import { NextResponse } from "next/server";

type UrlItem = {
  loc: string;
  lastmod?: string; // ISO string
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number; // 0.0 - 1.0
};

type VenueListItem = {
  _id: string;
  name: string;
  slug: string;
  type: "TURF" | "EVENT_SPACE";
  city?: string;
  area?: string;
  thumbnailUrl: string;
  updatedAt?: string; // optional (only if your API returns it)
};

// ---- helpers ----
function escapeXml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toIsoDate(input?: string) {
  if (!input) return undefined;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function buildSitemap(urls: UrlItem[]) {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => {
    const loc = escapeXml(u.loc);
    const lastmod = u.lastmod ? `<lastmod>${escapeXml(u.lastmod)}</lastmod>` : "";
    const changefreq = u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : "";
    const priority =
      typeof u.priority === "number" ? `<priority>${u.priority.toFixed(1)}</priority>` : "";

    return `<url>
  <loc>${loc}</loc>
  ${lastmod}
  ${changefreq}
  ${priority}
</url>`;
  })
  .join("\n")}
</urlset>`;

  return body;
}

// ---- route ----
export async function GET() {
  const baseUrl = "https://www.turfhere.com";

  // Fetch venues server-side from your existing API
  // (No filters, no paging for sitemap; we want all public venues)
  let venues: VenueListItem[] = [];

  try {
    const res = await fetch(`${baseUrl}/api/venues`, {
      // cache a bit so it doesn’t hammer your API
      next: { revalidate: 3600 }, // 1 hour
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const json = (await res.json()) as { venues?: VenueListItem[] };
      if (Array.isArray(json.venues)) venues = json.venues;
    }
  } catch {
    // If API fails, we still return a sitemap with static routes (Google-friendly fallback)
    venues = [];
  }

  const staticUrls: UrlItem[] = [
    { loc: `${baseUrl}/`, changefreq: "daily", priority: 1.0 },
    { loc: `${baseUrl}/about`, changefreq: "monthly", priority: 0.6 },
    { loc: `${baseUrl}/contact`, changefreq: "monthly", priority: 0.6 },
    { loc: `${baseUrl}/owner`, changefreq: "weekly", priority: 0.7 },
    { loc: `${baseUrl}/venues`, changefreq: "daily", priority: 0.9 },
  ];

  const venueUrls: UrlItem[] = venues
    .filter((v) => typeof v.slug === "string" && v.slug.trim().length > 0)
    .map((v) => ({
      loc: `${baseUrl}/v/${encodeURIComponent(v.slug)}`,
      // Only include lastmod if you actually have updatedAt
      lastmod: toIsoDate(v.updatedAt),
      changefreq: "weekly",
      priority: 0.8,
    }));

  // Optional: de-duplicate by loc (safe)
  const all = [...staticUrls, ...venueUrls];
  const deduped = Array.from(new Map(all.map((u) => [u.loc, u])).values());

  const xml = buildSitemap(deduped);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
