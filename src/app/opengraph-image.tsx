import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site";
import { event } from "@/content/event";
import { brand } from "@/lib/design/tokens";

/**
 * Default social share image - espresso field, honeycomb accents, wordmark.
 * Colors come from the shared brand tokens so OG matches the live site.
 */
export const alt = `${siteConfig.name} - Where women and gender minorities build in tech`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const { espresso, cream, honey, sky } = brand;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: espresso,
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: "16px" }}>
          {[honey, sky, honey, sky, honey, sky, honey, sky].map((c, i) => (
            <div
              key={i}
              style={{
                width: 40,
                height: 46,
                background: c,
                opacity: 0.25 + (i % 3) * 0.2,
                clipPath:
                  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: cream,
              opacity: 0.65,
              marginBottom: 24,
            }}
          >
            {event.dates} · UMass Amherst
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              color: cream,
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            Where women and gender minorities build in tech.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 40,
            fontWeight: 700,
            color: cream,
          }}
        >
          Hack(H)er413
        </div>
      </div>
    ),
    { ...size },
  );
}
