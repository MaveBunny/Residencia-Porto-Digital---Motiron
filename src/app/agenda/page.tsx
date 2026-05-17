"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/data/events";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ArrowRight, Trash2, CheckCircle2, AlertCircle, XCircle, Timer } from "lucide-react";
import Link from "next/link";
import { isAuthenticated, getUserId, logout, getUserName } from "@/utils/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCallback } from "react";

export default function Agenda() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Estados dos modais customizados
  const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string; type: "success" | "error" | "info" }>({
    open: false, title: "", message: "", type: "info"
  });

  const showAlert = useCallback((title: string, message: string, type: "success" | "error" | "info" = "success") => {
    setAlertModal({ open: true, title, message, type });
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      setUserId(getUserId());
      setUserName(getUserName());
    }
  }, [router]);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['registrations', userId],
    queryFn: () => api.getUserRegistrations(userId!),
    enabled: !!userId,
  });

  const cancelMutation = useMutation({
    mutationFn: (activityId: string) => api.cancelRegistration(userId!, activityId),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['registrations', userId] });
        showAlert("Inscrição Cancelada", data.message, "success");
      }
    }
  });

  if (!userId || isLoading) return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-senac-blue"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-24 px-6 pb-24">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter text-slate-900 uppercase">
            Senac<span className="text-senac-orange">Eventos</span>
          </Link>
          <div className="flex gap-4 items-center">
            {userName && (
              <span className="text-sm font-black text-senac-orange capitalize bg-senac-orange/10 px-3 py-1 rounded-full hidden sm:inline-block mr-2">
                Olá, {userName}
              </span>
            )}
            <Link href="/atividades" className="text-sm font-bold text-slate-600 hover:text-senac-blue mr-2">Catálogo</Link>
            <button
              onClick={() => { logout(); window.location.href = '/'; }}
              className="text-sm font-black text-red-500 bg-red-50 hover:bg-red-100 px-4 py-1.5 rounded-full transition-all uppercase tracking-widest text-[10px]"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4">
            Minha <span className="text-senac-blue">Agenda</span>
          </h1>
          <p className="text-slate-500 text-lg">Acompanhe suas inscrições e prepare-se para os eventos.</p>
        </div>

        {activities.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
            <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">Sua agenda está vazia</h3>
            <p className="text-slate-500 mb-8">Você ainda não se inscreveu em nenhuma atividade.</p>
            <Link href="/atividades">
              <Button className="bg-senac-blue hover:bg-senac-blue/90 text-white rounded-xl h-12 px-8 font-black uppercase tracking-widest text-xs">
                Explorar Atividades
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map(event => (
              <Card key={event.id} className="border-slate-100 shadow-sm rounded-3xl overflow-hidden flex flex-col md:flex-row bg-white">
                <div className="w-full md:w-48 h-48 md:h-auto overflow-hidden">
                   <img src={event.image || null} alt={event.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[10px] font-black text-senac-blue uppercase tracking-widest bg-senac-blue/10 px-3 py-1 rounded-full">{event.category}</span>
                          {event.isCanceled && (
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Evento Cancelado
                            </span>
                          )}
                          {event.registrationStatus === "Confirmado" && !event.isCanceled && !event.isConcluded && (
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Inscrito
                            </span>
                          )}
                          {event.isConcluded && !event.isCanceled && (
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Evento Concluído
                            </span>
                          )}
                          {event.registrationStatus === "Pendente" && !event.isCanceled && (
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Lista de Espera
                            </span>
                          )}
                        </div>
                       <button 
                         onClick={() => {
                           if(confirm("Cancelar esta inscrição?")) cancelMutation.mutate(event.id);
                         }}
                         className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 hover:bg-red-50 p-2 rounded-xl"
                         title="Cancelar Inscrição"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">{event.title}</h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600 mb-4">
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-senac-orange" /> {event.date} às {event.time}</div>
                      <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-senac-orange" /> {event.location}</div>
                      <div className="flex items-center gap-1.5"><Timer className="w-4 h-4 text-senac-orange" /> {event.hours || 0} horas</div>
                    </div>
                  </div>
                  
                  <Link href={`/atividades/${event.id}`}>
                    <Button variant="ghost" className="text-senac-blue p-0 h-auto font-black uppercase tracking-widest text-[10px] hover:bg-transparent hover:text-senac-blue/80 flex items-center gap-2">
                      Ver detalhes <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
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
    </div>
  );
}
