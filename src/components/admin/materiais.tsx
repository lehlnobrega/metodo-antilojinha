// Aba "Materiais de apoio" do painel admin: materiais por módulo, com reordenar e publicar.
import { closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "@tanstack/react-router";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SeletorEmoji } from "@/components/editor/emoji";
import { BotaoPrimario, BotaoSecundario, CardOverlay, CardsOpcao, inputCls, Interruptor, Rotulo, textareaCls } from "@/components/metodo/overlay";
import { useModulos } from "@/lib/dados";
import {
  type MaterialApoio, reordenar, TIPOS_MATERIAL, type TipoMaterial, useContagemPaginas, useExcluirMaterial, useMateriaisApoio, useSalvarMaterial,
} from "@/lib/materiais";
import { cn } from "@/lib/utils";

const TIPOS_NOVO: { valor: TipoMaterial; titulo: string; texto: string; emoji: string }[] = [
  { valor: "paginas", titulo: "Páginas estilo Notion", texto: "Várias páginas com texto, códigos e callouts", emoji: "📄" },
  { valor: "link", titulo: "Link", texto: "Abre um site em outra aba", emoji: "🔗" },
  { valor: "pdf", titulo: "PDF", texto: "Link para um arquivo PDF", emoji: "📕" },
  { valor: "video", titulo: "Vídeo", texto: "Link de um vídeo", emoji: "🎥" },
];

export function AbaMateriais() {
  const modulos = useModulos();
  const [moduloId, setModuloId] = useState<number | null>(null);
  const materiais = useMateriaisApoio();
  const contagem = useContagemPaginas();
  const salvar = useSalvarMaterial();
  const excluir = useExcluirMaterial();
  const [editando, setEditando] = useState<MaterialApoio | "novo" | null>(null);
  const [ordem, setOrdem] = useState<MaterialApoio[]>([]);

  useEffect(() => {
    if (moduloId == null && modulos.data?.length) setModuloId(modulos.data[0]!.id);
  }, [modulos.data, moduloId]);

  const doModulo = useMemo(() => (materiais.data ?? []).filter((m) => m.modulo_id === moduloId), [materiais.data, moduloId]);
  useEffect(() => setOrdem(doModulo), [doModulo]);

  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const aoSoltar = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const de = ordem.findIndex((m) => m.id === e.active.id);
    const para = ordem.findIndex((m) => m.id === e.over!.id);
    const nova = arrayMove(ordem, de, para);
    setOrdem(nova);
    try {
      await reordenar("materiais", nova.map((m) => m.id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {(modulos.data ?? []).map((m) => (
          <button key={m.id} onClick={() => setModuloId(m.id)} className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium", moduloId === m.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary hover:text-primary")}>
            {m.ordem}. {m.titulo}
          </button>
        ))}
      </div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{ordem.length} {ordem.length === 1 ? "material" : "materiais"} neste módulo. Arraste para mudar a ordem.</p>
        <BotaoPrimario onClick={() => setEditando("novo")} disabled={moduloId == null} className="inline-flex items-center gap-2"><Plus className="size-4" /> Novo material</BotaoPrimario>
      </div>
      <div className="card-metodo divide-y divide-border">
        {materiais.isLoading ? <p className="p-4 text-sm text-muted-foreground">Carregando...</p> : null}
        <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={aoSoltar}>
          <SortableContext items={ordem.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            {ordem.map((m) => (
              <LinhaMaterial
                key={m.id}
                m={m}
                paginas={contagem.data?.get(m.id)}
                onPublicar={(v) => salvar.mutate({ id: m.id, publicado: v }, { onError: (e) => toast.error(e.message) })}
                onEditar={() => setEditando(m)}
                onExcluir={() => {
                  if (confirm(`Excluir o material "${m.titulo}"? As páginas dele também somem.`)) excluir.mutate(m.id, { onError: (e) => toast.error(e.message), onSuccess: () => toast.success("Material excluído") });
                }}
              />
            ))}
          </SortableContext>
        </DndContext>
        {!materiais.isLoading && ordem.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Nenhum material neste módulo ainda.</p> : null}
      </div>
      {editando ? (
        <CardMaterial
          material={editando === "novo" ? null : editando}
          moduloId={moduloId!}
          proximaOrdem={ordem.length + 1}
          onFechar={() => setEditando(null)}
        />
      ) : null}
    </div>
  );
}

function LinhaMaterial({ m, paginas, onPublicar, onEditar, onExcluir }: { m: MaterialApoio; paginas: number | undefined; onPublicar: (v: boolean) => void; onEditar: () => void; onExcluir: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: m.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("flex items-center gap-3 bg-surface p-3 sm:p-4", isDragging && "relative z-10 shadow-lg")}>
      <button {...attributes} {...listeners} aria-label="Arrastar" className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted"><GripVertical className="size-4" /></button>
      <span className="text-2xl">{m.emoji || "📄"}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{m.titulo}</p>
        <p className="text-xs text-muted-foreground">
          {TIPOS_MATERIAL[m.tipo ?? "link"]}
          {m.tipo === "paginas" ? ` · ${paginas ?? 0} ${paginas === 1 ? "página" : "páginas"}` : ""}
        </p>
      </div>
      <span className="hidden text-xs text-muted-foreground sm:inline">Publicado</span>
      <Interruptor ligado={m.publicado !== false} rotulo="Publicado" onChange={onPublicar} />
      {m.tipo === "paginas" ? (
        <Link to="/admin/materiais/$materialId" params={{ materialId: String(m.id) }} className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-muted">Editar</Link>
      ) : (
        <button onClick={onEditar} className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-muted">Editar</button>
      )}
      {m.tipo === "paginas" ? <button onClick={onEditar} aria-label="Dados do material" className="rounded-lg p-2 text-muted-foreground hover:text-primary"><Pencil className="size-4" /></button> : null}
      <button onClick={onExcluir} aria-label="Excluir" className="rounded-lg p-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
    </div>
  );
}

function CardMaterial({ material, moduloId, proximaOrdem, onFechar }: { material: MaterialApoio | null; moduloId: number; proximaOrdem: number; onFechar: () => void }) {
  const salvar = useSalvarMaterial();
  const [tipo, setTipo] = useState<TipoMaterial>(material?.tipo ?? "paginas");
  const [emoji, setEmoji] = useState(material?.emoji ?? "📄");
  const [titulo, setTitulo] = useState(material?.titulo ?? "");
  const [descricao, setDescricao] = useState(material?.descricao ?? "");
  const [url, setUrl] = useState(material?.url ?? "");
  const precisaUrl = tipo !== "paginas";
  const valido = titulo.trim() && (!precisaUrl || url.trim());
  const sujo = !material && Boolean(titulo || descricao || url);

  const enviar = () => {
    salvar.mutate(
      {
        ...(material ? { id: material.id } : { modulo_id: moduloId, ordem: proximaOrdem, publicado: false }),
        tipo,
        emoji,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        url: precisaUrl ? url.trim() : null,
      },
      {
        onSuccess: () => { toast.success(material ? "Material salvo" : "Material criado"); onFechar(); },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <CardOverlay
      aberto
      onFechar={onFechar}
      sujo={sujo}
      titulo={material ? "Editar material" : "Novo material"}
      rodape={<><BotaoSecundario onClick={onFechar}>Cancelar</BotaoSecundario><BotaoPrimario onClick={enviar} disabled={!valido || salvar.isPending}>{salvar.isPending ? "Salvando..." : "Salvar"}</BotaoPrimario></>}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <span className="text-[13px] font-medium">Tipo<span className="text-primary"> *</span></span>
          <CardsOpcao opcoes={TIPOS_NOVO} valor={tipo} onChange={setTipo} />
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <span className="block text-[13px] font-medium">Emoji</span>
            <SeletorEmoji valor={emoji} onChange={setEmoji} />
          </div>
          <Rotulo texto="Título" obrigatorio className="flex-1">
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputCls} placeholder="Ex.: Scripts de venda" />
          </Rotulo>
        </div>
        <Rotulo texto="Descrição">
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className={textareaCls} />
        </Rotulo>
        {precisaUrl ? (
          <Rotulo texto="URL" obrigatorio>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className={inputCls} placeholder="https://" />
          </Rotulo>
        ) : null}
      </div>
    </CardOverlay>
  );
}
