import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { useStore, orderPaid, orderTotal } from "@/lib/store";
import { brl } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Brasa POS" }] }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const orders = useStore((s) => s.orders);

  const now = new Date();
  const dayKey = (d: Date) => d.toLocaleDateString("pt-BR");
  const monthKey = (d: Date) => `${d.getMonth() + 1}/${d.getFullYear()}`;

  const today = orders.filter((o) => dayKey(new Date(o.createdAt)) === dayKey(now));
  const month = orders.filter((o) => monthKey(new Date(o.createdAt)) === monthKey(now));

  const sum = (list: typeof orders) => list.reduce((s, o) => s + orderPaid(o), 0);
  const totalGross = (list: typeof orders) => list.reduce((s, o) => s + orderTotal(o), 0);

  const byMethod = (list: typeof orders) => {
    const acc: Record<PaymentMethod, number> = { dinheiro: 0, pix: 0, debito: 0, credito: 0 };
    list.flatMap((o) => o.payments).forEach((p) => { acc[p.method] += p.amount - (p.change ?? 0); });
    return acc;
  };

  const byType = (list: typeof orders) => {
    const acc = { balcao: 0, mesa: 0, delivery: 0 } as Record<string, number>;
    list.forEach((o) => { acc[o.type] += orderPaid(o); });
    return acc;
  };

  const tMethod = byMethod(today);
  const mMethod = byMethod(month);
  const tType = byType(today);
  const mType = byType(month);

  return (
    <AppShell>
      <PageHeader title="Relatórios" description="Fechamento diário e mensal." />
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title={`Hoje (${dayKey(now)})`} count={today.length} gross={totalGross(today)} paid={sum(today)} byMethod={tMethod} byType={tType} />
        <Section title={`Mês (${monthKey(now)})`} count={month.length} gross={totalGross(month)} paid={sum(month)} byMethod={mMethod} byType={mType} />
      </div>
    </AppShell>
  );
}

function Section({ title, count, gross, paid, byMethod, byType }: {
  title: string; count: number; gross: number; paid: number;
  byMethod: Record<PaymentMethod, number>; byType: Record<string, number>;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-5 space-y-4">
        <h2 className="font-medium">{title}</h2>
        <div className="grid grid-cols-3 gap-3">
          <Mini label="Pedidos" value={String(count)} />
          <Mini label="Faturado" value={brl(gross)} />
          <Mini label="Recebido" value={brl(paid)} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Por forma de pagamento</div>
          <Row label="Dinheiro" value={byMethod.dinheiro} />
          <Row label="PIX" value={byMethod.pix} />
          <Row label="Débito" value={byMethod.debito} />
          <Row label="Crédito" value={byMethod.credito} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Por tipo</div>
          <Row label="Balcão" value={byType.balcao} />
          <Row label="Mesa" value={byType.mesa} />
          <Row label="Delivery" value={byType.delivery} />
        </div>
      </CardContent>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{brl(value)}</span>
    </div>
  );
}