import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Book, Calendar, Users as UsersIcon, LogOut, User, Sun, Moon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Para avatar privado:
 * - O filename do avatar fica na memória local do browser (EditProfile).
 * - No Navigation, não temos o filename. Para funcionar mesmo assim, vamos:
 *   1. Listar arquivos no bucket 'private-avatars' na pasta do user.id.
 *   2. Se houver arquivo, criar signed URL e mostrar.
 *   3. Se não houver, fallback para ícone User.
 */

const Navigation = () => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<{ username: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const nav = useNavigate();
  const location = useLocation();

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== 'undefined'
      ? document.documentElement.classList.contains("dark")
      : false
  );

  // Atualiza sessão e usuário (para updates dinâmicos após edição)
  useEffect(() => {
    // Escuta mudança de sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Busca sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Função para buscar o profile atualizado (username)
  const fetchProfile = async (currentUser) => {
    if (currentUser?.id) {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", currentUser.id)
        .single();
      if (!error && data) setProfile({ username: data.username });
      else setProfile(null);
    }
  };

  // Função para buscar o avatar atualizado
  const fetchAvatarUrl = async (currentUser) => {
    setAvatarUrl(null); // fallback safe
    if (!currentUser?.id) return;

    const { data, error } = await supabase.storage
      .from("private-avatars")
      .list(`${currentUser.id}/`, { limit: 1 });

    if (error || !data || data.length === 0) return;

    const file = data.sort((a, b) =>
      (b.updated_at || "").localeCompare(a.updated_at || "")
    )[0];

    if (file?.name) {
      const { data: urlData } = await supabase.storage
        .from("private-avatars")
        .createSignedUrl(`${currentUser.id}/${file.name}`, 60 * 60);
      setAvatarUrl(urlData?.signedUrl || null);
    }
  };

  // Função para alternar dark/light mode
  const toggleDarkMode = () => {
    if (typeof window !== 'undefined') {
      const docClass = document.documentElement.classList;
      if (docClass.contains("dark")) {
        docClass.remove("dark");
        setDarkMode(false);
        localStorage.setItem("theme", "light");
      } else {
        docClass.add("dark");
        setDarkMode(true);
        localStorage.setItem("theme", "dark");
      }
    }
  };

  // Hidrata estado inicial baseado no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const theme = localStorage.getItem("theme");
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        setDarkMode(true);
      } else if (theme === "light") {
        document.documentElement.classList.remove("dark");
        setDarkMode(false);
      }
    }
  }, []);

  // Configuração dos itens de navegação
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Book, path: "/dashboard" },
    { id: "projects", label: "Projetos", icon: Users, path: "/projects" },
    { id: "forum", label: "Fórum", icon: UsersIcon, path: "/forum" },
    { id: "events", label: "Eventos", icon: Calendar, path: "/events" },
  ];

  // Determina a aba ativa com base na rota
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) return "dashboard";
    if (path.startsWith("/projects")) return "projects";
    if (path.startsWith("/forum")) return "forum";
    if (path.startsWith("/events")) return "events";
    return "";
  };

  const activeTab = getActiveTab();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Você saiu da conta.");
    nav("/auth");
  };

  // Buscar profile e avatar no mount e quando usuário muda (login/logout)
  useEffect(() => {
    fetchProfile(user);
    fetchAvatarUrl(user);
    // eslint-disable-next-line
  }, [user]);

  // ESCUTAR profile-updated para recarregar automaticamente username/avatar na navbar
  useEffect(() => {
    const handler = () => {
      fetchProfile(user);
      fetchAvatarUrl(user);
    };
    window.addEventListener("profile-updated", handler);
    return () => window.removeEventListener("profile-updated", handler);
  }, [user]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-200 dark:border-zinc-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="gradient-bg text-white p-2 rounded-lg mr-3">
              <Book className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold bg-tech-gradient bg-clip-text text-transparent">
              Jovem Tech Flow
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {
              navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => nav(item.path)}
                    className={`flex items-center px-3 py-2 rounded-lg transition-all ${
                      isActive
                        ? "bg-tech-gradient text-white"
                        : "text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </button>
                );
              })
            }
          </div>

          <div className="flex items-center space-x-2">
            {/* Botão dark mode */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Alternar tema"
              onClick={toggleDarkMode}
              className="rounded-full"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
              )}
            </Button>
            {user ? (
              <div className="flex items-center space-x-2">
                {/* Avatar (novidade) */}
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full object-cover border"
                  />
                ) : (
                  <User className="h-8 w-8 text-primary bg-muted rounded-full p-1" />
                )}

                {/* Username com update imediato */}
                <button
                  className="text-sm text-muted-foreground hover:underline transition cursor-pointer"
                  onClick={() => nav("/profile")}
                >
                  {profile?.username || "usuário"}
                </button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sair
                </Button>
              </div>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => nav("/auth")}>
                  Login
                </Button>
                <Button
                  size="sm"
                  className="gradient-bg"
                  onClick={() => nav("/auth")}
                >
                  Cadastrar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
