import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL, useAuth, type AppRole } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Brasa POS" }] }),
  component: UsersPage,
});

const ALL: AppRole[] = ["admin", "caixa", "garcom", "cozinha"];

type Row = { id: string; full_name: string | null; email: string | null; roles: AppRole[] };

function UsersPage() {
  const { hasRole, loading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email").order("created_at"),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const map = new Map<string, AppRole[]>();
    ((roles ?? []) as Array<{ user_id: string; role: AppRole }>).forEach((r) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role);
      map.set(r.user_id, arr);
    });
    setRows(
      ((profiles ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>).map((p) => ({
        ...p,
        roles: map.get(p.id) ?? [],
      })),
    );
  };

  useEffect(() => {
    if (!loading && hasRole("admin")) void load();
  }, [loading, hasRole]);

  if (loading) return null;

  if (!hasRole("admin")) {
    return (
      <AppShell>
        <PageHeader title="Usuários" />
        <div className="px-8"><p className="text-sm text-muted-foreground">Acesso restrito a administradores.</p></div>
      </AppShell>
    );
  }

  const toggle = async (userId: string, role: AppRole, has: boolean) => {
    setBusy(true);
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) toast.error(error.message);
    }
    await load();
    setBusy(false);
  };

  return (
    <AppShell>
      <PageHeader title="Usuários" description="Defina o papel de cada funcionário" />
      <div className="px-8 pb-8 space-y-3">
        {rows.map((r) => (
          <Card key={r.id} className="border-border">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="font-medium">{r.full_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{r.email}</div>
                <div className="mt-1 flex gap-1 flex-wrap">
                  {r.roles.length === 0 && <Badge variant="outline">sem papel</Badge>}
                  {r.roles.map((x) => (
                    <Badge key={x}>{ROLE_LABEL[x]}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 flex-wrap">
                {ALL.map((role) => {
                  const has = r.roles.includes(role);
                  return (
                    <label key={role} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={has} disabled={busy} onCheckedChange={() => toggle(r.id, role, has)} />
                      {ROLE_LABEL[role]}
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário ainda.</p>}
        <Button variant="outline" onClick={load}>Atualizar</Button>
      </div>
    </AppShell>
  );
}