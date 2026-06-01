import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore, orderTotal } from "@/lib/store";
import { brl, onlyDigits } from "@/lib/format";
import { UtensilsCrossed } from "lucide-react";

export const Route = createFileRoute("/mesas")({
  head: () => ({ meta: [{ title: "Mesas — Brasa POS" }] }),
  component: MesasPage,
});

function MesasPage() {
  const orders = useStore((s) => s.orders);
  const createOrder = useStore((s) => s.createOrder);
  const navigate = useNavigate();
  const [num, setNum] = useState("");

  const openTables = new Map<number, ReturnType<typeof orderTotal> extends never ? never : (typeof orders)[number]>();
  orders
    .filter((o) => o.type === "mesa" && o.status === "aberto" && o.tableNumber)
    .forEach((o) => openTables.set(o.tableNumber!, o));

  const tables = Array.from({ length: 20 }, (_, i) => i + 1);

  const openTable = (n: number) => {
    const existing = openTables.get(n);
    if (existing) navigate({ to: "/pedido/$id", params: { id: existing.id } });
    else {
      const o = createOrder("mesa", { tableNumber: n });
      navigate({ to: "/pedido/$id", params: { id: o.id } });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Mesas"
        description="Toque numa mesa para abrir ou continuar o atendimento."
        actions={
          <div className="flex gap-2">
            <Input
              placeholder="Outra mesa…"
              value={num}
              onChange={(e) => setNum(onlyDigits(e.target.value))}
              className="w-32"
            />
            <Button disabled={!num} onClick={() => openTable(Number(num))}>Abrir</Button>
          </div>
        }
      />
      <div className="px-8 pb-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {tables.map((n) => {
          const o = openTables.get(n);
          const busy = !!o;
          return (
            <button key={n} onClick={() => openTable(n)}>
              <Card className={`border-border transition-all ${busy ? "border-primary bg-primary/10" : "hover:border-primary"}`}>
                <CardContent className="p-4 text-center space-y-1">
                  <UtensilsCrossed className={`w-5 h-5 mx-auto ${busy ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="font-semibold">Mesa {n}</div>
                  <div className="text-xs text-muted-foreground">
                    {busy ? brl(orderTotal(o)) : "Livre"}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </AppShell>
  );
}