import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha — Brasa POS" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Senha mínima de 6 caracteres");
    if (password !== confirm) return toast.error("As senhas não coincidem");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    navigate({ to: "/" });
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-11 h-11 rounded-md grid place-items-center text-primary-foreground" style={{ background: "var(--gradient-ember)" }}>
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold leading-tight text-lg">Brasa POS</div>
            <div className="text-xs text-muted-foreground">Redefinir senha</div>
          </div>
        </div>
        <Card className="border-border">
          <CardContent className="p-5">
            {!ready ? (
              <p className="text-sm text-muted-foreground text-center">
                Validando link… Abra esta página pelo link enviado no e-mail.
              </p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Nova senha</Label>
                  <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirmar senha</Label>
                  <Input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Salvando…" : "Salvar nova senha"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}