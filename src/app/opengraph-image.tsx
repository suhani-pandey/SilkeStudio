import { ImageResponse } from "next/og";
import { businessInfo } from "@/lib/business-info";

export const alt = "GlowNest Beauty Salon — nails, threading, facials, hair and waxing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The card people see when the site is shared on Facebook, Instagram or in a message. */
export default async function OpengraphImage() {
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
          backgroundColor: "#fbf8f3",
          color: "#241e1a",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", border: "3px solid #b58648", padding: "18px 44px" }}>
          <div style={{ fontSize: 66, letterSpacing: 10, color: "#b58648", fontWeight: 700 }}>
            GLOWNEST
          </div>
        </div>
        <div style={{ fontSize: 40, color: "#6b2c8f", marginTop: 18 }}>Salon</div>
        <div style={{ fontSize: 30, marginTop: 42, color: "#6a6058" }}>
          Nails · Threading · Facials · Hair · Waxing
        </div>
        <div style={{ fontSize: 25, marginTop: 14, color: "#6a6058" }}>
          {businessInfo.address.line2}
        </div>
      </div>
    ),
    size,
  );
}
