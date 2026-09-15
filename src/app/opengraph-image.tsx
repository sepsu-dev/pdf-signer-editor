import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "KritQR — Generate QR Code Online Gratis";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          fontFamily: "system-ui, sans-serif",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              background: "white",
              padding: 20,
              borderRadius: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "#0f172a",
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "#0f172a",
                  borderRadius: 4,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "#0f172a",
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  width: 16,
                  height: 16,
                  background: "#0f172a",
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -3 }}>
            KritQR
          </div>
        </div>
        <div style={{ fontSize: 40, opacity: 0.9 }}>
          Generate QR Code Online Gratis
        </div>
        <div style={{ fontSize: 28, opacity: 0.7, marginTop: 16 }}>
          kritqr.my.id
        </div>
      </div>
    ),
    { ...size }
  );
}