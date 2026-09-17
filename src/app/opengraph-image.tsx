import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "PDF Signer Editor — Free Online Document Signing & Annotation";

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
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #e11d48 100%)",
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
          {/* Document Icon Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#e11d48",
              width: 110,
              height: 110,
              borderRadius: 28,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4)",
            }}
          >
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M12 18v-6" />
              <path d="m9 15 3-3 3 3" />
            </svg>
          </div>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>
            PDF <span style={{ color: "#fb7185" }}>Signer</span>
          </div>
        </div>
        <div style={{ fontSize: 36, fontWeight: 500, opacity: 0.95, textAlign: "center", maxWidth: 900 }}>
          Free Online Document Signing &amp; Text Annotation
        </div>
        <div style={{ fontSize: 24, opacity: 0.75, marginTop: 20, letterSpacing: 0.5 }}>
          Client-side • Fast • Secure • No File Uploads
        </div>
      </div>
    ),
    { ...size }
  );
}