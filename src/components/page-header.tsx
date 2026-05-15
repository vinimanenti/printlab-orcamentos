/**
 * Cabeçalho editorial padronizado de páginas internas.
 *
 * Uso:
 *   <PageHeader
 *     eyebrow="Orçamentos"
 *     title="Lista"
 *     description="20 encontrados."
 *     actions={<Button>Novo</Button>}
 *   />
 */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap pb-2">
      <div className="space-y-1.5 min-w-0">
        {eyebrow && <p className="label-eyebrow text-muted-foreground">{eyebrow}</p>}
        <h1 className="display-lg">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
}
