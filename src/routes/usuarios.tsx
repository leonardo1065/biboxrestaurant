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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Crown, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Brasa POS" }] }),
  component: UsersPage,
});

const ALL: AppRole[] = ["admin", "caixa", "garcom", "cozinha"];

type Row = { id: string; full_name: string | null; email: string | null; roles: AppRole[] };

function UsersPage() {
  const { hasRole, loading, user, refresh } = useAuth();
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

  const transferMaster = async (targetUserId: string) => {
    if (!user) return;
    setBusy(true);
    // Garante admin no destino
    const { data: existing } = await supabase
      .from("user_roles").select("id").eq("user_id", targetUserId).eq("role", "admin").maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("user_roles").insert({ user_id: targetUserId, role: "admin" });
      if (error) { setBusy(false); return toast.error(error.message); }
    }
    // Remove admin do usuário atual
    const { error: delErr } = await supabase
      .from("user_roles").delete().eq("user_id", user.id).eq("role", "admin");
    if (delErr) { setBusy(false); return toast.error(delErr.message); }
    toast.success("Administrador transferido");
    await refresh();
    await load();
    setBusy(false);
  };

  return (
    <AppShell>
      <PageHeader title="Usuários" description="Defina papéis e transfira o administrador master" />
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
                  {r.id === user?.id && <Badge variant="outline">você</Badge>}
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
              {r.id !== user?.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" disabled={busy} title="Tornar este usuário o administrador master e remover seu próprio acesso de admin">
                      <Crown className="w-3.5 h-3.5 mr-1" /> Transferir master
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Transferir administrador master?</AlertDialogTitle>
                      <AlertDialogDescription>
                        <strong>{r.full_name ?? r.email}</strong> passará a ser administrador e você perderá seu papel de admin.
                        Para voltar a ser admin, o novo master precisará lhe conceder o papel novamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void transferMaster(r.id)}>
                        <ShieldOff className="w-3.5 h-3.5 mr-1" /> Confirmar transferência
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário ainda.</p>}
        <Button variant="outline" onClick={load}>Atualizar</Button>
      </div>
    </AppShell>
  );
}