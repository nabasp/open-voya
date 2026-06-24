
type FrogLogoVariant = "default" | "light";

// Bespoke "open voya" frog mark. No shadcn/lucide equivalent, so it stays a
// raw inline SVG. The `light` variant is used on dark surfaces (export success).
const FILLS: Record<FrogLogoVariant, string[]> = {
  // legBack, footBack, legBack2, footBack2, body, headLeft, headRight, eyeLeft, eyeRight
  default: ["#9a9890", "#6b6a64", "#9a9890", "#6b6a64", "#2a2820", "#3a3833", "#14130f", "#14130f", "#3a3833"],
  light: ["#cfccc1", "#9a9890", "#cfccc1", "#9a9890", "#5c5b54", "#cfccc1", "#f3f1ea", "#f3f1ea", "#cfccc1"],
};

export function FrogLogo({
  size = 21,
  variant = "default",
  className,
}: {
  size?: number;
  variant?: FrogLogoVariant;
  className?: string;
}) {
  const f = FILLS[variant];
  return (
    <svg
      viewBox="0 0 84 84"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <polygon points="32,48 14,52 16,64 32,60" fill={f[0]} />
      <polygon points="16,64 6,74 14,77 25,66" fill={f[1]} />
      <polygon points="52,48 70,52 68,64 52,60" fill={f[2]} />
      <polygon points="68,64 78,74 70,77 59,66" fill={f[3]} />
      <polygon points="33,40 51,40 49,70 35,70" fill={f[4]} />
      <polygon points="42,11 24,16 14,40 42,57" fill={f[5]} />
      <polygon points="42,11 60,16 70,40 42,57" fill={f[6]} />
      <polygon points="19,23 29,17 32,28 22,32" fill={f[7]} />
      <polygon points="65,23 55,17 52,28 62,32" fill={f[8]} />
      <text
        x="42"
        y="66"
        textAnchor="middle"
        fontFamily="Arial Black, sans-serif"
        fontWeight={900}
        fontSize={24}
        fill="#E50914"
      >
        V
      </text>
    </svg>
  );
}
