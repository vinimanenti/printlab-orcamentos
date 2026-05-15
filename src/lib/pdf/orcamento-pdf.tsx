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
 * Documento PDF do orçamento. Renderizado server-side via
 * @react-pdf/renderer (sem Chrome headless — funciona em serverless).
 *
 * Layout pensado para A4 retrato, 1 página normal, 2+ se muitos itens.
 */

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111",
  },

  // ===== HEADER =====
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  empresaNome: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#111" },
  empresaSub: { fontSize: 9, color: "#666", marginTop: 2 },
  badge: {
    backgroundColor: "#111",
    color: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },

  // ===== TÍTULO =====
  titulo: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
    marginBottom: 4,
  },
  meta: { color: "#666", fontSize: 10 },

  // ===== BLOCOS CLIENTE / CONDIÇÕES =====
  duasColunas: {
    flexDirection: "row",
    gap: 20,
    marginTop: 18,
    marginBottom: 18,
  },
  coluna: { flex: 1 },
  rotulo: {
    fontSize: 8,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  campo: { fontSize: 10, marginBottom: 2 },
  campoForte: { fontSize: 11, fontFamily: "Helvetica-Bold" },

  // ===== TABELA DE ITENS =====
  tabela: { marginTop: 8, borderTopWidth: 1, borderTopColor: "#111" },
  thead: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#111",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    minHeight: 28,
  },
  tcol_n: { width: 22 },
  tcol_desc: { flex: 1, paddingRight: 6 },
  tcol_med: { width: 70 },
  tcol_qtd: { width: 30, textAlign: "right" },
  tcol_unit: { width: 60, textAlign: "right" },
  tcol_tot: { width: 70, textAlign: "right" },
  descSub: { fontSize: 8, color: "#666", marginTop: 2 },

  // ===== TOTAIS =====
  totais: {
    marginTop: 14,
    alignSelf: "flex-end",
    minWidth: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    fontSize: 10,
  },
  totalFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#111",
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
  },

  // ===== OBS / FOOTER =====
  obs: {
    marginTop: 22,
    padding: 10,
    backgroundColor: "#f4f4f4",
    borderRadius: 4,
  },
  obsTitulo: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 4 },
  obsTexto: { fontSize: 10, lineHeight: 1.4 },

  rodape: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#888",
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
    paddingTop: 6,
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

export function OrcamentoPDF({ data }: { data: OrcamentoPDFData }) {
  const validadeAte = addDays(data.criadoEm, data.validadeDias);

  return (
    <Document
      title={`Orcamento-${data.numero}-${data.cliente.nome}`}
      author={data.empresa.nome}
      creator={data.empresa.nome}
    >
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.empresaNome}>{data.empresa.nome}</Text>
            <Text style={styles.empresaSub}>
              {data.empresa.telefone}
              {data.empresa.email ? ` · ${data.empresa.email}` : ""}
            </Text>
            {data.empresa.endereco ? (
              <Text style={styles.empresaSub}>{data.empresa.endereco}</Text>
            ) : null}
          </View>
          <Text style={styles.badge}>ORÇAMENTO</Text>
        </View>

        {/* TÍTULO */}
        <Text style={styles.titulo}>#{String(data.numero).padStart(4, "0")}</Text>
        <Text style={styles.meta}>
          Emitido em {format(data.criadoEm, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} · vendedor{" "}
          {data.vendedor.nome}
        </Text>

        {/* CLIENTE + CONDIÇÕES */}
        <View style={styles.duasColunas}>
          <View style={styles.coluna}>
            <Text style={styles.rotulo}>Cliente</Text>
            <Text style={styles.campoForte}>{data.cliente.nome}</Text>
            {data.cliente.documento && (
              <Text style={styles.campo}>
                {data.cliente.tipo === "PJ" ? "CNPJ" : "CPF"}:{" "}
                {formatDoc(data.cliente.documento, data.cliente.tipo)}
              </Text>
            )}
            <Text style={styles.campo}>{data.cliente.telefone}</Text>
            {data.cliente.email && <Text style={styles.campo}>{data.cliente.email}</Text>}
          </View>
          <View style={styles.coluna}>
            <Text style={styles.rotulo}>Condições</Text>
            <Text style={styles.campo}>
              Validade: {format(validadeAte, "dd/MM/yyyy", { locale: ptBR })} ({data.validadeDias} dias)
            </Text>
            {data.prazoEntregaDias != null && (
              <Text style={styles.campo}>
                Prazo de produção: {data.prazoEntregaDias} dias após aprovação
              </Text>
            )}
            {data.condicoesPagamento && (
              <Text style={styles.campo}>Pagamento: {data.condicoesPagamento}</Text>
            )}
          </View>
        </View>

        {/* TABELA */}
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
              <Text style={styles.tcol_n}>{ix + 1}</Text>
              <View style={styles.tcol_desc}>
                <Text>{it.descricao}</Text>
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

        {/* OBSERVAÇÕES */}
        {data.observacoes ? (
          <View style={styles.obs}>
            <Text style={styles.obsTitulo}>Observações</Text>
            <Text style={styles.obsTexto}>{data.observacoes}</Text>
          </View>
        ) : null}

        {/* RODAPÉ */}
        <View style={styles.rodape} fixed>
          <Text>
            {data.empresa.nome} — orçamento #{data.numero}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `página ${pageNumber} de ${totalPages}`
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

// Suppress font registration warnings (we use built-in Helvetica)
Font.registerHyphenationCallback((word) => [word]);
