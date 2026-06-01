import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { useStore, orderTotal, orderRemaining } from "@/lib/store";
import { brl } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

export const Route = createFileRoute("/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — Brasa POS" }] }),
  component: PedidosPage,
});

function PedidosPage() {
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
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
          return (
            <Link key={o.id} to="/pedido/$id" params={{ id: o.id }} className="block">
              <Card className="border-border hover:border-primary transition-colors">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">#{o.code}</span>
                      <Badge variant="secondary" className="capitalize">{o.type === "balcao" ? "Balcão" : o.type === "mesa" ? `Mesa ${o.tableNumber}` : "Delivery"}</Badge>
                      <Badge className="capitalize" variant={o.status === "aberto" ? "default" : o.status === "pago" ? "secondary" : "outline"}>{o.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {new Date(o.createdAt).toLocaleString("pt-BR")}
                      {cust && ` · ${cust.name}`}
                      {` · ${o.items.length} itens`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold">{brl(orderTotal(o))}</div>
                    {orderRemaining(o) > 0 && o.status !== "fechado" && (
                      <div className="text-xs text-primary">Falta {brl(orderRemaining(o))}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}