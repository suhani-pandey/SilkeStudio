import { ImageResponse } from "next/og";
import { businessInfo } from "@/lib/business-info";

export const alt = "Silke Studio — beauty and clothing alterations in Høje Taastrup";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The card people see when the site is shared on Facebook, Instagram or in a message. */
export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#faf6f1",
        color: "#2e2622",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ display: "flex", border: "3px solid #9a6237", padding: "18px 44px" }}>
        <div style={{ fontSize: 66, letterSpacing: 10, color: "#9a6237", fontWeight: 700 }}>
          SILKE
        </div>
      </div>
      <div style={{ fontSize: 40, color: "#b95a41", marginTop: 18 }}>Studio</div>
      <div style={{ fontSize: 30, marginTop: 42, color: "#6b5f56" }}>
        Beauty · Nails · Threading · Alterations · Sari
      </div>
      <div style={{ fontSize: 25, marginTop: 14, color: "#6b5f56" }}>
        {businessInfo.address.line2}
      </div>
    </div>,
    size,
  );
}
