// Editor de páginas estilo Notion: usado nos materiais de apoio e nos bônus de páginas.
import { closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { JSONContent } from "@tiptap/react";
import { ExternalLink, MoreHorizontal, Plus } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { EditorNotion } from "@/components/editor/EditorNotion";
import { SeletorEmoji } from "@/components/editor/emoji";
import { AppLayout } from "@/components/layout/AppLayout";
import { EstadoVazio } from "@/components/PaginaTopo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAluna } from "@/lib/aluna";
import { type FontePaginas, type PaginaMaterial, reordenar, useMutacaoPaginas, usePaginasMaterial } from "@/lib/materiais";
import { cn } from "@/lib/utils";

const DOC_VAZIO: JSONContent = { type: "doc", content: [] };

type Rascunho = { titulo: string; emoji: string; conteudo: JSONContent | null };

export function EditorPaginas({
  fonte,
  id,
  pai,
  carregandoPai,
  voltar,
  linkAluna,
}: {
  fonte: FontePaginas;
  id: number;
  /** O material ou o bônus dono das páginas */
  pai: { titulo: string; emoji?: string | null } | undefined;
  carregandoPai: boolean;
  voltar: ReactNode;
  /** Link "Ver como aluna" da página aberta (null esconde o botão) */
  linkAluna: (paginaId: number) => string | null;
}) {
  const { aluna } = useAluna();
  const paginasQ = usePaginasMaterial(id, fonte);
  const { criar, alterar, excluir, invalidar } = useMutacaoPaginas(id, fonte);

  const [lista, setLista] = useState<PaginaMaterial[]>([]);
  const [atualId, setAtualId] = useState<number | null>(null);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [estado, setEstado] = useState<"" | "salvando" | "salvo">("");
  const pendente = useRef<{ id: number; dados: Rascunho } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tituloRef = useRef<HTMLInputElement>(null);
  const [focarTitulo, setFocarTitulo] = useState(false);

  useEffect(() => {
    if (paginasQ.data) setLista(paginasQ.data);
  }, [paginasQ.data]);
  useEffect(() => {
    if (atualId == null && lista.length) setAtualId(lista[0]!.id);
  }, [lista, atualId]);

  const salvarAgora = useCallback(async () => {
    clearTimeout(timer.current);
    const p = pendente.current;
    if (!p) return;
    pendente.current = null;
    setEstado("salvando");
    try {
      await alterar.mutateAsync({ id: p.id, titulo: p.dados.titulo.trim() || "Sem título", emoji: p.dados.emoji || "📄", conteudo: p.dados.conteudo ?? DOC_VAZIO });
      setLista((l) => l.map((x) => (x.id === p.id ? { ...x, ...p.dados } : x)));
      setEstado("salvo");
    } catch (e) {
      setEstado("");
      toast.error((e as Error).message);
    }
  }, [alterar]);

  useEffect(() => () => void salvarAgora(), [salvarAgora]);

  const atual = lista.find((p) => p.id === atualId);
  useEffect(() => {
    if (atual && (!rascunho || pendente.current?.id !== atual.id)) {
      setRascunho({ titulo: atual.titulo, emoji: atual.emoji ?? "📄", conteudo: atual.conteudo });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atual?.id]);

  const mudar = (parcial: Partial<Rascunho>) => {
    if (!atual || !rascunho) return;
    const novo = { ...rascunho, ...parcial };
    setRascunho(novo);
    pendente.current = { id: atual.id, dados: novo };
    setEstado("salvando");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void salvarAgora(), 1000);
  };

  const trocarPagina = async (pid: number) => {
    await salvarAgora();
    setRascunho(null);
    setAtualId(pid);
  };

  const proximaOrdem = () => Math.max(0, ...lista.map((p) => p.ordem ?? 0)) + 1;

  useEffect(() => {
    if (focarTitulo && rascunho && tituloRef.current) {
      tituloRef.current.focus();
      tituloRef.current.select();
      setFocarTitulo(false);
    }
  }, [focarTitulo, rascunho]);

  const novaPagina = async () => {
    await salvarAgora();
    criar.mutate(
      { titulo: "Nova página", emoji: "📄", ordem: proximaOrdem(), publicado: true, conteudo: DOC_VAZIO },
      { onSuccess: (p) => { setLista((l) => [...l, p]); setRascunho(null); setAtualId(p.id); setFocarTitulo(true); }, onError: (e) => toast.error(e.message) },
    );
  };

  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const aoSoltar = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const nova = arrayMove(lista, lista.findIndex((p) => p.id === e.active.id), lista.findIndex((p) => p.id === e.over!.id));
    setLista(nova);
    try { await reordenar(fonte.tabela, nova.map((p) => p.id)); invalidar(); } catch (err) { toast.error((err as Error).message); }
  };

  const acoes = {
    renomear: (p: PaginaMaterial) => {
      const t = window.prompt("Novo nome da página", p.titulo);
      if (!t?.trim()) return;
      if (p.id === atualId) return mudar({ titulo: t.trim() });
      alterar.mutate({ id: p.id, titulo: t.trim() }, { onSuccess: () => setLista((l) => l.map((x) => (x.id === p.id ? { ...x, titulo: t.trim() } : x))) });
    },
    emoji: (p: PaginaMaterial, e: string) => {
      if (p.id === atualId) return mudar({ emoji: e });
      alterar.mutate({ id: p.id, emoji: e }, { onSuccess: () => setLista((l) => l.map((x) => (x.id === p.id ? { ...x, emoji: e } : x))) });
    },
    duplicar: async (p: PaginaMaterial) => {
      await salvarAgora();
      const base = p.id === atualId && rascunho ? { ...p, ...rascunho } : p;
      criar.mutate(
        { titulo: `${base.titulo} (cópia)`, emoji: base.emoji || "📄", conteudo: base.conteudo ?? DOC_VAZIO, ordem: proximaOrdem(), publicado: false },
        { onSuccess: (n) => { setLista((l) => [...l, n]); toast.success("Página duplicada"); }, onError: (e) => toast.error(e.message) },
      );
    },
    publicar: (p: PaginaMaterial) => {
      const v = p.publicado === false;
      alterar.mutate({ id: p.id, publicado: v }, {
        onSuccess: () => { setLista((l) => l.map((x) => (x.id === p.id ? { ...x, publicado: v } : x))); invalidar(); toast.success(v ? "Página publicada" : "Página despublicada"); },
        onError: (e) => toast.error(e.message),
      });
    },
    excluir: (p: PaginaMaterial) => {
      if (!confirm(`Excluir a página "${p.titulo}"?`)) return;
      if (pendente.current?.id === p.id) pendente.current = null;
      excluir.mutate(p.id, {
        onSuccess: () => { setLista((l) => l.filter((x) => x.id !== p.id)); if (atualId === p.id) { setAtualId(null); setRascunho(null); } },
        onError: (e) => toast.error(e.message),
      });
    },
  };

  if (aluna && !aluna.is_admin) return <AppLayout><EstadoVazio titulo="Área restrita" texto="Essa página é só para a equipe do Método." /></AppLayout>;
  if (carregandoPai || paginasQ.isLoading) return <AppLayout><p className="text-sm text-muted-foreground">Carregando...</p></AppLayout>;
  if (!pai) return <AppLayout><EstadoVazio titulo="Não encontrado" /></AppLayout>;
  const link = atual ? linkAluna(atual.id) : null;

  return (
    <AppLayout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {voltar}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground" aria-live="polite">{estado === "salvando" ? "Salvando..." : estado === "salvo" ? "Salvo ✓" : ""}</span>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              onClick={() => void salvarAgora()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Ver como aluna <ExternalLink className="size-4" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-border bg-white lg:flex">
        <aside className="w-full shrink-0 border-b border-border bg-muted p-3 lg:w-[260px] lg:border-b-0 lg:border-r">
          <p className="flex items-center gap-2 px-2 py-2 text-sm font-semibold text-foreground"><span className="text-lg">{pai.emoji || "📄"}</span>{pai.titulo}</p>
          <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={aoSoltar}>
            <SortableContext items={lista.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-0.5">
                {lista.map((p) => (
                  <ItemPagina
                    key={p.id}
                    p={p.id === atualId && rascunho ? { ...p, ...rascunho } : p}
                    ativo={p.id === atualId}
                    onAbrir={() => void trocarPagina(p.id)}
                    acoes={acoes}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <button onClick={novaPagina} className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"><Plus className="size-4" /> Nova página</button>
        </aside>

        <div className="min-w-0 flex-1 px-5 py-6 sm:px-12 sm:py-10">
          {atual && rascunho ? (
            <div className="mx-auto max-w-[720px]">
              {atual.publicado === false ? <p className="mb-3 inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium">Rascunho, as alunas não veem</p> : null}
              <SeletorEmoji valor={rascunho.emoji} onChange={(e) => mudar({ emoji: e })}>
                <button type="button" className="rounded-lg text-[48px] leading-none hover:bg-muted" aria-label="Trocar emoji">{rascunho.emoji}</button>
              </SeletorEmoji>
              <input
                ref={tituloRef}
                value={rascunho.titulo}
                onChange={(e) => mudar({ titulo: e.target.value })}
                placeholder="Sem título"
                className="mt-3 w-full bg-transparent text-[38px] font-bold leading-tight text-foreground outline-none placeholder:text-[#D3D1CB]"
              />
              <div className="mt-6">
                <EditorNotion key={atual.id} conteudo={rascunho.conteudo} editavel onChange={(c) => mudar({ conteudo: c })} />
              </div>
            </div>
          ) : (
            <EstadoVazio titulo="Nenhuma página ainda" texto="Crie a primeira página." acao={<button onClick={novaPagina} className="text-sm font-medium text-primary hover:underline">+ Nova página</button>} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

type Acoes = {
  renomear: (p: PaginaMaterial) => void;
  emoji: (p: PaginaMaterial, e: string) => void;
  duplicar: (p: PaginaMaterial) => void;
  publicar: (p: PaginaMaterial) => void;
  excluir: (p: PaginaMaterial) => void;
};

function ItemPagina({ p, ativo, onAbrir, acoes }: { p: PaginaMaterial; ativo: boolean; onAbrir: () => void; acoes: Acoes }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group flex items-center gap-1 rounded-md pr-1 text-sm text-foreground", ativo ? "bg-accent-soft" : "hover:bg-muted", isDragging && "relative z-10 shadow")}
    >
      <button {...attributes} {...listeners} onClick={onAbrir} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1.5 text-left">
        <span>{p.emoji || "📄"}</span>
        <span className={cn("truncate", p.publicado === false && "text-muted-foreground")}>{p.titulo || "Sem título"}</span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button aria-label="Opções da página" className="rounded p-1 text-muted-foreground opacity-100 hover:bg-black/5 lg:opacity-0 lg:group-hover:opacity-100"><MoreHorizontal className="size-4" /></button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => acoes.renomear(p)}>Renomear</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => { const e = window.prompt("Cole ou digite o novo emoji", p.emoji ?? ""); if (e?.trim()) acoes.emoji(p, e.trim()); }}>Trocar emoji</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => acoes.duplicar(p)}>Duplicar</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => acoes.publicar(p)}>{p.publicado === false ? "Publicar" : "Despublicar"}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => acoes.excluir(p)} className="text-destructive">Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
