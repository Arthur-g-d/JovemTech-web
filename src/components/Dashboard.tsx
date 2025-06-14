import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Book, Users, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Calcula a progressão real considerando todos os projetos nos quais o usuário está matriculado.
const Dashboard = () => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<{ username: string } | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [events, setEvents] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Buscar perfil assim que houver usuário logado
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();
        if (!error && data) setProfile({ username: data.username });
        else setProfile(null);
      }
    };
    fetchProfile();
  }, [user]);
  
  // Buscar projetos nos quais o usuário é membro
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      // Busca projetos nos quais o usuário está matriculado (como membro)
      // FIX: Use .from<any, any>() for tables not in generated types
      const { data: memberRows } = await supabase
        .from<any, any>("project_members")
        .select("project_id")
        .eq("user_id", user.id);

      const projectIds = memberRows?.map((row: any) => row.project_id) ?? [];

      if (projectIds.length === 0) {
        setProjects([]);
        setProgressPercent(0);
        return;
      }

      const { data: projectList } = await supabase
        .from("projects")
        .select("*")
        .in("id", projectIds);

      setProjects(projectList ?? []);

      // Busca e calcula progressão dos projetos
      const projectProgressArr = await Promise.all(
        projectIds.map(async (pId: string) => {
          // Conteúdos
          const { data: contents } = await supabase
            .from<any, any>("project_contents")
            .select("id")
            .eq("project_id", pId);

          // Progressões do user no projeto
          const { data: progresses } = await supabase
            .from<any, any>("project_progressions")
            .select("*")
            .eq("project_id", pId)
            .eq("user_id", user.id);

          if (!contents || !contents.length) return 1; // Considera 100% se sem etapas

          const percent =
            progresses && progresses.length
              ? Math.round(
                  (progresses.filter((pr: any) => pr.progress_num >= 100).length / contents.length) * 100
                )
              : 0;
          return percent;
        })
      );

      // Progresso médio geral
      if (projectProgressArr.length > 0) {
        setProgressPercent(Math.round(projectProgressArr.reduce((a, b) => a + b, 0) / projectProgressArr.length));
      } else {
        setProgressPercent(0);
      }
    })();
  }, [user]);

  // Buscar eventos onde usuário está inscrito
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      // FIX: Use .from<any, any>() for event_registrations if needed
      const { data: registrations } = await supabase
        .from<any, any>("event_registrations")
        .select("event_id")
        .eq("user_id", user.id);
      const eventIds = registrations?.map((row: any) => row.event_id) ?? [];
      if (!eventIds.length) {
        setEvents([]);
        return;
      }

      const { data: eventList } = await supabase
        .from("events")
        .select("*")
        .in("id", eventIds)
        .order("event_date", { ascending: true });

      setEvents(eventList || []);
    })();
  }, [user]);

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {user && (
          <div className="flex items-center space-x-2 mb-6">
            <User className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">
              Olá, {profile?.username || "usuário"}
            </span>
          </div>
        )}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard do Estudante</h2>
          <p className="text-muted-foreground">
            Acompanhe seu progresso na jornada tech
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Bem-vindo à plataforma!</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Explore cursos, projetos e participe do fórum e dos eventos para avançar na sua carreira.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            {/* Stats Cards reais */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{progressPercent}%</div>
                  <div className="text-sm text-muted-foreground">Progresso Geral nos Projetos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{projects.length}</div>
                  <div className="text-sm text-muted-foreground">Projetos Matrículados</div>
                </CardContent>
              </Card>
            </div>
            {/* Próximos Eventos (reais) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Próximos Eventos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {events.length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground">
                    Nenhum evento inscrito.
                  </div>
                )}
                {events.map((event, index) => (
                  <div
                    key={event.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium">{event.event_date}</div>
                      <div className="text-xs text-muted-foreground">{event.event_time}</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{event.title}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate("/forum")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Entrar no Fórum
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate("/projects")}
                >
                  <Book className="h-4 w-4 mr-2" />
                  Continuar Estudos
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate("/study-projects")}
                >
                  <Book className="h-4 w-4 mr-2" />
                  Estudar Projetos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
