import { ImageResponse } from "next/og";
import { businessInfo } from "@/lib/business-info";

export const alt = "Silke Studio — beauty and clothing alterations in Høje Taastrup";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The card people see when the site is shared on Facebook, Instagram or in a message. */
export default async function OpengraphImage() {
  // Forest-green ground, an ivory band for the content, yellow for the name: the site's 60-30-10.
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1f3d36",
        color: "#fbf4ea",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", border: "3px solid #fcca45", padding: "18px 44px" }}>
          <div style={{ fontSize: 66, letterSpacing: 10, fontWeight: 700 }}>SILKE</div>
        </div>
        <div style={{ fontSize: 40, color: "#fcca45", marginTop: 18, letterSpacing: 6 }}>
          STUDIO
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "34px 40px",
          backgroundColor: "#f5efe3",
          color: "#0e201b",
        }}
      >
        <div style={{ fontSize: 32 }}>Beauty · Nails · Threading · Alterations · Sari</div>
        <div style={{ fontSize: 25, marginTop: 10 }}>{businessInfo.address.line2}</div>
      </div>
    </div>,
    size,
  );
}
