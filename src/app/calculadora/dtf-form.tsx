"use client";

import { useState, useRef, useMemo, useCallback, type ChangeEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { calcItems, ROLL_WIDTH, STICKER_GAP_CM, type CustomerType, type DtfPricing } from "@/lib/dtf";
import "./dtf.css";

type Item = { id: number; width: string; height: string; qty: string; desc: string; photo: string | null };

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const emptyItem = (id: number): Item => ({ id, width: '', height: '', qty: '1', desc: '', photo: null });

export function DtfForm({ pricing, podeEditarPrecos }: { pricing: DtfPricing; podeEditarPrecos: boolean }) {
  const nextId = useRef(1);
  const [type, setType] = useState<CustomerType>('cliente');
  const [items, setItems] = useState<Item[]>([emptyItem(0)]);
  const [copied, setCopied] = useState(false);

  const updateItem = useCallback((id: number, field: keyof Omit<Item, "id">, value: string | null) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems(prev => prev.length > 1 ? prev.filter(it => it.id !== id) : prev);
  }, []);

  const addItem = useCallback(() => {
    const item = emptyItem(nextId.current++);
    setItems(prev => [...prev, item]);
  }, []);

  const results = useMemo(() => {
    const calculations = calcItems(items.map(it => ({
      widthCm: Number(it.width),
      heightCm: Number(it.height),
      qty: Number(it.qty),
    })), type, pricing);
    return items.map((it, index) => ({
      ...it,
      calc: calculations[index],
    }));
  }, [items, type, pricing]);

  const totals = useMemo(() => {
    const valid = results.filter(r => r.calc);
    const totalM = valid.reduce((s, r) => s + r.calc!.linearM, 0);
    const totalPrice = valid.reduce((s, r) => s + r.calc!.total, 0);
    const totalGapCm = valid.reduce((s, r) => s + r.calc!.gapCm, 0);
    const totalQty = valid.reduce((s, r) => s + r.calc!.qty, 0);
    return { count: valid.length, totalM, totalPrice, totalGapCm, totalQty };
  }, [results]);

  const buildText = () => {
    let text = `*Orçamento DTF — ${type === 'cliente' ? 'Cliente' : 'Revendedor'}*\n`;
    text += `Largura do rolo: ${ROLL_WIDTH}cm\n`;
    text += `Espaçamento: ${STICKER_GAP_CM}cm entre adesivos, incluído na metragem\n\n`;
    results.forEach((r, i) => {
      if (!r.calc) return;
      text += `*Item ${i + 1}*${r.desc ? ` — ${r.desc}` : ''}\n`;
      text += `  ${r.calc.widthCm}cm × ${r.calc.heightCm}cm · ${r.calc.qty} un.\n`;
      text += `  ${r.calc.linearM.toFixed(2)}m linear × ${fmt(r.calc.pricePerM)}/m\n`;
      text += `  *${fmt(r.calc.total)}*\n`;
      if (r.calc.alert) text += `  ⚠ ${r.calc.alert}\n`;
      text += '\n';
    });
    text += `———————————\n`;
    text += `*TOTAL: ${fmt(totals.totalPrice)}*\n`;
    text += `${totals.totalM.toFixed(2)}m lineares · ${totals.totalQty} adesivo(s) · ${totals.count} item(s)\n`;
    text += `Espaçamento total incluído: ${totals.totalGapCm}cm`;
    return text;
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(buildText().replace(/\*/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Não foi possível copiar. Verifique a permissão da área de transferência.'); }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(buildText())}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="dtf-calculator">
      {/* Header */}
      <div className="header">
        <div>
          <h2>Orçamento DTF</h2>
          <p>Rolo {ROLL_WIDTH}cm · Cotação por metro linear</p>
          {podeEditarPrecos && <Link href="/configuracoes/dtf" className="mt-2 inline-block text-xs underline underline-offset-4">Editar preços DTF</Link>}
        </div>
        <div className="type-toggle">
          <button className={`type-btn ${type === 'cliente' ? 'active' : ''}`} aria-pressed={type === "cliente"} onClick={() => setType('cliente')}>Cliente</button>
          <button className={`type-btn ${type === 'revendedor' ? 'active' : ''}`} aria-pressed={type === "revendedor"} onClick={() => setType('revendedor')}>Revendedor</button>
        </div>
      </div>

      {/* Pricing info */}
      <div className="roll-info">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>Base: {fmt(pricing[type])}/m · Orçamento abaixo de 10cm lineares no total: {fmt(pricing.abaixo10Cm)}/m</span>
      </div>

      <p className="pricing-note">Metragem = soma de altura × quantidade de todos os itens + {STICKER_GAP_CM} cm entre cada adesivo, inclusive entre itens diferentes. Não há espaço adicional após o último adesivo nem encaixe lado a lado. O limite de 10 cm considera essa soma total. Cotação rápida: não salva no cadastro de orçamentos. As fotos ficam nesta tela; o compartilhamento envia apenas texto.</p>
      {/* Items */}
      {results.map((r, idx) => (
        <ItemCard key={r.id} item={r} idx={idx} total={items.length}
          onUpdate={updateItem} onRemove={removeItem} />
      ))}

      <button className="add-btn" onClick={addItem}>+ Adicionar item ao orçamento</button>

      {results.some(r => !r.calc) && <p role="status" className="validation-note">Preencha todos os itens com medidas positivas, largura de até 30 cm e quantidade inteira para compartilhar.</p>}
      {/* Summary */}
      {totals.count > 0 && (
        <div className="summary">
          <div className="summary-title">RESUMO DO ORÇAMENTO</div>
          <div className="summary-rows">
            <div className="summary-row">
              <span className="label">Tipo</span>
              <span className="value">{type === 'cliente' ? 'Cliente Final' : 'Revendedor'}</span>
            </div>
            <div className="summary-row">
              <span className="label">Itens</span>
              <span className="value">{totals.count}</span>
            </div>
            <div className="summary-row">
              <span className="label">Quantidade de adesivos</span>
              <span className="value">{totals.totalQty}</span>
            </div>
            <div className="summary-row">
              <span className="label">Espaçamento incluído</span>
              <span className="value">{totals.totalGapCm} cm</span>
            </div>
            <div className="summary-row">
              <span className="label">Metragem total</span>
              <span className="value">{totals.totalM.toFixed(2)}m</span>
            </div>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-total">
            <span className="label">Total</span>
            <span className="value">{fmt(totals.totalPrice)}</span>
          </div>
          <div className="summary-actions">
            <button className="btn-share btn-whatsapp" disabled={totals.count !== items.length} onClick={shareWhatsApp}>
              WhatsApp
            </button>
            <button className="btn-share btn-copy" disabled={totals.count !== items.length} onClick={copyText}>
              {copied ? '✓ Copiado!' : 'Copiar texto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, idx, total, onUpdate, onRemove }: { item: Item & { calc: ReturnType<typeof calcItems>[number] }; idx: number; total: number; onUpdate: (id: number, field: keyof Omit<Item, "id">, value: string | null) => void; onRemove: (id: number) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { toast.error('Selecione uma imagem de até 10 MB.'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') onUpdate(item.id, 'photo', reader.result); };
    reader.onerror = () => toast.error('Não foi possível carregar a imagem.');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const c = item.calc;

  return (
    <div className="item-card">
      <div className="item-header">
        <span className="item-num">ITEM {String(idx + 1).padStart(2, '0')}</span>
        {total > 1 && (
          <button className="item-remove" onClick={() => onRemove(item.id)} title="Remover">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      <div className="item-grid">
        {/* Photo */}
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} hidden />
          <div className="photo-zone" role="button" tabIndex={0} aria-label="Selecionar foto do adesivo" onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }} onClick={() => fileRef.current?.click()}>
            {item.photo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- Local image preview from FileReader. */}
              <img src={item.photo} alt="Foto" />
                <button className="photo-clear" aria-label="Remover foto" onKeyDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onUpdate(item.id, 'photo', null); }}>×</button>
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span className="photo-label">Foto do<br/>adesivo</span>
              </>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="fields">
          <div className="field" style={{marginBottom: 2}}>
            <label htmlFor={`dtf-desc-${item.id}`}>Descrição (opcional)</label>
            <input type="text" placeholder="Ex: Logo empresa, adesivo redondo..." id={`dtf-desc-${item.id}`} value={item.desc}
              onChange={e => onUpdate(item.id, 'desc', e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor={`dtf-width-${item.id}`}>Largura (cm)</label>
              <input type="number" placeholder="0" min="0.1" max={ROLL_WIDTH} step="0.1" id={`dtf-width-${item.id}`} value={item.width}
                onChange={e => onUpdate(item.id, 'width', e.target.value)}
                style={parseFloat(item.width) > ROLL_WIDTH ? {borderColor: 'var(--red)', color: 'var(--red)'} : {}} />
              {parseFloat(item.width) > ROLL_WIDTH && (
                <span style={{fontSize: 10, color: 'var(--red)', marginTop: 2, display: 'block'}}>Máx {ROLL_WIDTH}cm (largura do rolo)</span>
              )}
            </div>
            <div className="field">
              <label htmlFor={`dtf-height-${item.id}`}>Altura (cm)</label>
              <input type="number" placeholder="0" min="0.1" step="0.1" id={`dtf-height-${item.id}`} value={item.height}
                onChange={e => onUpdate(item.id, 'height', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor={`dtf-qty-${item.id}`}>Quantidade</label>
              <input type="number" placeholder="1" min="1" step="1" id={`dtf-qty-${item.id}`} value={item.qty}
                onChange={e => onUpdate(item.id, 'qty', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Price */}
      {c && (
        <div className="item-price">
          <div>
            <div className="price-detail">
              {c.linearM.toFixed(2)}m × {fmt(c.pricePerM)}/m
            </div>
            {c.alert && <div className="price-alert">{c.alert}</div>}
          </div>
          <div className="price-value">{fmt(c.total)}</div>
        </div>
      )}
    </div>
  );
}
