import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/palco", "/esg", "/m/", "/u/", "/termos", "/privacidade", "/direitos"], disallow: ["/admin", "/pedido", "/minhas", "/perfil"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
