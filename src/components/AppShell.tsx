import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ChefHat,
  ClipboardList,
  Flame,
  GlassWater,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  ScrollText,
  Shield,
  Users,
  IdCard,
  UtensilsCrossed,
  Wallet,
  UserPlus,
} from "lucide-react";
import { useState, useEffect, useRef, createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

const ShellContext = createContext<{ openMobileMenu: () => void }>({ openMobileMenu: () => {} });

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
  const [now, setNow] = useState(() => new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
    <ShellContext.Provider value={{ openMobileMenu: () => setMobileMenuOpen(true) }}>
    <div className="dark min-h-screen bg-background text-foreground flex">
      {mobileMenuOpen && <button aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" />}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        sidebarCollapsed ? "md:w-16" : "md:w-60",
      )}>
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-md grid place-items-center text-primary-foreground" style={{ background: "var(--gradient-ember)" }}>
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className={cn("font-semibold leading-tight", sidebarCollapsed && "md:hidden")}>Brasa POS</div>
              <div className={cn("text-xs text-muted-foreground", sidebarCollapsed && "md:hidden")}>Restaurante</div>
            </div>
            </div>
            <button type="button" aria-label={sidebarCollapsed ? "Expandir painel" : "Recolher painel"} title={sidebarCollapsed ? "Expandir painel" : "Recolher painel"} onClick={() => setSidebarCollapsed((value) => !value)} className="hidden md:grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            <button type="button" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} className="grid md:hidden h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className={cn("mt-2 text-[11px] text-muted-foreground tabular-nums", sidebarCollapsed && "md:hidden")}>
            {now.toLocaleDateString("pt-BR")} · {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <nav className={cn("flex-1 p-2 space-y-1", sidebarCollapsed && "md:px-1")}>
          {nav.map(({ to, label, icon: Icon }) => {
            const active =
              to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 md:py-2 rounded-md text-sm transition-colors",
                  sidebarCollapsed && "md:justify-center md:px-0",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className={cn(sidebarCollapsed && "md:hidden")}>{label}</span>
              </Link>
            );
          })}
          {hasRole("admin") && (
            <>
            <Link
              to="/usuarios"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                sidebarCollapsed && "md:justify-center md:px-0",
                location.pathname.startsWith("/usuarios")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span className={cn(sidebarCollapsed && "md:hidden")}>Usuários</span>
            </Link>
            <Link
              to="/funcionarios"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                sidebarCollapsed && "md:justify-center md:px-0",
                location.pathname.startsWith("/funcionarios")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <IdCard className="w-4 h-4 shrink-0" />
              <span className={cn(sidebarCollapsed && "md:hidden")}>Funcionários</span>
            </Link>
            <button
              onClick={async () => {
                if (!confirm("Para cadastrar um novo usuário você sairá da sua conta. Continuar?")) return;
                await signOut();
                navigate({ to: "/login", search: { signup: 1 } as never });
              }}
              className={cn("w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground", sidebarCollapsed && "md:justify-center md:px-0")}
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span className={cn(sidebarCollapsed && "md:hidden")}>Cadastrar usuário</span>
            </button>
            </>
          )}
        </nav>
        <div className={cn("p-3 border-t border-sidebar-border space-y-2", sidebarCollapsed && "md:p-2")}>
          <div className={cn("text-xs", sidebarCollapsed && "md:hidden")}>
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
            <LogOut className="w-3.5 h-3.5 md:mr-0 mr-1.5" /> <span className={cn(sidebarCollapsed && "md:hidden")}>Sair</span>
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-x-hidden"><ShellContext.Provider value={{ openMobileMenu: () => setMobileMenuOpen(true) }}>{children}</ShellContext.Provider></main>
    </div>
    </ShellContext.Provider>
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
  const { openMobileMenu } = useContext(ShellContext);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 px-4 sm:px-8 pt-5 sm:pt-8 pb-4">
      <div className="flex items-center gap-3 min-w-0">
        <button type="button" aria-label="Abrir menu" onClick={openMobileMenu} className="grid md:hidden h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-card text-foreground">
          <Menu className="h-5 w-5" />
        </button>
        <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
        <div className="text-xs text-muted-foreground tabular-nums text-right">
          {now.toLocaleDateString("pt-BR")} · {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
        <Button size="sm" variant="outline" onClick={() => { void signOut().then(() => navigate({ to: "/login" })); }}><LogOut className="h-3.5 w-3.5 mr-1" />Sair</Button>
      </div>
    </div>
  );
}