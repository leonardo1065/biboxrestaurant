import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Brasa POS" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo!");
    navigate({ to: "/" });
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Entrando…");
    navigate({ to: "/" });
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div
            className="w-11 h-11 rounded-md grid place-items-center text-primary-foreground"
            style={{ background: "var(--gradient-ember)" }}
          >
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold leading-tight text-lg">Brasa POS</div>
            <div className="text-xs text-muted-foreground">Acesso do restaurante</div>
          </div>
        </div>

        <Card className="border-border">
          <CardContent className="p-5">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={onSignIn} className="space-y-3 mt-4">
                  <Field label="E-mail">
                    <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field label="Senha">
                    <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </Field>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Entrando…" : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={onSignUp} className="space-y-3 mt-4">
                  <Field label="Nome">
                    <Input required value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="E-mail">
                    <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field label="Senha">
                    <Input type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </Field>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Criando…" : "Criar conta"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    O primeiro usuário cadastrado vira <b>Administrador</b>.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}