import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { lookupCep } from "@/lib/viacep";
import { onlyDigits } from "@/lib/format";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/funcionarios")({
  head: () => ({ meta: [{ title: "Funcionários — Brasa POS" }] }),
  component: EmployeesPage,
});

type Role = "gerente" | "atendente" | "balconista" | "cozinheiro" | "ajudante_cozinha" | "auxiliar" | "garcom";
const ROLE_LABEL: Record<Role, string> = {
  gerente: "Gerente",
  atendente: "Atendente",
  balconista: "Balconista",
  cozinheiro: "Cozinheiro",
  ajudante_cozinha: "Ajudante de cozinha",
  auxiliar: "Auxiliar",
  garcom: "Garçom",
};
const DAYS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"] as const;
const DAY_LABEL: Record<string, string> = { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom" };

type Employee = {
  id: string;
  full_name: string;
  phone: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
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

const empty: Omit<Employee, "id"> = {
  full_name: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  role: "garcom",
  salary: 0,
  work_days: [],
  day_off: null,
  hired_at: new Date().toISOString().slice(0, 10),
  notes: "",
  active: true,
};

function EmployeesPage() {
  const { hasRole, loading } = useAuth();
  const [rows, setRows] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<Omit<Employee, "id">>(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("employees").select("*").order("full_name");
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Employee[]);
  };

  useEffect(() => {
    if (!loading && hasRole("admin")) void load();
  }, [loading, hasRole]);

  if (loading) return null;
  if (!hasRole("admin")) {
    return (
      <AppShell>
        <PageHeader title="Funcionários" />
        <div className="px-8"><p className="text-sm text-muted-foreground">Acesso restrito a administradores.</p></div>
      </AppShell>
    );
  }

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({ ...e, phone: e.phone ?? "", cep: e.cep ?? "", street: e.street ?? "", number: e.number ?? "", complement: e.complement ?? "", neighborhood: e.neighborhood ?? "", city: e.city ?? "", state: e.state ?? "", notes: e.notes ?? "" });
    setOpen(true);
  };

  const onCep = async (v: string) => {
    const digits = onlyDigits(v);
    setForm((f) => ({ ...f, cep: digits }));
    if (digits.length === 8) {
      const r = await lookupCep(digits);
      if (r) setForm((f) => ({ ...f, street: r.logradouro, neighborhood: r.bairro, city: r.localidade, state: r.uf }));
    }
  };

  const save = async () => {
    if (!form.full_name.trim()) return toast.error("Informe o nome");
    setSaving(true);
    const payload = { ...form, phone: form.phone ? onlyDigits(form.phone) : null, salary: Number(form.salary) || 0 };
    const { error } = editing
      ? await supabase.from("employees").update(payload).eq("id", editing.id)
      : await supabase.from("employees").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Funcionário atualizado" : "Funcionário cadastrado");
    setOpen(false);
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover funcionário?")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  };

  const toggleDay = (d: string) =>
    setForm((f) => ({ ...f, work_days: f.work_days.includes(d) ? f.work_days.filter((x) => x !== d) : [...f.work_days, d] }));

  return (
    <AppShell>
      <PageHeader
        title="Funcionários"
        description="Cadastro de equipe, função, salário e escala"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Novo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Editar funcionário" : "Novo funcionário"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Nome</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div>
                  <Label>Função</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Salário (R$)</Label><Input type="number" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} /></div>
                <div><Label>Data de contratação</Label><Input type="date" value={form.hired_at} onChange={(e) => setForm({ ...form, hired_at: e.target.value })} /></div>
                <div><Label>CEP</Label><Input value={form.cep ?? ""} onChange={(e) => void onCep(e.target.value)} /></div>
                <div className="col-span-2"><Label>Rua</Label><Input value={form.street ?? ""} onChange={(e) => setForm({ ...form, street: e.target.value })} /></div>
                <div><Label>Número</Label><Input value={form.number ?? ""} onChange={(e) => setForm({ ...form, number: e.target.value })} /></div>
                <div><Label>Complemento</Label><Input value={form.complement ?? ""} onChange={(e) => setForm({ ...form, complement: e.target.value })} /></div>
                <div><Label>Bairro</Label><Input value={form.neighborhood ?? ""} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></div>
                <div><Label>Cidade</Label><Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div><Label>UF</Label><Input value={form.state ?? ""} maxLength={2} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} /></div>
                <div className="col-span-2">
                  <Label>Dias de trabalho</Label>
                  <div className="flex gap-3 flex-wrap mt-1">
                    {DAYS.map((d) => (
                      <label key={d} className="flex items-center gap-1.5 text-sm">
                        <Checkbox checked={form.work_days.includes(d)} onCheckedChange={() => toggleDay(d)} />
                        {DAY_LABEL[d]}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Dia de folga</Label>
                  <Select value={form.day_off ?? "none"} onValueChange={(v) => setForm({ ...form, day_off: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {DAYS.map((d) => <SelectItem key={d} value={d}>{DAY_LABEL[d]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2"><Checkbox id="active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: !!v })} /><Label htmlFor="active">Ativo</Label></div>
                <div className="col-span-2"><Label>Observações</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="px-8 pb-8 space-y-3">
        {rows.map((e) => (
          <Card key={e.id} className="border-border">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{e.full_name}</span>
                  <Badge>{ROLE_LABEL[e.role]}</Badge>
                  {!e.active && <Badge variant="outline">Inativo</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {e.phone ? `📞 ${e.phone} · ` : ""}Contratado em {new Date(e.hired_at).toLocaleDateString("pt-BR")} · R$ {Number(e.salary).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Dias: {e.work_days.length ? e.work_days.map((d) => DAY_LABEL[d]).join(", ") : "—"}
                  {e.day_off ? ` · Folga: ${DAY_LABEL[e.day_off]}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="outline" onClick={() => remove(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Nenhum funcionário cadastrado.</p>}
      </div>
    </AppShell>
  );
}