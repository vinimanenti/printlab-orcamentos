import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatBRL } from "@/lib/calculadoras";

/**
 * PDF editorial do orçamento PrintLab.
 *
 * Layout estilo specimen tipográfico: bastante white space, hierarquia
 * tipográfica forte, tira CMYK como elemento de marca. Renderizado
 * server-side com @react-pdf/renderer (sem Chrome headless).
 */

// Cores oficiais da marca PrintLab
const CYAN = "#00AFEF";
const MAGENTA = "#EC268F";
const YELLOW = "#FFF212";
const INK = "#201E1E";
const MUTED = "#6b6b69";
const RULE = "#e5e5e3";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 50,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: INK,
  },

  // ===== HEADER COM TIRA CMYK =====
  marcaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  marcaTexto: { fontSize: 18, fontFamily: "Helvetica-Bold", letterSpacing: -0.5 },
  cmykStrip: {
    flexDirection: "row",
    gap: 2,
    marginHorizontal: 4,
  },
  cmykDot: { width: 6, height: 6, borderRadius: 3 },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  badge: {
    fontSize: 8,
    color: INK,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
  },

  // ===== TÍTULO BLOCK =====
  tituloBlock: {
    marginBottom: 28,
    paddingBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: INK,
  },
  eyebrow: {
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
    fontFamily: "Helvetica-Bold",
  },
  titulo: {
    fontSize: 38,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -1,
    lineHeight: 1,
  },
  meta: { color: MUTED, fontSize: 10, marginTop: 8 },

  // ===== BLOCOS (cliente / condições) =====
  duasColunas: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 28,
  },
  coluna: { flex: 1 },
  rotulo: {
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
  },
  campo: { fontSize: 10, marginBottom: 3, color: INK },
  campoForte: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 6 },

  // ===== TABELA =====
  tabela: {
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: INK,
  },
  thead: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: INK,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: INK,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  trow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
    minHeight: 32,
  },
  tcol_n: { width: 22, color: MUTED, fontSize: 8 },
  tcol_desc: { flex: 1, paddingRight: 8 },
  tcol_med: { width: 70, fontSize: 9 },
  tcol_qtd: { width: 32, textAlign: "right" },
  tcol_unit: { width: 65, textAlign: "right" },
  tcol_tot: { width: 75, textAlign: "right", fontFamily: "Helvetica-Bold" },
  descPrincipal: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  descSub: { fontSize: 8, color: MUTED, marginTop: 2 },

  // ===== TOTAIS =====
  totaisWrap: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totais: {
    width: 240,
    borderTopWidth: 1,
    borderTopColor: INK,
    paddingTop: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    fontSize: 10,
    color: MUTED,
  },
  totalFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: INK,
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: INK,
  },

  // ===== OBS =====
  obs: {
    marginTop: 28,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: CYAN,
    backgroundColor: "#fafafa",
  },
  obsRotulo: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  obsTexto: { fontSize: 10, lineHeight: 1.5 },

  // ===== RODAPÉ =====
  rodape: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    fontSize: 7,
    color: MUTED,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: RULE,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

export type OrcamentoPDFData = {
  numero: number;
  criadoEm: Date;
  validadeDias: number;
  prazoEntregaDias: number | null;
  observacoes: string | null;
  condicoesPagamento: string | null;
  subtotal: number;
  desconto: number;
  total: number;
  cliente: {
    nome: string;
    tipo: "PF" | "PJ";
    documento: string | null;
    telefone: string;
    email: string | null;
  };
  vendedor: { nome: string };
  itens: Array<{
    descricao: string;
    larguraCm: number;
    alturaCm: number;
    quantidade: number;
    precoUnitario: number;
    precoTotal: number;
    material?: string;
    impressao?: string;
    acabamento?: string;
  }>;
  empresa: {
    nome: string;
    telefone: string;
    email?: string | null;
    endereco?: string | null;
  };
};

function PrintLabMarkPdf() {
  return (
    <View style={styles.marcaRow}>
      <Text style={styles.marcaTexto}>Print</Text>
      <View style={styles.cmykStrip}>
        <View style={[styles.cmykDot, { backgroundColor: MAGENTA }]} />
        <View style={[styles.cmykDot, { backgroundColor: YELLOW }]} />
        <View style={[styles.cmykDot, { backgroundColor: CYAN }]} />
        <View style={[styles.cmykDot, { backgroundColor: INK }]} />
      </View>
      <Text style={styles.marcaTexto}>Lab</Text>
    </View>
  );
}

export function OrcamentoPDF({ data }: { data: OrcamentoPDFData }) {
  const validadeAte = addDays(data.criadoEm, data.validadeDias);

  return (
    <Document
      title={`Orcamento-${data.numero}-${data.cliente.nome}`}
      author={data.empresa.nome}
      creator={data.empresa.nome}
    >
      <Page size="A4" style={styles.page}>
        {/* TOPO */}
        <View style={styles.topRow} fixed>
          <View>
            <PrintLabMarkPdf />
            <Text style={{ fontSize: 8, color: MUTED, marginTop: 4, letterSpacing: 1 }}>
              {data.empresa.telefone}
              {data.empresa.email ? `  ·  ${data.empresa.email}` : ""}
            </Text>
            {data.empresa.endereco ? (
              <Text style={{ fontSize: 8, color: MUTED }}>{data.empresa.endereco}</Text>
            ) : null}
          </View>
          <Text style={styles.badge}>· Orçamento ·</Text>
        </View>

        {/* TÍTULO BLOCK */}
        <View style={styles.tituloBlock}>
          <Text style={styles.eyebrow}>Nº do orçamento</Text>
          <Text style={styles.titulo}>#{String(data.numero).padStart(4, "0")}</Text>
          <Text style={styles.meta}>
            Emitido em {format(data.criadoEm, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            {"  ·  "}vendedor {data.vendedor.nome}
          </Text>
        </View>

        {/* CLIENTE + CONDIÇÕES */}
        <View style={styles.duasColunas}>
          <View style={styles.coluna}>
            <Text style={styles.rotulo}>Para</Text>
            <Text style={styles.campoForte}>{data.cliente.nome}</Text>
            {data.cliente.documento && (
              <Text style={styles.campo}>
                {data.cliente.tipo === "PJ" ? "CNPJ" : "CPF"}{" "}
                {formatDoc(data.cliente.documento, data.cliente.tipo)}
              </Text>
            )}
            <Text style={styles.campo}>{data.cliente.telefone}</Text>
            {data.cliente.email && <Text style={styles.campo}>{data.cliente.email}</Text>}
          </View>
          <View style={styles.coluna}>
            <Text style={styles.rotulo}>Condições</Text>
            <Text style={styles.campo}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Validade:</Text>{" "}
              {format(validadeAte, "dd/MM/yyyy", { locale: ptBR })} ({data.validadeDias} dias)
            </Text>
            {data.prazoEntregaDias != null && (
              <Text style={styles.campo}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Prazo de produção:</Text>{" "}
                {data.prazoEntregaDias} dias após aprovação
              </Text>
            )}
            {data.condicoesPagamento && (
              <Text style={styles.campo}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Pagamento:</Text>{" "}
                {data.condicoesPagamento}
              </Text>
            )}
          </View>
        </View>

        {/* TABELA DE ITENS */}
        <View style={styles.tabela}>
          <View style={styles.thead}>
            <Text style={styles.tcol_n}>#</Text>
            <Text style={styles.tcol_desc}>Descrição</Text>
            <Text style={styles.tcol_med}>Medida</Text>
            <Text style={styles.tcol_qtd}>Qtd</Text>
            <Text style={styles.tcol_unit}>Unitário</Text>
            <Text style={styles.tcol_tot}>Total</Text>
          </View>
          {data.itens.map((it, ix) => (
            <View style={styles.trow} key={ix} wrap={false}>
              <Text style={styles.tcol_n}>{String(ix + 1).padStart(2, "0")}</Text>
              <View style={styles.tcol_desc}>
                <Text style={styles.descPrincipal}>{it.descricao}</Text>
                <Text style={styles.descSub}>
                  {[it.material, it.impressao, it.acabamento].filter(Boolean).join(" · ") || " "}
                </Text>
              </View>
              <Text style={styles.tcol_med}>
                {it.larguraCm} × {it.alturaCm} cm
              </Text>
              <Text style={styles.tcol_qtd}>{it.quantidade}</Text>
              <Text style={styles.tcol_unit}>{formatBRL(it.precoUnitario)}</Text>
              <Text style={styles.tcol_tot}>{formatBRL(it.precoTotal)}</Text>
            </View>
          ))}
        </View>

        {/* TOTAIS */}
        <View style={styles.totaisWrap}>
          <View style={styles.totais}>
            <View style={styles.totalRow}>
              <Text>Subtotal</Text>
              <Text>{formatBRL(data.subtotal)}</Text>
            </View>
            {data.desconto > 0 && (
              <View style={styles.totalRow}>
                <Text>Desconto</Text>
                <Text>− {formatBRL(data.desconto)}</Text>
              </View>
            )}
            <View style={styles.totalFinal}>
              <Text>Total</Text>
              <Text>{formatBRL(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* OBSERVAÇÕES */}
        {data.observacoes ? (
          <View style={styles.obs}>
            <Text style={styles.obsRotulo}>Observações</Text>
            <Text style={styles.obsTexto}>{data.observacoes}</Text>
          </View>
        ) : null}

        {/* RODAPÉ */}
        <View style={styles.rodape} fixed>
          <Text>
            {data.empresa.nome}  ·  Orçamento {String(data.numero).padStart(4, "0")}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${String(pageNumber).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

function formatDoc(doc: string, tipo: "PF" | "PJ"): string {
  const d = doc.replace(/\D/g, "");
  if (tipo === "PJ" && d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  if (tipo === "PF" && d.length === 11) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  return d;
}

Font.registerHyphenationCallback((word) => [word]);
