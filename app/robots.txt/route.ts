export async function GET() {
    return new Response(
  `User-agent: *
  Allow: /
  
  Disallow: /api/
  Disallow: /_next/
  Disallow: /admin/
  
  Sitemap: https://turfhere.com/sitemap.xml`,
      {
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );
  }
  