import type { MetadataRoute } from "next";
import { cookies } from "next/headers";
import { fetchTenantPreviewBySlug } from "@/lib/server/tenant-preview";

export default async function manifest(props: {
  params: Promise<{ tenant: string }>;
}): Promise<MetadataRoute.Manifest> {
  const { tenant: tenantSlug } = await props.params;
  const tenant = await fetchTenantPreviewBySlug(tenantSlug);
  const tenantName = tenant?.name?.trim() || "Terceiro Gestor";
  const encodedTenantSlug = encodeURIComponent(tenantSlug);
  const cookieStore = await cookies();
  const hasRefreshSession = Boolean(cookieStore.get("refresh_token")?.value);
  const startUrl = hasRefreshSession
    ? `/${encodedTenantSlug}/dashboard`
    : `/${encodedTenantSlug}/login`;
  const scope = `/${encodedTenantSlug}/`;

  return {
    name: tenantName,
    short_name: tenantName,
    description: `Acesso rapido a ${tenantName}`,
    start_url: startUrl,
    scope,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/pwa/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}