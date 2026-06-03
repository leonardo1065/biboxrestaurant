import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { useStore, orderTotal, orderPaid } from "@/lib/store";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Flame, ChefHat, UtensilsCrossed, Bike, Users, Wallet } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brasa POS — Painel" },
      { name: "description", content: "Visão geral do restaurante: vendas do dia, pedidos abertos e caixa." },
    ],
  }),
  component: Index,
});

function Index() {
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const cash = useStore((s) => s.currentCash());

  const today = new Date().toDateString();
  const todays = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const sales = todays.reduce((s, o) => s + orderPaid(o), 0);
  const open = orders.filter((o) => o.status === "aberto");
  const preparing = orders.flatMap((o) => o.items.filter((i) => i.status === "preparando")).length;
  const readyOrders = orders.filter((o) => o.readyAt && o.status !== "fechado");

  const byType = (t: string) => open.filter((o) => o.type === t).length;

  return (
    <AppShell>
      <PageHeader
        title="Painel"
        description="Visão geral do dia"
        actions={
          <Button asChild>
            <Link to="/pdv"><Flame className="w-4 h-4 mr-1.5" />Novo pedido</Link>
          </Button>
        }
      />
      <div className="px-8 pb-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Vendas do dia" value={brl(sales)} icon={<Wallet className="w-4 h-4" />} />
          <Stat label="Pedidos abertos" value={String(open.length)} icon={<UtensilsCrossed className="w-4 h-4" />} />
          <Stat label="Em preparo" value={String(preparing)} icon={<ChefHat className="w-4 h-4" />} />
          <Stat label="Clientes" value={String(customers.length)} icon={<Users className="w-4 h-4" />} />
        </div>

        {readyOrders.length > 0 && (
          <Card className="border-emerald-500/40 bg-emerald-500/5">
            <CardContent className="p-5">
              <h2 className="font-medium mb-3 text-emerald-400">🔔 Pedidos prontos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {readyOrders.map((o) => (
                  <Link key={o.id} to="/pedido/$id" params={{ id: o.id }}
                    className="rounded-md border border-emerald-500/30 bg-background/40 p-3 hover:border-emerald-500 transition-colors">
                    <div className="font-semibold">#{o.code} · {labelType(o.type)}{o.tableNumber ? ` ${o.tableNumber}` : ""}</div>
                    <div className="text-xs text-muted-foreground">Pronto às {new Date(o.readyAt!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border">
          <CardContent className="p-5">
            <h2 className="font-medium mb-3">Caixa</h2>
            {cash ? (
              <div className="text-sm text-muted-foreground">
                Aberto em {new Date(cash.openedAt).toLocaleString("pt-BR")} — abertura{" "}
                <span className="text-foreground font-medium">{brl(cash.openingAmount)}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nenhum caixa aberto.</span>
                <Button asChild variant="secondary">
                  <Link to="/caixa">Abrir caixa</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Quick to="/pdv" icon={<UtensilsCrossed className="w-5 h-5" />} title="Balcão" value={byType("balcao")} hint="pedidos abertos" />
          <Quick to="/mesas" icon={<UtensilsCrossed className="w-5 h-5" />} title="Mesas" value={byType("mesa")} hint="mesas em uso" />
          <Quick to="/pdv" icon={<Bike className="w-5 h-5" />} title="Delivery" value={byType("delivery")} hint="entregas em andamento" />
        </div>

        <Card className="border-border">
          <CardContent className="p-5">
            <h2 className="font-medium mb-3">Últimos pedidos</h2>
            {todays.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido hoje. Comece pelo Novo Pedido.</p>
            ) : (
              <div className="divide-y divide-border">
                {todays.slice(0, 8).map((o) => (
                  <Link
                    key={o.id}
                    to="/pedido/$id"
                    params={{ id: o.id }}
                    className="flex items-center justify-between py-3 hover:bg-accent/40 -mx-2 px-2 rounded"
                  >
                    <div>
                      <div className="text-sm font-medium">#{o.code} · {labelType(o.type)}{o.tableNumber ? ` · Mesa ${o.tableNumber}` : ""}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {o.items.length} itens
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{brl(orderTotal(o))}</div>
                      <div className="text-xs text-muted-foreground capitalize">{o.status}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wide">
          {label}
          <span className="text-primary">{icon}</span>
        </div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Quick({ to, icon, title, value, hint }: { to: string; icon: React.ReactNode; title: string; value: number; hint: string }) {
  return (
    <Link to={to} className="block">
      <Card className="border-border hover:border-primary transition-colors">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-md grid place-items-center bg-accent text-primary">{icon}</div>
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-xs text-muted-foreground">{value} {hint}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function labelType(t: string) {
  return t === "balcao" ? "Balcão" : t === "mesa" ? "Mesa" : "Delivery";
}
