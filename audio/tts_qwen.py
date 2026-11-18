"""Qwen3-TTS narration (local, mlx-audio) for the Tahoe job-seeker films, phrase by phrase like tts.py and tts_ko.py.

Engines (script JSON "engine", or --engine):
  clone   the Base model clones one reference voice (ref_audio + ref_text), so every line has the same narrator
  custom  a CustomVoice preset speaker (e.g. "sohee") with a per-phrase "instruct" for tone and emotion
  --anchor N renders N VoiceDesign candidates of the voice described in "design" (to make the clone reference)

Every phrase is rendered `takes` times with fixed seeds. Whisper listens to each take; the kept take is one it hears
correctly, whose last word falls when the phrase is marked "fall", and whose length is nearest the median. Takes and
what Whisper heard are cached in audio/cache/qwen/, picks are written to audio/build/<v>/takes.json, so a rebuild
needs no model once every take exists.

Outputs (same as tts.py):
  public/<v>/vo.wav       full narration, each phrase on its cue frame
  src/<v>/timeline.json   scene starts and lengths, per-phrase cue frames, word frames from Whisper's timestamps
  out/captions-<v>.srt    sidecar captions

Usage (from audio/):
  .venv-qwen/bin/python tts_qwen.py --script script-seeker.json --anchor 4
  .venv-qwen/bin/python tts_qwen.py --script script-seeker.json --use-anchor 2
  .venv-qwen/bin/python tts_qwen.py --script script-seeker.json --variant seeker
  .venv-qwen/bin/python tts_qwen.py --script script-seeker.json --engine custom --speaker sohee \
      --model models/qwen3/CustomVoice-8bit --audition EN-B-sohee --only s01_hook,s03_turn,s10_end
"""

import argparse
import hashlib
import json
import re
import shutil
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
CACHE = HERE / "cache" / "qwen"
SR = 24000

_model: dict = {}
_whisper: dict = {}
# Whisper's codes; Qwen3-TTS takes the language name (it has no Vietnamese: such scripts set "qwen_language": "auto").
LANG_CODES = {"english": "en", "korean": "ko", "spanish": "es", "chinese": "zh", "japanese": "ja", "vietnamese": "vi"}
LATIN = ("english", "spanish", "vietnamese")


# ---------------------------------------------------------------- synthesis

def model(path: str):
    if path not in _model:
        from mlx_audio.tts.utils import load_model

        _model.clear()  # one model in memory at a time
        _model[path] = load_model(str(HERE / path))
    return _model[path]


def trim(x: np.ndarray, sr: int, thresh_db: float = -42.0) -> np.ndarray:
    """Trim leading/trailing silence, keeping a few ms so consonants aren't clipped (same as tts.py)."""
    env = np.abs(x)
    win = max(1, int(sr * 0.01))
    env = np.convolve(env, np.ones(win) / win, mode="same")
    thresh = env.max() * 10 ** (thresh_db / 20)
    idx = np.where(env > thresh)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(sr * 0.015))
    b = min(len(x), idx[-1] + int(sr * 0.06))
    y = x[a:b].copy()
    f = int(sr * 0.008)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y


def voice_id(cfg: dict) -> str:
    """What makes two takes the same voice: engine, model, speaker or reference clip, sampling settings."""
    if cfg["engine"] == "vieneu":
        return "|".join(["vieneu-v3turbo", cfg["speaker"], cfg["language"], str(cfg["temperature"]), str(cfg["seed"])])
    ref = ""
    if cfg["engine"] == "clone":
        ref = hashlib.sha1((HERE / cfg["ref_audio"]).read_bytes()).hexdigest()[:12] + "|" + cfg["ref_text"]
    if cfg["engine"] == "design":
        ref = cfg["design"]
    return "|".join([cfg["engine"], Path(cfg["model"]).name, cfg.get("speaker") or "", ref, cfg["language"],
                     str(cfg["temperature"]), str(cfg["seed"])])


def take_key(cfg: dict, text: str, instruct: str | None, take: int) -> str:
    ins = instruct if cfg["engine"] == "custom" else ""
    tag = "vieneu" if cfg["engine"] == "vieneu" else "qwen3"
    return hashlib.sha1(f"{tag}|{voice_id(cfg)}|{ins}|{take}|{text}".encode()).hexdigest()[:16]


def take_seed(cfg: dict, text: str, take: int) -> int:
    return cfg["seed"] * 1000 + take * 101 + int(hashlib.sha1(text.encode()).hexdigest()[:6], 16) % 997


def vieneu_batch(cfg: dict, jobs: list[tuple[str, str, int]]) -> None:
    """Vietnamese takes via VieNeu-TTS in its own venv (audio/vieneu_say.py): [(text, key, take), ...] -> raw wavs."""
    import subprocess
    import tempfile

    if not jobs:
        return
    CACHE.mkdir(parents=True, exist_ok=True)
    spec = [{"text": t, "voice": cfg["speaker"], "seed": take_seed(cfg, t, k), "temperature": cfg["temperature"],
             "out": str(CACHE / f"{key}.raw.wav")} for t, key, k in jobs]
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as fh:
        json.dump(spec, fh, ensure_ascii=False)
    subprocess.run([str(HERE / ".venv-vi/bin/python"), str(HERE / "vieneu_say.py"), fh.name], check=True)


def prerender(cfg: dict, script: dict, only: set[str] | None = None) -> None:
    """Engines that run outside this process render every missing take in one batch first."""
    if cfg["engine"] != "vieneu":
        return
    jobs = []
    for sc in scenes_of(script, only):
        for ph in sc["phrases"]:
            said = ph.get("say", ph["text"])
            for k in range(ph.get("takes", cfg["takes"])):
                key = take_key(cfg, said, ph.get("instruct"), k)
                if not (CACHE / f"{key}.wav").exists():
                    jobs.append((said, key, k))
    vieneu_batch(cfg, jobs)


def render(cfg: dict, text: str, instruct: str | None, take: int) -> tuple[np.ndarray, str]:
    key = take_key(cfg, text, instruct, take)
    path = CACHE / f"{key}.wav"
    if path.exists():
        return sf.read(path, dtype="float32")[0], key
    if cfg["engine"] == "vieneu":
        raw = CACHE / f"{key}.raw.wav"
        if not raw.exists():
            vieneu_batch(cfg, [(text, key, take)])
        x = trim(sf.read(raw, dtype="float32")[0], SR)
        sf.write(path, x, SR)
        raw.unlink()
        return x, key
    import mlx.core as mx

    mx.random.seed(take_seed(cfg, text, take))
    kw = dict(text=text, lang_code=cfg.get("qwen_language", cfg["language"]), temperature=cfg["temperature"])
    if cfg["engine"] == "custom":
        kw.update(voice=cfg["speaker"], instruct=instruct or None)
    elif cfg["engine"] == "clone":
        kw.update(ref_audio=str(HERE / cfg["ref_audio"]), ref_text=cfg["ref_text"])
    elif cfg["engine"] == "design":
        kw.update(instruct=cfg["design"])
    chunks = [np.array(r.audio, dtype=np.float32).reshape(-1) for r in model(cfg["model"]).generate(**kw)]
    x = trim(np.concatenate(chunks), SR)
    CACHE.mkdir(parents=True, exist_ok=True)
    sf.write(path, x, SR)
    return x, key


# ---------------------------------------------------------------- listening

def whisper(lang: str):
    name = "small.en" if lang == "english" else "small"
    if name not in _whisper:
        from faster_whisper import WhisperModel

        _whisper[name] = WhisperModel(name, device="cpu", compute_type="int8")
    return _whisper[name]


def hear(key: str, lang: str) -> list[list]:
    """Words Whisper hears in a cached take: [[word, start, end], ...] (cached beside the take)."""
    side = CACHE / f"{key}.{lang}.json"
    if side.exists():
        return json.loads(side.read_text())
    from scipy.signal import resample_poly

    x = sf.read(CACHE / f"{key}.wav", dtype="float32")[0]
    audio = np.concatenate([np.zeros(4000, np.float32), resample_poly(x, 2, 3).astype(np.float32), np.zeros(8000, np.float32)])
    segs, _ = whisper(lang).transcribe(  # an array, not a path: mlx-audio's PyAV is too new for faster-whisper's decoder
        audio, language=LANG_CODES[lang], beam_size=5,
        word_timestamps=True, condition_on_previous_text=False, vad_filter=False)
    pad = 4000 / 16000
    words = [[w.word.strip(), round(max(0.0, w.start - pad), 3), round(max(0.0, w.end - pad), 3)] for s in segs for w in (s.words or [])]
    side.write_text(json.dumps(words, ensure_ascii=False))
    return words


KO_DIGITS = "영일이삼사오육칠팔구"


def ko_number(n: int) -> str:
    """Sino-Korean reading of 0..99999999 (enough for the figures Whisper writes as digits)."""
    if n == 0:
        return "영"
    out = ""
    for unit, name in ((10**4, "만"),):
        if n >= unit:
            hi = n // unit
            out += ("" if hi == 1 else ko_number(hi)) + name
            n %= unit
    for unit, name in ((1000, "천"), (100, "백"), (10, "십")):
        d = n // unit
        if d:
            out += ("" if d == 1 else KO_DIGITS[d]) + name
        n %= unit
    if n:
        out += KO_DIGITS[n]
    return out


def norm_en(s: str) -> list[str]:
    from num2words import num2words

    s = s.lower().replace("’", "'")
    s = re.sub(r"\$?(\d[\d,]*)(k)?\+?", lambda m: num2words(int(m.group(1).replace(",", "")) * (1000 if m.group(2) else 1)), s)
    s = re.sub(r"\ba (hundred|thousand|million)\b", r"one \1", s)
    s = re.sub(r"[^a-z' ]+", " ", s.replace("-", " "))
    return s.split()


def norm_ko(s: str) -> str:
    s = re.sub(r"(?i)tahoe", "타호", s)
    s = re.sub(r"\d[\d,]*", lambda m: ko_number(int(m.group(0).replace(",", ""))), s)
    return "".join(ch for ch in s if "가" <= ch <= "힣")


def norm_latin(s: str, lang: str) -> list[str]:
    """Spanish / Vietnamese words: lower case, accents kept, digits spelled out in the language."""
    from num2words import num2words

    s = s.lower().replace("’", "'")
    code = {"spanish": "es", "vietnamese": "vi"}[lang]
    s = re.sub(r"\d[\d.,]*", lambda m: num2words(int(re.sub(r"[.,]", "", m.group(0))), lang=code), s)
    return re.findall(r"[^\W\d_]+", s)


CJK_NUM = {"零": 0, "〇": 0, "一": 1, "二": 2, "两": 2, "兩": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9}
CJK_UNIT = {"十": 10, "百": 100, "千": 1000, "万": 10000, "萬": 10000}


def cjk_number(t: str) -> str:
    total, sec, num = 0, 0, 0
    for ch in t:
        if ch in CJK_NUM:
            num = CJK_NUM[ch]
        elif ch in CJK_UNIT:
            u = CJK_UNIT[ch]
            if u == 10000:
                total += (sec + num) * u
                sec = num = 0
            else:
                sec += (num or 1) * u
                num = 0
    return str(total + sec + num)


def norm_cjk(s: str) -> str:
    """Chinese / Japanese: characters only (han, kana, digits); numerals in either script read as digits."""
    s = s.translate({ord(c): ord("0") + i for i, c in enumerate("０１２３４５６７８９")})
    s = re.sub(r"(?i)tahoe", "タホ", s)
    s = re.sub(r"[零〇一二两兩三四五六七八九十百千万萬]{2,}|[十百千万萬]", lambda m: cjk_number(m.group(0)), s)
    return "".join(ch for ch in s if ch.isdigit() or "\u3040" <= ch <= "\u30ff" or "\u4e00" <= ch <= "\u9fff")


def hanzi_number(n: int) -> str:
    """Chinese / Japanese numerals for 0..99999 (一百零二, 一千)."""
    d = "零一二三四五六七八九"
    if n == 0:
        return d[0]
    out, zero = "", False
    for unit, name in ((10000, "万"), (1000, "千"), (100, "百"), (10, "十"), (1, "")):
        q, n = divmod(n, unit)
        if q:
            if zero and out:
                out += "零"
            out += ("" if (q == 1 and unit == 10 and not out) else d[q]) + name
            zero = False
        elif out:
            zero = True
    return out


def reading(s: str, lang: str) -> list[str]:
    """What a line sounds like: pinyin syllables with tones (Chinese) or kana (Japanese), so homophones and
    traditional/simplified spellings compare equal while real tone or sound errors still count."""
    s = s.translate({ord(c): ord("0") + i for i, c in enumerate("０１２３４５６７８９")})
    s = re.sub(r"\s+", "", s)  # Whisper spaces CJK characters apart; readings need whole words
    s = re.sub(r"\d+", lambda m: hanzi_number(int(m.group(0))), s.replace(",", ""))
    if lang == "japanese":
        s = re.sub(r"一(?=[十百千])", "", s)  # Japanese says 百, 千 (not 一百, 一千)
        s = s.replace("一目", "ひと目")  # "at a glance": kakasi reads 一目 as いちもく (as in 一目置く)
    if lang == "chinese":
        from pypinyin import Style, lazy_pinyin

        s = re.sub(r"(?i)tahoe", "它后", s)
        han = "".join(ch for ch in s if "\u4e00" <= ch <= "\u9fff")
        # The particles 的/得/地 are all a neutral "de", but pypinyin reads 得 after some verbs as dé ("投得更准" ->
        # de2) while Whisper writes the same sound as 的 (de5): "de" counts as one sound whatever its tone.
        return ["de" if re.fullmatch(r"de\d", p) else p for p in lazy_pinyin(han, style=Style.TONE3, neutral_tone_with_five=True)]
    import pykakasi

    s = re.sub(r"(?i)tahoe", "たほ", s)
    kana = "".join(i["hira"] for i in pykakasi.kakasi().convert(s))
    return [ch for ch in kana if "\u3041" <= ch <= "\u309f" or ch == "ー"]


def levenshtein(a: str, b: str) -> int:
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def match(said: str, heard: list, lang: str) -> float:
    """1.0 = Whisper heard exactly the line (EN: word match ratio; KO: 1 - character error rate)."""
    text = " ".join(w[0] for w in heard)
    if lang == "english":
        return SequenceMatcher(None, norm_en(said), norm_en(text)).ratio()
    if lang in ("spanish", "vietnamese"):
        return SequenceMatcher(None, norm_latin(said, lang), norm_latin(text, lang)).ratio()
    if lang == "korean":
        ref, hyp = norm_ko(said), norm_ko(text)
    else:
        ref, hyp = reading(said, lang), reading(text, lang)
    return max(0.0, 1 - levenshtein(ref, hyp) / max(1, len(ref)))


def pitch(x: np.ndarray, heard: list) -> tuple[float | None, float | None]:
    """(semitone change across the last word, semitone spread over the whole phrase)."""
    import parselmouth

    p = parselmouth.Sound(x.astype(np.float64), SR).to_pitch(time_step=0.01, pitch_floor=75, pitch_ceiling=500)
    f, t = p.selected_array["frequency"], p.xs()
    voiced = f[f > 0]
    spread = float(np.std(12 * np.log2(voiced / np.median(voiced)))) if len(voiced) > 10 else None
    if not heard:
        return None, spread
    a, b = heard[-1][1], heard[-1][2]
    v = f[(t >= a) & (t <= b + 0.05) & (f > 0)]
    if len(v) < 6:
        return None, spread
    k = max(2, len(v) // 3)
    return float(12 * np.log2(np.median(v[-k:]) / np.median(v[:k]))), spread


def judge(cfg: dict, ph: dict, take: int) -> dict:
    said = ph.get("say", ph["text"])
    x, key = render(cfg, said, ph.get("instruct"), take)
    heard = hear(key, cfg["language"])
    delta, spread = pitch(x, heard)
    return {"take": take, "key": key, "dur": round(len(x) / SR, 3), "match": round(match(said, heard, cfg["language"]), 3),
            "end_st": None if delta is None else round(delta, 2), "spread_st": None if spread is None else round(spread, 2),
            "heard": " ".join(w[0] for w in heard), "words": heard}


def pick(cfg: dict, ph: dict) -> dict:
    takes = [judge(cfg, ph, k) for k in range(ph.get("takes", cfg["takes"]))]  # a phrase may ask for more
    need = {"english": 0.95, "korean": 0.92}.get(cfg["language"], 0.9)
    ok = [t for t in takes if t["match"] >= need]
    pool = ok or [max(takes, key=lambda t: t["match"])]
    if ph.get("fall"):
        falling = [t for t in pool if t["end_st"] is not None and t["end_st"] < 0]
        pool = falling or pool
    med = float(np.median([t["dur"] for t in pool]))
    # "pick": "shortest" keeps the briskest good take (a slow preset in a 30 s reel); default: the median-length take
    best = min(pool, key=lambda t: t["dur"] if cfg.get("pick") == "shortest" else abs(t["dur"] - med))
    if "take" in ph:  # a take chosen by ear for this phrase
        best = next(t for t in takes if t["take"] == ph["take"])
    best = dict(best, flag=(not ok) or bool(ph.get("fall") and (best["end_st"] is None or best["end_st"] >= 0)),
                others=[{k: t[k] for k in ("take", "dur", "match", "end_st", "spread_st")} for t in takes])
    return best


def tighten(x: np.ndarray, words: list, max_pause: float, thresh_db: float = -38.0) -> tuple[np.ndarray, list]:
    """Shorten silences inside a phrase to `max_pause` seconds (cut from their middle), shifting the word times after
    each cut. Some presets (Sohee in English) leave 0.5-0.9 s breaks mid-sentence, too long for a 30 s reel."""
    env = np.convolve(np.abs(x), np.ones(int(SR * 0.02)) / int(SR * 0.02), mode="same")
    quiet = env < env.max() * 10 ** (thresh_db / 20)
    cuts, i, n = [], 0, len(x)
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if i > 0 and j < n and (j - i) / SR > max_pause:  # inside the phrase, not its lead-in or tail
                keep = int(SR * max_pause / 2)
                cuts.append((i + keep, j - keep))
            i = j
        else:
            i += 1
    if not cuts:
        return x, words
    parts, last = [], 0
    for a, b in cuts:
        parts.append(x[last:a])
        last = b
    parts.append(x[last:])
    shift = lambda t: t - sum((min(b, max(a, t * SR)) - a) / SR for a, b in cuts)
    return np.concatenate(parts), [[w, round(shift(s), 3), round(shift(e), 3)] for w, s, e in words]


def paced(cfg: dict, best: dict) -> tuple[np.ndarray, list]:
    """The kept take, its inner pauses capped at the script's `max_pause` (if set), at the script's `tempo`
    (rubberband time-stretch, pitch unchanged), with its word times moved to match."""
    tempo = float(cfg.get("tempo", 1.0))
    src = CACHE / f"{best['key']}.wav"
    words = best["words"]
    if cfg.get("max_pause"):
        x, words = tighten(sf.read(src, dtype="float32")[0], words, float(cfg["max_pause"]))
        src = CACHE / f"{best['key']}.p{float(cfg['max_pause']):.2f}.wav"
        if not src.exists():
            sf.write(src, x, SR, subtype="FLOAT")
    if abs(tempo - 1.0) < 1e-6:
        return sf.read(src, dtype="float32")[0], words
    dst = CACHE / f"{src.stem}.t{tempo:.3f}.wav"
    if not dst.exists():
        import subprocess

        af = f"rubberband=tempo={tempo}:transients=mixed:detector=soft:phase=laminar:window=standard:pitchq=quality"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", af, "-ar", str(SR), "-ac", "1", str(dst)], check=True)
    return sf.read(dst, dtype="float32")[0], [[w, round(s / tempo, 3), round(e / tempo, 3)] for w, s, e in words]


# ---------------------------------------------------------------- timeline

def word_frames(text: str, frame: int, end: int, fps: int, heard: list, lang: str) -> list[dict]:
    """Frame where each script word starts: matched to Whisper's word times, interpolated where they differ."""
    words = text.split()
    norm = {"english": lambda w: " ".join(norm_en(w)), "korean": norm_ko, "spanish": lambda w: " ".join(norm_latin(w, "spanish")),
            "vietnamese": lambda w: " ".join(norm_latin(w, "vietnamese"))}.get(lang, norm_cjk)
    times: list[float | None] = [None] * len(words)
    sm = SequenceMatcher(None, [norm(w) for w in words], [norm(w[0]) for w in heard], autojunk=False)
    for a, b, n in sm.get_matching_blocks():
        for i in range(n):
            times[a + i] = heard[b + i][1]
    dur = (end - frame) / fps
    if times[0] is None:
        times[0] = 0.0
    known = [(i, t) for i, t in enumerate(times) if t is not None] + [(len(words), dur)]
    for (i0, t0), (i1, t1) in zip(known, known[1:]):
        for i in range(i0 + 1, i1):
            times[i] = t0 + (t1 - t0) * (i - i0) / (i1 - i0)
    return [{"text": w, "frame": frame + round(t * fps)} for w, t in zip(words, times)]


def srt_time(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def scenes_of(script: dict, only: set[str] | None) -> list[dict]:
    return [sc for sc in script["scenes"] if not only or sc["id"] in only]


def build(cfg: dict, script: dict, variant: str) -> None:
    prerender(cfg, script)
    fps, gap, overlap = script["fps"], script["gap"], script["overlap_frames"]
    picks_path = HERE / f"build/{variant}/takes.json"
    picks_path.parent.mkdir(parents=True, exist_ok=True)
    scenes, placed, captions, picks = [], [], [], {}
    start = 0
    for sc in script["scenes"]:
        t = sc["lead"]
        cues = []
        for i, ph in enumerate(sc["phrases"]):
            best = pick(cfg, ph)
            picks[f"{sc['id']}.{i}"] = {k: v for k, v in best.items() if k != "words"} | {"text": ph["text"]}
            x, words = paced(cfg, best)
            frame = round(t * fps)
            dur = len(x) / SR
            end = frame + round(dur * fps)
            cues.append({"frame": frame, "endFrame": end, "text": ph["text"],
                         "words": word_frames(ph["text"], frame, end, fps, words, cfg["language"])})
            placed.append(((start + frame) / fps, x))
            captions.append(((start + frame) / fps, (start + frame) / fps + dur, ph["text"]))
            t = frame / fps + dur + ph.get("pause", gap)
        length = round((t - gap + sc["tail"]) * fps)
        scenes.append({"id": sc["id"], "from": start, "durationInFrames": length, "cues": cues})
        start += length - overlap

    total = scenes[-1]["from"] + scenes[-1]["durationInFrames"]
    vo = np.zeros(int(total / fps * SR) + SR, dtype=np.float32)
    for at, x in placed:
        i = int(round(at * SR))
        vo[i: i + len(x)] += x
    vo = vo[: int(total / fps * SR)]

    vo_path, tl_path, srt_path = ROOT / f"public/{variant}/vo.wav", ROOT / f"src/{variant}/timeline.json", ROOT / f"out/captions-{variant}.srt"
    vo_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(vo_path, vo, SR, subtype="PCM_24")
    voice = f"qwen3 {cfg['engine']} {cfg.get('speaker') or Path(cfg.get('ref_audio', '')).stem} tempo {cfg.get('tempo', 1.0)}"
    tl_path.parent.mkdir(parents=True, exist_ok=True)
    tl_path.write_text(json.dumps({"fps": fps, "overlap": overlap, "durationInFrames": total, "voice": voice, "scenes": scenes},
                                  indent=2, ensure_ascii=False))
    srt_path.parent.mkdir(exist_ok=True)
    srt_path.write_text("\n".join(f"{i}\n{srt_time(a)} --> {srt_time(b)}\n{text}\n" for i, (a, b, text) in enumerate(captions, 1)),
                        encoding="utf-8")
    picks_path.write_text(json.dumps(picks, indent=2, ensure_ascii=False))

    speech = sum(len(x) for _, x in placed) / SR
    print(f"{variant}: {voice}  total={total} frames ({total / fps:.1f}s), speech {speech:.1f}s")
    for s in scenes:
        print(f"  {s['id']:<12} from {s['from']:>5}  len {s['durationInFrames']:>4}  cues {[c['frame'] for c in s['cues']]}")
    report(picks)


def report(picks: dict) -> None:
    for k, p in picks.items():
        mark = "  FLAG" if p["flag"] else ""
        print(f"  {k:<14} take {p['take']} {p['dur']:>5.2f}s match {p['match']:.2f} end {p['end_st']} spread {p['spread_st']}{mark}"
              f"\n                 said: {p['text']}\n                heard: {p['heard']}")


def audition(cfg: dict, script: dict, name: str, only: set[str] | None) -> None:
    """Chosen takes of a few scenes in a row, with their pauses, levelled for listening."""
    prerender(cfg, script, only)
    parts, picks = [], {}
    for sc in scenes_of(script, only):
        for i, ph in enumerate(sc["phrases"]):
            best = pick(cfg, ph)
            picks[f"{sc['id']}.{i}"] = {k: v for k, v in best.items() if k != "words"} | {"text": ph["text"]}
            x, _ = paced(cfg, best)
            parts += [x, np.zeros(int(SR * ph.get("pause", script["gap"])), np.float32)]
        parts.append(np.zeros(int(SR * 0.6), np.float32))
    y = np.concatenate(parts)
    rms = np.sqrt(np.mean(y[np.abs(y) > 1e-4] ** 2))
    y = np.clip(y * (10 ** (-20 / 20) / max(rms, 1e-6)), -0.99, 0.99)
    out = ROOT / f"out/voice-audition/{name}.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, y, SR, subtype="PCM_16")
    print(f"wrote {out} ({len(y) / SR:.1f}s)")
    report(picks)


def anchors(cfg: dict, n: int) -> None:
    """VoiceDesign candidates for the clone reference, with what Whisper heard and pitch stats."""
    d = dict(cfg, engine="design", model=cfg["design_model"], takes=n)
    out = ROOT / "out/voice-audition/anchors"
    out.mkdir(parents=True, exist_ok=True)
    for k in range(n):
        r = judge(d, {"text": cfg["anchor_text"]}, k)
        shutil.copyfile(CACHE / f"{r['key']}.wav", out / f"anchor-{k}.wav")
        x = sf.read(CACHE / f"{r['key']}.wav", dtype="float32")[0]
        import parselmouth

        f = parselmouth.Sound(x.astype(np.float64), SR).to_pitch(pitch_floor=75, pitch_ceiling=500).selected_array["frequency"]
        f = f[f > 0]
        wps = len(cfg["anchor_text"].split()) / r["dur"]
        print(f"anchor-{k}: {r['dur']:.1f}s  {wps:.2f} words/s  match {r['match']:.2f}  f0 median {np.median(f):.0f} Hz"
              f"  spread {r['spread_st']} st  key {r['key']}\n   heard: {r['heard']}")


def use_anchor(cfg: dict, k: int) -> None:
    d = dict(cfg, engine="design", model=cfg["design_model"])
    key = take_key(d, cfg["anchor_text"], None, k)
    dst = HERE / cfg["ref_audio"]
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(CACHE / f"{key}.wav", dst)
    print(f"anchor-{k} -> {dst}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", required=True, help="narration script in audio/")
    ap.add_argument("--variant", help="write public/<v>/vo.wav, src/<v>/timeline.json, out/captions-<v>.srt")
    ap.add_argument("--engine", choices=["clone", "custom", "vieneu"])
    ap.add_argument("--speaker")
    ap.add_argument("--model")
    ap.add_argument("--takes", type=int)
    ap.add_argument("--ref", dest="ref_audio", help="clone reference wav (audio/-relative), overrides ref_audio")
    ap.add_argument("--instruct-all", help="custom engine: one tone instruction for every phrase instead of each phrase's own")
    ap.add_argument("--anchor", type=int, help="render N VoiceDesign candidates of the clone reference")
    ap.add_argument("--use-anchor", type=int, help="copy candidate K to the script's ref_audio path")
    ap.add_argument("--audition", help="write out/voice-audition/<name>.wav from --only scenes")
    ap.add_argument("--only", help="comma-separated scene ids")
    a = ap.parse_args()
    script = json.loads((HERE / a.script).read_text())
    cfg = {k: v for k, v in script.items() if k != "scenes"}
    for k in ("engine", "speaker", "model", "takes", "ref_audio"):
        if getattr(a, k) is not None:
            cfg[k] = getattr(a, k)
    only = set(a.only.split(",")) if a.only else None
    if a.instruct_all:
        for sc in script["scenes"]:
            for ph in sc["phrases"]:
                ph["instruct"] = a.instruct_all
    if a.anchor:
        anchors(cfg, a.anchor)
    elif a.use_anchor is not None:
        use_anchor(cfg, a.use_anchor)
    elif a.audition:
        audition(cfg, script, a.audition, only)
    else:
        build(cfg, script, a.variant or "seeker")
