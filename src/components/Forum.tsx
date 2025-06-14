
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Forum() {
  const [posts, setPosts] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    supabase
      .from("forum_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setPosts(data ?? []));
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, [posting]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !userId) return;
    setPosting(true);
    await supabase.from("forum_posts").insert({
      title,
      content,
      category,
      author_id: userId,
    });
    setTitle("");
    setContent("");
    setCategory("");
    setPosting(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-4 text-primary">Fórum</h2>
      {userId && (
        <form
          onSubmit={handlePost}
          className="mb-8 rounded-lg shadow-lg border border-border/70 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md space-y-3 md:p-6 p-4 animate-fade-in"
        >
          <input
            type="text"
            className="border border-border bg-background dark:bg-zinc-900 dark:text-white/90 rounded-md px-3 py-2 w-full text-base focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
            placeholder="Título do post"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={posting}
            required
            autoComplete="off"
          />
          <input
            type="text"
            className="border border-border bg-background dark:bg-zinc-900 dark:text-white/90 rounded-md px-3 py-2 w-full text-base focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
            placeholder="Categoria"
            value={category}
            onChange={e => setCategory(e.target.value)}
            disabled={posting}
            required
            autoComplete="off"
          />
          <Textarea
            className="w-full border border-border bg-background dark:bg-zinc-900 dark:text-white/90 rounded-md text-base focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={posting}
            placeholder="Escreva o conteúdo do post..."
            required
            autoComplete="off"
          />
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={posting || !title || !content}
              className="px-6 shadow-lg"
            >
              {posting ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.length === 0 && (
          <div className="col-span-full text-muted-foreground text-center font-medium py-8">
            Nenhum post encontrado.
          </div>
        )}
        {posts.map((post: any) => (
          <Link to={`/forum/${post.id}`} key={post.id} tabIndex={0} className="focus:outline-none focus:ring-2 focus:ring-primary rounded-lg">
            <Card className="cursor-pointer transition hover:shadow-2xl border border-border/80 bg-white/90 dark:bg-zinc-900/90 animate-fade-in hover:scale-105">
              <CardHeader className="flex gap-2 pb-2">
                <CardTitle className="truncate text-lg md:text-xl text-primary">
                  {post.title}
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-1">
                  {post.category && (
                    <Badge className="capitalize bg-accent/70 dark:bg-accent/70 text-accent-foreground">{post.category}</Badge>
                  )}
                  {post.solved && (
                    <Badge variant="outline" className="text-green-700 border-green-700 bg-green-100/60 dark:bg-green-900/30 dark:text-green-300">
                      Resolvido
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-2 tracking-wide">
                  {post.created_at?.slice(0, 16).replace("T", " ")}
                </div>
                <div className="text-zinc-700 dark:text-zinc-200">
                  {post.content?.slice(0, 120)}
                  {post.content?.length > 120 ? "..." : ""}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
