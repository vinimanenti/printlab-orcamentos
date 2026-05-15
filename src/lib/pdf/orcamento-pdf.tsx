import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  Svg,
  Circle,
  Text as SvgText,
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

  // ===== HEADER COM LOGO + DADOS + NUMERO À DIREITA =====
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  empresaInfo: {
    marginTop: 6,
  },
  empresaLinha: {
    fontSize: 8,
    color: MUTED,
    letterSpacing: 0.3,
    lineHeight: 1.5,
  },
  empresaNome: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginBottom: 3,
  },
  // Bloco direito: ORÇAMENTO · #0001 · data
  numeroBloco: {
    alignItems: "flex-end",
    minWidth: 170,
  },
  numeroEyebrow: {
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    fontFamily: "Helvetica-Bold",
  },
  numeroValor: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.8,
    color: INK,
    marginTop: 4,
    marginBottom: 4,
  },
  numeroMeta: {
    fontSize: 8,
    color: MUTED,
    textAlign: "right",
    lineHeight: 1.4,
  },
  badge: {
    fontSize: 8,
    color: INK,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
  },

  // (bloco de título grande foi removido — número agora vive no topRow direita)

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
    cnpj?: string | null;
    telefone: string;
    email?: string | null;
    endereco?: string | null;
    /** Data URL da logo personalizada (PNG/JPG/WebP) — opcional */
    logoDataUrl?: string | null;
  };
};

/**
 * Logo PrintLab desenhada com primitivas SVG do react-pdf.
 *
 * Layout horizontal: "Print" + 4 círculos (M, Y, C, K) + "Lab"
 * Reproduz a marca oficial em 200pt × 36pt.
 *
 * Os pontos têm contorno branco fino simulando o aspecto da arte original.
 */
const SVG_TEXT_STYLE = {
  fontFamily: "Helvetica-Bold",
  fontSize: 28,
  letterSpacing: -1,
};

function PrintLabMarkPdf() {
  return (
    <Svg width={200} height={36} viewBox="0 0 200 36">
      {/* "Print" */}
      <SvgText x={0} y={26} fill={INK} style={SVG_TEXT_STYLE}>
        Print
      </SvgText>

      {/* 4 círculos CMYK na ordem M Y C K da logo oficial */}
      <Circle cx={75} cy={18} r={6} fill={MAGENTA} stroke="#ffffff" strokeWidth={1} />
      <Circle cx={89} cy={18} r={6} fill={YELLOW} stroke="#ffffff" strokeWidth={1} />
      <Circle cx={103} cy={18} r={6} fill={CYAN} stroke="#ffffff" strokeWidth={1} />
      <Circle cx={117} cy={18} r={6} fill={INK} stroke="#ffffff" strokeWidth={1} />

      {/* "Lab" */}
      <SvgText x={128} y={26} fill={INK} style={SVG_TEXT_STYLE}>
        Lab
      </SvgText>
    </Svg>
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
        {/* TOPO — LOGO + DADOS À ESQUERDA / Nº DO ORÇAMENTO À DIREITA */}
        <View style={styles.topRow} fixed>
          {/* COLUNA ESQUERDA — marca + dados da empresa */}
          <View>
            {data.empresa.logoDataUrl ? (
              <Image
                src={data.empresa.logoDataUrl}
                style={{
                  // Apenas altura — largura segue proporção natural,
                  // sem caixa centralizada que causaria offset à esquerda
                  height: 25,
                  marginBottom: 6,
                  // Garante que a Image se comporte como bloco alinhado à esquerda
                  alignSelf: "flex-start",
                }}
              />
            ) : (
              <PrintLabMarkPdf />
            )}
            <View style={styles.empresaInfo}>
              <Text style={styles.empresaNome}>{data.empresa.nome}</Text>
              {data.empresa.cnpj && (
                <Text style={styles.empresaLinha}>CNPJ {data.empresa.cnpj}</Text>
              )}
              {data.empresa.endereco && (
                <Text style={styles.empresaLinha}>{data.empresa.endereco}</Text>
              )}
              <Text style={styles.empresaLinha}>
                {data.empresa.telefone}
                {data.empresa.email ? `  ·  ${data.empresa.email}` : ""}
              </Text>
            </View>
          </View>

          {/* COLUNA DIREITA — número do orçamento compacto */}
          <View style={styles.numeroBloco}>
            <Text style={styles.numeroEyebrow}>Orçamento Nº</Text>
            <Text style={styles.numeroValor}>
              #{String(data.numero).padStart(4, "0")}
            </Text>
            <Text style={styles.numeroMeta}>
              Emitido em {format(data.criadoEm, "dd/MM/yyyy", { locale: ptBR })}
            </Text>
            <Text style={styles.numeroMeta}>
              Vendedor: {data.vendedor.nome}
            </Text>
          </View>
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
