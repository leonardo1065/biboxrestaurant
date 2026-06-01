import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { formatPhone, onlyDigits, brl } from "@/lib/format";
import { CustomerFormDialog } from "@/components/CustomerFormDialog";
import { Bike, UtensilsCrossed, ShoppingBag, Search, Plus } from "lucide-react";

export const Route = createFileRoute("/pdv")({
  head: () => ({
    meta: [
      { title: "Novo Pedido — Brasa POS" },
      { name: "description", content: "Inicie um pedido de balcão, mesa ou delivery." },
    ],
  }),
  component: PDV,
});

function PDV() {
  const navigate = useNavigate();
  const createOrder = useStore((s) => s.createOrder);
  const findByPhone = useStore((s) => s.findCustomerByPhone);

  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");

  const customer = phone ? findByPhone(phone) : undefined;

  const start = (type: "balcao" | "mesa" | "delivery") => {
    if (type === "mesa" && !tableNumber) return;
    if (type === "delivery" && !customer) {
      setOpenForm(true);
      return;
    }
    const order = createOrder(type, {
      tableNumber: type === "mesa" ? Number(tableNumber) : undefined,
      customerId: customer?.id,
      deliveryFee: type === "delivery" && deliveryFee ? Number(deliveryFee) : undefined,
    });
    navigate({ to: "/pedido/$id", params: { id: order.id } });
  };

  return (
    <AppShell>
      <PageHeader title="Novo Pedido" description="Escolha o tipo de atendimento e identifique o cliente quando aplicável." />
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardContent className="p-5 space-y-4">
            <h2 className="font-medium">Cliente (telefone)</h2>
            <div className="flex gap-2">
              <Input
                value={formatPhone(phone)}
                onChange={(e) => { setPhone(onlyDigits(e.target.value)); setSearched(false); }}
                placeholder="(11) 99999-9999"
                inputMode="tel"
                className="text-lg h-12"
              />
              <Button variant="secondary" className="h-12" onClick={() => setSearched(true)}>
                <Search className="w-4 h-4 mr-1" />Buscar
              </Button>
            </div>
            {searched && phone.length >= 10 && (
              customer ? (
                <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {customer.street ? `${customer.street}, ${customer.number ?? "s/n"} · ${customer.neighborhood ?? ""} · ${customer.city ?? ""}` : "Sem endereço cadastrado"}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Telefone não cadastrado.</span>
                  <Button size="sm" onClick={() => setOpenForm(true)}>
                    <Plus className="w-4 h-4 mr-1" />Cadastrar
                  </Button>
                </div>
              )
            )}
            {customer && (
              <p className="text-xs text-muted-foreground">Cliente vinculado ao próximo pedido.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5 space-y-4">
            <h2 className="font-medium">Tipo de atendimento</h2>
            <button
              onClick={() => start("balcao")}
              className="w-full flex items-center justify-between p-4 rounded-md border border-border hover:border-primary transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">Balcão</div>
                  <div className="text-xs text-muted-foreground">Pedido rápido para retirada no balcão</div>
                </div>
              </div>
              <span className="text-primary">→</span>
            </button>

            <div className="p-4 rounded-md border border-border space-y-3">
              <div className="flex items-center gap-3">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">Mesa</div>
                  <div className="text-xs text-muted-foreground">Atendimento no salão</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nº da mesa"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(onlyDigits(e.target.value))}
                  inputMode="numeric"
                />
                <Button onClick={() => start("mesa")} disabled={!tableNumber}>Abrir mesa</Button>
              </div>
            </div>

            <div className="p-4 rounded-md border border-border space-y-3">
              <div className="flex items-center gap-3">
                <Bike className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">Delivery</div>
                  <div className="text-xs text-muted-foreground">Requer cliente cadastrado com endereço</div>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Taxa de entrega</Label>
                  <Input
                    placeholder="0,00"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value.replace(",", "."))}
                    inputMode="decimal"
                  />
                </div>
                <Button className="self-end" onClick={() => start("delivery")} disabled={!customer}>
                  Iniciar delivery
                </Button>
              </div>
              {deliveryFee && <p className="text-xs text-muted-foreground">Taxa: {brl(Number(deliveryFee) || 0)}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <CustomerFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        initialPhone={phone}
        onSaved={(c) => { setPhone(c.phone); setSearched(true); }}
      />
    </AppShell>
  );
}