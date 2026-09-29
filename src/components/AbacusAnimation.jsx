const RODS = [
  { id: 0, leftColor: "#D4A843", leftCount: 3, delay: "0s", duration: "3.8s" },
  { id: 1, leftColor: "#E53935", leftCount: 5, delay: "0.5s", duration: "4.3s" },
  { id: 2, leftColor: "#1E88E5", leftCount: 2, delay: "1.1s", duration: "3.5s" },
  { id: 3, leftColor: "#D4A843", leftCount: 7, delay: "0.3s", duration: "4.8s" },
  { id: 4, leftColor: "#43A047", leftCount: 4, delay: "0.8s", duration: "3.2s" },
  { id: 5, leftColor: "#E53935", leftCount: 6, delay: "0.2s", duration: "4.5s" },
  { id: 6, leftColor: "#1E88E5", leftCount: 3, delay: "0.65s", duration: "3.9s" },
];

const TOTAL_BEADS = 9;
const BEAD_SIZE = 22;
const BEAD_GAP = 4;

function Bead({ color, style }) {
  return (
    <div
      style={{
        width: BEAD_SIZE,
        height: BEAD_SIZE,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${lighten(color)}, ${color} 60%, ${darken(color)} 100%)`,
        boxShadow: `0 2px 4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)`,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

function lighten(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (v) => Math.min(255, v + 80);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function darken(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dim = (v) => Math.max(0, v - 50);
  return `rgb(${dim(r)},${dim(g)},${dim(b)})`;
}

export default function AbacusAnimation() {
  const beadStep = BEAD_SIZE + BEAD_GAP;

  return (
    <>
      <style>{`
        @keyframes slideLeft {
          0%, 10%   { transform: translateX(0); }
          35%, 65%  { transform: translateX(-${beadStep * 2}px); }
          90%, 100% { transform: translateX(0); }
        }
        @keyframes slideRight {
          0%, 10%   { transform: translateX(0); }
          35%, 65%  { transform: translateX(${beadStep * 2}px); }
          90%, 100% { transform: translateX(0); }
        }
        @keyframes abacusPulse {
          0%, 100% { box-shadow: 0 0 40px 8px rgba(212,168,67,0.18), 0 8px 40px rgba(0,0,0,0.22); }
          50%       { box-shadow: 0 0 60px 16px rgba(212,168,67,0.32), 0 8px 40px rgba(0,0,0,0.22); }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        {/* Abacus frame */}
        <div
          style={{
            position: "relative",
            background: "linear-gradient(160deg, #7B4F1E 0%, #5C3410 50%, #3E2008 100%)",
            borderRadius: 16,
            padding: "14px 18px",
            boxShadow:
              "0 0 50px 10px rgba(212,168,67,0.22), 0 10px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)",
            animation: "abacusPulse 4s ease-in-out infinite",
            width: "100%",
            maxWidth: 380,
          }}
        >
          {/* Top bar */}
          <div
            style={{
              height: 10,
              background: "linear-gradient(90deg, #A0632A, #C8844A, #A0632A)",
              borderRadius: 6,
              marginBottom: 10,
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            }}
          />

          {/* Rods */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {RODS.map((rod) => {
              const leftBeads = rod.leftCount;
              const rightBeads = TOTAL_BEADS - leftBeads;

              return (
                <div
                  key={rod.id}
                  style={{
                    position: "relative",
                    height: BEAD_SIZE + 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {/* Rod line */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      height: 3,
                      background:
                        "linear-gradient(90deg, rgba(180,120,60,0.4), rgba(220,180,100,0.7), rgba(180,120,60,0.4))",
                      borderRadius: 2,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />

                  {/* Left group (animated) */}
                  <div
                    style={{
                      display: "flex",
                      gap: BEAD_GAP,
                      animation: `slideLeft ${rod.duration} ${rod.delay} ease-in-out infinite`,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {Array.from({ length: leftBeads }).map((_, i) => (
                      <Bead key={i} color={rod.leftColor} />
                    ))}
                  </div>

                  {/* Spacer (divider gap) */}
                  <div style={{ flex: 1 }} />

                  {/* Right group (animated opposite) */}
                  <div
                    style={{
                      display: "flex",
                      gap: BEAD_GAP,
                      animation: `slideRight ${rod.duration} ${rod.delay} ease-in-out infinite`,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {Array.from({ length: rightBeads }).map((_, i) => (
                      <Bead key={i} color="#ffffff" style={{ opacity: 0.75 }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom bar */}
          <div
            style={{
              height: 10,
              background: "linear-gradient(90deg, #A0632A, #C8844A, #A0632A)",
              borderRadius: 6,
              marginTop: 10,
              boxShadow: "0 -2px 6px rgba(0,0,0,0.2)",
            }}
          />

          {/* Left post */}
          <div
            style={{
              position: "absolute",
              left: 8,
              top: 0,
              bottom: 0,
              width: 10,
              background: "linear-gradient(180deg, #A0632A, #C8844A, #A0632A)",
              borderRadius: 5,
            }}
          />
          {/* Right post */}
          <div
            style={{
              position: "absolute",
              right: 8,
              top: 0,
              bottom: 0,
              width: 10,
              background: "linear-gradient(180deg, #A0632A, #C8844A, #A0632A)",
              borderRadius: 5,
            }}
          />
        </div>

        {/* Label */}
        <p
          style={{
            marginTop: 16,
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic",
            fontSize: "1rem",
            color: "rgba(212,168,67,0.85)",
            letterSpacing: "0.04em",
            textAlign: "center",
          }}
        >
          Think. Calculate. Excel.
        </p>
      </div>
    </>
  );
}
