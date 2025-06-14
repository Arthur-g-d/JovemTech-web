
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Content {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
}
interface Props {
  projectId: string;
  isAdmin?: boolean;
}
const TYPES = [
  { value: "text", label: "Texto" },
  { value: "link", label: "Link" },
  { value: "video", label: "Vídeo" },
  { value: "atividade", label: "Atividade" }
];
const ProjectContentManager = ({ projectId, isAdmin = false }: Props) => {
  const [contents, setContents] = useState<Content[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("text");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const [forceIsAdmin, setForceIsAdmin] = useState<boolean>(false);
  useEffect(() => {
    if (!isAdmin) {
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return;
        const { data } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        setForceIsAdmin(!!data);
      });
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!projectId) return;
    (supabase as any)
      .from("project_contents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .then(({ data }: { data: any[] }) => setContents(data ?? []));
  }, [projectId]);

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    await (supabase as any)
      .from("project_contents")
      .insert({
        project_id: projectId,
        title,
        description,
        content_type: type,
        content_url: url,
        author_id: user?.id,
      });
    setTitle(""); setDescription(""); setType("text"); setUrl("");
    (supabase as any)
      .from("project_contents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .then(({ data }: { data: any[] }) => setContents(data ?? []));
    setLoading(false);
  };

  const handleDelete = async (contentId: string) => {
    setLoading(true);
    await (supabase as any).from("project_contents").delete().eq("id", contentId);
    (supabase as any)
      .from("project_contents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .then(({ data }: { data: any[] }) => setContents(data ?? []));
    setLoading(false);
  };

  if (!isAdmin && !forceIsAdmin) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Jornada de Progressão</h3>
      <form onSubmit={handleAddContent} className="space-y-2 mb-4">
        <Input
          placeholder="Título da etapa"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={loading}
        />
        <Textarea
          placeholder="Descrição (opcional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={loading}
        />
        <div className="flex gap-2">
          <label className="text-sm font-medium">Tipo:</label>
          <select value={type} onChange={e => setType(e.target.value)} disabled={loading}
            className="p-2 border rounded bg-background">
            {TYPES.map((typ) => (
              <option key={typ.value} value={typ.value}>{typ.label}</option>
            ))}
          </select>
        </div>
        {(type === "link" || type === "video") && (
          <Input
            placeholder={type === "video" ? "URL do vídeo (ex: Youtube)" : "URL do conteúdo"}
            value={url}
            onChange={e => setUrl(e.target.value)}
            disabled={loading}
          />
        )}
        <Button type="submit" disabled={loading}>{loading ? "Adicionando..." : "Adicionar etapa"}</Button>
      </form>
      <div className="flex flex-col gap-2">
        {contents.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2 border rounded px-3 py-2">
            <Badge>{i + 1}</Badge>
            <span className="font-bold">{c.title}</span>
            <span className="text-xs text-muted-foreground">({c.content_type})</span>
            {c.description && <span className="text-xs ml-2">{c.description}</span>}
            {(c.content_type === "link" || c.content_type === "video") && c.content_url && (
              <a href={c.content_url} target="_blank" rel="noopener noreferrer" className="ml-2 underline text-primary text-xs">
                Acessar material
              </a>
            )}
            <Button
              size="icon"
              variant="outline"
              className="ml-auto"
              onClick={() => handleDelete(c.id)}
              title="Excluir"
              disabled={loading}
            >
              ×
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ProjectContentManager;
