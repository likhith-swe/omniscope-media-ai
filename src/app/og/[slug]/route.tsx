import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getTitle } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const title = getTitle(slug);

  const background = title
    ? `linear-gradient(160deg, ${title.palette.from}, ${title.palette.to})`
    : "linear-gradient(160deg, #08090E, #11131C)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background,
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "999px",
              border: "3px solid #F0B25A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "12px", height: "12px", borderRadius: "999px", background: "#F0B25A", display: "flex" }} />
          </div>
          <span style={{ fontSize: "26px", fontWeight: 600, letterSpacing: "-0.02em" }}>
            OmniScope
          </span>
          <span style={{ fontSize: "15px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.55)", marginLeft: "8px" }}>
            MEDIA INTELLIGENCE
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {title ? (
            <>
              <span style={{ fontSize: "22px", color: "rgba(255,255,255,0.65)", marginBottom: "12px" }}>
                {title.year} · ★ {title.rating.toFixed(1)} · {title.genres.join(" / ")}
              </span>
              <span
                style={{
                  fontSize: title.title.length > 20 ? "84px" : "104px",
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  textTransform: "uppercase",
                  maxWidth: "1050px",
                }}
              >
                {title.title}
              </span>
              <span style={{ fontSize: "24px", color: "rgba(255,255,255,0.7)", marginTop: "18px" }}>
                Where it streams in India, the US and the UK — verified daily.
              </span>
            </>
          ) : (
            <span style={{ fontSize: "96px", fontWeight: 800, lineHeight: 1.05 }}>
              Name that movie. Know where it plays.
            </span>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)" }}>
            omniscope.tv — quote it, describe it, or drop a frame
          </span>
          <span style={{ fontSize: "16px", color: "#F0B25A", letterSpacing: "0.2em" }}>
            {title ? `/WATCH/${title.slug.toUpperCase()}` : "SCENE RECOGNIZER"}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
