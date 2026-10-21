// Chips do calendário: status, tipo de conteúdo, formato e ícones de plataforma.
import { Check, Images, Instagram, Music2, Video } from "lucide-react";

import { statusInfo } from "@/lib/calendario";
import { tipoAcervo } from "@/lib/acervo";
import { cn } from "@/lib/utils";

export function ChipStatus({ valor, pequeno }: { valor: string | null | undefined; pequeno?: boolean }) {
  const s = statusInfo(valor);
  return (
    <span
      className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium", pequeno ? "px-1.5 py-px text-[10px]" : "px-2.5 py-0.5 text-xs")}
      style={{ background: s.fundo, color: s.texto }}
    >
      {s.valor === "publicado" ? <Check className={pequeno ? "size-2.5" : "size-3"} strokeWidth={3} /> : null}
      {s.rotulo}
    </span>
  );
}

export function ChipTipo({ valor, pequeno }: { valor: string | null | undefined; pequeno?: boolean }) {
  const t = valor ? tipoAcervo(valor) : undefined;
  if (!t) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium", t.chip, pequeno ? "px-1.5 py-px text-[10px]" : "px-2.5 py-0.5 text-xs")}>
      {t.emoji} {pequeno ? null : t.rotulo}
    </span>
  );
}

export function ChipFormato({ valor, pequeno }: { valor: string | null | undefined; pequeno?: boolean }) {
  if (!valor) return null;
  const video = valor === "video";
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-muted font-medium", pequeno ? "px-1.5 py-px text-[10px]" : "px-2.5 py-0.5 text-xs")}>
      {video ? <Video className="size-3" /> : <Images className="size-3" />}
      {video ? "Vídeo" : "Carrossel"}
    </span>
  );
}

export function IconesPlataforma({ valor, className }: { valor: string | null | undefined; className?: string }) {
  const v = valor?.toLowerCase();
  return (
    <span className={cn("inline-flex items-center gap-1 text-muted-foreground", className)}>
      {v === "instagram" || v === "ambos" ? <Instagram className="size-3.5" aria-label="Instagram" /> : null}
      {v === "tiktok" || v === "ambos" ? <Music2 className="size-3.5" aria-label="TikTok" /> : null}
    </span>
  );
}
