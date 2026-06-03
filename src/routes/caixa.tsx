import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import type { PaymentMethod } from "@/lib/types";

export const Route = createFileRoute("/caixa")({
  head: () => ({ meta: [{ title: "Caixa — Brasa POS" }] }),
  component: CaixaPage,
});

function CaixaPage() {
  const current = useStore((s) => s.currentCash());
  const sessions = useStore((s) => s.cashSessions);
  const orders = useStore((s) => s.orders);
  const openCash = useStore((s) => s.openCash);
  const closeCash = useStore((s) => s.closeCash);

  const [opening, setOpening] = useState("");
  const [closing, setClosing] = useState("");

  const sinceOpened = current
    ? orders.flatMap((o) => o.payments).filter((p) => new Date(p.at) >= new Date(current.openedAt))
    : [];

  const totals = sinceOpened.reduce<Record<PaymentMethod, number>>(
    (acc, p) => {
      acc[p.method] = (acc[p.method] ?? 0) + (p.amount - (p.change ?? 0));
      return acc;
    },
    { dinheiro: 0, pix: 0, debito: 0, credito: 0 },
  );

  const expectedCash = current ? current.openingAmount + totals.dinheiro : 0;
  const totalMovimento = totals.dinheiro + totals.pix + totals.debito + totals.credito;

  return (
    <AppShell>
      <PageHeader title="Caixa" description="Abertura, fechamento e movimentação por forma de pagamento." />
      <div className="px-8 pb-8 space-y-6">
        {!current ? (
          <Card className="border-border max-w-md">
            <CardContent className="p-5 space-y-3">
              <h2 className="font-medium">Abrir caixa</h2>
              <div>
                <Label>Valor de abertura (R$)</Label>
                <Input inputMode="decimal" value={opening} onChange={(e) => setOpening(e.target.value.replace(",", "."))} />
              </div>
              <Button onClick={() => {
                const n = Number(opening) || 0;
                openCash(n);
                setOpening("");
                toast.success("Caixa aberto");
              }}>Abrir caixa</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <Stat label="Abertura" value={brl(current.openingAmount)} />
              <Stat label="Dinheiro" value={brl(totals.dinheiro)} />
              <Stat label="PIX" value={brl(totals.pix)} />
              <Stat label="Débito" value={brl(totals.debito)} />
              <Stat label="Crédito" value={brl(totals.credito)} />
            </div>
            <Card className="border-border max-w-md">
              <CardContent className="p-5 space-y-2 text-sm">
                <h2 className="font-medium mb-1">Movimento do caixa</h2>
                <div className="flex justify-between"><span className="text-muted-foreground">Total recebido (bruto)</span><span className="font-medium">{brl(totalMovimento)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">(-) Valor de abertura</span><span className="font-medium">{brl(current.openingAmount)}</span></div>
                <div className="border-t border-border pt-2 flex justify-between"><span className="font-medium">Movimento líquido do dia</span><span className="font-semibold text-primary">{brl(totalMovimento)}</span></div>
                <p className="text-xs text-muted-foreground">A abertura é descontada do dinheiro esperado em caixa no fechamento.</p>
              </CardContent>
            </Card>
            <Card className="border-border max-w-md">
              <CardContent className="p-5 space-y-3">
                <h2 className="font-medium">Fechar caixa</h2>
                <div className="text-sm text-muted-foreground">Esperado em dinheiro: <span className="text-foreground font-medium">{brl(expectedCash)}</span></div>
                <div>
                  <Label>Valor conferido em dinheiro (R$)</Label>
                  <Input inputMode="decimal" value={closing} onChange={(e) => setClosing(e.target.value.replace(",", "."))} />
                </div>
                <Button variant="secondary" onClick={() => {
                  closeCash(Number(closing) || 0);
                  setClosing("");
                  toast.success("Caixa fechado");
                }}>Fechar caixa</Button>
              </CardContent>
            </Card>
          </>
        )}

        <div>
          <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">Histórico de caixas</h2>
          <Card className="border-border">
            <CardContent className="p-0 divide-y divide-border">
              {sessions.length === 0 && <div className="p-4 text-sm text-muted-foreground">Sem histórico ainda.</div>}
              {sessions.map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{new Date(s.openedAt).toLocaleString("pt-BR")} {s.closedAt ? `→ ${new Date(s.closedAt).toLocaleTimeString("pt-BR")}` : "(aberto)"}</div>
                    <div className="text-xs text-muted-foreground">Abertura {brl(s.openingAmount)}{s.closingAmount != null ? ` · Fechamento ${brl(s.closingAmount)}` : ""}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}