import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore, orderTotal, orderPaid, orderRemaining, orderSubtotal, orderTip } from "@/lib/store";
import { brl, formatPhone } from "@/lib/format";
import { categoryLabels } from "@/lib/seed";
import type { MenuCategory, MenuItem, PaymentMethod } from "@/lib/types";
import { toast } from "sonner";
import { Minus, Plus, Printer, Trash2, X, Send, CheckCircle2, ScanLine } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";
import { parseMenuQrPayload } from "@/routes/cardapio";

export const Route = createFileRoute("/pedido/$id")({
  head: () => ({ meta: [{ title: "Pedido — Brasa POS" }] }),
  component: PedidoPage,
});

function PedidoPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const customers = useStore((s) => s.customers);
  const menu = useStore((s) => s.menu);
  const addItemToOrder = useStore((s) => s.addItemToOrder);
  const updateItem = useStore((s) => s.updateItem);
  const removeItem = useStore((s) => s.removeItem);
  const addPayment = useStore((s) => s.addPayment);
  const closeOrder = useStore((s) => s.closeOrder);
  const setOrderField = useStore((s) => s.setOrderField);
  const setOrderStatus = useStore((s) => s.setOrderStatus);
  const confirmOrder = useStore((s) => s.confirmOrder);

  const [cat, setCat] = useState<MenuCategory>("executivos");
  const [addItem, setAddItem] = useState<MenuItem | null>(null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("dinheiro");
  const [payAmount, setPayAmount] = useState("");
  const [payReceived, setPayReceived] = useState("");
  const [feeInput, setFeeInput] = useState<string>(order?.deliveryFee != null ? String(order.deliveryFee).replace(".", ",") : "");
  const [scanOpen, setScanOpen] = useState(false);

  const remaining = order ? orderRemaining(order) : 0;
  const customer = order?.customerId ? customers.find((c) => c.id === order.customerId) : undefined;

  const cats = Object.keys(categoryLabels) as MenuCategory[];
  const items = useMemo(() => menu.filter((m) => m.category === cat && m.available), [menu, cat]);

  if (!order) {
    return (
      <AppShell>
        <div className="p-8">
          <p className="text-muted-foreground">Pedido não encontrado.</p>
          <Button asChild className="mt-3"><Link to="/pedidos">Voltar</Link></Button>
        </div>
      </AppShell>
    );
  }

  const total = orderTotal(order);
  const paid = orderPaid(order);
  const subtotal = orderSubtotal(order);
  const tip = orderTip(order);

  const confirmAdd = () => {
    if (!addItem) return;
    addItemToOrder(order.id, addItem.id, qty, notes || undefined);
    toast.success(`${qty}× ${addItem.name} adicionado`);
    setAddItem(null);
    setQty(1);
    setNotes("");
  };

  const doPay = () => {
    const amt = Number(payAmount.replace(",", ".")) || 0;
    if (amt <= 0) { toast.error("Informe o valor"); return; }
    let registeredAmount = amt;
    let change: number | undefined;
    if (payMethod === "dinheiro" && payReceived) {
      const rec = Number(payReceived.replace(",", ".")) || 0;
      if (rec >= amt) {
        registeredAmount = rec;
        change = rec - amt;
      }
    }
    addPayment(order.id, payMethod, registeredAmount, change);
    setPayAmount(""); setPayReceived("");
    toast.success(`Pagamento ${payMethod} de ${brl(amt)}${change ? ` — troco ${brl(change)}` : ""}`);
    if (amt >= orderRemaining(order)) {
      setOrderStatus(order.id, "pago");
    }
  };

  const typeLabel = order.type === "balcao" ? "Balcão"
    : order.type === "mesa" ? `Mesa ${order.tableNumber}`
    : "Delivery";

  const canConfirm = order.items.length > 0 && !order.confirmedAt && order.status !== "fechado";

  // Derive a 4-step status: Aberto → Enviado → Fechado → Concluído.
  const step: "aberto" | "enviado" | "fechado" | "concluido" =
    order.status === "fechado" && remaining <= 0
      ? "concluido"
      : order.status === "fechado"
      ? "fechado"
      : order.confirmedAt
      ? "enviado"
      : "aberto";

  const doEnviarEFechar = () => {
    if (order.items.length === 0) { toast.error("Adicione itens ao pedido"); return; }
    if (!order.confirmedAt) confirmOrder(order.id);
    closeOrder(order.id);
    toast.success(`Pedido #${order.code} enviado e fechado`);
  };

  const doFinalizarEConcluir = () => {
    if (remaining > 0) {
      toast.error(`Falta ${brl(remaining)} — registre o pagamento antes de concluir`);
      return;
    }
    if (order.status !== "fechado") closeOrder(order.id);
    setOrderStatus(order.id, "fechado");
    toast.success(`Pedido #${order.code} finalizado e concluído`);
    navigate({ to: "/pedidos" });
  };

  return (
    <AppShell>
      <PageHeader
        title={`Pedido #${order.code}`}
        description={`${typeLabel} · ${new Date(order.createdAt).toLocaleString("pt-BR")}`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="ghost"><Link to="/pedidos">Voltar</Link></Button>
            <Button asChild variant="secondary"><Link to="/recibo/$id" params={{ id: order.id }} target="_blank">
              <Printer className="w-4 h-4 mr-1.5" />{order.type === "delivery" ? "Cupom" : "Recibo"}
            </Link></Button>
            {order.status !== "fechado" && (
              <Button variant="secondary" onClick={() => setScanOpen(true)}>
                <ScanLine className="w-4 h-4 mr-1.5" />Escanear QR
              </Button>
            )}
            {canConfirm && (
              <Button variant="default" onClick={() => {
                confirmOrder(order.id);
                toast.success(`Pedido #${order.code} enviado para cozinha/copa`);
              }}>
                <Send className="w-4 h-4 mr-1.5" />Confirmar e enviar
              </Button>
            )}
            {order.status !== "fechado" && (
              <Button onClick={() => {
                if (remaining > 0 && !confirm(`Faltam ${brl(remaining)}. Fechar mesmo assim?`)) return;
                if (!order.confirmedAt) confirmOrder(order.id);
                closeOrder(order.id);
                toast.success("Pedido fechado");
                navigate({ to: "/pedidos" });
              }}><CheckCircle2 className="w-4 h-4 mr-1.5" />Fechar pedido</Button>
            )}
          </div>
        }
      />

      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: items + menu */}
        <div className="lg:col-span-2 space-y-6">
          <StatusPanel
            step={step}
            onEnviarEFechar={doEnviarEFechar}
            onFinalizarEConcluir={doFinalizarEConcluir}
            remaining={remaining}
          />
          {customer && (
            <Card className="border-border">
              <CardContent className="p-4 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{customer.name}</span>
                  <span className="text-muted-foreground">{formatPhone(customer.phone)}</span>
                </div>
                {customer.street && (
                  <div className="text-xs text-muted-foreground">
                    {customer.street}, {customer.number ?? "s/n"}{customer.complement ? ` — ${customer.complement}` : ""} · {customer.neighborhood} · {customer.city}/{customer.state}
                    {customer.reference && <> · Ref: {customer.reference}</>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="font-medium">Cardápio</h2>
                <Select value={cat} onValueChange={(v) => setCat(v as MenuCategory)}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((m) => (
                  <button key={m.id} onClick={() => { setAddItem(m); setQty(1); setNotes(""); }} className="text-left">
                    <div className="rounded-md border border-border hover:border-primary transition-colors p-3 flex gap-3 items-center">
                      {m.image ? (
                        <img src={m.image} alt={m.name} loading="lazy" className="w-14 h-14 rounded object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded bg-muted grid place-items-center text-xs text-muted-foreground">sem foto</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{m.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{m.description}</div>
                      </div>
                      <div className="text-primary font-semibold">{brl(m.price)}</div>
                    </div>
                  </button>
                ))}
                {!items.length && <div className="text-sm text-muted-foreground p-2">Nenhum item disponível nesta categoria.</div>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <h2 className="font-medium mb-3">Itens do pedido</h2>
              {order.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Adicione itens pelo cardápio acima.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {order.items.map((i) => (
                    <li key={i.id} className="py-3 flex gap-3 items-start">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => updateItem(order.id, i.id, { qty: Math.max(1, i.qty - 1) })}><Minus className="w-4 h-4" /></Button>
                        <span className="w-6 text-center font-medium">{i.qty}</span>
                        <Button size="icon" variant="ghost" onClick={() => updateItem(order.id, i.id, { qty: i.qty + 1 })}><Plus className="w-4 h-4" /></Button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{i.name}</span>
                          <Badge variant="outline" className="capitalize text-xs">{i.status}</Badge>
                          {order.type === "mesa" && order.splitCount && order.splitCount > 1 && (
                            <Select value={String(i.splitClient ?? 1)} onValueChange={(v) => updateItem(order.id, i.id, { splitClient: Number(v) })}>
                              <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: order.splitCount }, (_, k) => k + 1).map((n) =>
                                  <SelectItem key={n} value={String(n)}>Cliente {n}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <Input
                          className="mt-1 h-8 text-xs"
                          placeholder="Observação / alteração no prato"
                          value={i.notes ?? ""}
                          onChange={(e) => updateItem(order.id, i.id, { notes: e.target.value })}
                        />
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold">{brl(i.price * i.qty)}</div>
                        <Button size="icon" variant="ghost" onClick={() => removeItem(order.id, i.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {order.type === "mesa" && (
            <Card className="border-border">
              <CardContent className="p-4 space-y-3">
                <h2 className="font-medium">Divisão de mesa</h2>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Nº de clientes:</Label>
                  <Input
                    type="number" min={1} max={20}
                    value={order.splitCount ?? 1}
                    onChange={(e) => setOrderField(order.id, "splitCount", Math.max(1, Number(e.target.value) || 1))}
                    className="w-24"
                  />
                </div>
                {order.splitCount && order.splitCount > 1 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                    {Array.from({ length: order.splitCount }, (_, k) => k + 1).map((n) => {
                      const sub = order.items
                        .filter((i) => (i.splitClient ?? 1) === n)
                        .reduce((s, i) => s + i.price * i.qty, 0);
                      return (
                        <div key={n} className="rounded-md border border-border p-2 text-sm">
                          <div className="text-muted-foreground text-xs">Cliente {n}</div>
                          <div className="font-semibold">{brl(sub)}</div>
                        </div>
                      );
                    })}
                    <div className="rounded-md border border-primary/50 bg-primary/5 p-2 text-sm">
                      <div className="text-muted-foreground text-xs">Por pessoa (igual)</div>
                      <div className="font-semibold">{brl(total / (order.splitCount ?? 1))}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: totals + payments */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardContent className="p-4 space-y-2 text-sm">
              <Row label="Subtotal" value={brl(subtotal)} />
              {order.type === "mesa" && (
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!order.tipEnabled}
                      onChange={(e) => setOrderField(order.id, "tipEnabled", e.target.checked)}
                    />
                    Taxa do garçom (10%)
                  </label>
                  <span className={tip ? "font-medium" : "text-muted-foreground"}>{brl(tip)}</span>
                </div>
              )}
              {order.type === "delivery" && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-muted-foreground">Taxa de entrega</Label>
                    <Input
                      className="h-8 w-28 text-right"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={feeInput}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.,]/g, "");
                        setFeeInput(v);
                        const n = Number(v.replace(",", "."));
                        if (!Number.isNaN(n)) setOrderField(order.id, "deliveryFee", n);
                      }}
                      onBlur={() => {
                        const n = Number(feeInput.replace(",", ".")) || 0;
                        setOrderField(order.id, "deliveryFee", n);
                        setFeeInput(n ? n.toFixed(2).replace(".", ",") : "");
                      }}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={!!order.deliveryPaid} onChange={(e) => setOrderField(order.id, "deliveryPaid", e.target.checked)} />
                    Pago (caso contrário: a cobrar na entrega)
                  </label>
                </>
              )}
              <div className="border-t border-border my-2" />
              <Row label="Total" value={brl(total)} bold />
              <Row label="Pago" value={brl(paid)} />
              <Row label="Falta" value={brl(remaining)} bold highlight={remaining > 0} />
            </CardContent>
          </Card>

          {order.status !== "fechado" && (
            <Card className="border-border">
              <CardContent className="p-4 space-y-3">
                <h2 className="font-medium">Pagamento</h2>
                <div className="grid grid-cols-2 gap-2">
                  {(["dinheiro", "pix", "debito", "credito"] as PaymentMethod[]).map((m) => (
                    <Button key={m} variant={payMethod === m ? "default" : "secondary"} onClick={() => setPayMethod(m)} className="capitalize">
                      {m === "debito" ? "Débito" : m === "credito" ? "Crédito" : m === "pix" ? "PIX" : "Dinheiro"}
                    </Button>
                  ))}
                </div>
                <div>
                  <Label className="text-xs">Valor a pagar (total do pedido)</Label>
                  <div className="flex gap-2">
                    <Input inputMode="decimal" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={brl(remaining)} />
                    <Button variant="ghost" onClick={() => setPayAmount(String(remaining.toFixed(2)))}>Falta</Button>
                  </div>
                </div>
                {payMethod === "dinheiro" && (
                  <div>
                    <Label className="text-xs">Valor recebido em dinheiro</Label>
                    <Input inputMode="decimal" value={payReceived} onChange={(e) => setPayReceived(e.target.value)} placeholder="0,00" />
                    {payReceived && payAmount && Number(payReceived.replace(",", ".")) >= Number(payAmount.replace(",", ".")) && (
                      <div className="text-xs text-primary mt-1">Troco: {brl(Number(payReceived.replace(",", ".")) - Number(payAmount.replace(",", ".")))}</div>
                    )}
                  </div>
                )}
                <Button className="w-full" onClick={doPay}>Registrar pagamento</Button>
              </CardContent>
            </Card>
          )}

          {order.payments.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-4">
                <h2 className="font-medium mb-2 text-sm">Pagamentos</h2>
                <ul className="text-sm divide-y divide-border">
                  {order.payments.map((p) => (
                    <li key={p.id} className="py-2 flex justify-between">
                      <span className="capitalize">{p.method}{p.change ? ` (troco ${brl(p.change)})` : ""}</span>
                      <span className="font-medium">{brl(p.amount - (p.change ?? 0))}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add item dialog */}
      <Dialog open={!!addItem} onOpenChange={(o) => !o && setAddItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{addItem?.name}</DialogTitle></DialogHeader>
          {addItem && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">{addItem.description}</div>
              <div className="flex items-center gap-3">
                <Label>Quantidade</Label>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="secondary" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="w-4 h-4" /></Button>
                  <span className="w-10 text-center font-semibold">{qty}</span>
                  <Button size="icon" variant="secondary" onClick={() => setQty((q) => q + 1)}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
              <div>
                <Label>Observações / alterações</Label>
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: sem cebola, ponto da carne, trocar arroz por salada…" />
              </div>
              <div className="text-right text-sm">Subtotal: <span className="font-semibold">{brl(addItem.price * qty)}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddItem(null)}><X className="w-4 h-4 mr-1" />Cancelar</Button>
            <Button onClick={confirmAdd}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QRScanner
        open={scanOpen}
        onOpenChange={setScanOpen}
        onScan={(decoded) => {
          const itemId = parseMenuQrPayload(decoded);
          if (!itemId) { toast.error("QR inválido"); return; }
          const item = menu.find((m) => m.id === itemId);
          if (!item) { toast.error("Item não encontrado no cardápio"); return; }
          if (!item.available) { toast.error(`${item.name} está esgotado`); return; }
          addItemToOrder(order.id, item.id, 1);
          toast.success(`${item.name} adicionado ao pedido #${order.code}`);
          setScanOpen(false);
        }}
      />
    </AppShell>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base" : ""}`}>
      <span className={highlight ? "text-primary" : "text-muted-foreground"}>{label}</span>
      <span className={`${bold ? "font-semibold" : ""} ${highlight ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}