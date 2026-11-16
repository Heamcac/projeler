import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MOTOWORLD Motosiklet Servisi",
    short_name: "MOTOWORLD",
    lang: "tr",
    description: "Bursa motosiklet bakım ve servis randevusu",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0A1628",
    theme_color: "#0A1628",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
