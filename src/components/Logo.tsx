import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  tamanho?: "sm" | "md" | "lg";
  branca?: boolean;
};

const tamanhos = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };
const pontos = { sm: "size-1.5", md: "size-2", lg: "size-3" };

/** Logo provisória do Método (Método•). Trocar por imagem depois. */
export function Logo({ className, tamanho = "md", branca }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-end gap-1 font-semibold tracking-[-0.04em]",
        branca ? "text-primary-foreground" : "text-foreground",
        tamanhos[tamanho],
        className,
      )}
    >
      <span className="leading-none">Método</span>
      <span className={cn("mb-[0.15em] rounded-full", branca ? "bg-accent" : "bg-primary", pontos[tamanho])} aria-hidden="true" />
    </span>
  );
}
