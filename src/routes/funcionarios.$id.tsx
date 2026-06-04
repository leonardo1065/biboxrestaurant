import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, MapPin, Phone, CreditCard, CalendarDays, Briefcase, Banknote } from "lucide-react";

export const Route = createFileRoute("/funcionarios/$id")({
  head: () => ({ meta: [{ title: "Detalhes do Funcionário — Brasa POS" }] }),
  component: EmployeeDetailPage,
});

type Role = "gerente" | "atendente" | "balconista" | "cozinheiro" | "ajudante_cozinha" | "auxiliar" | "garcom" | "copeiro" | "faxineiro";
const ROLE_LABEL: Record<Role, string> = {
  gerente: "Gerente",
  atendente: "Atendente",
  balconista: "Balconista",
  cozinheiro: "Cozinheiro",
  ajudante_cozinha: "Ajudante de cozinha",
  copeiro: "Copeiro",
  garcom: "Garçom",
  faxineiro: "Faxineiro",
  auxiliar: "Auxiliar",
};
const DAY_LABEL: Record<string, string> = { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom" };

type Employee = {
  id: string;
  full_name: string;
  phone: string | null;
  rg: string | null;
  cpf: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  apto: string | null;
  bloco: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  role: Role;
  salary: number;
  work_days: string[];
  day_off: string | null;
  hired_at: string;
  notes: string | null;
  active: boolean;
};

function EmployeeDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { hasRole, loading } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [fetching, setFetching] = useState(true);

  const load = async () => {
    setFetching(true);
    const { data, error } = await supabase.from("employees").select("*").eq("id", id).single();
    setFetching(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEmployee(data as Employee);
  };

  useEffect(() => {
    if (!loading && hasRole("admin")) void load();
  }, [loading, hasRole, id]);

  const remove = async () => {
    if (!confirm("Remover funcionário?")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Funcionário removido");
    navigate({ to: "/funcionarios" });
  };

  if (loading) return null;
  if (!hasRole("admin")) {
    return (
      <AppShell>
        <PageHeader title="Funcionários" />
        <div className="px-8"><p className="text-sm text-muted-foreground">Acesso restrito a administradores.</p></div>
      </AppShell>
    );
  }

  if (fetching) {
    return (
      <AppShell>
        <PageHeader title="Funcionário" />
        <div className="px-8"><p className="text-sm text-muted-foreground">Carregando…</p></div>
      </AppShell>
    );
  }

  if (!employee) {
    return (
      <AppShell>
        <PageHeader title="Funcionário" />
        <div className="px-8">
          <p className="text-sm text-muted-foreground">Funcionário não encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/funcionarios" })}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
        </div>
      </AppShell>
    );
  }

  const e = employee;

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value ?? "—"}</span>
    </div>
  );

  return (
    <AppShell>
      <PageHeader
        title={e.full_name}
        description="Detalhes completos do funcionário"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/funcionarios" })}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: "/funcionarios" })}>
              <Pencil className="w-4 h-4 mr-1" /> Editar
            </Button>
            <Button variant="destructive" onClick={remove}>
              <Trash2 className="w-4 h-4 mr-1" /> Excluir
            </Button>
          </div>
        }
      />
      <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Informações pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="w-4 h-4 text-primary" />
              Dados pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Nome" value={e.full_name} />
            <InfoRow label="Telefone" value={e.phone} />
            <InfoRow label="RG" value={e.rg} />
            <InfoRow label="CPF" value={e.cpf} />
            <InfoRow label="Status" value={e.active ? <Badge>Ativo</Badge> : <Badge variant="outline">Inativo</Badge>} />
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4 text-primary" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="CEP" value={e.cep} />
            <InfoRow label="Rua" value={e.street} />
            <InfoRow label="Número" value={e.number} />
            <InfoRow label="Apto" value={e.apto} />
            <InfoRow label="Bloco" value={e.bloco} />
            <InfoRow label="Complemento" value={e.complement} />
            <InfoRow label="Bairro" value={e.neighborhood} />
            <InfoRow label="Cidade" value={`${e.city ?? ""}${e.city && e.state ? ` - ${e.state}` : e.state ?? ""}`} />
          </CardContent>
        </Card>

        {/* Trabalho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="w-4 h-4 text-primary" />
              Dados de trabalho
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Função" value={<Badge>{ROLE_LABEL[e.role]}</Badge>} />
            <InfoRow label="Salário" value={`R$ ${Number(e.salary).toFixed(2)}`} />
            <InfoRow
              label="Dias de trabalho"
              value={e.work_days.length ? e.work_days.map((d) => DAY_LABEL[d]).join(", ") : "—"}
            />
            <InfoRow label="Folga" value={e.day_off ? DAY_LABEL[e.day_off] : "—"} />
            <InfoRow label="Data de admissão" value={new Date(e.hired_at).toLocaleDateString("pt-BR")} />
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="w-4 h-4 text-primary" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{e.notes ?? "Nenhuma observação."}</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
