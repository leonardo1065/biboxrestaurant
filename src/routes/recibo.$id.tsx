import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore, orderTotal, orderPaid, orderRemaining } from "@/lib/store";
import { brl, formatPhone } from "@/lib/format";

export const Route = createFileRoute("/recibo/$id")({
  head: () => ({ meta: [{ title: "Recibo" }] }),
  component: ReciboPage,
});

function ReciboPage() {
  const { id } = Route.useParams();
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const customer = useStore((s) =>
    order?.customerId ? s.customers.find((c) => c.id === order.customerId) : undefined,
  );

  useEffect(() => {
    if (order) setTimeout(() => window.print(), 400);
  }, [order]);

  if (!order) return <div className="p-8">Pedido não encontrado.</div>;

  const isDelivery = order.type === "delivery";
  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = orderTotal(order);
  const paid = orderPaid(order);
  const due = orderRemaining(order);

  return (
    <div className="min-h-screen bg-white text-black p-6 print:p-2 font-mono text-[13px] leading-snug">
      <style>{`@media print { @page { size: 80mm auto; margin: 4mm; } }`}</style>
      <div className="max-w-sm mx-auto space-y-2">
        <div className="text-center">
          <div className="font-bold text-base">BRASA RESTAURANTE</div>
          <div className="text-xs">{isDelivery ? "CUPOM DE ENTREGA" : "RECIBO DE VENDA"}</div>
          <div className="text-xs">Pedido #{order.code} · {new Date(order.createdAt).toLocaleString("pt-BR")}</div>
          <div className="text-xs capitalize">
            {order.type === "balcao" ? "Balcão" : order.type === "mesa" ? `Mesa ${order.tableNumber}` : "Delivery"}
          </div>
        </div>

        {customer && (
          <div className="border-t border-dashed border-black pt-2 text-xs">
            <div><b>Cliente:</b> {customer.name}</div>
            <div><b>Tel:</b> {formatPhone(customer.phone)}</div>
            {customer.street && (
              <div><b>End:</b> {customer.street}, {customer.number ?? "s/n"}{customer.complement ? ` — ${customer.complement}` : ""}</div>
            )}
            {customer.neighborhood && <div>{customer.neighborhood} · {customer.city}/{customer.state} · CEP {customer.cep}</div>}
            {customer.reference && <div><b>Ref:</b> {customer.reference}</div>}
          </div>
        )}

        <div className="border-t border-dashed border-black pt-2">
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between">
              <span>{i.qty}× {i.name}{i.notes ? ` (${i.notes})` : ""}</span>
              <span>{brl(i.price * i.qty)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black pt-2 space-y-0.5">
          <Row l="Subtotal" v={brl(subtotal)} />
          {order.deliveryFee ? <Row l="Taxa entrega" v={brl(order.deliveryFee)} /> : null}
          <Row l="TOTAL" v={brl(total)} bold />
          {order.payments.map((p) => (
            <Row key={p.id} l={`Pag. ${p.method}${p.change ? ` (troco ${brl(p.change)})` : ""}`} v={brl(p.amount - (p.change ?? 0))} />
          ))}
          <Row l="Pago" v={brl(paid)} />
          {due > 0 && <Row l={isDelivery ? "A COBRAR NA ENTREGA" : "FALTA"} v={brl(due)} bold />}
        </div>

        <div className="text-center text-xs pt-3 border-t border-dashed border-black">
          Obrigado pela preferência!
        </div>

        <div className="text-center pt-4 print:hidden">
          <button onClick={() => window.print()} className="px-3 py-1.5 rounded bg-black text-white text-xs">Imprimir</button>
        </div>
      </div>
    </div>
  );
}

function Row({ l, v, bold }: { l: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold" : ""}`}>
      <span>{l}</span><span>{v}</span>
    </div>
  );
}