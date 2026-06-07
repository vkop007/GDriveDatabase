import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GDrive Database",
    short_name: "GDrive DB",
    description:
      "A Drive-native database workspace with email login and Google Drive sync.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#eb0081",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
