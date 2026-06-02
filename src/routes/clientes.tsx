import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore, orderTotal, orderRemaining } from "@/lib/store";
import { CustomerFormDialog } from "@/components/CustomerFormDialog";
import { Badge } from "@/components/ui/badge";
import { formatPhone, onlyDigits, brl } from "@/lib/format";
import { Pencil, Plus, Trash2, Search, ChevronDown, ChevronRight, Receipt } from "lucide-react";
import type { Customer } from "@/lib/types";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Brasa POS" }] }),
  component: ClientesPage,
});

function ClientesPage() {
  const customers = useStore((s) => s.customers);
  const orders = useStore((s) => s.orders);
  const deleteCustomer = useStore((s) => s.deleteCustomer);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | undefined>();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const qd = onlyDigits(q);
  const ql = q.toLowerCase().trim();
  const filtered = customers.filter((c) =>
    qd ? c.phone.includes(qd) : c.name.toLowerCase().includes(ql),
  );

  const ordersByCustomer = useMemo(() => {
    const m = new Map<string, typeof orders>();
    for (const o of orders) {
      if (!o.customerId) continue;
      const arr = m.get(o.customerId) ?? [];
      arr.push(o);
      m.set(o.customerId, arr);
    }
    for (const [k, arr] of m) {
      arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      m.set(k, arr.slice(0, 5));
    }
    return m;
  }, [orders]);

  const statusLabel: Record<string, string> = {
    aberto: "Aberto",
    pago: "Pago",
    fechado: "Fechado",
    cancelado: "Cancelado",
  };

  return (
    <AppShell>
      <PageHeader
        title="Clientes"
        description="Busca rápida por telefone. Clique para ver os últimos pedidos."
        actions={
          <Button onClick={() => { setEditing(undefined); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" />Novo cliente
          </Button>
        }
      />
      <div className="px-8 pb-8 space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Telefone ou nome…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <Card className="border-border">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">Nenhum cliente encontrado.</div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((c) => {
                  const isOpen = !!expanded[c.id];
                  const last = ordersByCustomer.get(c.id) ?? [];
                  return (
                    <div key={c.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          className="min-w-0 flex items-center gap-2 text-left flex-1"
                          onClick={() => setExpanded((e) => ({ ...e, [c.id]: !e[c.id] }))}
                        >
                          {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                          <div className="min-w-0">
                            <div className="font-medium truncate">{c.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {formatPhone(c.phone)}{c.street ? ` · ${c.street}, ${c.number ?? "s/n"} — ${c.neighborhood ?? ""} ${c.city ? `· ${c.city}/${c.state ?? ""}` : ""}` : ""}
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2 shrink-0">{last.length} pedidos</Badge>
                        </button>
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Excluir ${c.name}?`)) deleteCustomer(c.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="mt-3 ml-6 space-y-2">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">Últimos 5 pedidos</div>
                          {last.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Sem pedidos ainda.</div>
                          ) : (
                            <div className="rounded-md border border-border divide-y divide-border">
                              {last.map((o) => {
                                const total = orderTotal(o);
                                const rem = orderRemaining(o);
                                const paid = rem === 0 && total > 0;
                                return (
                                  <Link
                                    key={o.id}
                                    to="/pedido/$id"
                                    params={{ id: o.id }}
                                    className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/40 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Receipt className="w-4 h-4 text-muted-foreground shrink-0" />
                                      <div className="min-w-0">
                                        <div className="text-sm font-medium truncate">
                                          #{o.code} · {o.type}{o.tableNumber ? ` · Mesa ${o.tableNumber}` : ""}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          {new Date(o.createdAt).toLocaleString("pt-BR")} · {o.items.length} itens
                                          {o.items.length > 0 && ` · ${o.items.map((i) => `${i.qty}x ${i.name}`).slice(0, 3).join(", ")}${o.items.length > 3 ? "…" : ""}`}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Badge variant={paid ? "default" : "outline"} className="text-[10px]">
                                        {paid ? "Pago" : statusLabel[o.status] ?? o.status}
                                      </Badge>
                                      <div className="text-sm font-semibold tabular-nums">{brl(total)}</div>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <CustomerFormDialog open={open} onOpenChange={setOpen} existing={editing} />
    </AppShell>
  );
}