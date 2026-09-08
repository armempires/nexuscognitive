import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

export default function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const score = Number(searchParams.get("score") || "0");
  const max = Number(searchParams.get("max") || "145");
  const label = searchParams.get("label") || "";
  const safeScore = Number.isFinite(score) ? Math.max(0, score) : 0;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 145;
  const angle = Math.round(Math.max(0, Math.min(1, safeScore / safeMax)) * 360);

  return new ImageResponse(
    <div
      style={{
        width: 360,
        height: 360,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <div
        style={{
          width: 320,
          height: 320,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `conic-gradient(#f6c66a ${angle}deg, #2a2733 ${angle}deg 360deg)`,
        }}
      >
        <div
          style={{
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: "#211e2d",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", color: "#f6c66a", fontSize: 90, fontWeight: 800 }}>
            {String(safeScore)}
          </div>
          <div style={{ display: "flex", color: "#777184", fontSize: 24, marginTop: 6 }}>
            / {String(safeMax)}
          </div>
          {label ? (
            <div
              style={{
                display: "flex",
                marginTop: 18,
                padding: "10px 20px",
                borderRadius: 999,
                background: "#f6c66a33",
                color: "#f6c66a",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {label}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    { width: 360, height: 360 },
  );
}