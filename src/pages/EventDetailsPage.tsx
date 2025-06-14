
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import EventContentManager from "@/components/EventContentManager";

export default function EventDetailsPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<any | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [creatorUsername, setCreatorUsername] = useState<string | null>(null);
  const [attendeeCount, setAttendeeCount] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [eventContents, setEventContents] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    // Buscar dados do evento
    supabase.from("events").select("*").eq("id", id).maybeSingle()
      .then(async ({ data }) => {
        setEvent(data);

        // Buscar nome do criador
        if (data?.created_by) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", data.created_by)
            .maybeSingle();
          setCreatorUsername(profile?.username || data.created_by);
        }

        // Buscar total de inscritos neste evento
        const { count } = await supabase
          .from("event_registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", id);
        setAttendeeCount(count ?? 0);
      });

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return setUserId(null);

      setUserId(user.id);

      supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setIsRegistered(!!data));

      supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle()
        .then(({ data }) => setIsAdmin(!!data));
    });

    // Carregar conteúdos do evento (apenas se for inscrito ou admin)
    if (id) {
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return;
        // Só buscar se for admin ou estiver inscrito
        const { data: reg } = await supabase
          .from("event_registrations")
          .select("*")
          .eq("event_id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        const { data: role } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (reg || role) {
          (supabase as any)
            .from("event_contents")
            .select("*")
            .eq("event_id", id)
            .order("created_at", { ascending: true })
            .then(({ data }: { data: any[] }) => setEventContents(data ?? []));
        }
      });
    }
  }, [id]);

  // Atualizar a contagem de inscritos após registrar
  const fetchAttendeeCount = async () => {
    if (!id) return;
    const { count } = await supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", id);
    setAttendeeCount(count ?? 0);
  }

  const handleRegister = async () => {
    if (!userId || !id) return;
    setRegistering(true);
    await supabase.from("event_registrations").insert({
      event_id: id,
      user_id: userId,
    });
    setIsRegistered(true);
    setRegistering(false);
    fetchAttendeeCount();
  };

  if (!event) return <div className="p-4">Carregando...</div>;

  // Formatadores
  const formatDateTime = (date: string, time: string) => {
    try {
      if (!date || !time) return "";
      const isoString = `${date}T${time}`;
      return format(parseISO(isoString), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
    } catch {
      return `${date} ${time}`;
    }
  };

  // Cálculo barra de progresso
  const haveLimit = !!event.max_attendees;
  const percent = haveLimit && event.max_attendees > 0
    ? Math.min((attendeeCount / event.max_attendees) * 100, 100)
    : 0;

  return (
    <div className="max-w-2xl mx-auto mt-8 px-2">
      <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
      <div className="mb-2 text-muted-foreground">{event.description}</div>
      <div className="mb-2 flex flex-col sm:flex-row gap-1">
        <b>Data e hora:</b>
        <span>{formatDateTime(event.event_date, event.event_time)}</span>
      </div>
      <div className="mb-2 flex gap-1">
        <b>Criador:</b>
        <span className="text-primary font-bold">{creatorUsername?? event.created_by}</span>
      </div>
      <div className="mb-2 flex gap-1">
        <b>Inscrições máximas:</b>
        <span>{event.max_attendees ?? "Ilimitado"}</span>
      </div>
      {haveLimit && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span>{attendeeCount} inscrito(s)</span>
            <span>{event.max_attendees} vagas</span>
          </div>
          <Progress value={percent} />
        </div>
      )}
      {!isRegistered ? (
        <Button className="mt-3" onClick={handleRegister} disabled={registering || (haveLimit && attendeeCount >= event.max_attendees)}>
          {registering ? "Inscrevendo..." : (haveLimit && attendeeCount >= event.max_attendees ? "Evento Lotado" : "Inscrever-se para o evento")}
        </Button>
      ) : (
        <div className="text-green-700 font-bold mt-4">Você está inscrito neste evento!</div>
      )}

      {/* Apenas admin: painel de gerenciamento dos conteúdos */}
      {isAdmin && id && (
        <div className="mt-8">
          <EventContentManager eventId={id} isAdmin />
        </div>
      )}

      {/* Conteúdo exclusivo para inscritos/admin */}
      <div className="mt-8">
        {(isRegistered || isAdmin) ? (
          <div className="bg-green-100 dark:bg-green-900/10 rounded-lg p-4">
            <b>Conteúdo do evento:</b>
            {eventContents.length === 0 ? (
              <div className="text-muted-foreground">Ainda não há materiais para este evento.</div>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {eventContents.map((c: any, i: number) => (
                  <li key={c.id} className="border rounded px-3 py-2 flex flex-col">
                    <span className="font-bold">{c.title}</span>
                    {c.description && <span className="text-xs">{c.description}</span>}
                    {c.content_type === "link" && c.content_url && (
                      <a href={c.content_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm mt-1">Acessar material</a>
                    )}
                    {(c.content_type === "text" || !c.content_type) && c.content_url && (
                      <div className="text-sm mt-1">{c.content_url}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground">
            Inscreva-se para visualizar o conteúdo do evento.
          </div>
        )}
      </div>
    </div>
  );
}
