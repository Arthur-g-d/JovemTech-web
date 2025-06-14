import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";

function isAdmin(userId: string | undefined) {
  if (!userId) return Promise.resolve(false);
  return supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle()
    .then((r) => !!r.data);
}

const EventForm = ({ onCreated }: { onCreated: () => void }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [tags, setTags] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    await supabase.from("events").insert({
      title,
      description,
      event_date: eventDate,
      event_time: eventTime,
      created_by: user?.id,
      max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
      tags: tags ? tags.split(",").map((tag: string) => tag.trim()) : [],
    });
    setTitle("");
    setDescription("");
    setEventDate("");
    setEventTime("");
    setMaxAttendees("");
    setTags("");
    setLoading(false);
    onCreated();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto space-y-5 bg-background/90 dark:bg-zinc-900 border border-border shadow-lg rounded-2xl p-6 mb-10 animate-fade-in"
    >
      <div>
        <Label htmlFor="event-title">Título do Evento</Label>
        <Input
          id="event-title"
          placeholder="Nome do evento"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="event-description">Descrição</Label>
        <Textarea
          id="event-description"
          placeholder="Escreva uma descrição detalhada do evento"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="min-h-[92px]"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="event-date">Data do Evento</Label>
          <Input
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="event-time">Horário</Label>
          <Input
            id="event-time"
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="max-attendees">Máximo de inscritos</Label>
          <Input
            id="max-attendees"
            type="number"
            placeholder="Deixe em branco para ilimitado"
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value.replace(/\D/, ""))}
            min={0}
          />
        </div>
        <div>
          <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
          <Input
            id="tags"
            placeholder="ex: tecnologia, networking, presencial"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full font-semibold text-base"
      >
        {loading ? "Salvando..." : "Criar Evento"}
      </Button>
    </form>
  );
};

const Events = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });
    setEvents(data || []);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      isAdmin(user?.id).then(setIsAdminUser);
    });
  }, []);

  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Eventos & Workshops</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Participe dos eventos cadastrados pelos administradores.
          </p>
        </div>
        {isAdminUser && <EventForm onCreated={fetchEvents} />}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground">
              Nenhum evento cadastrado.
            </div>
          )}
          {events.map((event) => (
            <Link to={`/events/${event.id}`} key={event.id}>
              <Card className="cursor-pointer hover:shadow-xl transition-all">
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {(event.tags || []).join(", ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <b>Data:</b> {event.event_date}
                  </div>
                  <div>
                    <b>Hora:</b> {event.event_time}
                  </div>
                  <div className="mb-2">
                    <b>Descrição:</b> {event.description}
                  </div>
                  <div>
                    <b>Criador:</b> {event.created_by}
                  </div>
                  <div>
                    <b>Inscrições máximas:</b>{" "}
                    {event.max_attendees ?? "Ilimitado"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
export default Events;
