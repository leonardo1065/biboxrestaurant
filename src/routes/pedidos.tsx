import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { useStore, orderTotal, orderRemaining } from "@/lib/store";
import { brl } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, CheckCircle2, DollarSign } from "lucide-react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentMethod } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — Brasa POS" }] }),
  component: PedidosPage,
});

function PedidosPage() {
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const addPayment = useStore((s) => s.addPayment);
  const closeOrder = useStore((s) => s.closeOrder);
  const setOrderStatus = useStore((s) => s.setOrderStatus);
  const confirmOrder = useStore((s) => s.confirmOrder);

  const [payOrderId, setPayOrderId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("dinheiro");
  const [payReceived, setPayReceived] = useState("");

  const payOrder = payOrderId ? orders.find((o) => o.id === payOrderId) : null;
  const payRemaining = payOrder ? orderRemaining(payOrder) : 0;

  const doQuickPay = () => {
    if (!payOrder) return;
    if (payOrder.items.length === 0) { toast.error("Adicione itens ao pedido antes de pagar"); return; }
    let registered = payRemaining;
    let change: number | undefined;
    if (payMethod === "dinheiro" && payReceived) {
      const rec = Number(payReceived.replace(",", ".")) || 0;
      if (rec >= payRemaining) { registered = rec; change = rec - payRemaining; }
    }
    addPayment(payOrder.id, payMethod, registered, change);
    if (!payOrder.confirmedAt) confirmOrder(payOrder.id);
    setOrderStatus(payOrder.id, "pago");
    closeOrder(payOrder.id);
    toast.success(`Pedido #${payOrder.code} pago (${payMethod}) e concluído`);
    setPayOrderId(null); setPayReceived(""); setPayMethod("dinheiro");
  };

  return (
    <AppShell>
      <PageHeader
        title="Pedidos"
        description="Todos os pedidos, do mais recente ao mais antigo."
        actions={
          <Button asChild>
            <Link to="/pdv"><Flame className="w-4 h-4 mr-1.5" />Novo</Link>
          </Button>
        }
      />
      <div className="px-8 pb-8 space-y-3">
        {orders.length === 0 && (
          <Card className="border-border"><CardContent className="p-6 text-sm text-muted-foreground">Nenhum pedido ainda.</CardContent></Card>
        )}
        {orders.map((o) => {
          const cust = customers.find((c) => c.id === o.customerId);
          const remaining = orderRemaining(o);
          const isClosed = o.status === "fechado";
          return (
            <Card key={o.id} className="border-border hover:border-primary transition-colors">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <Link to="/pedido/$id" params={{ id: o.id }} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">#{o.code}</span>
                      <Badge variant="secondary" className="capitalize">{o.type === "balcao" ? "Balcão" : o.type === "mesa" ? `Mesa ${o.tableNumber}` : "Delivery"}</Badge>
                      <Badge className="capitalize" variant={o.status === "aberto" ? "default" : o.status === "pago" ? "secondary" : "outline"}>{o.status}</Badge>
                      {isClosed && <Badge variant="outline" className="text-primary border-primary/40"><CheckCircle2 className="w-3 h-3 mr-1" />Finalizado e concluído</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {new Date(o.createdAt).toLocaleString("pt-BR")}
                      {cust && ` · ${cust.name}`}
                      {` · ${o.items.length} itens`}
                    </div>
                </Link>
                <div className="text-right shrink-0">
                  <div className="font-semibold">{brl(orderTotal(o))}</div>
                  {remaining > 0 && !isClosed && (
                    <div className="text-xs text-primary">Falta {brl(remaining)}</div>
                  )}
                </div>
                {!isClosed && remaining > 0 && o.items.length > 0 && (
                  <Button size="sm" variant="default" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPayOrderId(o.id); setPayMethod("dinheiro"); setPayReceived(""); }}>
                    <DollarSign className="w-4 h-4 mr-1" />Pagar e finalizar
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!payOrderId} onOpenChange={(o) => !o && setPayOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar e finalizar {payOrder ? `#${payOrder.code}` : ""}</DialogTitle>
          </DialogHeader>
          {payOrder && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Valor a receber: <span className="text-foreground font-semibold">{brl(payRemaining)}</span>
              </div>
              <div>
                <Label className="text-xs">Forma de pagamento</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(["dinheiro", "pix", "debito", "credito"] as PaymentMethod[]).map((m) => (
                    <Button key={m} type="button" variant={payMethod === m ? "default" : "secondary"} onClick={() => setPayMethod(m)} className="capitalize">
                      {m === "debito" ? "Débito" : m === "credito" ? "Crédito" : m === "pix" ? "PIX" : "Dinheiro"}
                    </Button>
                  ))}
                </div>
              </div>
              {payMethod === "dinheiro" && (
                <div>
                  <Label className="text-xs">Valor recebido (opcional, para troco)</Label>
                  <Input inputMode="decimal" value={payReceived} onChange={(e) => setPayReceived(e.target.value)} placeholder={brl(payRemaining)} />
                  {payReceived && Number(payReceived.replace(",", ".")) >= payRemaining && (
                    <div className="text-xs text-primary mt-1">Troco: {brl(Number(payReceived.replace(",", ".")) - payRemaining)}</div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">O pedido será marcado como pago e concluído, entrando no caixa como {payMethod}.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayOrderId(null)}>Cancelar</Button>
            <Button onClick={doQuickPay}><CheckCircle2 className="w-4 h-4 mr-1" />Confirmar pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}