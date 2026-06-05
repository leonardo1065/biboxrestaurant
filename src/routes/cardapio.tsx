import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import { brl } from "@/lib/format";
import { categoryLabels } from "@/lib/seed";
import type { MenuCategory, MenuItem } from "@/lib/types";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cardapio")({
  head: () => ({ meta: [{ title: "Cardápio — Brasa POS" }] }),
  component: CardapioPage,
});

function CardapioPage() {
  const menu = useStore((s) => s.menu);
  const toggle = useStore((s) => s.toggleMenuAvailable);
  const remove = useStore((s) => s.deleteMenuItem);
  const upsert = useStore((s) => s.upsertMenuItem);

  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [open, setOpen] = useState(false);

  const onPickImage = (file: File) => {
    if (!editing) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEditing({ ...editing, image: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const cats = Object.keys(categoryLabels) as MenuCategory[];

  return (
    <AppShell>
      <PageHeader
        title="Cardápio"
        description="Pratos, bebidas e disponibilidade."
        actions={
          <Button onClick={() => { setEditing({
            id: crypto.randomUUID(), name: "", price: 0, category: "executivos", available: true,
          }); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" />Novo item
          </Button>
        }
      />
      <div className="px-8 pb-8 space-y-8">
        {cats.map((cat) => {
          const items = menu.filter((m) => m.category === cat);
          if (!items.length) return null;
          return (
            <section key={cat}>
              <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">{categoryLabels[cat]}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((m) => (
                  <Card key={m.id} className="border-border overflow-hidden">
                    {m.image && (
                      <div className="aspect-[4/3] bg-muted">
                        <img src={m.image} alt={m.name} loading="lazy" width={1024} height={768} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium leading-tight">{m.name}</div>
                          {m.description && <div className="text-xs text-muted-foreground mt-0.5">{m.description}</div>}
                        </div>
                        <div className="font-semibold text-primary">{brl(m.price)}</div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={m.available} onCheckedChange={() => toggle(m.id)} />
                          {m.available ? "Disponível" : "Esgotado"}
                        </label>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setEditing(m); setOpen(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir item?")) remove(m.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing && menu.some((m) => m.id === editing.id) ? "Editar item" : "Novo item"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div><Label>Nome</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Input value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid gap-2">
                <Label>Foto do item</Label>
                {editing.image && (
                  <div className="relative w-full aspect-[4/3] bg-muted rounded-md overflow-hidden">
                    <img src={editing.image} alt="Pré-visualização" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => setEditing({ ...editing, image: undefined })}
                    >
                      Remover
                    </Button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPickImage(f);
                    e.target.value = "";
                  }}
                />
                <Input
                  placeholder="ou cole uma URL de imagem"
                  value={editing.image && !editing.image.startsWith("data:") ? editing.image : ""}
                  onChange={(e) => setEditing({ ...editing, image: e.target.value || undefined })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Preço</Label>
                  <Input inputMode="decimal" value={String(editing.price)} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value.replace(",", ".")) || 0 })} />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v as MenuCategory })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {cats.map((c) => <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (!editing) return;
              if (!editing.name.trim()) { toast.error("Informe o nome"); return; }
              upsert(editing);
              toast.success("Item salvo");
              setOpen(false);
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}