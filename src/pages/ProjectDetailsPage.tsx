import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProjectContentManager from "@/components/ProjectContentManager";
import ProjectMembersManager from "@/components/ProjectMembersManager";
import ProjectProgress from "@/components/ProjectProgress";
import { Button } from "@/components/ui/button";

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("projects").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => setProject(data));
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return setIsAdmin(false);
      supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle()
        .then((r) => setIsAdmin(!!r.data));
    });
  }, [id]);

  if (!project) return <div className="p-4">Carregando...</div>;

  return (
    <div className="max-w-3xl mx-auto mt-8 px-2">
      <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
      <div className="mb-2">{project.description}</div>
      <div className="mb-4">
        <Link to={`/projects/${project.id}/study`}>
          <Button variant="default">Jornada de Estudos</Button>
        </Link>
      </div>
      {isAdmin ? (
        <>
          <ProjectContentManager projectId={project.id} isAdmin />
          <ProjectMembersManager projectId={project.id} />
        </>
      ) : null}
      <div className="mt-6">
        <ProjectProgress projectId={project.id} />
      </div>
      <div className="mt-2">
        <Link to="/projects">
          <Button variant="outline">Voltar para projetos</Button>
        </Link>
      </div>
    </div>
  );
}
