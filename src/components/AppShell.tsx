import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ChefHat,
  ClipboardList,
  Flame,
  GlassWater,
  LayoutDashboard,
  LogOut,
  Receipt,
  ScrollText,
  Shield,
  Users,
  IdCard,
  UtensilsCrossed,
  Wallet,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

const nav = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/pdv", label: "Novo Pedido", icon: Flame },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/mesas", label: "Mesas", icon: UtensilsCrossed },
  { to: "/cozinha", label: "Cozinha", icon: ChefHat },
  { to: "/copa", label: "Copa", icon: GlassWater },
  { to: "/cardapio", label: "Cardápio", icon: ScrollText },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/caixa", label: "Caixa", icon: Wallet },
  { to: "/relatorios", label: "Relatórios", icon: Receipt },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, session, profile, roles, hasRole, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  // Notificação de pedido pronto
  const orders = useStore((s) => s.orders);
  const ack = useStore((s) => s.acknowledgeReady);
  const seen = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!session) return;
    for (const o of orders) {
      if (o.readyAt && !o.notifiedReady && !seen.current.has(o.id)) {
        seen.current.add(o.id);
        const label = o.type === "mesa" ? `Mesa ${o.tableNumber}` : o.type === "balcao" ? "Balcão" : "Delivery";
        toast.success(`🔔 Pedido #${o.code} PRONTO — ${label}`, { duration: 8000 });
        ack(o.id);
      }
    }
  }, [orders, session, ack]);

  if (loading || !session) {
    return (
      <div className="dark min-h-screen bg-background text-foreground grid place-items-center">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground flex">
      <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md grid place-items-center text-primary-foreground" style={{ background: "var(--gradient-ember)" }}>
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold leading-tight">Brasa POS</div>
              <div className="text-xs text-muted-foreground">Restaurante</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active =
              to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
          {hasRole("admin") && (
            <>
            <Link
              to="/usuarios"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                location.pathname.startsWith("/usuarios")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Shield className="w-4 h-4" />
              <span>Usuários</span>
            </Link>
            <Link
              to="/funcionarios"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                location.pathname.startsWith("/funcionarios")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <IdCard className="w-4 h-4" />
              <span>Funcionários</span>
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar usuário</span>
            </Link>
            </>
          )}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="text-xs">
            <div className="font-medium text-foreground truncate">{profile?.full_name ?? profile?.email ?? "Usuário"}</div>
            <div className="flex gap-1 flex-wrap mt-1">
              {roles.length === 0 ? (
                <Badge variant="outline" className="text-[10px]">sem papel</Badge>
              ) : (
                roles.map((r) => (
                  <Badge key={r} className="text-[10px]">{ROLE_LABEL[r]}</Badge>
                ))
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" className="w-full" onClick={() => { void signOut().then(() => navigate({ to: "/login" })); }}>
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 px-8 pt-8 pb-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}