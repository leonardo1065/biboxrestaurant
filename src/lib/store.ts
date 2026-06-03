import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CashSession,
  Customer,
  MenuItem,
  Order,
  OrderItem,
  OrderItemStatus,
  OrderStatus,
  OrderType,
  Payment,
  PaymentMethod,
} from "./types";
import { seedMenu } from "./seed";
import { onlyDigits } from "./format";

export const BAR_CATEGORIES = new Set(["bebidas", "cervejas", "drinks"]);

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

interface State {
  customers: Customer[];
  menu: MenuItem[];
  orders: Order[];
  cashSessions: CashSession[];
  orderSeq: number;
  hydrated: boolean;

  // customers
  findCustomerByPhone: (phone: string) => Customer | undefined;
  addCustomer: (data: Omit<Customer, "id" | "createdAt">) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // menu
  toggleMenuAvailable: (id: string) => void;
  upsertMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;

  // orders
  createOrder: (type: OrderType, opts?: { tableNumber?: number; customerId?: string; deliveryFee?: number }) => Order;
  addItemToOrder: (orderId: string, menuItemId: string, qty?: number, notes?: string) => void;
  updateItem: (orderId: string, itemId: string, patch: Partial<OrderItem>) => void;
  removeItem: (orderId: string, itemId: string) => void;
  setItemStatus: (orderId: string, itemId: string, status: OrderItemStatus) => void;
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  setOrderField: <K extends keyof Order>(orderId: string, key: K, value: Order[K]) => void;
  confirmOrder: (orderId: string) => void;
  acknowledgeReady: (orderId: string) => void;
  addPayment: (orderId: string, method: PaymentMethod, amount: number, change?: number) => Payment;
  closeOrder: (orderId: string) => void;

  // cash
  openCash: (amount: number) => CashSession;
  closeCash: (amount: number, notes?: string) => void;
  currentCash: () => CashSession | undefined;
}

export const orderTotal = (o: Order) =>
  o.items.reduce((s, i) => s + i.price * i.qty, 0) + (o.deliveryFee ?? 0);

export const orderPaid = (o: Order) =>
  o.payments.reduce((s, p) => s + p.amount - (p.change ?? 0), 0);

export const orderRemaining = (o: Order) => Math.max(0, orderTotal(o) - orderPaid(o));

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      customers: [],
      menu: seedMenu,
      orders: [],
      cashSessions: [],
      orderSeq: 0,
      hydrated: false,

      findCustomerByPhone: (phone) => {
        const clean = onlyDigits(phone);
        if (!clean) return undefined;
        return get().customers.find((c) => c.phone === clean);
      },

      addCustomer: (data) => {
        const c: Customer = {
          ...data,
          phone: onlyDigits(data.phone),
          id: uid(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ customers: [...s.customers, c] }));
        return c;
      },

      updateCustomer: (id, data) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id ? { ...c, ...data, phone: data.phone ? onlyDigits(data.phone) : c.phone } : c,
          ),
        })),

      deleteCustomer: (id) =>
        set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

      toggleMenuAvailable: (id) =>
        set((s) => ({
          menu: s.menu.map((m) => (m.id === id ? { ...m, available: !m.available } : m)),
        })),
      upsertMenuItem: (item) =>
        set((s) => ({
          menu: s.menu.some((m) => m.id === item.id)
            ? s.menu.map((m) => (m.id === item.id ? item : m))
            : [...s.menu, item],
        })),
      deleteMenuItem: (id) => set((s) => ({ menu: s.menu.filter((m) => m.id !== id) })),

      createOrder: (type, opts) => {
        const code = get().orderSeq + 1;
        const o: Order = {
          id: uid(),
          code,
          type,
          tableNumber: opts?.tableNumber,
          customerId: opts?.customerId,
          items: [],
          payments: [],
          status: "aberto",
          deliveryFee: opts?.deliveryFee,
          deliveryPaid: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ orders: [o, ...s.orders], orderSeq: code }));
        return o;
      },

      addItemToOrder: (orderId, menuItemId, qty = 1, notes) => {
        const item = get().menu.find((m) => m.id === menuItemId);
        if (!item) return;
        const oi: OrderItem = {
          id: uid(),
          menuItemId,
          name: item.name,
          price: item.price,
          qty,
          notes,
          status: "novo",
        };
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, items: [...o.items, oi] } : o,
          ),
        }));
      },

      updateItem: (orderId, itemId, patch) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, items: o.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
              : o,
          ),
        })),

      removeItem: (orderId, itemId) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, items: o.items.filter((i) => i.id !== itemId) } : o,
          ),
        })),

      setItemStatus: (orderId, itemId, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? (() => {
                  const items = o.items.map((i) => (i.id === itemId ? { ...i, status } : i));
                  const allReady = items.length > 0 && items.every((i) => i.status === "pronto" || i.status === "entregue");
                  return {
                    ...o,
                    items,
                    readyAt: allReady && !o.readyAt ? new Date().toISOString() : o.readyAt,
                  };
                })()
              : o,
          ),
        })),

      setOrderStatus: (orderId, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, status, closedAt: status === "fechado" ? new Date().toISOString() : o.closedAt }
              : o,
          ),
        })),

      setOrderField: (orderId, key, value) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, [key]: value } : o)),
        })),

      confirmOrder: (orderId) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId && !o.confirmedAt
              ? { ...o, confirmedAt: new Date().toISOString() }
              : o,
          ),
        })),

      acknowledgeReady: (orderId) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, notifiedReady: true } : o)),
        })),

      addPayment: (orderId, method, amount, change) => {
        const p: Payment = { id: uid(), method, amount, change, at: new Date().toISOString() };
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, payments: [...o.payments, p] } : o,
          ),
        }));
        return p;
      },

      closeOrder: (orderId) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: "fechado", closedAt: new Date().toISOString() }
              : o,
          ),
        })),

      openCash: (amount) => {
        const cs: CashSession = {
          id: uid(),
          openedAt: new Date().toISOString(),
          openingAmount: amount,
        };
        set((s) => ({ cashSessions: [cs, ...s.cashSessions] }));
        return cs;
      },
      closeCash: (amount, notes) =>
        set((s) => ({
          cashSessions: s.cashSessions.map((c, idx) =>
            idx === 0 && !c.closedAt
              ? { ...c, closingAmount: amount, closedAt: new Date().toISOString(), notes }
              : c,
          ),
        })),
      currentCash: () => {
        const cs = get().cashSessions[0];
        return cs && !cs.closedAt ? cs : undefined;
      },
    }),
    {
      name: "brasa-pos-v1",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);