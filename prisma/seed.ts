/**
 * Seed inicial do banco PrintLab Orçamentos.
 *
 * Cria/atualiza:
 *   - Usuário administrador (com bcrypt da SEED_ADMIN_PASSWORD)
 *   - Configuração singleton da empresa
 *   - Contadores de sequência (orçamento, pedido)
 *   - Materiais iniciais (vinis, papel, lona) com preços da spec §10
 *   - Tipos de impressão (HP Látex, Ecossolvente, UV, Sem impressão)
 *   - Acabamentos (refile, meio corte, laminação, resina, etc.)
 *   - Templates de mensagem para WhatsApp
 *   - Motivos de perda
 *
 * Idempotente: pode rodar várias vezes; usa upsert por chaves únicas.
 *
 * Rode com: npm run db:seed
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@printlab.com.br").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "trocar-na-primeira-vez";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Administrador";

  console.log("→ Usuário administrador");
  const senhaHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { senhaHash, nome: adminName, perfil: "ADM", ativo: true },
    create: {
      email: adminEmail,
      senhaHash,
      nome: adminName,
      perfil: "ADM",
      ativo: true,
    },
  });

  console.log("→ Configuração da empresa");
  await prisma.configuracaoSistema.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      empresaNome: process.env.EMPRESA_NOME ?? "PrintLab",
      empresaTelefone: process.env.EMPRESA_TELEFONE ?? "(00) 00000-0000",
      margemMinimaPct: 20,
      prefixoOrcamento: "ORC",
      prefixoPedido: "PED",
      validadeOrcamentoDias: 7,
      validadeAprovacaoDias: 7,
    },
  });

  console.log("→ Contadores de sequência");
  for (const chave of ["orcamento", "pedido"]) {
    await prisma.sequenceCounter.upsert({
      where: { chave },
      update: {},
      create: { chave, valor: 0 },
    });
  }

  console.log("→ Materiais (preços iniciais da spec §10)");
  const materiais = [
    { nome: "Vinil branco brilho", precoM2: 150, larguraBobinaCm: 127 },
    { nome: "Vinil transparente", precoM2: 180, larguraBobinaCm: 127 },
    { nome: "Vinil fosco", precoM2: 180, larguraBobinaCm: 127 },
    { nome: "Vinil brilho", precoM2: 150, larguraBobinaCm: 127 },
    { nome: "Vinil leitoso", precoM2: 160, larguraBobinaCm: 127 },
    { nome: "Papel adesivo", precoM2: 120, larguraBobinaCm: 64 },
    { nome: "Papel fotográfico adesivo", precoM2: 200, larguraBobinaCm: 64 },
    { nome: "BOPP adesivo", precoM2: 180, larguraBobinaCm: 33 },
    { nome: "Lona 440g", precoM2: 100, larguraBobinaCm: 160 },
    { nome: "Adesivo resinado", precoM2: 500, larguraBobinaCm: 127 },
  ];
  for (const m of materiais) {
    await prisma.material.upsert({
      where: { nome: m.nome },
      update: {},
      create: m,
    });
  }

  console.log("→ Tipos de impressão");
  const impressoes = [
    { nome: "Digital HP Látex", precoM2: 0 },
    { nome: "Impressão Ecossolvente", precoM2: 0 },
    { nome: "Impressão UV", precoM2: 50 },
    { nome: "Sem impressão", precoM2: 0 },
  ];
  for (const i of impressoes) {
    await prisma.tipoImpressao.upsert({
      where: { nome: i.nome },
      update: {},
      create: i,
    });
  }

  console.log("→ Acabamentos");
  const acabamentos = [
    { nome: "Sem recorte especial", precoFixo: 0 },
    { nome: "Refile", precoFixo: 0 },
    { nome: "Meio corte", precoM2: 10 },
    { nome: "Corte contorno", precoM2: 15 },
    { nome: "Laminação brilho", precoM2: 25 },
    { nome: "Laminação fosca", precoM2: 30 },
    { nome: "Resina", precoM2: 60 },
    { nome: "Máscara de transferência", precoM2: 8 },
  ];
  for (const a of acabamentos) {
    await prisma.acabamento.upsert({
      where: { nome: a.nome },
      update: {},
      create: a,
    });
  }

  console.log("→ Motivos de perda");
  const motivos = [
    "Preço",
    "Prazo",
    "Cliente sumiu",
    "Fechou com concorrente",
    "Pedido cancelado",
    "Produto indisponível",
    "Outro motivo",
  ];
  for (const nome of motivos) {
    await prisma.motivoPerda.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
  }

  console.log("→ Templates de mensagem WhatsApp");
  const templates = [
    {
      chave: "orcamento_envio",
      nome: "Envio de orçamento",
      corpo:
        "Olá {{cliente}}, tudo bem?\n\nSegue seu orçamento {{numero}} da PrintLab:\n\n{{itens}}\n\n*Total: {{total}}*\nValidade: {{validade}}\nPrazo de produção: {{prazo}}\n\nQualquer dúvida estou à disposição.",
    },
    {
      chave: "pedido_aprovado",
      nome: "Pedido aprovado",
      corpo:
        "Olá {{cliente}}!\nSeu pedido {{numero}} foi confirmado. Vamos iniciar a produção. Em breve te aviso aqui no WhatsApp.",
    },
    {
      chave: "pedido_em_producao",
      nome: "Pedido em produção",
      corpo:
        "Oi {{cliente}}, seu pedido {{numero}} entrou em produção. Te aviso quando estiver pronto.",
    },
    {
      chave: "pedido_pronto",
      nome: "Pedido pronto para retirada",
      corpo:
        "Olá {{cliente}}!\nSeu pedido {{numero}} está pronto para retirada. Nosso horário é seg–sex 8h–18h.",
    },
    {
      chave: "pedido_enviado",
      nome: "Pedido enviado",
      corpo:
        "Olá {{cliente}}!\nSeu pedido {{numero}} foi enviado. Código de rastreio: {{rastreio}}.",
    },
    {
      chave: "cobranca_pagamento",
      nome: "Cobrança de pagamento",
      corpo:
        "Oi {{cliente}}, passando pra lembrar do saldo em aberto do pedido {{numero}} ({{saldo}}). Posso te enviar o Pix?",
    },
    {
      chave: "arte_aprovacao",
      nome: "Solicitar aprovação de arte",
      corpo:
        "Olá {{cliente}}!\nSegue a arte do pedido {{numero}} para sua aprovação:\n{{link}}\n\nClicar em \"Aprovar\" libera a produção.",
    },
    {
      chave: "sem_resposta",
      nome: "Cliente sem resposta",
      corpo:
        "Oi {{cliente}}! Passando pra saber se você teve oportunidade de ver o orçamento {{numero}}? Posso ajustar algo?",
    },
    {
      chave: "agradecimento",
      nome: "Agradecimento pós-venda",
      corpo:
        "Obrigado por escolher a PrintLab, {{cliente}}!\nSe puder, deixe seu feedback. Estamos à disposição para próximos pedidos.",
    },
  ];
  for (const t of templates) {
    await prisma.mensagemTemplate.upsert({
      where: { chave: t.chave },
      update: {},
      create: t,
    });
  }

  console.log("\n✓ Seed concluído.");
  console.log(`  Login: ${adminEmail}`);
  console.log(`  Senha: ${adminPassword}  ← troque após primeiro login`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
