/**
 * Marca PrintLab — wordmark + tira CMYK.
 *
 * Variantes:
 *   - `mark`: apenas a tira CMYK (4 quadrados) + Λ (para favicon, ícone)
 *   - `wordmark`: "PrintLab" composto, com a tira como ponto sobre o "i"
 *   - `full`: wordmark + descritor "ORÇAMENTOS" embaixo (para login/PDF)
 *
 * Substituível: quando você me mandar o SVG oficial, troco o conteúdo
 * de `<Wordmark/>` sem mexer nas chamadas pelo sistema.
 */

type Variant = "mark" | "wordmark" | "full";

export function PrintLabMark({
  variant = "wordmark",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  if (variant === "mark") {
    return (
      <span
        className={`inline-flex items-center gap-[2px] ${className ?? ""}`}
        aria-label="PrintLab"
      >
        <span className="size-1.5 bg-cyan" />
        <span className="size-1.5 bg-magenta" />
        <span className="size-1.5 bg-yellow" />
        <span className="size-1.5 bg-foreground" />
      </span>
    );
  }

  if (variant === "full") {
    return (
      <div className={`inline-flex flex-col items-start ${className ?? ""}`}>
        <Wordmark />
        <span className="label-eyebrow mt-1 text-foreground/60">Orçamentos</span>
      </div>
    );
  }

  return <Wordmark className={className} />;
}

function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-baseline font-semibold tracking-tight text-[1.05em] ${className ?? ""}`}
      aria-label="PrintLab"
    >
      <span>Print</span>
      <span className="inline-flex items-center gap-[2px] mx-[3px] translate-y-[-0.25em]">
        <span className="size-1.5 bg-cyan rounded-[1px]" />
        <span className="size-1.5 bg-magenta rounded-[1px]" />
        <span className="size-1.5 bg-yellow rounded-[1px]" />
        <span className="size-1.5 bg-foreground rounded-[1px]" />
      </span>
      <span>Lab</span>
    </span>
  );
}

/**
 * Versão SVG para uso em PDF (@react-pdf/renderer não entende JSX HTML).
 * Use `<PrintLabMarkPdf/>` dentro do react-pdf.
 *
 * Retorna SVG inline simples com a tira CMYK + texto.
 */
export const printlabMarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20" viewBox="0 0 120 20">
  <text x="0" y="15" font-family="Helvetica" font-size="14" font-weight="700" fill="#111">Print</text>
  <rect x="38" y="2" width="4" height="4" fill="#00a4d6"/>
  <rect x="43" y="2" width="4" height="4" fill="#d9008a"/>
  <rect x="48" y="2" width="4" height="4" fill="#e8c300"/>
  <rect x="53" y="2" width="4" height="4" fill="#111"/>
  <text x="60" y="15" font-family="Helvetica" font-size="14" font-weight="700" fill="#111">Lab</text>
</svg>
`;
