import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import type { OrderItemStatus } from "@/lib/types";
import { Bell, ChefHat, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/cozinha")({
  head: () => ({ meta: [{ title: "Cozinha — Brasa POS" }] }),
  component: CozinhaPage,
});

function CozinhaPage() {
  const orders = useStore((s) => s.orders);
  const setItemStatus = useStore((s) => s.setItemStatus);

  const lanes: { status: OrderItemStatus; label: string; tone: string; icon: React.ReactNode; next?: OrderItemStatus; nextLabel?: string }[] = [
    { status: "novo", label: "Novos", tone: "bg-secondary", icon: <Bell className="w-4 h-4" />, next: "preparando", nextLabel: "Iniciar preparo" },
    { status: "preparando", label: "Em preparo", tone: "bg-primary/15 border-primary/40", icon: <ChefHat className="w-4 h-4" />, next: "pronto", nextLabel: "Marcar pronto" },
    { status: "pronto", label: "Prontos", tone: "bg-emerald-500/15 border-emerald-500/40", icon: <CheckCircle2 className="w-4 h-4" />, next: "entregue", nextLabel: "Entregar" },
  ];

  const tickets = orders.filter((o) => o.status === "aberto" || o.status === "pago");

  return (
    <AppShell>
      <PageHeader title="Cozinha" description="Avisos de preparo, prontos e entregues." />
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {lanes.map((lane) => (
          <div key={lane.status} className="space-y-3">
            <div className={`px-3 py-2 rounded-md border border-border flex items-center gap-2 ${lane.tone}`}>
              {lane.icon}<span className="font-medium text-sm">{lane.label}</span>
            </div>
            {tickets.map((o) => {
              const its = o.items.filter((i) => i.status === lane.status);
              if (!its.length) return null;
              return (
                <Card key={o.id} className="border-border">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">#{o.code} · {o.type === "mesa" ? `Mesa ${o.tableNumber}` : o.type === "balcao" ? "Balcão" : "Delivery"}</div>
                      <Badge variant="outline" className="text-xs">{new Date(o.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</Badge>
                    </div>
                    <ul className="text-sm space-y-1">
                      {its.map((i) => (
                        <li key={i.id} className="flex items-start justify-between gap-2 border-t border-border pt-1.5">
                          <div>
                            <div>{i.qty}× {i.name}</div>
                            {i.notes && <div className="text-xs text-primary">obs: {i.notes}</div>}
                          </div>
                          {lane.next && (
                            <Button size="sm" variant="secondary" onClick={() => setItemStatus(o.id, i.id, lane.next!)}>
                              {lane.nextLabel}
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
    </AppShell>
  );
}