import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const DURATION = 60 * FPS;

const timings = {
  hook: { from: 0, duration: 6 * FPS },
  problem: { from: 6 * FPS, duration: 7 * FPS },
  product: { from: 13 * FPS, duration: 7 * FPS },
  evidence: { from: 20 * FPS, duration: 11 * FPS },
  trace: { from: 31 * FPS, duration: 11 * FPS },
  decision: { from: 42 * FPS, duration: 11 * FPS },
  close: { from: 53 * FPS, duration: 7 * FPS },
} as const;

const palette = {
  bg: "#070B12",
  panel: "#0A111D",
  panel2: "#0E1726",
  panel3: "#101A2A",
  border: "#223047",
  borderSoft: "rgba(148, 163, 184, 0.18)",
  text: "#F8FAFC",
  muted: "#94A3B8",
  soft: "#64748B",
  blue: "#1D4ED8",
  blueSoft: "#60A5FA",
  indigo: "#4F46E5",
  amber: "#F6B94D",
  green: "#6EE7B7",
  red: "#F87171",
};

const baseFont: CSSProperties = {
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

type PanelSpec = {
  id: string;
  label: string;
  description: string;
  status: string;
  tone: "blue" | "indigo" | "amber" | "green";
  path: string;
};

const evidencePanels: PanelSpec[] = [
  {
    id: "xrd",
    label: "XRD",
    description: "Phase structure evidence",
    status: "spinel peaks aligned",
    tone: "blue",
    path: "M18 125 C46 116 76 111 98 101 C118 91 125 54 138 98 C156 132 192 112 220 103 C242 94 252 42 268 100 C292 132 326 114 354 105 C376 97 386 62 400 103 C418 124 440 119 466 111",
  },
  {
    id: "raman",
    label: "Raman",
    description: "Local symmetry context",
    status: "mode consistency tracked",
    tone: "indigo",
    path: "M18 126 C58 125 86 119 104 112 C120 106 128 76 142 109 C158 130 194 121 216 114 C238 105 246 55 262 109 C284 134 318 122 346 114 C372 102 382 82 398 110 C416 125 440 122 466 116",
  },
  {
    id: "xps",
    label: "XPS",
    description: "Surface oxidation state",
    status: "confirmation required",
    tone: "amber",
    path: "M18 112 C52 108 78 107 104 105 C132 103 150 100 178 98 C206 94 234 88 262 82 C292 75 318 78 346 85 C372 92 392 102 418 111 C440 118 452 121 466 122",
  },
  {
    id: "ftir",
    label: "FTIR",
    description: "Bonding context",
    status: "bond features linked",
    tone: "green",
    path: "M18 92 C44 94 70 98 92 104 C112 109 121 128 138 111 C160 89 182 102 206 111 C232 121 247 142 268 116 C292 89 316 104 342 114 C374 126 392 120 418 104 C438 92 452 94 466 99",
  },
];

const workflow = ["Signal", "Compute", "Reason", "Validate", "Decision", "Report"];
const traceSteps = ["Goal", "Plan", "Execute", "Evidence", "Reason", "Decision", "Report"];

const progressFromWindow = (frame: number, from: number, duration: number) =>
  interpolate(frame, [from, from + duration], [0, 1], {
    easing: easeInOut,
    ...clamp,
  });

const fadeWindow = (frame: number, from: number, duration: number, fade = 18) => {
  const fadeIn = interpolate(frame, [from, from + fade], [0, 1], {
    easing: easeOut,
    ...clamp,
  });
  const fadeOut = interpolate(frame, [from + duration - fade, from + duration], [1, 0], {
    easing: Easing.in(Easing.cubic),
    ...clamp,
  });
  return Math.min(fadeIn, fadeOut);
};

const useSceneSpring = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 24, stiffness: 88, mass: 0.9 },
  });
};

const toneColor = (tone: PanelSpec["tone"]) => {
  if (tone === "indigo") return palette.indigo;
  if (tone === "amber") return palette.amber;
  if (tone === "green") return palette.green;
  return palette.blueSoft;
};

const Background = () => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [0, DURATION], [-18, 18], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.bg,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 28% 16%, rgba(29, 78, 216, 0.20), transparent 34%), radial-gradient(circle at 82% 74%, rgba(79, 70, 229, 0.16), transparent 36%), linear-gradient(180deg, rgba(7, 11, 18, 0.72), #070B12)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 92,
          left: -120,
          width: 2160,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.25), transparent)",
          transform: `translateX(${sweep}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "128px 120px",
          border: "1px solid rgba(148, 163, 184, 0.06)",
          borderRadius: 28,
        }}
      />
    </AbsoluteFill>
  );
};

const ProductShell = ({
  children,
  scale = 1,
  y = 0,
  dimmed = false,
}: {
  children: ReactNode;
  scale?: number;
  y?: number;
  dimmed?: boolean;
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 150,
        top: 118 + y,
        width: 1620,
        height: 820,
        borderRadius: 22,
        border: `1px solid ${palette.border}`,
        backgroundColor: "rgba(8, 15, 27, 0.88)",
        boxShadow: "0 38px 110px rgba(0, 0, 0, 0.42)",
        overflow: "hidden",
        transform: `scale(${scale})`,
        transformOrigin: "center",
      }}
    >
      <div
        style={{
          height: 66,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          borderBottom: `1px solid ${palette.borderSoft}`,
          backgroundColor: "rgba(12, 20, 34, 0.86)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[palette.red, palette.amber, palette.green].map((color) => (
              <div key={color} style={{ width: 11, height: 11, borderRadius: 999, backgroundColor: color }} />
            ))}
          </div>
          <div style={{ width: 1, height: 24, backgroundColor: palette.border }} />
          <div style={{ color: palette.text, fontSize: 20, fontWeight: 800, letterSpacing: 0 }}>
            DIFARYX
          </div>
          <div style={{ color: palette.soft, fontSize: 15 }}>Evidence reasoning console</div>
        </div>
        <div
          style={{
            border: `1px solid ${palette.border}`,
            borderRadius: 999,
            padding: "9px 14px",
            color: palette.text,
            fontSize: 15,
            backgroundColor: "rgba(15, 23, 42, 0.78)",
          }}
        >
          Google AI Challenge Demo
        </div>
      </div>
      <div
        style={{
          position: "relative",
          height: 754,
          opacity: dimmed ? 0.45 : 1,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const SceneCaption = ({
  label,
  title,
  subtitle,
  opacity,
  top = 142,
}: {
  label?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  opacity: number;
  top?: number;
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 156,
        top,
        width: 720,
        opacity,
        zIndex: 8,
      }}
    >
      {label ? (
        <div
          style={{
            color: palette.blueSoft,
            textTransform: "uppercase",
            letterSpacing: 1.6,
            fontSize: 15,
            fontWeight: 800,
            marginBottom: 14,
          }}
        >
          {label}
        </div>
      ) : null}
      <div
        style={{
          color: palette.text,
          fontSize: 58,
          lineHeight: 1.02,
          fontWeight: 820,
          letterSpacing: 0,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            marginTop: 20,
            color: palette.muted,
            fontSize: 25,
            lineHeight: 1.3,
            fontWeight: 520,
            maxWidth: 660,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};

const HookScene = ({ opacity }: { opacity: number }) => {
  const frame = useCurrentFrame();
  const local = frame;
  const pulse = interpolate(local, [30, 118], [0, 1], { easing: easeInOut, ...clamp });
  const lift = useSceneSpring(18);

  return (
    <AbsoluteFill style={{ opacity }}>
      <ProductShell scale={0.92} y={16}>
        <div style={{ position: "absolute", inset: 0, padding: 46 }}>
          <div style={{ position: "absolute", left: 52, top: 52, right: 52 }}>
            <MiniNavigation active="Signal intake" />
          </div>
          <div style={{ position: "absolute", left: 74, top: 164, width: 610 }}>
            <SignalWorkbench progress={pulse} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 732,
              top: 270,
              width: 186,
              height: 2,
              background:
                "linear-gradient(90deg, rgba(96, 165, 250, 0.15), rgba(96, 165, 250, 0.82))",
              transform: `scaleX(${pulse})`,
              transformOrigin: "left center",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 86,
              top: 196,
              width: 520,
              transform: `translateY(${interpolate(lift, [0, 1], [34, 0])}px)`,
              opacity: interpolate(local, [48, 78], [0, 1], clamp),
            }}
          >
            <DecisionPreview compact />
          </div>
        </div>
      </ProductShell>
      <SceneCaption
        opacity={opacity}
        title="A signal is not a decision."
        subtitle="Scientific conclusions need connected evidence."
        top={744}
      />
    </AbsoluteFill>
  );
};

const ProblemScene = ({ opacity }: { opacity: number }) => {
  const frame = useCurrentFrame();
  const local = frame;

  return (
    <AbsoluteFill style={{ opacity }}>
      <ProductShell scale={0.96}>
        <div style={{ position: "absolute", inset: 0, padding: 48 }}>
          <MiniNavigation active="Context map" />
          <div style={{ position: "absolute", left: 64, top: 150, right: 64, bottom: 58 }}>
            <DisconnectedMap localFrame={local} />
          </div>
        </div>
      </ProductShell>
      <SceneCaption
        label="Problem"
        opacity={opacity}
        title="Experimental context is fragmented."
        subtitle="Signals, notes, literature, validation, and reports rarely stay connected."
      />
    </AbsoluteFill>
  );
};

const ProductEntryScene = ({ opacity }: { opacity: number }) => {
  const frame = useCurrentFrame();
  const local = frame;
  const progress = interpolate(local, [28, 156], [0, 1], { easing: easeInOut, ...clamp });

  return (
    <AbsoluteFill style={{ opacity }}>
      <ProductShell scale={0.96}>
        <div style={{ position: "absolute", inset: 0, padding: 48 }}>
          <MiniNavigation active="Reasoning layer" />
          <div style={{ position: "absolute", left: 72, top: 142, width: 600 }}>
            <div style={{ color: palette.text, fontSize: 42, fontWeight: 820, lineHeight: 1.08 }}>
              DIFARYX is the reasoning layer for experimental evidence.
            </div>
            <div style={{ marginTop: 22, color: palette.muted, fontSize: 21, lineHeight: 1.45 }}>
              A product interface for moving from raw signals to traceable scientific decisions.
            </div>
          </div>
          <div style={{ position: "absolute", left: 710, top: 146, right: 68, bottom: 80 }}>
            <WorkflowEngine progress={progress} />
          </div>
        </div>
      </ProductShell>
    </AbsoluteFill>
  );
};

const EvidenceFusionScene = ({ opacity }: { opacity: number }) => {
  const frame = useCurrentFrame();
  const local = frame;
  const progress = interpolate(local, [18, 230], [0, 1], { easing: easeInOut, ...clamp });

  return (
    <AbsoluteFill style={{ opacity }}>
      <ProductShell scale={0.97}>
        <div style={{ position: "absolute", inset: 0, padding: 38 }}>
          <MiniNavigation active="Evidence fusion" />
          <div style={{ position: "absolute", left: 62, top: 114, right: 62 }}>
            <div style={{ color: palette.text, fontSize: 36, fontWeight: 820 }}>
              One decision. Multiple evidence streams.
            </div>
            <div style={{ marginTop: 10, color: palette.muted, fontSize: 19 }}>
              XRD, Raman, XPS, and FTIR are treated as equal channels feeding a shared reasoning layer.
            </div>
          </div>
          <div style={{ position: "absolute", left: 54, top: 214, right: 54, bottom: 48 }}>
            <FusionLayout progress={progress} localFrame={local} />
          </div>
        </div>
      </ProductShell>
    </AbsoluteFill>
  );
};

const TraceScene = ({ opacity }: { opacity: number }) => {
  const frame = useCurrentFrame();
  const local = frame;
  const progress = interpolate(local, [20, 250], [0, 1], { easing: easeInOut, ...clamp });

  return (
    <AbsoluteFill style={{ opacity }}>
      <ProductShell scale={0.97}>
        <div style={{ position: "absolute", inset: 0, padding: 38 }}>
          <MiniNavigation active="Agent execution" />
          <div style={{ position: "absolute", left: 62, top: 112, width: 700 }}>
            <div style={{ color: palette.text, fontSize: 34, fontWeight: 820 }}>
              The agent does not just summarize.
            </div>
            <div style={{ marginTop: 10, color: palette.muted, fontSize: 20 }}>
              It reasons through the evidence inside an execution trace.
            </div>
          </div>
          <div style={{ position: "absolute", left: 58, top: 208, width: 680, bottom: 56 }}>
            <ExecutionTrace progress={progress} />
          </div>
          <div style={{ position: "absolute", right: 58, top: 184, width: 770, bottom: 56 }}>
            <LiveReasoningConsole progress={progress} localFrame={local} />
          </div>
        </div>
      </ProductShell>
    </AbsoluteFill>
  );
};

const DecisionScene = ({ opacity }: { opacity: number }) => {
  const frame = useCurrentFrame();
  const local = frame;
  const progress = interpolate(local, [0, 90], [0, 1], { easing: easeInOut, ...clamp });

  return (
    <AbsoluteFill style={{ opacity }}>
      <ProductShell scale={0.97}>
        <div style={{ position: "absolute", inset: 0, padding: 44 }}>
          <MiniNavigation active="Decision output" />
          <div style={{ position: "absolute", left: 62, top: 124 }}>
            <div style={{ color: palette.text, fontSize: 38, fontWeight: 820 }}>
              A defensible decision, not a static report.
            </div>
            <div style={{ marginTop: 10, color: palette.muted, fontSize: 20 }}>
              Evidence, confidence boundaries, and next steps remain visible.
            </div>
          </div>
          <div style={{ position: "absolute", left: 62, top: 228, right: 62, bottom: 58 }}>
            <DecisionOutput progress={progress} />
          </div>
        </div>
      </ProductShell>
    </AbsoluteFill>
  );
};

const ClosingScene = ({ opacity }: { opacity: number }) => {
  const frame = useCurrentFrame();
  const local = frame;
  const scale = interpolate(local, [0, 120], [0.94, 1], { easing: easeOut, ...clamp });
  const wordOpacity = interpolate(local, [8, 42], [0, 1], { easing: easeOut, ...clamp });

  return (
    <AbsoluteFill style={{ opacity }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          transform: `scale(${scale})`,
        }}
      >
        <div>
          <div
            style={{
              opacity: wordOpacity,
              color: palette.text,
              fontSize: 116,
              lineHeight: 0.95,
              fontWeight: 880,
              letterSpacing: 0,
            }}
          >
            DIFARYX
          </div>
          <div
            style={{
              marginTop: 30,
              opacity: interpolate(local, [36, 76], [0, 1], { easing: easeOut, ...clamp }),
              color: palette.text,
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            From signal to scientific decision.
          </div>
          <div
            style={{
              marginTop: 18,
              opacity: interpolate(local, [62, 100], [0, 1], { easing: easeOut, ...clamp }),
              color: palette.muted,
              fontSize: 25,
              fontWeight: 520,
            }}
          >
            Autonomous reasoning for experimental evidence.
          </div>
          <div
            style={{
              display: "inline-flex",
              marginTop: 40,
              border: `1px solid ${palette.border}`,
              borderRadius: 999,
              padding: "12px 18px",
              color: palette.text,
              backgroundColor: "rgba(15, 23, 42, 0.72)",
              fontSize: 18,
              opacity: interpolate(local, [92, 130], [0, 1], { easing: easeOut, ...clamp }),
            }}
          >
            Google AI Challenge Demo
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const MiniNavigation = ({ active }: { active: string }) => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 10 }}>
        {["Evidence", "Fusion", "Trace", "Decision"].map((item) => (
          <div
            key={item}
            style={{
              border: `1px solid ${item === active ? "rgba(96, 165, 250, 0.52)" : palette.borderSoft}`,
              borderRadius: 999,
              padding: "8px 13px",
              color: item === active ? palette.text : palette.soft,
              backgroundColor: item === active ? "rgba(29, 78, 216, 0.18)" : "rgba(15, 23, 42, 0.36)",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {item}
          </div>
        ))}
      </div>
      <div style={{ color: palette.soft, fontSize: 14 }}>{active}</div>
    </div>
  );
};

const SignalWorkbench = ({ progress }: { progress: number }) => {
  return (
    <div
      style={{
        border: `1px solid ${palette.border}`,
        borderRadius: 16,
        backgroundColor: "rgba(10, 17, 29, 0.84)",
        padding: 24,
        height: 356,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: palette.text, fontSize: 24, fontWeight: 800 }}>Live signal intake</div>
          <div style={{ color: palette.soft, fontSize: 15, marginTop: 6 }}>experimental stream</div>
        </div>
        <div style={{ color: palette.blueSoft, fontSize: 15 }}>active</div>
      </div>
      <svg width="100%" height="238" viewBox="0 0 560 238" style={{ marginTop: 28 }}>
        {[50, 100, 150, 200].map((y) => (
          <line key={y} x1="0" x2="560" y1={y} y2={y} stroke="rgba(148, 163, 184, 0.12)" />
        ))}
        <path
          d="M8 192 C58 178 96 173 130 158 C152 148 160 72 180 154 C204 196 256 166 294 151 C320 140 330 52 350 150 C384 198 432 168 462 153 C488 140 498 88 516 152 C532 180 548 178 556 174"
          fill="none"
          stroke={palette.blueSoft}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="1200"
          strokeDashoffset={1200 - 1200 * progress}
        />
      </svg>
    </div>
  );
};

const DecisionPreview = ({ compact = false }: { compact?: boolean }) => {
  return (
    <div
      style={{
        border: `1px solid rgba(246, 185, 77, 0.42)`,
        borderRadius: 18,
        backgroundColor: "rgba(18, 24, 34, 0.92)",
        padding: compact ? 28 : 34,
      }}
    >
      <div style={{ color: palette.amber, fontSize: 15, fontWeight: 850, letterSpacing: 1.2 }}>
        DECISION BOUNDARY
      </div>
      <div style={{ marginTop: 18, color: palette.text, fontSize: compact ? 30 : 38, fontWeight: 830, lineHeight: 1.1 }}>
        Evidence must become a defensible claim.
      </div>
      <div style={{ marginTop: 18, color: palette.muted, fontSize: compact ? 18 : 21, lineHeight: 1.42 }}>
        DIFARYX keeps the signal, trace, limitations, and report-ready decision connected.
      </div>
    </div>
  );
};

const DisconnectedMap = ({ localFrame }: { localFrame: number }) => {
  const labels = ["Signals", "Notebook notes", "Literature", "Validation", "Reports"];
  const positions = [
    { left: 40, top: 74 },
    { left: 500, top: 40 },
    { left: 970, top: 78 },
    { left: 298, top: 386 },
    { left: 760, top: 376 },
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {labels.map((label, index) => {
        const reveal = interpolate(localFrame, [index * 14, index * 14 + 28], [0, 1], {
          easing: easeOut,
          ...clamp,
        });
        const pos = positions[index];
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: pos.left,
              top: pos.top,
              width: 310,
              border: `1px solid ${palette.border}`,
              borderRadius: 14,
              backgroundColor: "rgba(12, 20, 34, 0.88)",
              padding: 22,
              opacity: reveal,
              transform: `translateY(${interpolate(reveal, [0, 1], [28, 0])}px)`,
            }}
          >
            <div style={{ color: palette.text, fontSize: 25, fontWeight: 820 }}>{label}</div>
            <div style={{ color: palette.soft, fontSize: 16, marginTop: 10 }}>Disconnected</div>
          </div>
        );
      })}
      <svg width="100%" height="100%" viewBox="0 0 1470 550" style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2, 3].map((index) => (
          <path
            key={index}
            d={["M200 180 C420 240 580 180 660 116", "M810 118 C940 178 1020 188 1134 185", "M452 446 C590 356 660 260 694 168", "M918 434 C820 350 772 244 734 167"][index]}
            fill="none"
            stroke="rgba(148, 163, 184, 0.16)"
            strokeWidth="2"
            strokeDasharray="10 12"
            opacity={interpolate(localFrame, [76, 126], [0, 1], clamp)}
          />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 604,
          top: 226,
          width: 260,
          textAlign: "center",
          border: `1px solid rgba(246, 185, 77, 0.44)`,
          borderRadius: 999,
          padding: "18px 22px",
          color: palette.amber,
          backgroundColor: "rgba(37, 27, 12, 0.82)",
          fontSize: 22,
          fontWeight: 850,
          opacity: interpolate(localFrame, [96, 140], [0, 1], clamp),
        }}
      >
        Disconnected
      </div>
    </div>
  );
};

const WorkflowEngine = ({ progress }: { progress: number }) => {
  return (
    <div
      style={{
        border: `1px solid ${palette.border}`,
        borderRadius: 18,
        height: "100%",
        backgroundColor: "rgba(10, 17, 29, 0.82)",
        padding: 36,
      }}
    >
      <div style={{ color: palette.text, fontSize: 25, fontWeight: 820 }}>Reasoning workflow</div>
      <div style={{ marginTop: 46, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
        {workflow.map((step, index) => {
          const active = progress >= index / (workflow.length - 1);
          return (
            <div key={step} style={{ minWidth: 0 }}>
              <div
                style={{
                  height: 130,
                  border: `1px solid ${active ? "rgba(96, 165, 250, 0.58)" : palette.border}`,
                  borderRadius: 14,
                  backgroundColor: active ? "rgba(29, 78, 216, 0.18)" : "rgba(15, 23, 42, 0.45)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: 18,
                }}
              >
                <div style={{ color: active ? palette.blueSoft : palette.soft, fontSize: 15, fontWeight: 850 }}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div style={{ color: palette.text, fontSize: 20, fontWeight: 780 }}>{step}</div>
              </div>
              {index < workflow.length - 1 ? (
                <div
                  style={{
                    marginTop: 28,
                    height: 3,
                    width: "100%",
                    backgroundColor: active ? palette.blue : "#1E293B",
                    transform: `scaleX(${interpolate(progress, [index / 5, (index + 1) / 5], [0, 1], clamp)})`,
                    transformOrigin: "left center",
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 52,
          border: `1px solid rgba(79, 70, 229, 0.32)`,
          borderRadius: 16,
          backgroundColor: "rgba(79, 70, 229, 0.10)",
          padding: 24,
          color: palette.muted,
          fontSize: 20,
          lineHeight: 1.42,
        }}
      >
        Every stage preserves evidence, reasoning context, validation limits, and report-ready output.
      </div>
    </div>
  );
};

const FusionLayout = ({ progress, localFrame }: { progress: number; localFrame: number }) => {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 520, height: 212 }}>
        <SignalPanel spec={evidencePanels[0]} delay={0} progress={progress} localFrame={localFrame} />
      </div>
      <div style={{ position: "absolute", left: 0, bottom: 0, width: 520, height: 212 }}>
        <SignalPanel spec={evidencePanels[1]} delay={20} progress={progress} localFrame={localFrame} />
      </div>
      <div style={{ position: "absolute", right: 0, top: 0, width: 520, height: 212 }}>
        <SignalPanel spec={evidencePanels[2]} delay={40} progress={progress} localFrame={localFrame} />
      </div>
      <div style={{ position: "absolute", right: 0, bottom: 0, width: 520, height: 212 }}>
        <SignalPanel spec={evidencePanels[3]} delay={60} progress={progress} localFrame={localFrame} />
      </div>
      <ConnectionLayer progress={progress} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 430,
          height: 250,
          marginLeft: -215,
          marginTop: -125,
          border: `1px solid rgba(96, 165, 250, 0.54)`,
          borderRadius: 22,
          backgroundColor: "rgba(13, 24, 43, 0.88)",
          boxShadow: "0 26px 74px rgba(0, 0, 0, 0.34)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          opacity: interpolate(progress, [0.12, 0.32], [0, 1], clamp),
          transform: `scale(${interpolate(progress, [0.12, 0.32], [0.92, 1], { easing: easeOut, ...clamp })})`,
        }}
      >
        <div style={{ color: palette.blueSoft, fontSize: 15, fontWeight: 850, letterSpacing: 1.4 }}>
          EVIDENCE FUSION
        </div>
        <div style={{ marginTop: 18, color: palette.text, fontSize: 36, fontWeight: 850 }}>
          Shared claim boundary
        </div>
        <div style={{ marginTop: 14, color: palette.muted, fontSize: 18, lineHeight: 1.38, width: 310 }}>
          Confidence is constrained by the strongest evidence and the missing validation.
        </div>
      </div>
    </div>
  );
};

const SignalPanel = ({
  spec,
  delay,
  progress,
  localFrame,
}: {
  spec: PanelSpec;
  delay: number;
  progress: number;
  localFrame: number;
}) => {
  const reveal = interpolate(localFrame, [delay, delay + 28], [0, 1], {
    easing: easeOut,
    ...clamp,
  });
  const color = toneColor(spec.tone);
  const draw = interpolate(progress, [0.05, 0.65], [0, 1], clamp);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        border: `1px solid ${palette.border}`,
        borderRadius: 16,
        backgroundColor: "rgba(10, 17, 29, 0.88)",
        padding: 20,
        opacity: reveal,
        transform: `translateY(${interpolate(reveal, [0, 1], [24, 0])}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ color, fontSize: 15, fontWeight: 900 }}>{spec.label}</div>
          <div style={{ marginTop: 6, color: palette.text, fontSize: 21, fontWeight: 800 }}>{spec.description}</div>
        </div>
        <div
          style={{
            border: `1px solid ${spec.tone === "amber" ? "rgba(246, 185, 77, 0.42)" : "rgba(96, 165, 250, 0.28)"}`,
            borderRadius: 999,
            padding: "7px 10px",
            color: spec.tone === "amber" ? palette.amber : palette.muted,
            fontSize: 12,
            fontWeight: 750,
          }}
        >
          live
        </div>
      </div>
      <svg width="100%" height="92" viewBox="0 0 486 150" style={{ marginTop: 12 }}>
        {[38, 76, 114].map((y) => (
          <line key={y} x1="0" x2="486" y1={y} y2={y} stroke="rgba(148, 163, 184, 0.10)" />
        ))}
        <path
          d={spec.path}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="900"
          strokeDashoffset={900 - 900 * draw}
        />
      </svg>
      <div style={{ color: spec.tone === "amber" ? palette.amber : palette.soft, fontSize: 14 }}>
        {spec.status}
      </div>
    </div>
  );
};

const ConnectionLayer = ({ progress }: { progress: number }) => {
  return (
    <svg width="100%" height="100%" viewBox="0 0 1512 462" style={{ position: "absolute", inset: 0 }}>
      {[
        "M520 102 C642 112 648 188 756 214",
        "M520 360 C642 334 646 280 756 250",
        "M992 102 C872 118 864 188 756 214",
        "M992 360 C872 332 866 280 756 250",
      ].map((path, index) => (
        <path
          key={path}
          d={path}
          fill="none"
          stroke={index === 2 ? "rgba(246, 185, 77, 0.58)" : "rgba(96, 165, 250, 0.58)"}
          strokeWidth="2.5"
          strokeDasharray="540"
          strokeDashoffset={540 - 540 * interpolate(progress, [0.14, 0.48], [0, 1], clamp)}
        />
      ))}
    </svg>
  );
};

const ExecutionTrace = ({ progress }: { progress: number }) => {
  return (
    <div
      style={{
        height: "100%",
        border: `1px solid ${palette.border}`,
        borderRadius: 18,
        backgroundColor: "rgba(10, 17, 29, 0.88)",
        padding: 26,
      }}
    >
      <div style={{ color: palette.text, fontSize: 24, fontWeight: 820 }}>Execution trace</div>
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {traceSteps.map((step, index) => {
          const active = progress >= index / (traceSteps.length - 1);
          return (
            <div
              key={step}
              style={{
                border: `1px solid ${active ? "rgba(96, 165, 250, 0.48)" : palette.borderSoft}`,
                borderRadius: 13,
                backgroundColor: active ? "rgba(29, 78, 216, 0.15)" : "rgba(15, 23, 42, 0.36)",
                padding: "14px 16px",
                display: "grid",
                gridTemplateColumns: "42px 1fr auto",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ color: active ? palette.blueSoft : palette.soft, fontSize: 14, fontWeight: 880 }}>
                {String(index + 1).padStart(2, "0")}
              </div>
              <div style={{ color: palette.text, fontSize: 20, fontWeight: 780 }}>{step}</div>
              <div style={{ color: active ? palette.green : palette.soft, fontSize: 13 }}>
                {active ? "linked" : "queued"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LiveReasoningConsole = ({ progress, localFrame }: { progress: number; localFrame: number }) => {
  const rows = [
    "Read XRD phase-structure evidence",
    "Attach Raman local-symmetry context",
    "Hold XPS oxidation state as boundary",
    "Attach FTIR bonding context",
    "Generate decision with validation limit",
  ];

  return (
    <div
      style={{
        height: "100%",
        border: `1px solid ${palette.border}`,
        borderRadius: 18,
        backgroundColor: "rgba(12, 20, 34, 0.88)",
        padding: 28,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: palette.text, fontSize: 24, fontWeight: 820 }}>Live reasoning</div>
          <div style={{ marginTop: 6, color: palette.soft, fontSize: 15 }}>evidence-bound execution</div>
        </div>
        <div style={{ color: palette.blueSoft, fontSize: 15 }}>
          {Math.round(interpolate(progress, [0, 1], [12, 92], clamp))}% complete
        </div>
      </div>
      <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "1fr 260px", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((row, index) => (
            <div
              key={row}
              style={{
                border: `1px solid ${palette.borderSoft}`,
                borderRadius: 12,
                padding: "14px 16px",
                backgroundColor: "rgba(7, 11, 18, 0.36)",
                color: index === 2 ? palette.amber : palette.muted,
                fontSize: 17,
                opacity: interpolate(localFrame, [index * 32, index * 32 + 24], [0, 1], clamp),
              }}
            >
              {row}
            </div>
          ))}
        </div>
        <div
          style={{
            border: `1px solid rgba(79, 70, 229, 0.34)`,
            borderRadius: 14,
            backgroundColor: "rgba(79, 70, 229, 0.10)",
            padding: 18,
          }}
        >
          <div style={{ color: palette.indigo, fontSize: 14, fontWeight: 900 }}>TRACE STATE</div>
          <div style={{ marginTop: 18, color: palette.text, fontSize: 28, fontWeight: 840 }}>
            Evidence fusion in progress
          </div>
          <div style={{ marginTop: 16, height: 8, borderRadius: 999, backgroundColor: "#111827", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${interpolate(progress, [0, 1], [8, 100], clamp)}%`,
                backgroundColor: palette.blue,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const DecisionOutput = ({ progress }: { progress: number }) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 24, height: "100%" }}>
      <div
        style={{
          border: `1px solid rgba(96, 165, 250, 0.42)`,
          borderRadius: 20,
          backgroundColor: "rgba(10, 17, 29, 0.9)",
          padding: 34,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ color: palette.blueSoft, fontSize: 15, fontWeight: 900, letterSpacing: 1.3 }}>
            REPORT-READY DECISION
          </div>
          <div style={{ marginTop: 22, color: palette.text, fontSize: 41, fontWeight: 850, lineHeight: 1.1 }}>
            CuFe<sub>2</sub>O<sub>4</sub> spinel assignment supported by XRD evidence.
          </div>
          <div style={{ marginTop: 24, color: palette.muted, fontSize: 22, lineHeight: 1.45, maxWidth: 770 }}>
            The phase-structure signal supports the claim, while the surface oxidation state remains a validation
            boundary.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <DecisionMetric label="Evidence fusion" value="4 channels" progress={progress} />
          <DecisionMetric label="Claim boundary" value="visible" progress={progress} amber />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <BoundaryCard
          label="Validation boundary"
          text="Surface oxidation state requires XPS confirmation."
          accent={palette.amber}
          progress={progress}
          delay={0}
        />
        <BoundaryCard
          label="Next step"
          text="Run Raman/XPS consistency check before publication-level claim."
          accent={palette.blueSoft}
          progress={progress}
          delay={0.08}
        />
        <BoundaryCard
          label="Decision mode"
          text="Report-ready, with limitations preserved."
          accent={palette.green}
          progress={progress}
          delay={0.16}
        />
      </div>
    </div>
  );
};

const DecisionMetric = ({
  label,
  value,
  progress,
  amber = false,
}: {
  label: string;
  value: string;
  progress: number;
  amber?: boolean;
}) => (
  <div
    style={{
      border: `1px solid ${amber ? "rgba(246, 185, 77, 0.34)" : palette.border}`,
      borderRadius: 14,
      padding: 18,
      backgroundColor: "rgba(15, 23, 42, 0.52)",
      opacity: interpolate(progress, [0.35, 0.7], [0, 1], clamp),
    }}
  >
    <div style={{ color: palette.soft, fontSize: 14 }}>{label}</div>
    <div style={{ color: amber ? palette.amber : palette.text, fontSize: 25, fontWeight: 840, marginTop: 8 }}>
      {value}
    </div>
  </div>
);

const BoundaryCard = ({
  label,
  text,
  accent,
  progress,
  delay,
}: {
  label: string;
  text: string;
  accent: string;
  progress: number;
  delay: number;
}) => {
  const reveal = interpolate(progress, [delay, delay + 0.25], [0, 1], {
    easing: easeOut,
    ...clamp,
  });

  return (
    <div
      style={{
        border: `1px solid ${palette.border}`,
        borderRadius: 16,
        backgroundColor: "rgba(12, 20, 34, 0.82)",
        padding: 22,
        opacity: reveal,
        transform: `translateY(${interpolate(reveal, [0, 1], [24, 0])}px)`,
      }}
    >
      <div style={{ color: accent, fontSize: 14, fontWeight: 900, letterSpacing: 1.1 }}>{label}</div>
      <div style={{ marginTop: 14, color: palette.text, fontSize: 22, lineHeight: 1.25, fontWeight: 760 }}>{text}</div>
    </div>
  );
};

export const GoogleAIChallengeVideo = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ ...baseFont, width: WIDTH, height: HEIGHT, backgroundColor: palette.bg }}>
      <Background />
      <Sequence from={timings.hook.from} durationInFrames={timings.hook.duration}>
        <HookScene opacity={fadeWindow(frame, timings.hook.from, timings.hook.duration)} />
      </Sequence>
      <Sequence from={timings.problem.from} durationInFrames={timings.problem.duration}>
        <ProblemScene opacity={fadeWindow(frame, timings.problem.from, timings.problem.duration)} />
      </Sequence>
      <Sequence from={timings.product.from} durationInFrames={timings.product.duration}>
        <ProductEntryScene opacity={fadeWindow(frame, timings.product.from, timings.product.duration)} />
      </Sequence>
      <Sequence from={timings.evidence.from} durationInFrames={timings.evidence.duration}>
        <EvidenceFusionScene opacity={fadeWindow(frame, timings.evidence.from, timings.evidence.duration)} />
      </Sequence>
      <Sequence from={timings.trace.from} durationInFrames={timings.trace.duration}>
        <TraceScene opacity={fadeWindow(frame, timings.trace.from, timings.trace.duration)} />
      </Sequence>
      <Sequence from={timings.decision.from} durationInFrames={timings.decision.duration}>
        <DecisionScene opacity={fadeWindow(frame, timings.decision.from, timings.decision.duration)} />
      </Sequence>
      <Sequence from={timings.close.from} durationInFrames={timings.close.duration}>
        <ClosingScene opacity={fadeWindow(frame, timings.close.from, timings.close.duration, 24)} />
      </Sequence>
    </AbsoluteFill>
  );
};
