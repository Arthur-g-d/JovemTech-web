
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type Project = {
  id: string;
  title: string;
  description: string;
};

type Content = {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url?: string;
};

type Progression = {
  id: string;
  project_id: string;
  user_id: string;
  content_id: string;
  progress_num: number;
};

export default function ProjectStudySingle({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [progresses, setProgresses] = useState<Progression[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle()
      .then(({ data }) => setProject(data));
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !userId) {
      setContents([]);
      setProgresses([]);
      return;
    }
    (async () => {
      const { data: conts, error: contsError } = await supabase
        .from("project_contents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (!contsError && Array.isArray(conts)) {
        setContents(
          (conts as Content[]).filter(
            c =>
              c.content_type === "Humanizado" ||
              c.content_type === "Acadêmico"
          )
        );
      } else {
        setContents([]);
      }

      const { data: progs, error: progsError } = await supabase
        .from("project_progressions")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId);
      if (!progsError && Array.isArray(progs)) {
        setProgresses(progs as Progression[]);
      } else {
        setProgresses([]);
      }
    })();
  }, [projectId, userId]);

  const handleComplete = async (contentId: string) => {
    if (!userId || !projectId) return;
    setLoadingId(contentId);
    await supabase
      .from("project_progressions")
      .upsert(
        [
          {
            project_id: projectId,
            user_id: userId,
            content_id: contentId,
            progress_num: 100,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "project_id,user_id,content_id" }
      );
    const { data: progs, error: progsError } = await supabase
      .from("project_progressions")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId);
    if (!progsError && Array.isArray(progs)) {
      setProgresses(progs as Progression[]);
    } else {
      setProgresses([]);
    }
    setLoadingId(null);
  };

  const percent =
    contents.length === 0
      ? 0
      : Math.round(
          (progresses.filter((pr) => pr.progress_num >= 100).length / contents.length) *
            100
        );

  if (!project)
    return <div className="p-4">Carregando...</div>;

  return (
    <section>
      <Card className="mb-6 shadow-lg animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 flex-wrap">
            Jornada de Estudos:
            <span className="text-primary">{project.title}</span>
            <span className="ml-3 text-base font-normal text-gray-400">
              {percent}% concluído
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-gray-700">{project.description}</div>
          <Progress value={percent} className="mb-4 h-4" />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        {contents.length === 0 && (
          <div className="text-muted-foreground text-center py-8">
            Nenhuma etapa desta jornada ainda.
          </div>
        )}
        {contents.map((step, idx) => {
          const prog = progresses.find((pr) => pr.content_id === step.id);
          const isDone = prog?.progress_num >= 100;
          return (
            <Card
              key={step.id}
              className={`transition-all animate-fade-in shadow-md border-2 ${
                isDone
                  ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                  : "border-primary/10 bg-background"
              }`}
            >
              <CardHeader className="flex-row items-center gap-4 py-3 px-4 bg-muted/30 rounded-t-lg">
                <Badge variant="secondary" className="mr-2">{idx + 1}</Badge>
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-lg">{step.title}</span>
                  <div className="flex flex-row gap-2 items-center mt-1">
                    <span className="text-xs bg-accent/50 px-2 rounded text-primary capitalize">
                      {step.content_type}
                    </span>
                    {step.content_type === "link" && step.content_url && (
                      <a
                        href={step.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 underline text-primary hover:brightness-105 text-xs"
                        tabIndex={0}
                      >
                        Acesse o material
                      </a>
                    )}
                    {step.content_type === "video" && step.content_url && (
                      <a
                        href={step.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 underline text-blue-600 hover:brightness-105 text-xs"
                        tabIndex={0}
                      >
                        Assistir vídeo
                      </a>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 px-4 pb-4">
                {step.description && (
                  <span className="text-sm text-muted-foreground mb-2">
                    {step.description}
                  </span>
                )}
                <div className="flex items-center gap-3 justify-end">
                  {isDone ? (
                    <span className="text-green-700 text-xs font-semibold">
                      Concluído ✔
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!!loadingId}
                      onClick={() => handleComplete(step.id)}
                      className="transition-all shadow hover:scale-105"
                    >
                      {loadingId === step.id ? "Salvando..." : "Marcar como feito"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
