import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { brand } from "@/lib/design/tokens";
import { emailBrand } from "@/lib/emails/chrome";

/**
 * Hive Admit — personalized acceptance ticket (PNG via next/og).
 * Unique to Hack(H)er: honeycomb + bee, not an airline boarding pass.
 */

export const hiveAdmitSize = { width: 1120, height: 520 } as const;

export type HiveAdmitVars = {
  firstName: string;
  lastName?: string;
  /** Optional short role line, e.g. "Hacker". */
  role?: string;
};

function displayName(vars: HiveAdmitVars): string {
  const first = vars.firstName.trim() || "Hacker";
  const last = vars.lastName?.trim();
  return last ? `${first} ${last}` : first;
}

async function loadBeeDataUrl(): Promise<string> {
  const bytes = await readFile(
    join(process.cwd(), "public/brand/bee-mark.png"),
  );
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

async function loadFonts() {
  const dir = join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans");
  const [regular, bold] = await Promise.all([
    readFile(join(dir, "Geist-Regular.ttf")),
    readFile(join(dir, "Geist-Bold.ttf")),
  ]);
  return [
    { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Geist", data: bold, weight: 700 as const, style: "normal" as const },
  ];
}

/** Flat hex PNG via SVG — Satori clip-path is unreliable. */
function hexDataUrl(fill: string, stroke?: string): string {
  const strokeAttr = stroke
    ? `stroke="${stroke}" stroke-width="4"`
    : `stroke="none"`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="132" viewBox="0 0 120 132"><polygon points="60,4 114,34 114,98 60,128 6,98 6,34" fill="${fill}" ${strokeAttr}/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Absolute URL for embedding the ticket in email HTML. */
export function hiveAdmitImageUrl(vars: HiveAdmitVars): string {
  const params = new URLSearchParams();
  params.set("firstName", vars.firstName.trim() || "Hacker");
  if (vars.lastName?.trim()) params.set("lastName", vars.lastName.trim());
  if (vars.role?.trim()) params.set("role", vars.role.trim());
  return `${emailBrand.url}/api/emails/hive-admit?${params.toString()}`;
}

function HoneycombField({
  honey,
  sky,
  gold,
}: {
  honey: string;
  sky: string;
  gold: string;
}) {
  const cells = [
    { left: 40, top: 24, size: 48, color: honey, opacity: 0.22 },
    { left: 78, top: 48, size: 48, color: sky, opacity: 0.18 },
    { left: 116, top: 24, size: 48, color: honey, opacity: 0.2 },
    { left: 154, top: 48, size: 48, color: gold, opacity: 0.14 },
    { left: 192, top: 24, size: 48, color: sky, opacity: 0.16 },
    { left: 230, top: 48, size: 48, color: honey, opacity: 0.18 },
    { left: 880, top: 360, size: 56, color: honey, opacity: 0.16 },
    { left: 924, top: 390, size: 56, color: sky, opacity: 0.14 },
    { left: 968, top: 360, size: 56, color: gold, opacity: 0.12 },
    { left: 1012, top: 390, size: 56, color: honey, opacity: 0.15 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
      }}
    >
      {cells.map((cell, i) => (
        <img
          key={i}
          src={hexDataUrl(cell.color)}
          width={cell.size}
          height={Math.round(cell.size * 1.1)}
          alt=""
          style={{
            position: "absolute",
            left: cell.left,
            top: cell.top,
            opacity: cell.opacity,
          }}
        />
      ))}
    </div>
  );
}

export async function renderHiveAdmitTicket(
  vars: HiveAdmitVars,
): Promise<ImageResponse> {
  const { espresso, cream, honey, brown, gold, sky, honeySoft } = brand;
  const name = displayName(vars).toUpperCase();
  const role = (vars.role?.trim() || "Hacker").toUpperCase();
  const [beeSrc, fonts] = await Promise.all([loadBeeDataUrl(), loadFonts()]);
  const year = String(emailBrand.cycleYear);
  const stampHex = hexDataUrl(honey, gold);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(145deg, ${espresso} 0%, #2a1c18 55%, ${espresso} 100%)`,
          padding: 32,
          fontFamily: "Geist",
          position: "relative",
        }}
      >
        <HoneycombField honey={honey} sky={sky} gold={gold} />

        {/* Ticket */}
        <div
          style={{
            width: 1048,
            height: 428,
            display: "flex",
            background: cream,
            borderRadius: 22,
            border: `3px solid ${gold}`,
            overflow: "hidden",
            position: "relative",
            boxShadow: `0 18px 50px rgba(0,0,0,0.35)`,
          }}
        >
          {/* Main panel */}
          <div
            style={{
              width: 768,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "32px 40px 28px",
              background: cream,
              position: "relative",
            }}
          >
            {/* Soft honey wash behind name */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 120,
                height: 160,
                background: `linear-gradient(180deg, ${honeySoft}00 0%, ${honeySoft} 45%, ${honeySoft}00 100%)`,
                display: "flex",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <img
                  src={beeSrc}
                  width={56}
                  height={56}
                  alt=""
                  style={{ objectFit: "contain" }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: 20,
                      fontWeight: 700,
                      color: espresso,
                      letterSpacing: -0.5,
                    }}
                  >
                    <span style={{ display: "flex" }}>Hack(H)er413</span>
                    <span
                      style={{
                        display: "flex",
                        marginLeft: 10,
                        fontSize: 16,
                        fontWeight: 400,
                        color: brown,
                        opacity: 0.65,
                      }}
                    >
                      {year}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: 3.5,
                      color: gold,
                    }}
                  >
                    HIVE ADMIT
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "10px 16px",
                  background: espresso,
                  color: cream,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 2,
                  borderRadius: 999,
                }}
              >
                {"YOU'RE IN"}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 3.5,
                  color: brown,
                  opacity: 0.55,
                }}
              >
                POLLINATOR
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: name.length > 20 ? 46 : 58,
                  fontWeight: 700,
                  color: espresso,
                  lineHeight: 1.02,
                  maxWidth: 700,
                  letterSpacing: -1,
                }}
              >
                {name}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 40,
                borderTop: `2px solid ${sky}`,
                paddingTop: 18,
              }}
            >
              {[
                { label: "DATE", value: emailBrand.eventDatesShort },
                { label: "CLASS", value: role },
                { label: "VENUE", value: "UMass Amherst" },
              ].map((field) => (
                <div
                  key={field.label}
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 2.5,
                      color: brown,
                      opacity: 0.55,
                    }}
                  >
                    {field.label}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 19,
                      fontWeight: 700,
                      color: espresso,
                    }}
                  >
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Perforation with ticket notches */}
          <div
            style={{
              width: 28,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              background: `linear-gradient(90deg, ${cream} 0%, ${honeySoft} 100%)`,
              position: "relative",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: espresso,
                marginTop: -14,
                display: "flex",
              }}
            />
            {Array.from({ length: 11 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 4,
                  height: 14,
                  borderRadius: 999,
                  background: brown,
                  opacity: 0.28,
                  display: "flex",
                }}
              />
            ))}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: espresso,
                marginBottom: -14,
                display: "flex",
              }}
            />
          </div>

          {/* Stub */}
          <div
            style={{
              flex: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              background: honeySoft,
              padding: "28px 20px",
            }}
          >
            <div
              style={{
                width: 140,
                height: 154,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <img
                src={stampHex}
                width={140}
                height={154}
                alt=""
                style={{ position: "absolute", inset: 0 }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  position: "relative",
                }}
              >
                <img
                  src={beeSrc}
                  width={36}
                  height={36}
                  alt=""
                  style={{ objectFit: "contain" }}
                />
                <div
                  style={{
                    display: "flex",
                    fontSize: 28,
                    fontWeight: 700,
                    color: espresso,
                    letterSpacing: 1,
                  }}
                >
                  IN
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 3,
                  color: brown,
                  opacity: 0.65,
                }}
              >
                KEEP THIS
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 16,
                  fontWeight: 700,
                  color: espresso,
                  textAlign: "center",
                }}
              >
                Pass to the hive
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...hiveAdmitSize,
      fonts,
    },
  );
}
