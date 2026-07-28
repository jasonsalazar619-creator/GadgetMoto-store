import "server-only";

const fallbackSiteUrl = "https://gadget-moto-store.vercel.app";

function resolveSiteUrl(): URL {
  const configuredHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (!configuredHost) {
    return new URL(fallbackSiteUrl);
  }

  try {
    const url = new URL(
      configuredHost.startsWith("https://")
        ? configuredHost
        : `https://${configuredHost}`,
    );
    return url.protocol === "https:" ? url : new URL(fallbackSiteUrl);
  } catch {
    return new URL(fallbackSiteUrl);
  }
}

export const siteUrl = resolveSiteUrl();

export function absoluteSiteUrl(pathname: string): string {
  return new URL(pathname, siteUrl).toString();
}
