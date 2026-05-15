/**
 * Marca PrintLab — logo oficial.
 *
 * Variantes:
 *   - `mark`: tira CMYK (4 círculos: M Y C K) — ícone compacto
 *   - `wordmark`: logo completa para fundo claro
 *   - `wordmark-dark`: logo completa para fundo escuro (texto branco)
 *
 * Arquivos em public/brand/printlab-{light,dark}.svg.
 *
 * Cores oficiais:
 *   Magenta #EC268F · Yellow #FFF212 · Cyan #00AFEF · Preto #201E1E
 */

type Variant = "mark" | "wordmark" | "wordmark-dark";

const SIZES = {
  sm: 26,
  md: 36,
  lg: 50,
  xl: 66,
} as const;

export function PrintLabMark({
  variant = "wordmark",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (variant === "mark") {
    return (
      <span
        className={`inline-flex items-center gap-1 ${className ?? ""}`}
        aria-label="PrintLab"
      >
        <span className="size-2 rounded-full bg-magenta" />
        <span className="size-2 rounded-full bg-yellow" />
        <span className="size-2 rounded-full bg-cyan" />
        <span className="size-2 rounded-full bg-foreground" />
      </span>
    );
  }

  const src =
    variant === "wordmark-dark" ? "/brand/printlab-dark.svg" : "/brand/printlab-light.svg";

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt="PrintLab"
      height={SIZES[size]}
      style={{ height: `${SIZES[size]}px`, width: "auto" }}
      className={className}
    />
  );
}

/**
 * SVG inline para o PDF (@react-pdf/renderer).
 * Réplica simplificada da logo oficial.
 */
export const printlabMarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="22" viewBox="0 0 140 22">
  <text x="0" y="17" font-family="Helvetica" font-size="18" font-weight="700" fill="#201E1E" letter-spacing="-0.5">Print</text>
  <circle cx="50" cy="11" r="3.5" fill="#EC268F"/>
  <circle cx="59" cy="11" r="3.5" fill="#FFF212"/>
  <circle cx="68" cy="11" r="3.5" fill="#00AFEF"/>
  <circle cx="77" cy="11" r="3.5" fill="#201E1E"/>
  <text x="84" y="17" font-family="Helvetica" font-size="18" font-weight="700" fill="#201E1E" letter-spacing="-0.5">Lab</text>
</svg>
`;
