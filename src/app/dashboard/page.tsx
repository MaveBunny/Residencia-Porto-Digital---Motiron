"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { api, Event } from "@/data/events";
import { logout, isAuthenticated, getUserType, getUserName } from "@/utils/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, CalendarDays, Users, Ticket, BarChart3, LogOut, Plus, Search,
  TrendingUp, MoreVertical, MapPin, Clock, ArrowLeft, ArrowRight, Filter, CheckCircle2,
  XCircle, AlertCircle, Download, DollarSign, ArrowUpRight, ArrowDownRight, Menu, X,
  UserPlus, Mail, Hash, User, Lock, Tags, Image as ImageIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import DatePicker, { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@/components/ui/button";

registerLocale("pt-BR", ptBR);

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    category: "Workshop",
    totalSpots: 50,
    location: "",
    speaker: "",
    hours: 0,
  });

  const [participantFilter, setParticipantFilter] = useState("Todos");
  const [participantSearch, setParticipantSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("Todos");
  const [eventSearch, setEventSearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [managerName, setManagerName] = useState<string | null>(null);

  // Estados dos modais customizados
  const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string; type: "success" | "error" | "info" }>({
    open: false, title: "", message: "", type: "info"
  });
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({
    open: false, title: "", message: "", onConfirm: () => {}
  });

  const showAlert = useCallback((title: string, message: string, type: "success" | "error" | "info" = "success") => {
    setAlertModal({ open: true, title, message, type });
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ open: true, title, message, onConfirm });
  }, []);

  useEffect(() => {
    if (!isAuthenticated() || getUserType() !== "gestor") {
      router.push("/login");
    } else {
      setIsAuth(true);
      setManagerName(getUserName());
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };
  const menuItems = [
    { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { id: "eventos", label: "Eventos", icon: CalendarDays },
    { id: "categorias", label: "Categorias", icon: Tags },
    { id: "participantes", label: "Participantes", icon: Users },
    { id: "usuarios", label: "Cadastrar Usuário", icon: UserPlus },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: api.getActivities
  });
  const events: Event[] = Array.isArray(data) ? data : [];

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories
  });
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const { data: participants = [], isLoading: isLoadingParticipants } = useQuery({
    queryKey: ['participants'],
    queryFn: api.getAllParticipants
  });

  const createEventMutation = useMutation({
    mutationFn: () => {
      const selectedCategory = categories.find(c => c.name === newEvent.category);
      const defaultImage = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800";

      return api.addActivity({
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        category: newEvent.category,
        totalSpots: newEvent.totalSpots,
        location: newEvent.location || "A definir",
        speaker: newEvent.speaker || "Convidado Senac",
        image: selectedCategory?.image || defaultImage,
        time: "09:00",
        hours: newEvent.hours
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['activities'] });
        setIsNewEventModalOpen(false);
        setEditingEventId(null);
        setNewEvent({ title: "", description: "", date: "", category: "Workshop", totalSpots: 50, location: "", speaker: "", hours: 0 });
        showAlert("Evento Criado", data.message, "success");
      }
    }
  });

  const editEventMutation = useMutation({
    mutationFn: () => {
      const selectedCategory = categories.find(c => c.name === newEvent.category);

      return api.editActivity(editingEventId!, {
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        category: newEvent.category as Event["category"],
        totalSpots: newEvent.totalSpots,
        location: newEvent.location || "A definir",
        speaker: newEvent.speaker,
        image: selectedCategory?.image || undefined,
        hours: newEvent.hours,
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['activities'] });
        setIsNewEventModalOpen(false);
        setEditingEventId(null);
        setNewEvent({ title: "", description: "", date: "", category: "Workshop", totalSpots: 50, location: "", speaker: "", hours: 0 });
        showAlert("Evento Atualizado", data.message, "success");
      }
    }
  });

  const cancelEventMutation = useMutation({
    mutationFn: (eventId: string) => api.cancelEvent(eventId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['participants'] });
      showAlert("Evento Cancelado", data.message, "error");
    }
  });

  const finishEventMutation = useMutation({
    mutationFn: (eventId: string) => api.finishEvent(eventId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['participants'] });
      showAlert("Evento Concluído", data.message, "success");
    }
  });

  const toggleAttendanceMutation = useMutation({
    mutationFn: ({ userId, activityId }: { userId: string, activityId: string }) => api.toggleAttendance(userId, activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
    }
  });

  const toggleRegistrationStatusMutation = useMutation({
    mutationFn: ({ userId, activityId }: { userId: string, activityId: string }) => api.toggleRegistrationStatus(userId, activityId),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['participants'] });
        queryClient.invalidateQueries({ queryKey: ['activities'] });
      } else {
        showAlert("Limite de Vagas", data.message, "error");
      }
    }
  });

  const selectedEvent = useMemo(() =>
    events.find(e => e.id === selectedEventId), [selectedEventId, events]
  );

  // Função para converter as datas do sistema em timestamps comparáveis
  const parseDateToTimestamp = (dateStr: string): number => {
    // Formato DD/MM/AAAA
    const ddmmMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmMatch) {
      const [, day, month, year] = ddmmMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
    }
    // Formato "15 de Mai"
    const monthMap: Record<string, number> = {
      "jan": 0, "fev": 1, "mar": 2, "abr": 3, "mai": 4, "jun": 5,
      "jul": 6, "ago": 7, "set": 8, "out": 9, "nov": 10, "dez": 11
    };
    const textMatch = dateStr.match(/(\d{1,2})\s+de\s+(\w{3})/i);
    if (textMatch) {
      const [, day, monthStr] = textMatch;
      const monthNum = monthMap[monthStr.toLowerCase()];
      if (monthNum !== undefined) {
        return new Date(new Date().getFullYear(), monthNum, parseInt(day)).getTime();
      }
    }
    return Infinity;
  };

  // Próximos 3 eventos ordenados por data (excluindo cancelados e concluídos)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = today.getTime();
    return [...events]
      .filter(e => !e.isCanceled && !e.isConcluded)
      .sort((a, b) => {
        const tA = parseDateToTimestamp(a.date);
        const tB = parseDateToTimestamp(b.date);
        const diffA = tA - now;
        const diffB = tB - now;
        if (diffA >= 0 && diffB >= 0) return diffA - diffB;
        if (diffA >= 0) return -1;
        if (diffB >= 0) return 1;
        return diffB - diffA;
      })
      .slice(0, 3);
  }, [events]);

  // Todos os eventos ordenados por data (mais próximos primeiro)
  const sortedEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = today.getTime();
    return [...events].sort((a, b) => {
      const tA = parseDateToTimestamp(a.date);
      const tB = parseDateToTimestamp(b.date);
      const diffA = tA - now;
      const diffB = tB - now;
      if (diffA >= 0 && diffB >= 0) return diffA - diffB;
      if (diffA >= 0) return -1;
      if (diffB >= 0) return 1;
      return diffB - diffA;
    });
  }, [events]);

  // Eventos filtrados por busca e status
  const eventFilteredList = useMemo(() => {
    return sortedEvents.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(eventSearch.toLowerCase()) || 
                            e.location.toLowerCase().includes(eventSearch.toLowerCase());
      
      if (eventFilter === "Ativos") {
        return matchesSearch && !e.isCanceled && !e.isConcluded;
      }
      if (eventFilter === "Cancelados") {
        return matchesSearch && (e.isCanceled || e.isConcluded);
      }
      return matchesSearch;
    });
  }, [sortedEvents, eventFilter, eventSearch]);

  if (!isAuth) return null;

  // --- SUB-TELA: DETALHES DO EVENTO ---
  const renderEventDetails = (event: Event) => {
    const percentage = event.totalSpots > 0 ? ((event.totalSpots - event.availableSpots) / event.totalSpots) * 100 : 0;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <button
          onClick={() => setSelectedEventId(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-senac-blue transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para lista
        </button>

        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 h-48 md:h-64 rounded-2xl overflow-hidden shadow-lg">
            <img src={event.image || null} alt={event.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-senac-blue/10 text-senac-blue px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {event.category}
                </span>
                {event.isCanceled && (
                  <span className="ml-2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Cancelado
                  </span>
                )}
                {event.isConcluded && (
                  <span className="ml-2 bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Concluído
                  </span>
                )}
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">{event.title}</h2>
                <p className="text-slate-500 mt-3 font-medium leading-relaxed">
                  {event.description || "Nenhuma descrição detalhada fornecida para este evento."}
                </p>
              </div>

              <div className="relative group">
                <button className="bg-slate-100 p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition-all">
                  <MoreVertical className="w-5 h-5" />
                </button>
                <div className="absolute right-0 top-full pt-2 hidden group-hover:block z-20">
                  <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-2 w-48 flex flex-col gap-1">
                    {!event.isCanceled && !event.isConcluded && (
                      <button
                        onClick={() => {
                          setEditingEventId(event.id);
                          setNewEvent({
                            title: event.title,
                            description: event.description || "",
                            date: event.date,
                            category: event.category,
                            totalSpots: event.totalSpots,
                            location: event.location || "",
                            speaker: event.speaker || "",
                            hours: event.hours || 0,
                          });
                          setIsNewEventModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors"
                      >
                        Editar Evento
                      </button>
                    )}
                    {!event.isCanceled && !event.isConcluded && (
                      <button
                        onClick={() => {
                          showConfirm(
                            "Concluir Evento",
                            "Marcar este evento como concluído? Os participantes confirmados serão atualizados para 'Concluído' e os pendentes para 'Cancelado'.",
                            () => finishEventMutation.mutate(event.id)
                          );
                        }}
                        disabled={finishEventMutation.isPending}
                        className="w-full text-left px-4 py-2 text-senac-blue hover:bg-senac-blue/10 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        Concluir Evento
                      </button>
                    )}
                    <button
                      onClick={() => {
                        showConfirm(
                          "Cancelar Evento",
                          "Tem certeza que deseja cancelar este evento? Todos os inscritos terão suas inscrições canceladas automaticamente.",
                          () => cancelEventMutation.mutate(event.id)
                        );
                      }}
                      disabled={event.isCanceled || cancelEventMutation.isPending}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      {event.isCanceled ? "Já Cancelado" : "Cancelar Evento"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <CalendarDays className="text-senac-blue w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Data</p>
                  <p className="font-bold text-slate-900">{event.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <MapPin className="text-senac-blue w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Local</p>
                  <p className="font-bold text-slate-900">{event.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <Users className="text-senac-blue w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Palestrante</p>
                  <p className="font-bold text-slate-900">{event.speaker || "Senac"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <Clock className="text-senac-blue w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Carga Horária</p>
                  <p className="font-bold text-slate-900">{event.hours}h</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-slate-100 rounded-2xl">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500 font-medium">Ocupação Atual</span>
                <span className="font-bold text-senac-blue">{percentage.toFixed(0)}% ({event.totalSpots - event.availableSpots}/{event.totalSpots})</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-senac-blue h-full w-[85%] rounded-full" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const UserRegistrationForm = () => {
    const [formData, setFormData] = useState({ nome: '', email: '', matricula: '', senha: '', tipo: 'aluno' });
    const [regStatus, setRegStatus] = useState({ loading: false, error: '', success: false });

    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setRegStatus({ loading: true, error: '', success: false });
      
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setRegStatus({ loading: false, error: '', success: true });
          setFormData({ nome: '', email: '', matricula: '', senha: '', tipo: 'aluno' });
          showAlert("Sucesso", "Usuário cadastrado com sucesso!", "success");
        } else {
          setRegStatus({ loading: false, error: data.message, success: false });
        }
      } catch (err) {
        setRegStatus({ loading: false, error: "Erro de conexão", success: false });
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">Cadastrar Novo Usuário</h2>
          <p className="text-slate-500 font-medium text-sm md:text-base">Adicione novos alunos ou colaboradores ao sistema.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm max-w-2xl">
          <form onSubmit={handleRegister} className="space-y-6">
            {regStatus.error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">
                {regStatus.error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  <input 
                    type="text"
                    required
                    placeholder="Nome do usuário"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  <select 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none appearance-none cursor-pointer"
                    value={formData.tipo}
                    onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                  >
                    <option value="aluno">Aluno / Estudante</option>
                    <option value="gestor">Gestor / Administrativo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Institucional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input 
                  type="email"
                  required
                  placeholder="email@exemplo.com"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matrícula</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  <input 
                    type="text"
                    required
                    placeholder="Número da matrícula"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none"
                    value={formData.matricula}
                    onChange={e => setFormData({ ...formData, matricula: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Inicial</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  <input 
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none"
                    value={formData.senha}
                    onChange={e => setFormData({ ...formData, senha: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={regStatus.loading}
              className="w-full h-14 bg-senac-blue hover:bg-senac-blue/90 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-senac-blue/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {regStatus.loading ? "Processando..." : "Finalizar Cadastro"}
            </Button>
          </form>
        </div>
      </div>
    );
  };

  const CategoryRegistrationForm = () => {
    const [formData, setFormData] = useState({ name: '', description: '', image: '' });
    const [regStatus, setRegStatus] = useState({ loading: false, error: '', success: false });

    const createCategoryMutation = useMutation({
      mutationFn: () => api.addCategory({ name: formData.name, description: formData.description, image: formData.image }),
      onSuccess: (data) => {
        if (data.success) {
          setRegStatus({ loading: false, error: '', success: true });
          setFormData({ name: '', description: '', image: '' });
          showAlert("Sucesso", "Categoria cadastrada com sucesso!", "success");
          queryClient.invalidateQueries({ queryKey: ['categories'] });
        } else {
          setRegStatus({ loading: false, error: data.message, success: false });
        }
      },
      onError: () => {
        setRegStatus({ loading: false, error: "Erro de conexão", success: false });
      }
    });

    const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      setRegStatus({ loading: true, error: '', success: false });
      createCategoryMutation.mutate();
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">Cadastrar Nova Categoria</h2>
          <p className="text-slate-500 font-medium text-sm md:text-base">Adicione novas categorias para classificar os eventos.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm max-w-2xl">
          <form onSubmit={handleRegister} className="space-y-6">
            {regStatus.error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">
                {regStatus.error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Categoria</label>
              <div className="relative">
                <Tags className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input 
                  type="text"
                  required
                  placeholder="Ex: Workshop"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
              <textarea
                required
                placeholder="Descreva a categoria..."
                rows={3}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none resize-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL da Imagem Padrão</label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                <input 
                  type="url"
                  placeholder="https://..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none"
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={regStatus.loading}
              className="w-full h-14 bg-senac-blue hover:bg-senac-blue/90 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-senac-blue/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {regStatus.loading ? "Processando..." : "Salvar Categoria"}
            </Button>
          </form>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (selectedEventId && selectedEvent) return renderEventDetails(selectedEvent);

    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900">Dashboard</h2>
                <p className="text-slate-500 font-medium text-sm md:text-base">Bem-vindo de volta ao cockpit do Senac.</p>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Status do Sistema</p>
                <p className="text-emerald-500 font-bold flex items-center gap-2 justify-end">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Operacional
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: "Total Eventos", value: events.length.toString(), trend: "Ativos", icon: CalendarDays },
                { label: "Inscrições", value: participants.filter(p => p.status === 'Confirmado').length.toString(), trend: "Confirmados", icon: Users },
                { label: "Presenças", value: participants.filter(p => p.attendance === 'Presente').length.toString(), trend: "Check-in", icon: CheckCircle2 },
                { label: "Pendentes Presença", value: participants.filter(p => p.status === 'Confirmado' && p.attendance === 'Pendente').length.toString(), trend: "Aguardando", icon: AlertCircle },
              ].map((kpi, i) => (
                <div key={i} className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-senac-blue/10 transition-colors">
                      <kpi.icon className="w-5 h-5 md:w-6 md:h-6 text-senac-blue" />
                    </div>
                    <span className="text-emerald-500 text-xs font-black bg-emerald-50 px-2 py-1 rounded-lg">{kpi.trend}</span>
                  </div>
                  <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-tighter">{kpi.label}</p>
                  <p className="text-2xl md:text-3xl font-black text-slate-900 mt-1">{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-lg md:text-xl font-black text-slate-900 mb-6">Próximos Eventos</h3>
                <div className="space-y-4">
                  {upcomingEvents.map(e => {
                    const perc = e.totalSpots > 0 ? ((e.totalSpots - e.availableSpots) / e.totalSpots) * 100 : 0;
                    return (
                      <div key={e.id} className="flex items-center gap-3 md:gap-4 p-2 md:p-3 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-100">
                        <img src={e.image || null} className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover flex-shrink-0" />
                        <div className="flex-1 overflow-hidden">
                          <p className="font-bold text-slate-900 leading-tight truncate">{e.title}</p>
                          <p className="text-[10px] md:text-xs text-slate-500 mt-1 font-medium truncate">{e.date} • {e.location.split(',')[0]}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs md:text-sm font-black text-senac-blue">{perc.toFixed(0)}%</p>
                          <p className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold">Vagas</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      case "eventos":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900">Seus Eventos</h2>
                <p className="text-slate-500 font-medium text-sm md:text-base">Gerencie e acompanhe a logística das suas produções.</p>
              </div>
              <button
                onClick={() => setIsNewEventModalOpen(true)}
                className="bg-senac-blue text-white px-6 py-4 rounded-2xl font-bold hover:bg-senac-blue/90 shadow-lg shadow-senac-blue/20 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Criar Evento
              </button>
            </div>

            <div className="bg-white p-2 rounded-[28px] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 py-2">
                <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome ou local..." 
                  className="bg-transparent border-none focus:ring-0 w-full font-medium text-slate-600 outline-none"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1 bg-slate-50 p-1 rounded-[22px] overflow-x-auto">
                {["Todos", "Ativos", "Cancelados"].map(f => (
                  <button 
                    key={f} 
                    onClick={() => setEventFilter(f)}
                    className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${eventFilter === f ? 'bg-white text-senac-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventFilteredList.map(e => (
                <div key={e.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                  <div className="h-40 md:h-48 overflow-hidden relative">
                    <img src={e.image || null} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-senac-blue uppercase tracking-widest shadow-sm">
                        {e.category}
                      </div>
                      {e.isCanceled && (
                        <div className="bg-red-500/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-sm">
                          Cancelado
                        </div>
                      )}
                      {e.isConcluded && (
                        <div className="bg-indigo-500/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-sm">
                          Concluído
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-5 md:p-6 flex-1 flex flex-col">
                    <h4 className="text-lg md:text-xl font-black text-slate-900 leading-tight mb-2">{e.title}</h4>
                    <div className="space-y-2 mt-auto">
                      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                        <CalendarDays className="w-4 h-4 text-senac-blue flex-shrink-0" /> {e.date}
                      </div>
                      <button
                        onClick={() => setSelectedEventId(e.id)}
                        className="w-full mt-4 bg-slate-50 text-slate-900 py-3 rounded-2xl font-bold hover:bg-senac-blue hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        Ver Detalhes <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "usuarios":
        return <UserRegistrationForm />;
      case "categorias":
        return <CategoryRegistrationForm />;
      case "participantes":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">Gestão de Participantes</h2>
              <p className="text-slate-500 font-medium text-sm md:text-base">Controle a lista de presença e inscrições em tempo real.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto">
                {["Todos", "Confirmado", "Presente", "Pendente"].map(f => (
                  <button
                    key={f}
                    onClick={() => setParticipantFilter(f)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${participantFilter === f ? 'bg-white text-senac-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {(f === "Confirmado" || f === "Presente") && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                    {f === "Pendente" && <AlertCircle className="w-3 h-3 inline mr-1" />}
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou evento..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue/20 font-medium text-sm outline-none"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Wrapper para scroll horizontal na tabela */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nome do Aluno</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Evento</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Inscr.</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Presença</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {participants.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">Nenhum participante encontrado.</td>
                      </tr>
                    )}
                    {participants
                      .filter(p => {
                        if (participantFilter === "Todos") return true;
                        if (participantFilter === "Confirmado") return p.status === "Confirmado";
                        if (participantFilter === "Presente") return p.attendance === "Presente";
                        if (participantFilter === "Pendente") return p.status === "Pendente" || p.attendance === "Pendente";
                        return true;
                      })
                      .filter(p => p.name.toLowerCase().includes(participantSearch.toLowerCase()) || p.event.toLowerCase().includes(participantSearch.toLowerCase()))
                      .map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-senac-blue/10 flex items-center justify-center text-senac-blue font-bold text-xs flex-shrink-0">{p.name.charAt(0)}</div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{p.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">{p.event}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-500">{p.date}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleRegistrationStatusMutation.mutate({ userId: p.userId, activityId: p.activityId })}
                              disabled={toggleRegistrationStatusMutation.isPending}
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit transition-all hover:scale-105 ${p.status === "Confirmado" ? "bg-emerald-50 text-emerald-600" :
                                p.status === "Concluído" ? "bg-indigo-50 text-indigo-600" :
                                  p.status === "Pendente" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                                }`}
                            >
                              {p.status === "Confirmado" || p.status === "Concluído" ? <CheckCircle2 className="w-3 h-3" /> :
                                p.status === "Pendente" ? <AlertCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {p.status}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleAttendanceMutation.mutate({ userId: p.userId, activityId: p.activityId })}
                              disabled={toggleAttendanceMutation.isPending}
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit transition-all hover:scale-105 ${p.attendance === "Presente" ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                                }`}
                            >
                              {p.attendance === "Presente" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {p.attendance}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-slate-400 hover:text-senac-blue p-2 rounded-xl"><MoreVertical className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">

      {/* OVERLAY ESCURO PARA MOBILE */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR - RESPONSIVA */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col justify-between shadow-2xl shadow-slate-200/50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="h-20 md:h-24 flex items-center justify-between px-6 md:px-10">
            <h1 className="text-2xl font-black text-senac-blue tracking-tighter">Senac<span className="text-senac-orange">.</span>Gestão</h1>
            {/* Botão fechar apenas no mobile */}
            <button
              className="md:hidden p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 md:px-6 space-y-2 py-4 overflow-y-auto">
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Menu Principal</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedEventId(null);
                    setIsMobileMenuOpen(false); // Fecha o menu ao clicar (mobile)
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-[20px] font-bold transition-all duration-300 ${isActive
                    ? "bg-senac-blue text-white shadow-xl shadow-senac-blue/30 scale-[1.02]"
                    : "text-slate-400 hover:bg-slate-50 hover:text-senac-blue"
                    }`}
                >
                  <div className={`p-1 rounded-lg ${isActive ? "bg-white/20" : ""}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm tracking-tight">{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* TOPBAR MOBILE COM HAMBÚRGUER */}
        <header className="h-20 bg-white border-b border-slate-100 flex md:hidden items-center justify-between px-4 sm:px-6 z-30 relative shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-black text-senac-blue tracking-tighter">Senac<span className="text-senac-orange">.</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-senac-orange capitalize bg-senac-orange/10 px-3 py-1 rounded-full hidden sm:inline-block">
              Gestor
            </span>
            <button onClick={handleLogout} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-xl transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* TOPBAR DESKTOP */}
        <header className="h-16 bg-white border-b border-slate-100 hidden md:flex items-center justify-end z-30 relative shadow-sm" style={{ paddingInline: 'calc(var(--spacing) * 50)' }}>
          <div className="flex gap-4 items-center">
            <span className="text-sm font-black text-senac-orange capitalize bg-senac-orange/10 px-3 py-1 rounded-full">
              Olá, {managerName || "Gestor"}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-black text-red-500 bg-red-50 hover:bg-red-100 px-4 py-1.5 rounded-full transition-all uppercase tracking-widest text-[10px]"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12 relative scroll-smooth w-full">
          {/* Efeito de luz ambiente de fundo */}
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-senac-blue/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-senac-orange/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10 pb-20">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* MODAL: NOVO EVENTO */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[30px] md:rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl md:text-2xl font-black text-slate-900">{editingEventId ? "Editar Evento" : "Novo Evento"}</h3>
              <button onClick={() => { setIsNewEventModalOpen(false); setEditingEventId(null); setNewEvent({ title: "", description: "", date: "", category: "Workshop", totalSpots: 50, location: "", speaker: "", hours: 0 }); }} className="text-slate-400 hover:text-slate-900 bg-slate-50 p-2 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Evento</label>
                <input
                  type="text"
                  placeholder="Ex: Workshop de Design"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none"
                  value={newEvent.title || ""}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Palestrante</label>
                <input
                  type="text"
                  placeholder="Ex: Nome do palestrante ou convidado"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none"
                  value={newEvent.speaker || ""}
                  onChange={e => setNewEvent({ ...newEvent, speaker: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Local do Evento</label>
                <input
                  type="text"
                  placeholder="Ex: Auditório Principal, Sala 204..."
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none"
                  value={newEvent.location || ""}
                  onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                <textarea
                  placeholder="Descreva o que acontecerá no evento..."
                  rows={3}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none resize-none"
                  value={newEvent.description || ""}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                  <DatePicker
                    selected={
                      newEvent.date 
                      ? (() => {
                          const parts = newEvent.date.split('/');
                          if (parts.length === 3) {
                            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                          }
                          // Fallback para caso antigo onde a data era YYYY-MM-DD
                          const partsFallback = newEvent.date.split('-');
                          if (partsFallback.length === 3) {
                             return new Date(parseInt(partsFallback[0]), parseInt(partsFallback[1]) - 1, parseInt(partsFallback[2]));
                          }
                          return null;
                        })()
                      : null
                    }
                    onChange={(date: Date | null) => {
                      if (date) {
                        const formatted = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                        setNewEvent({ ...newEvent, date: formatted });
                      } else {
                        setNewEvent({ ...newEvent, date: "" });
                      }
                    }}
                    dateFormat="dd/MM/yyyy"
                    locale="pt-BR"
                    placeholderText="DD/MM/AAAA"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none"
                    wrapperClassName="w-full block"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Carga Horária (Horas)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none"
                    value={newEvent.hours || 0}
                    onChange={e => setNewEvent({ ...newEvent, hours: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacidade (Vagas)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="50"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none"
                    value={newEvent.totalSpots || 0}
                    onChange={e => setNewEvent({ ...newEvent, totalSpots: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                  <select
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue font-medium outline-none"
                    value={newEvent.category || (categories[0]?.name || "")}
                    onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}
                  >
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    {categories.length === 0 && <option value="">Nenhuma categoria</option>}
                  </select>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!newEvent.title || !newEvent.date) {
                    showAlert("Campos Obrigatórios", "Por favor, preencha o título e a data do evento.", "error");
                    return;
                  }
                  if (editingEventId) {
                    editEventMutation.mutate();
                  } else {
                    createEventMutation.mutate();
                  }
                }}
                disabled={createEventMutation.isPending || editEventMutation.isPending}
                className="w-full bg-senac-blue text-white py-4 md:py-5 rounded-[22px] font-black text-lg mt-4 hover:scale-[1.02] transition-transform shadow-xl shadow-senac-blue/20 disabled:opacity-50"
              >
                {(createEventMutation.isPending || editEventMutation.isPending)
                  ? (editingEventId ? "Salvando..." : "Criando...")
                  : (editingEventId ? "Salvar Alterações" : "Publicar Evento")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALERTA CUSTOMIZADO */}
      {alertModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[30px] shadow-2xl animate-in zoom-in-95 duration-300 p-8 text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center ${
              alertModal.type === "success" ? "bg-emerald-50" :
              alertModal.type === "error" ? "bg-red-50" : "bg-senac-blue/10"
            }`}>
              {alertModal.type === "success" ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> :
               alertModal.type === "error" ? <XCircle className="w-8 h-8 text-red-500" /> :
               <AlertCircle className="w-8 h-8 text-senac-blue" />}
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{alertModal.title}</h3>
            <p className="text-slate-500 font-medium text-sm mb-6">{alertModal.message}</p>
            <button
              onClick={() => setAlertModal({ ...alertModal, open: false })}
              className={`w-full py-4 rounded-2xl font-black text-white transition-all hover:scale-[1.02] shadow-xl ${
                alertModal.type === "success" ? "bg-emerald-500 shadow-emerald-500/20" :
                alertModal.type === "error" ? "bg-red-500 shadow-red-500/20" : "bg-senac-blue shadow-senac-blue/20"
              }`}
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO CUSTOMIZADA */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[30px] shadow-2xl animate-in zoom-in-95 duration-300 p-8 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center bg-amber-50">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{confirmModal.title}</h3>
            <p className="text-slate-500 font-medium text-sm mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                className="flex-1 py-4 rounded-2xl font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, open: false });
                }}
                className="flex-1 py-4 rounded-2xl font-black text-white bg-senac-blue hover:scale-[1.02] transition-all shadow-xl shadow-senac-blue/20"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
