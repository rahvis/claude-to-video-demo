import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { BlurIn, EASE_IN_OUT, Hash, prog, Scramble, Swap } from "../../lib/motion";
import { useCue, useEvent, useLayout } from "../../lib/scene";
import { Card, Headline, Icon, Mono } from "../components/ui";
import { C, MONO } from "../theme";

// Values from the live deployment (paper, Appendix D): the published calibration
// fingerprint, the commitment carried as the attestation nonce, and the commitment
// after perturbing one hex digit of the fingerprint.
const FP = "2399d3ac624333ff5619c1b567ba0de32a85b86003774b6eba9a24476a999a80";
const COMMIT = "e8ba07774119c1ad42f4cad8db154e3a881027800db29cd8c0565d7d327a8e59";
const PERTURBED = "f730f594e9a8e5c889e0274f2c093a2dec3d3a1419109f2d4ac68b9e36f5286e";
const FLIP = 63;
const FP_FLIPPED = FP.slice(0, FLIP) + "1";
const SWAPPED_SCORE = 97;

const ScoreStrip: React.FC<{ width: number; flip: number; at: number }> = ({ width, flip, at }) => {
  const f = useCurrentFrame();
  const g = prog(f, at, 30);
  const bw = width / 150;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", height: 80, gap: 0 }}>
      {Array.from({ length: 150 }, (_, i) => {
        const base = 0.25 + 0.75 * random(`score-${i}`);
        const swapped = i === SWAPPED_SCORE && flip > 0;
        const h = swapped ? base + (1 - base) * 0.9 * flip - 0.15 * flip : base;
        const shown = g * 150 > i ? 1 : 0;
        return (
          <div
            key={i}
            style={{
              width: bw * 0.62,
              marginRight: bw * 0.38,
              height: `${Math.min(1, h) * 100 * shown}%`,
              background: swapped ? C.coral : `rgba(10,138,160,${0.35 + 0.5 * base})`,
              borderRadius: 1,
              boxShadow: swapped ? `0 0 14px ${C.coral}` : undefined,
            }}
          />
        );
      })}
    </div>
  );
};

const Row: React.FC<{ at: number; label: string; formula?: string; children: React.ReactNode; status?: React.ReactNode }> = ({ at, label, formula, children, status }) => (
  <BlurIn at={at} dur={20} y={20}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 18, flexWrap: "wrap" }}>
      <Mono size={24} color={C.teal} style={{ fontWeight: 500 }}>
        {label}
      </Mono>
      {formula && <Mono size={24}>{formula}</Mono>}
    </div>
    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 22 }}>
      <div style={{ fontFamily: MONO, lineHeight: 1.35 }}>{children}</div>
      {status}
    </div>
  </BlurIn>
);

export const S07Commit: React.FC = () => {
  const f = useCurrentFrame();
  const { portrait } = useLayout();
  const c = [useCue(0), useCue(1), useCue(2), useCue(3)];
  const tBoxes = useEvent("boxes");
  const tUnm = useEvent("unmeasured");
  const tChain = useEvent("chain");
  const tFp = useEvent("fp");
  const tMatch = useEvent("match");
  const tFlip = useEvent("flip");
  const tMis = useEvent("mismatch");

  const boxesOut = prog(f, tChain - 10, 14, EASE_IN_OUT);
  const unm = prog(f, tUnm, 14);
  const flip = prog(f, tFlip, 10);
  const hashSize = portrait ? 34 : 32;
  const split = portrait ? 32 : undefined;
  const flipped = f >= tFlip;

  const box = (title: string, detail: string, status: React.ReactNode, dashed: number) => (
    <Card
      style={{
        width: portrait ? 900 : 700,
        padding: "44px 48px",
        border: dashed > 0 ? `2px dashed rgba(217,72,47,${0.3 + 0.5 * dashed})` : `1px solid ${C.hairline}`,
      }}
    >
      <div style={{ fontSize: 46, fontWeight: 600, letterSpacing: "-0.03em" }}>{title}</div>
      <Mono size={25} style={{ display: "block", marginTop: 12 }}>
        {detail}
      </Mono>
      <div style={{ marginTop: 28, height: 36 }}>{status}</div>
    </Card>
  );

  const commitHash = !flipped || f < tFlip + 6 ? (
    <Hash scrambleColor="rgba(0,0,0,0.3)" text={COMMIT} at={tFp + 30} perChar={0.45} seed="c" color={C.fg} split={split} style={{ fontSize: hashSize }} />
  ) : f < tFlip + 18 ? (
    <Scramble length={64} seed="re" split={split} style={{ fontSize: hashSize, color: `${C.coral}99` }} />
  ) : (
    <Hash scrambleColor="rgba(0,0,0,0.3)" text={PERTURBED} at={tFlip + 18} perChar={0.2} band={4} seed="p" color={C.coral} split={split} style={{ fontSize: hashSize }} />
  );

  const pad = portrait ? 80 : 120;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: portrait ? 200 : 96, left: pad, right: pad }}>
        <Swap
          items={[
            { at: c[0].frame, node: <Headline size={portrait ? 76 : 72}>Attestation proves what ran.</Headline> },
            { at: c[1].frame, node: <Headline size={portrait ? 76 : 72}>Not what it was calibrated on.</Headline> },
            { at: c[2].frame, node: <Headline size={portrait ? 76 : 72}>So CCI commits the calibration set.</Headline> },
            { at: c[3].frame, node: <Headline size={portrait ? 76 : 72}>Swap one score. The fingerprint breaks.</Headline> },
          ]}
        />
      </div>

      <div style={{ position: "absolute", top: portrait ? 440 : 250, bottom: portrait ? 220 : 60, left: pad, right: pad }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: portrait ? "column" : "row",
            gap: 50,
            alignItems: "center",
            justifyContent: "center",
            opacity: 1 - boxesOut,
            filter: boxesOut > 0 ? `blur(${boxesOut * 10}px)` : undefined,
          }}
        >
          <BlurIn at={tBoxes} dur={22} y={40} scale={0.96}>
            {box(
              "Model & software",
              "gemma-3-1b-it · vLLM · Node.js",
              <BlurIn at={tBoxes + 14} dur={16} style={{ display: "flex", alignItems: "center", gap: 12, color: C.green, fontSize: 29, fontWeight: 500 }}>
                <Icon.Check size={32} /> measured by the attestation
              </BlurIn>,
              0,
            )}
          </BlurIn>
          <BlurIn at={tBoxes + 6} dur={22} y={40} scale={0.96}>
            {box(
              "Calibration set",
              "150 prompts · scores · α = 0.1",
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.coral, fontSize: 29, fontWeight: 500, opacity: unm }}>
                <Icon.X size={30} /> not measured by anything
              </div>,
              unm,
            )}
          </BlurIn>
        </div>

        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: portrait ? 920 : 1420, display: "flex", flexDirection: "column", gap: portrait ? 60 : 46 }}>
          <BlurIn at={tChain} dur={22} y={30}>
            <Card style={{ padding: portrait ? "28px 32px" : "24px 30px", width: "100%" }}>
              <ScoreStrip width={portrait ? 856 : 1360} flip={flip} at={tChain + 4} />
              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between" }}>
                <Mono size={21}>150 committed calibration scores</Mono>
                {flipped && (
                  <Mono size={21} color={C.coral} style={{ opacity: flip }}>
                    1 swapped
                  </Mono>
                )}
              </div>
            </Card>
          </BlurIn>

          <div style={{ display: "flex", flexDirection: "column", gap: portrait ? 44 : 44 }}>
            <Row at={tChain + 10} label="fingerprint" formula="fp = H(model ‖ template ‖ labels ‖ α ‖ scores)">
              <Hash
                scrambleColor="rgba(0,0,0,0.3)"
                text={flipped ? FP_FLIPPED : FP}
                at={tFp}
                perChar={0.5}
                seed="f"
                color={C.fg}
                split={split}
                style={{ fontSize: hashSize }}
                mark={flipped ? { index: FLIP, color: C.coral } : null}
              />
            </Row>
            <Row at={tFp + 22} label="commitment" formula="nonce = H(pk ‖ fp ‖ α ‖ template)">
              {commitHash}
            </Row>
            <Row
              at={tMatch - 26}
              label="attestation token"
              formula="MAA client-payload nonce"
              status={
                <Swap
                  items={[
                    {
                      at: tMatch,
                      node: (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.green, fontSize: 26, fontWeight: 600, whiteSpace: "nowrap" }}>
                          <Icon.Check size={30} /> match
                        </div>
                      ),
                    },
                    {
                      at: tMis,
                      node: (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.coral, fontSize: 26, fontWeight: 600, whiteSpace: "nowrap" }}>
                          <Icon.X size={30} /> mismatch
                        </div>
                      ),
                    },
                  ]}
                />
              }
            >
              <Hash scrambleColor="rgba(0,0,0,0.3)" text={COMMIT} at={tMatch - 22} perChar={0.25} band={4} seed="t" color={f >= tMis ? C.dim : C.fg} split={split} style={{ fontSize: hashSize }} />
            </Row>
          </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
