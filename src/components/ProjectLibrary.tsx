
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProjectLibrary() {
  const [projects, setProjects] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  // Agora busca TODOS os projetos, não apenas os do usuário
  useEffect(() => {
    supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProjects(data ?? []);
      });
  }, []);

  if (projects.length === 0) {
    return <div className="p-4">Ainda não há projetos cadastrados.</div>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
      {projects.map((project) => (
        <Link to={`/projects/${project.id}/study`} key={project.id}>
          <Card className="cursor-pointer hover:shadow-lg transition">
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div>{project.description}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(project.tags || []).map((tag: string) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
