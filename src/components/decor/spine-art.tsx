/**
 * The five book covers the shelf is built from, drawn to match the reference
 * the user sent: a salmon one patterned with diamonds, a blue one with a
 * scroll of loops over a framed panel, a yellow one with a star, a vermilion
 * one stitched down both edges, and a white one whose bright page block shows
 * because it is leaning.
 *
 * Each is one inline SVG whose viewBox is its own pixel size, so the ornament
 * is laid out in fractions of the book's height and keeps its proportions at
 * any size the shelf asks for.
 */

export type Design = "diamonds" | "loops" | "star" | "stitched" | "paper";

function star(cx: number, cy: number, r: number) {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(
      `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return points.join(" ");
}

export function SpineArt({
  design,
  width: w,
  height: h,
}: {
  design: Design;
  width: number;
  height: number;
}) {
  const common = {
    width: w,
    height: h,
    viewBox: `0 0 ${w} ${h}`,
    className: "block",
    "aria-hidden": true,
  } as const;

  if (design === "diamonds") {
    const step = h * 0.15;
    const top = h * 0.12;
    const count = Math.max(3, Math.floor((h * 0.82) / step));
    const rx = w * 0.26;
    const ry = step * 0.42;
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="var(--deco-salmon)" />
        <g fill="var(--deco-salmon-ink)">
          {Array.from({ length: count }, (_, i) => {
            const cy = top + i * step;
            return (
              <path
                key={i}
                d={`M${w / 2} ${cy - ry}L${w / 2 + rx} ${cy}L${w / 2} ${cy + ry}L${w / 2 - rx} ${cy}z`}
              />
            );
          })}
          {/* Half diamonds pressed against the edges, between the whole ones. */}
          {Array.from({ length: count - 1 }, (_, i) => {
            const cy = top + step / 2 + i * step;
            return (
              <g key={`edge-${i}`}>
                <path d={`M0 ${cy - ry}L${rx} ${cy}L0 ${cy + ry}z`} />
                <path d={`M${w} ${cy - ry}L${w - rx} ${cy}L${w} ${cy + ry}z`} />
              </g>
            );
          })}
        </g>
      </svg>
    );
  }

  if (design === "loops") {
    const loops = 5;
    const r = Math.min(w * 0.11, h * 0.018);
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="var(--deco-blue)" />
        <g fill="none" stroke="var(--deco-blue-ink)">
          <path
            d={`M${w * 0.12} ${h * 0.085}H${w * 0.88}`}
            strokeWidth={h * 0.016}
          />
          <path
            d={`M${w * 0.12} ${h * 0.125}H${w * 0.88}`}
            strokeWidth={h * 0.008}
          />
          {Array.from({ length: loops }, (_, i) => (
            <circle
              key={i}
              cx={w * 0.2 + ((w * 0.6) / (loops - 1)) * i}
              cy={h * 0.2}
              r={r}
              strokeWidth={h * 0.007}
            />
          ))}
          <rect
            x={w * 0.14}
            y={h * 0.32}
            width={w * 0.72}
            height={h * 0.6}
            strokeWidth={h * 0.008}
          />
        </g>
      </svg>
    );
  }

  if (design === "star") {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="var(--deco-yellow)" />
        <g fill="var(--deco-yellow-ink)">
          <polygon
            points={star(w / 2, h * 0.11, Math.min(w * 0.36, h * 0.06))}
          />
          {Array.from({ length: 5 }, (_, i) => (
            <circle
              key={i}
              cx={w * 0.2 + ((w * 0.6) / 4) * i}
              cy={h * 0.2}
              r={Math.min(w * 0.06, h * 0.011)}
            />
          ))}
        </g>
        <g fill="none" stroke="var(--deco-yellow-ink)">
          <rect
            x={w * 0.14}
            y={h * 0.29}
            width={w * 0.72}
            height={h * 0.62}
            strokeWidth={h * 0.009}
          />
          <rect
            x={w * 0.24}
            y={h * 0.33}
            width={w * 0.52}
            height={h * 0.54}
            strokeWidth={h * 0.005}
          />
        </g>
      </svg>
    );
  }

  if (design === "stitched") {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="var(--deco-vermilion)" />
        <g stroke="var(--deco-vermilion-ink)" fill="none">
          {[0.06, 0.095, 0.13, 0.165].map((y, i) => (
            <path
              key={i}
              d={`M${w * 0.16} ${h * y}H${w * 0.84}`}
              strokeWidth={h * 0.007}
            />
          ))}
          {/* Stitching down both edges, like thread through a cover. */}
          {[0.14, 0.86].map((x, i) => (
            <path
              key={i}
              d={`M${w * x} ${h * 0.24}V${h * 0.95}`}
              strokeWidth={h * 0.007}
              strokeDasharray={`${h * 0.012} ${h * 0.016}`}
            />
          ))}
        </g>
      </svg>
    );
  }

  // paper
  return (
    <svg {...common}>
      <rect width={w} height={h} fill="var(--deco-paper)" />
      {/* The page block, which only shows because this one is leaning. */}
      <rect width={w * 0.17} height={h} fill="var(--deco-paper-edge)" />
      <g stroke="var(--deco-paper-ink)" strokeWidth={h * 0.005}>
        {[0.42, 0.56, 0.7].map((x, i) => (
          <path
            key={i}
            d={`M${w * x} ${h * (0.16 + i * 0.04)}V${h * (0.82 - i * 0.03)}`}
          />
        ))}
      </g>
    </svg>
  );
}
