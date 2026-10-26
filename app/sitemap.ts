import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/palco", "/esg", "/entrar", "/termos", "/privacidade", "/direitos"].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" }));
}
