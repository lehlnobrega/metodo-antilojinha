// Editor estilo Notion (TipTap). O mesmo componente edita (admin) e exibe (aluna).
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Youtube from "@tiptap/extension-youtube";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, type Editor, type JSONContent, useEditor, wrappingInputRule } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold, Code, Heading1, Heading2, Heading3, Highlighter, Image as ImageIcon, Italic, Link2, List, ListChecks, ListOrdered,
  Minus, Quote, SquareChevronRight, Strikethrough, Table as TableIcon, Type, Underline as UnderlineIcon, Youtube as YoutubeIcon,
  Lightbulb, Baseline,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { BlocoCodigo, Callout, Toggle } from "./blocos";

export const CORES_GRIFO = [
  { rotulo: "Cinza", cor: "#F1F1EF" },
  { rotulo: "Marrom", cor: "#F4EEEE" },
  { rotulo: "Laranja", cor: "#FBECDD" },
  { rotulo: "Amarelo", cor: "#FBF3DB" },
  { rotulo: "Verde", cor: "#EDF3EC" },
  { rotulo: "Azul", cor: "#E7F3F8" },
  { rotulo: "Roxo", cor: "#F6F3F9" },
  { rotulo: "Rosa", cor: "#FAF1F5" },
  { rotulo: "Vermelho", cor: "#FDEBEC" },
];
export const CORES_TEXTO = [
  { rotulo: "Padrão", cor: "" },
  { rotulo: "Cinza", cor: "#787774" },
  { rotulo: "Marrom", cor: "#9F6B53" },
  { rotulo: "Laranja", cor: "#D9730D" },
  { rotulo: "Amarelo", cor: "#CB912F" },
  { rotulo: "Verde", cor: "#448361" },
  { rotulo: "Azul", cor: "#337EA9" },
  { rotulo: "Roxo", cor: "#9065B0" },
  { rotulo: "Rosa", cor: "#C14C8A" },
  { rotulo: "Vermelho", cor: "#D44C47" },
];

const ItemTarefa = TaskItem.extend({
  addInputRules() {
    return [...(this.parent?.() ?? []), wrappingInputRule({ find: /^\s*\[\]\s$/, type: this.type })];
  },
});

function extensoes(editavel: boolean) {
  return [
    StarterKit.configure({ codeBlock: false, link: { openOnClick: !editavel, autolink: true } }),
    Highlight.configure({ multicolor: true }),
    TextStyle,
    Color,
    Image,
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    ItemTarefa.configure({ nested: true }),
    Placeholder.configure({ placeholder: "Digite / para ver os blocos" }),
    BlocoCodigo,
    Youtube.configure({ nocookie: true }),
    Callout,
    Toggle,
  ];
}

type Bloco = { rotulo: string; busca: string; icone: typeof Type; executar: (e: Editor) => void };

const BLOCOS: Bloco[] = [
  { rotulo: "Texto", busca: "texto paragrafo", icone: Type, executar: (e) => e.chain().focus().setParagraph().run() },
  { rotulo: "Título 1", busca: "titulo 1 h1", icone: Heading1, executar: (e) => e.chain().focus().setHeading({ level: 1 }).run() },
  { rotulo: "Título 2", busca: "titulo 2 h2", icone: Heading2, executar: (e) => e.chain().focus().setHeading({ level: 2 }).run() },
  { rotulo: "Título 3", busca: "titulo 3 h3", icone: Heading3, executar: (e) => e.chain().focus().setHeading({ level: 3 }).run() },
  { rotulo: "Lista com marcadores", busca: "lista marcadores", icone: List, executar: (e) => e.chain().focus().toggleBulletList().run() },
  { rotulo: "Lista numerada", busca: "lista numerada", icone: ListOrdered, executar: (e) => e.chain().focus().toggleOrderedList().run() },
  { rotulo: "Lista de tarefas", busca: "lista tarefas checklist", icone: ListChecks, executar: (e) => e.chain().focus().toggleTaskList().run() },
  { rotulo: "Citação", busca: "citacao", icone: Quote, executar: (e) => e.chain().focus().toggleBlockquote().run() },
  { rotulo: "Callout", busca: "callout destaque", icone: Lightbulb, executar: (e) => e.chain().focus().insertContent({ type: "callout", content: [{ type: "paragraph" }] }).run() },
  { rotulo: "Toggle", busca: "toggle abrir fechar", icone: SquareChevronRight, executar: (e) => e.chain().focus().insertContent({ type: "toggle", attrs: { titulo: "" }, content: [{ type: "paragraph" }] }).run() },
  { rotulo: "Código", busca: "codigo code", icone: Code, executar: (e) => e.chain().focus().toggleCodeBlock().run() },
  { rotulo: "Tabela", busca: "tabela", icone: TableIcon, executar: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { rotulo: "Divisor", busca: "divisor linha", icone: Minus, executar: (e) => e.chain().focus().setHorizontalRule().run() },
  {
    rotulo: "Imagem", busca: "imagem foto", icone: ImageIcon,
    executar: (e) => { const src = window.prompt("Endereço (URL) da imagem"); if (src) e.chain().focus().setImage({ src }).run(); },
  },
  {
    rotulo: "Vídeo do YouTube", busca: "video youtube", icone: YoutubeIcon,
    executar: (e) => { const src = window.prompt("Link do vídeo do YouTube"); if (src) e.chain().focus().setYoutubeVideo({ src }).run(); },
  },
];

const semAcento = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

type EstadoBarra = { de: number; consulta: string; x: number; y: number } | null;

export function EditorNotion({
  conteudo,
  editavel = false,
  onChange,
}: {
  conteudo: JSONContent | null | undefined;
  editavel?: boolean;
  onChange?: (c: JSONContent) => void;
}) {
  const [barra, setBarra] = useState<EstadoBarra>(null);
  const [indice, setIndice] = useState(0);
  const caixa = useRef<HTMLDivElement>(null);
  const teclas = useRef<(ev: KeyboardEvent) => boolean>(() => false);

  const editor = useEditor({
    extensions: extensoes(editavel),
    content: conteudo ?? "",
    editable: editavel,
    immediatelyRender: false,
    editorProps: { handleKeyDown: (_v, ev) => teclas.current(ev) },
    onUpdate: ({ editor: e }) => onChange?.(e.getJSON()),
  });

  // Detecta "/" para abrir o menu de blocos.
  useEffect(() => {
    if (!editor || !editavel) return;
    const verificar = () => {
      const { selection } = editor.state;
      const { $from, empty } = selection;
      if (!empty || $from.parent.type.name === "codeBlock") return setBarra(null);
      const antes = $from.parent.textBetween(0, $from.parentOffset, undefined, "\ufffc");
      const m = antes.match(/(?:^|\s)\/([^\s/]{0,20})$/);
      if (!m) return setBarra(null);
      const c = editor.view.coordsAtPos($from.pos);
      const base = caixa.current?.getBoundingClientRect();
      setBarra({ de: $from.pos - m[1]!.length - 1, consulta: m[1]!, x: c.left - (base?.left ?? 0), y: c.bottom - (base?.top ?? 0) + 6 });
    };
    editor.on("update", verificar);
    editor.on("selectionUpdate", verificar);
    return () => {
      editor.off("update", verificar);
      editor.off("selectionUpdate", verificar);
    };
  }, [editor, editavel]);

  const filtrados = useMemo(
    () => (barra ? BLOCOS.filter((b) => semAcento(`${b.rotulo} ${b.busca}`).includes(semAcento(barra.consulta))) : []),
    [barra],
  );
  useEffect(() => setIndice(0), [barra?.consulta]);

  const escolher = (b: Bloco) => {
    if (!editor || !barra) return;
    editor.chain().focus().deleteRange({ from: barra.de, to: editor.state.selection.from }).run();
    setBarra(null);
    b.executar(editor);
  };

  teclas.current = (ev) => {
    if (!barra || filtrados.length === 0) return false;
    if (ev.key === "ArrowDown") { setIndice((i) => (i + 1) % filtrados.length); return true; }
    if (ev.key === "ArrowUp") { setIndice((i) => (i - 1 + filtrados.length) % filtrados.length); return true; }
    if (ev.key === "Enter") { escolher(filtrados[indice]!); return true; }
    if (ev.key === "Escape") { setBarra(null); return true; }
    return false;
  };

  return (
    <div ref={caixa} className={cn("notion relative", editavel && "notion-editando")}>
      {editor && editavel ? (
        <>
          <DragHandle editor={editor}>
            <div className="notion-alca" title="Arrastar para mover">⋮⋮</div>
          </DragHandle>
          <MenuFlutuante editor={editor} />
        </>
      ) : null}
      <EditorContent editor={editor} />
      {barra && filtrados.length > 0 ? (
        <div className="notion-barra" style={{ left: barra.x, top: barra.y }} role="listbox">
          <p className="px-3 pb-1 pt-2 text-[11px] font-medium text-muted-foreground">Blocos básicos</p>
          {filtrados.map((b, i) => (
            <button
              key={b.rotulo}
              type="button"
              role="option"
              aria-selected={i === indice}
              onMouseDown={(ev) => { ev.preventDefault(); escolher(b); }}
              onMouseEnter={() => setIndice(i)}
              className={cn("flex w-full items-center gap-3 px-3 py-1.5 text-left text-sm", i === indice && "bg-muted")}
            >
              <span className="flex size-8 items-center justify-center rounded-md border border-border bg-white"><b.icone className="size-4" /></span>
              {b.rotulo}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MenuFlutuante({ editor }: { editor: Editor }) {
  const [painel, setPainel] = useState<"cor" | "grifo" | null>(null);
  const botao = (ativo: boolean, acao: () => void, rotulo: string, Icone: typeof Bold) => (
    <button type="button" title={rotulo} aria-label={rotulo} onMouseDown={(e) => e.preventDefault()} onClick={acao} className={cn("rounded p-1.5 hover:bg-muted", ativo && "text-[#2383E2]")}>
      <Icone className="size-4" />
    </button>
  );
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e, state }) => !state.selection.empty && e.isEditable && !e.isActive("codeBlock")}
      className="notion-bolha"
    >
      <div className="flex items-center gap-0.5">
        {botao(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "Negrito", Bold)}
        {botao(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "Itálico", Italic)}
        {botao(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), "Sublinhado", UnderlineIcon)}
        {botao(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), "Riscado", Strikethrough)}
        {botao(editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), "Código inline", Code)}
        {botao(editor.isActive("link"), () => {
          const atual = editor.getAttributes("link")["href"] as string | undefined;
          const url = window.prompt("Endereço do link (deixe vazio para tirar)", atual ?? "https://");
          if (url === null) return;
          if (!url) editor.chain().focus().unsetLink().run();
          else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }, "Link", Link2)}
        {botao(painel === "cor", () => setPainel(painel === "cor" ? null : "cor"), "Cor do texto", Baseline)}
        {botao(painel === "grifo", () => setPainel(painel === "grifo" ? null : "grifo"), "Grifar", Highlighter)}
      </div>
      {painel ? (
        <div className="mt-1 grid grid-cols-5 gap-1 border-t border-border pt-1.5">
          {(painel === "cor" ? CORES_TEXTO : [{ rotulo: "Sem grifo", cor: "" }, ...CORES_GRIFO]).map((c) => (
            <button
              key={c.rotulo}
              type="button"
              title={c.rotulo}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const ch = editor.chain().focus();
                if (painel === "cor") (c.cor ? ch.setColor(c.cor) : ch.unsetColor()).run();
                else (c.cor ? ch.setHighlight({ color: c.cor }) : ch.unsetHighlight()).run();
                setPainel(null);
              }}
              className="flex size-7 items-center justify-center rounded border border-border text-xs font-semibold"
              style={painel === "cor" ? { color: c.cor || "#37352F" } : { background: c.cor || "#fff" }}
            >
              A
            </button>
          ))}
        </div>
      ) : null}
    </BubbleMenu>
  );
}
