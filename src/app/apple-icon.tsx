import { ImageResponse } from "next/og";

import { AppIconFace } from "@/components/decor/app-icon-face";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * What iOS puts on the home screen when the reader adds this app from
 * Safari's share menu. Safari will not take an SVG here, which is why this
 * is drawn rather than linked.
 */
export default function AppleIcon() {
  return new ImageResponse(<AppIconFace size={size.width} />, size);
}
