// Blocos próprios do editor: Callout, Toggle e bloco de código com copiar.
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Node, NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import { Check, ChevronRight, Copy } from "lucide-react";
import { useState } from "react";

import { SeletorEmoji } from "./emoji";

export const CORES_CALLOUT = [
  { valor: "cinza", rotulo: "Cinza", cor: "#F1F1EF" },
  { valor: "amarelo", rotulo: "Amarelo", cor: "#FBF3DB" },
  { valor: "rosa", rotulo: "Rosa", cor: "#FAF1F5" },
  { valor: "azul", rotulo: "Azul", cor: "#E7F3F8" },
  { valor: "verde", rotulo: "Verde", cor: "#EDF3EC" },
];

function CalloutView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const cor = CORES_CALLOUT.find((c) => c.valor === node.attrs["cor"])?.cor ?? "#F1F1EF";
  const emoji = String(node.attrs["emoji"] ?? "💡");
  return (
    <NodeViewWrapper className="notion-callout" style={{ background: cor }}>
      <div contentEditable={false} className="notion-callout-emoji">
        {editor.isEditable ? (
          <SeletorEmoji valor={emoji} onChange={(e) => updateAttributes({ emoji: e })}>
            <button type="button" className="rounded hover:bg-black/5">{emoji}</button>
          </SeletorEmoji>
        ) : (
          <span>{emoji}</span>
        )}
        {editor.isEditable ? (
          <div className="notion-callout-cores">
            {CORES_CALLOUT.map((c) => (
              <button key={c.valor} type="button" title={c.rotulo} aria-label={`Fundo ${c.rotulo}`} onClick={() => updateAttributes({ cor: c.valor })} style={{ background: c.cor }} />
            ))}
          </div>
        ) : null}
      </div>
      <NodeViewContent className="notion-callout-texto" />
    </NodeViewWrapper>
  );
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      emoji: { default: "💡", parseHTML: (el) => el.getAttribute("data-emoji") || "💡" },
      cor: { default: "cinza", parseHTML: (el) => el.getAttribute("data-cor") || "cinza" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },
  renderHTML({ node }) {
    return ["div", { "data-callout": "", "data-emoji": node.attrs["emoji"], "data-cor": node.attrs["cor"] }, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});

function ToggleView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const [aberto, setAberto] = useState(editor.isEditable);
  return (
    <NodeViewWrapper className="notion-toggle">
      <div contentEditable={false} className="notion-toggle-topo">
        <button type="button" onClick={() => setAberto((v) => !v)} aria-label={aberto ? "Fechar" : "Abrir"} className="notion-toggle-seta" data-aberto={aberto}>
          <ChevronRight className="size-4" />
        </button>
        {editor.isEditable ? (
          <input value={String(node.attrs["titulo"] ?? "")} onChange={(e) => updateAttributes({ titulo: e.target.value })} placeholder="Título do toggle" className="notion-toggle-input" />
        ) : (
          <button type="button" onClick={() => setAberto((v) => !v)} className="notion-toggle-titulo">{String(node.attrs["titulo"] ?? "")}</button>
        )}
      </div>
      <NodeViewContent className="notion-toggle-conteudo" style={{ display: aberto ? undefined : "none" }} />
    </NodeViewWrapper>
  );
}

export const Toggle = Node.create({
  name: "toggle",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return { titulo: { default: "", parseHTML: (el) => el.getAttribute("data-titulo") || "" } };
  },
  parseHTML() {
    return [{ tag: "div[data-toggle]" }];
  },
  renderHTML({ node }) {
    return ["div", { "data-toggle": "", "data-titulo": node.attrs["titulo"] }, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ToggleView);
  },
});

export const LINGUAGENS = [
  { valor: "html", rotulo: "HTML" },
  { valor: "css", rotulo: "CSS" },
  { valor: "javascript", rotulo: "JavaScript" },
  { valor: "plaintext", rotulo: "Texto" },
];

const lowlight = createLowlight({
  xml: common["xml"]!,
  css: common["css"]!,
  javascript: common["javascript"]!,
  plaintext: common["plaintext"]!,
});

function CodigoView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const [copiado, setCopiado] = useState(false);
  const lingua = String(node.attrs["language"] ?? "plaintext");
  const rotulo = LINGUAGENS.find((l) => l.valor === lingua)?.rotulo ?? lingua;
  const copiar = async () => {
    await navigator.clipboard.writeText(node.textContent);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };
  return (
    <NodeViewWrapper className="notion-code">
      <div contentEditable={false} className="notion-code-topo">
        {editor.isEditable ? (
          <select value={lingua} onChange={(e) => updateAttributes({ language: e.target.value })} className="notion-code-lingua">
            {LINGUAGENS.map((l) => (
              <option key={l.valor} value={l.valor}>{l.rotulo}</option>
            ))}
          </select>
        ) : (
          <span className="notion-code-lingua">{rotulo}</span>
        )}
        <button type="button" onClick={copiar} className="notion-code-copiar">
          {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copiado ? "Copiado! ✓" : "Copiar"}
        </button>
      </div>
      <pre>
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}

export const BlocoCodigo = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodigoView);
  },
}).configure({ lowlight, defaultLanguage: "plaintext" });
