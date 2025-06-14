
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Comment {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export default function ForumPostPage() {
  const { id } = useParams();
  const [post, setPost] = useState<any | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("forum_posts").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => setPost(data));
    supabase.from("forum_comments").select("*").eq("post_id", id).order("created_at", { ascending: true })
      .then(({ data }) => setComments(data ?? []));
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return setUserId(null);
      setUserId(user.id);
      supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle()
        .then((r) => setIsAdmin(!!r.data));
    });
  }, [id, adding]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !userId || !id) return;
    setAdding(true);
    await supabase.from("forum_comments").insert({
      post_id: id,
      author_id: userId,
      content,
    });
    setContent("");
    setAdding(false);
  };

  const handleDeletePost = async () => {
    if (!isAdmin || !id) return;
    await supabase.from("forum_posts").delete().eq("id", id);
    window.location.href = "/forum";
  };

  if (!post) return <div className="p-4">Carregando...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-8 px-2">
      <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
      <div className="mb-2">{post.content}</div>
      <div className="mb-2"><Badge>{post.category}</Badge></div>
      {isAdmin && (
        <Button variant="destructive" className="mb-3" onClick={handleDeletePost}>
          Excluir post
        </Button>
      )}
      <h3 className="font-bold mt-6 mb-2">Comentários</h3>
      <div className="flex flex-col gap-2 mb-4">
        {comments.length === 0 && (
          <div className="text-muted-foreground">Nenhum comentário ainda.</div>
        )}
        {comments.map((c) => (
          <div key={c.id} className="border rounded px-2 py-1">
            <div className="text-xs text-muted-foreground">
              Por: {c.author_id} em {c.created_at.slice(0, 19).replace("T", " ")}
            </div>
            <div>{c.content}</div>
          </div>
        ))}
      </div>
      {userId && (
        <form onSubmit={handleComment} className="mb-4">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={adding}
            placeholder="Escreva seu comentário"
          />
          <Button type="submit" disabled={adding || !content.trim()} className="mt-2">
            Comentar
          </Button>
        </form>
      )}
      <div>
        <Link to="/forum">
          <Button variant="outline">Voltar para fórum</Button>
        </Link>
      </div>
    </div>
  );
}
