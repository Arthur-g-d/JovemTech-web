import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/DashboardPage";
import Projects from "./pages/ProjectsPage";
import Forum from "./pages/ForumPage";
import Events from "./pages/EventsPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import ForumPostPage from "./pages/ForumPostPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ProjectStudyPage from "./pages/ProjectStudyPage";
import ProjectStudySinglePage from "./pages/ProjectStudySinglePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetailsPage />} />
          <Route path="/projects/:id/study" element={<ProjectStudySinglePage />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:id" element={<ForumPostPage />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/study-projects" element={<ProjectStudyPage />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
