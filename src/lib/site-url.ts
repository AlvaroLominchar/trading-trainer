import "server-only";

const LOCAL_SITE_URL = "http://localhost:3000";

function normalizeSiteUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl) {
    return normalizeSiteUrl(configuredUrl);
  }

  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return normalizeSiteUrl(`https://${vercelUrl}`);
  }

  return LOCAL_SITE_URL;
}
