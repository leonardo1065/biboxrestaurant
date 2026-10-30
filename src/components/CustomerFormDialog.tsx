import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { formatCep, formatPhone, onlyDigits } from "@/lib/format";
import { lookupCep } from "@/lib/viacep";
import type { Customer } from "@/lib/types";
import { toast } from "sonner";
import { MapPin, Search } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialPhone?: string;
  existing?: Customer;
  onSaved?: (c: Customer) => void;
}

export function CustomerFormDialog({ open, onOpenChange, initialPhone, existing, onSaved }: Props) {
  const addCustomer = useStore((s) => s.addCustomer);
  const updateCustomer = useStore((s) => s.updateCustomer);
  const customers = useStore((s) => s.customers);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [reference, setReference] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const cepRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setName(existing.name);
      setPhone(existing.phone);
      setCep(existing.cep ?? "");
      setStreet(existing.street ?? "");
      setNumber(existing.number ?? "");
      setComplement(existing.complement ?? "");
      setNeighborhood(existing.neighborhood ?? "");
      setCity(existing.city ?? "");
      setState(existing.state ?? "");
      setReference(existing.reference ?? "");
    } else {
      setName(""); setPhone(initialPhone ? onlyDigits(initialPhone) : "");
      setCep(""); setStreet(""); setNumber(""); setComplement("");
      setNeighborhood(""); setCity(""); setState(""); setReference("");
    }
  }, [open, existing, initialPhone]);

  const searchCep = async (value = cep) => {
    const clean = onlyDigits(value);
    if (clean.length !== 8) {
      toast.error("Informe um CEP com 8 dígitos");
      return;
    }
    setLoadingCep(true);
    const res = await lookupCep(clean);
    setLoadingCep(false);
    if (!res) {
      toast.error("CEP não encontrado");
      return;
    }
    setStreet(res.logradouro || "");
    setNeighborhood(res.bairro || "");
    setCity(res.localidade || "");
    setState(res.uf || "");
  };

  const openAddressInMaps = () => {
    const address = [street, number, neighborhood, city, state, formatCep(cep)]
      .filter(Boolean)
      .join(", ");
    if (!address) {
      toast.error("Informe ao menos o CEP ou o endereço");
      return;
    }
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const save = () => {
    const cleanPhone = onlyDigits(phone);
    const cleanCep = onlyDigits(cep);
    if (!name.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast.error("Telefone inválido. Use DDD + número (10 ou 11 dígitos)");
      return;
    }
    if (cleanCep && cleanCep.length !== 8) {
      toast.error("CEP inválido. Deve conter 8 dígitos");
      return;
    }
    const existsOther = customers.find((c) => c.phone === cleanPhone && c.id !== existing?.id);
    if (existsOther) {
      toast.error("Já existe um cliente com esse telefone");
      return;
    }
    const payload = {
      name: name.trim(),
      phone: cleanPhone,
      cep: cleanCep || undefined,
      street: street || undefined,
      number: number || undefined,
      complement: complement || undefined,
      neighborhood: neighborhood || undefined,
      city: city || undefined,
      state: state || undefined,
      reference: reference || undefined,
    };
    if (existing) {
      updateCustomer(existing.id, payload);
      toast.success("Cliente atualizado");
      onSaved?.({ ...existing, ...payload });
    } else {
      const c = addCustomer(payload);
      toast.success("Cliente cadastrado");
      onSaved?.(c);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-2xl max-h-[90dvh] overflow-y-auto overscroll-contain p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{existing ? "Editar cliente" : "Cadastrar cliente"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
          <div className="sm:col-span-4">
            <Label>Nome *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); phoneRef.current?.focus(); } }}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Telefone *</Label>
            <Input
              ref={phoneRef}
              value={formatPhone(phone)}
              onChange={(e) => setPhone(onlyDigits(e.target.value))}
              placeholder="(11) 99999-9999"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); cepRef.current?.focus(); } }}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>CEP {loadingCep && <span className="text-xs text-muted-foreground">(buscando…)</span>}</Label>
            <div className="flex gap-2">
              <Input
                ref={cepRef}
                value={formatCep(cep)}
                onChange={(e) => {
                  const value = onlyDigits(e.target.value).slice(0, 8);
                  setCep(value);
                  if (value.length === 8) void searchCep(value);
                }}
                placeholder="00000-000"
                inputMode="numeric"
                className="min-w-0"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Buscar endereço pelo CEP"
                title="Buscar endereço pelo CEP"
                disabled={loadingCep || onlyDigits(cep).length !== 8}
                onClick={() => void searchCep()}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Abrir endereço no mapa"
                title="Abrir endereço no mapa"
                onClick={openAddressInMaps}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="sm:col-span-3">
            <Label>Rua</Label>
            <Input value={street} onChange={(e) => setStreet(e.target.value)} />
          </div>
          <div className="sm:col-span-1">
            <Label>Número</Label>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <Label>Complemento</Label>
            <Input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, bloco…" />
          </div>
          <div className="sm:col-span-3">
            <Label>Bairro</Label>
            <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
          </div>
          <div className="sm:col-span-4">
            <Label>Cidade</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>UF</Label>
            <Input value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} />
          </div>
          <div className="sm:col-span-6">
            <Label>Ponto de referência</Label>
            <Textarea value={reference} onChange={(e) => setReference(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}