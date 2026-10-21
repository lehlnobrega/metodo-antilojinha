// Seletor de emoji simples (lista curta + campo para colar qualquer emoji).
import { type ReactNode, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EMOJIS = [
  "📄", "📘", "📗", "📕", "📒", "📝", "✏️", "📌", "📎", "🗂️", "📁", "📊",
  "💡", "⭐", "🔥", "✨", "🎯", "🚀", "💰", "💸", "🛍️", "🛒", "🏷️", "📦",
  "📱", "💻", "🖥️", "🎥", "🎬", "📸", "🎤", "📣", "💬", "❤️", "💖", "🌸",
  "✅", "⚠️", "❗", "❓", "🔑", "🔒", "🧠", "🧩", "🛠️", "⚙️", "📈", "🏆",
];

export function SeletorEmoji({
  valor,
  onChange,
  children,
}: {
  valor: string | null | undefined;
  onChange: (e: string) => void;
  children?: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        {children ?? (
          <button type="button" className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted text-2xl hover:border-primary" aria-label="Escolher emoji">
            {valor || "📄"}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="grid grid-cols-8 gap-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                onChange(e);
                setAberto(false);
              }}
              className="flex size-8 items-center justify-center rounded-md text-lg hover:bg-muted"
            >
              {e}
            </button>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (texto.trim()) {
              onChange(texto.trim());
              setTexto("");
              setAberto(false);
            }
          }}
        >
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ou cole um emoji" className="h-9 flex-1 rounded-lg border border-border bg-muted px-3 text-sm outline-none focus:border-primary" />
          <button className="rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">Usar</button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
