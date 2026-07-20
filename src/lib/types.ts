export type OrderType = "balcao" | "mesa" | "delivery";
export type OrderItemStatus = "novo" | "preparando" | "pronto" | "entregue";
export type OrderStatus = "aberto" | "pago" | "fechado" | "cancelado";
export type PaymentMethod = "dinheiro" | "pix" | "debito" | "credito";
export type MenuCategory =
  | "executivos"
  | "carnes"
  | "frango"
  | "acompanhamentos"
  | "saladas"
  | "bebidas"
  | "cervejas"
  | "drinks";

export interface Customer {
  id: string;
  name: string;
  phone: string; // só dígitos
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  reference?: string;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: MenuCategory;
  image?: string;
  available: boolean;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  notes?: string;
  status: OrderItemStatus;
  splitClient?: number; // 1..n para divisão de mesa
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  change?: number; // troco em dinheiro
  tip?: number; // caixinha (diferença em dinheiro que o cliente deixou para os funcionários)
  at: string;
}

export interface Order {
  id: string;
  code: number; // sequencial diário
  type: OrderType;
  tableNumber?: number;
  customerId?: string;
  items: OrderItem[];
  payments: Payment[];
  status: OrderStatus;
  deliveryFee?: number;
  deliveryPaid?: boolean; // pago ou a cobrar
  notes?: string;
  createdAt: string;
  closedAt?: string;
  splitCount?: number; // divisão de clientes na mesa
  confirmedAt?: string; // enviado para cozinha/copa
  readyAt?: string; // todos os itens prontos
  notifiedReady?: boolean; // já avisamos o cliente/mesa
  tipEnabled?: boolean; // taxa de 10% do garçom (mesa)
}

export interface CashSession {
  id: string;
  openedAt: string;
  openingAmount: number;
  closedAt?: string;
  closingAmount?: number;
  notes?: string;
}