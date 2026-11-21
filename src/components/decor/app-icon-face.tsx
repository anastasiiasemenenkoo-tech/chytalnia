/**
 * The cat's face, for the icon that ends up on a home screen.
 *
 * The shelf cat redrawn down to what survives at sixty pixels: ears, a
 * ginger head, the white blaze, two amber eyes and a nose. Everything that
 * made the big drawing recognisable at full size — marbling, whiskers,
 * paws — turns to mud at this scale and is left out.
 *
 * Rendered through Satori, which resolves no CSS custom properties, so the
 * palette is the light theme's values written out.
 */
const BACKGROUND = "#e6eafa";
const CAT = "#ef7e3c";
const SHADE = "#db5d2c";
const WHITE = "#f7f1e8";
const NOSE = "#efa3a5";
const EYE = "#e19b34";
const INK = "#3f271e";

export function AppIconFace({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: BACKGROUND,
      }}
    >
      <svg width={size * 0.84} height={size * 0.84} viewBox="0 0 100 100">
        {/* Ears behind the head, so their bases disappear under it. */}
        <path d="M20 44 14 8l32 16z" fill={CAT} />
        <path d="M80 44 86 8 54 24z" fill={CAT} />
        <path d="M25 38 21 17l18 9z" fill={NOSE} />
        <path d="M75 38 79 17l-18 9z" fill={NOSE} />

        <ellipse cx="50" cy="52" rx="34" ry="30" fill={CAT} />
        {/* A narrow wedge between the eyes, widening into the muzzle. The
            first attempt ran from brow to chin at full width and the face
            came out more white than ginger. */}
        <path d="M50 25 45 58h10z" fill={WHITE} />
        <ellipse cx="50" cy="65" rx="19" ry="13" fill={WHITE} />

        <ellipse cx="33" cy="49" rx="8" ry="8.6" fill={EYE} />
        <ellipse cx="67" cy="49" rx="8" ry="8.6" fill={EYE} />
        <ellipse cx="33" cy="49" rx="3.6" ry="5.2" fill={INK} />
        <ellipse cx="67" cy="49" rx="3.6" ry="5.2" fill={INK} />
        <circle cx="35.4" cy="46.2" r="1.8" fill={WHITE} />
        <circle cx="69.4" cy="46.2" r="1.8" fill={WHITE} />

        <path d="M45.5 59h9l-4.5 5z" fill={NOSE} />
        <path
          d="M50 64v3.2M50 67.2c-2.4 2.4-5.4 2-7 0M50 67.2c2.4 2.4 5.4 2 7 0"
          fill="none"
          stroke={INK}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* One shade line under the chin, so the head is not a flat disc. */}
        <path
          d="M28 70c7 8 37 8 44 0"
          fill="none"
          stroke={SHADE}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
