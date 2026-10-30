import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Flame } from "lucide-react";
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
  const initialTab: "signin" | "signup" =
    typeof window !== "undefined" && window.location.search.includes("signup") ? "signup" : "signin";
  const [tab, setTab] = useState<"signin" | "signup">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    if (!loading && session && tab !== "signup") navigate({ to: "/" });
  }, [loading, session, navigate, tab]);

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
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name.trim() },
      },
    });
    setBusy(false);
    if (error) return toast.error(`Não foi possível criar a conta: ${error.message}`);

    if (data.session) {
      toast.success("Conta criada e acesso liberado!");
      navigate({ to: "/" });
      return;
    }

    setTab("signin");
    setPassword("");
    toast.success(
      "Cadastro realizado! Confirme seu e-mail pelo link enviado para liberar o primeiro acesso. Seu perfil de Garçom já foi criado.",
      { duration: 8000 },
    );
  };

  const onForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error("Informe o e-mail");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Enviamos um link de redefinição para seu e-mail.");
    setForgotOpen(false);
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
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        aria-pressed={showPassword}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Entrando…" : "Entrar"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
                    className="block w-full text-center text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    Esqueci minha senha
                  </button>
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
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        aria-pressed={showPassword}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
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

        {forgotOpen && (
          <Card className="border-border mt-4">
            <CardContent className="p-5">
              <form onSubmit={onForgot} className="space-y-3">
                <div className="font-medium text-sm">Redefinir senha</div>
                <p className="text-xs text-muted-foreground">
                  Enviaremos um link para você criar uma nova senha.
                </p>
                <Field label="E-mail">
                  <Input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                </Field>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={busy}>
                    {busy ? "Enviando…" : "Enviar link"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
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