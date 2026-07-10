import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (decoded: string) => void;
  title?: string;
}

export function QRScanner({ open, onOpenChange, onScan, title = "Escanear QR do item" }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader-container";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const start = async () => {
      try {
        const scanner = new Html5Qrcode(containerId, { verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            if (cancelled) return;
            onScan(decoded);
          },
          () => {},
        );
      } catch (err) {
        console.error("QR scanner failed", err);
      }
    };
    start();
    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop().then(() => s.clear()).catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open, onScan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div id={containerId} className="w-full rounded-md overflow-hidden bg-black" />
        <p className="text-xs text-muted-foreground">
          Aponte a câmera para o QR do item do cardápio. Ao ler, o item é adicionado automaticamente.
        </p>
      </DialogContent>
    </Dialog>
  );
}