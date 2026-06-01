import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { CustomerFormDialog } from "@/components/CustomerFormDialog";
import { formatPhone, onlyDigits } from "@/lib/format";
import { Pencil, Plus, Trash2, Search } from "lucide-react";
import type { Customer } from "@/lib/types";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Brasa POS" }] }),
  component: ClientesPage,
});

function ClientesPage() {
  const customers = useStore((s) => s.customers);
  const deleteCustomer = useStore((s) => s.deleteCustomer);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | undefined>();

  const qd = onlyDigits(q);
  const ql = q.toLowerCase().trim();
  const filtered = customers.filter((c) =>
    qd ? c.phone.includes(qd) : c.name.toLowerCase().includes(ql),
  );

  return (
    <AppShell>
      <PageHeader
        title="Clientes"
        description="Busca rápida por telefone."
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
                {filtered.map((c) => (
                  <div key={c.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPhone(c.phone)}{c.street ? ` · ${c.street}, ${c.number ?? "s/n"} — ${c.neighborhood ?? ""} ${c.city ? `· ${c.city}/${c.state ?? ""}` : ""}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Excluir ${c.name}?`)) deleteCustomer(c.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <CustomerFormDialog open={open} onOpenChange={setOpen} existing={editing} />
    </AppShell>
  );
}