import { useLang } from "../reel/Film";

// Every word on screen in "Close to Home", in English and Korean. Nothing here repeats the narration (reel-lint +
// seeker-echo.py). The stat is the research table's: job openings were 7.5 million in September 2026 (US Bureau of
// Labor Statistics, JOLTS, released 2026-11-03). The map pins follow Tahoe's own search map (company tile and pay).
export const STAT = {
  value: 7.5,
  source: { en: "US Bureau of Labor Statistics, Sep 2026", ko: "미국 노동통계국, 2026년 9월" },
};

const COPY = {
  en: {
    dana: "Dana",
    day: "Day",
    job: "Data Analyst",
    company: "Fernway",
    careers: "Careers page",
    pay: "$88K",
    statLabel: ["job openings across", "the United States"],
    search: "data analyst near me",
    apply: "Apply directly",
    trial: "Try it free for 7 days",
  },
  ko: {
    dana: "다나",
    day: "일째",
    job: "데이터 분석가",
    company: "Fernway",
    careers: "채용 페이지",
    pay: "$88K",
    statLabel: ["미국 전역의", "채용 중인 일자리"],
    search: "내 근처 데이터 분석가",
    apply: "기업 사이트에서 바로 지원",
    trial: "7일 무료 체험",
  },
};

export const useCopy = () => COPY[useLang()];
