import { ImageResponse } from "next/og";

import { AppIconFace } from "@/components/decor/app-icon-face";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** The browser tab, and the big icon the web app manifest points at. */
export default function Icon() {
  return new ImageResponse(<AppIconFace size={size.width} />, size);
}
