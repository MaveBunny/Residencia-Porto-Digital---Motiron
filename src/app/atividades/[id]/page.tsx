"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Registration } from "@/data/events";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, ArrowLeft, Users, CheckCircle, CheckCircle2, LogOut, AlertCircle, XCircle, Download, Timer } from "lucide-react";
import Link from "next/link";
import { isAuthenticated, getUserId, getUserType, logout, getUserName } from "@/utils/auth";
import { useState, useEffect, useMemo, useCallback } from "react";

export default function AtividadeDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [isLogged, setIsLogged] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

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
    setIsLogged(isAuthenticated());
    setUserId(getUserId());
    setUserName(getUserName());
    setUserType(getUserType());
  }, []);

  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => api.getActivityById(id)
  });

  const { data: userRegistrations = [] } = useQuery({
    queryKey: ['registrations', userId],
    queryFn: () => api.getUserRegistrations(userId!),
    enabled: !!userId,
  });

  const isRegistered = userRegistrations.some(r => String(r.id) === String(id));

  const { data: rawRegistrations = [] } = useQuery({
    queryKey: ['rawRegistrations', userId],
    queryFn: () => api.getRawRegistrations(userId!),
    enabled: !!userId,
  });

  const registerMutation = useMutation({
    mutationFn: () => api.registerForActivity(userId!, id),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['activity', id] });
        queryClient.invalidateQueries({ queryKey: ['registrations', userId] });
        showAlert("Inscrição Confirmada!", data.message, "success");
      } else {
        showAlert("Ops!", data.message, "error");
      }
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelRegistration(userId!, id),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['activity', id] });
        queryClient.invalidateQueries({ queryKey: ['registrations', userId] });
        showAlert("Cancelado!", data.message, "info");
      }
    }
  });

  const confirmAttendanceMutation = useMutation({
    mutationFn: () => api.toggleAttendance(userId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations', userId] });
      queryClient.invalidateQueries({ queryKey: ['rawRegistrations', userId] });
    }
  });

  // Verificar se a data da atividade corresponde ao dia atual
  const isEventToday = useMemo(() => {
    if (!activity) return false;
    const today = new Date();
    const eventDate = activity.date;

    // Formato DD/MM/AAAA (eventos criados pelo gestor)
    const ddmmyyyyMatch = eventDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      return today.getDate() === parseInt(day) &&
             (today.getMonth() + 1) === parseInt(month) &&
             today.getFullYear() === parseInt(year);
    }

    // Formato "15 de Mai" (eventos seed)
    const monthMap: Record<string, number> = {
      "jan": 0, "fev": 1, "mar": 2, "abr": 3, "mai": 4, "jun": 5,
      "jul": 6, "ago": 7, "set": 8, "out": 9, "nov": 10, "dez": 11
    };
    const textMatch = eventDate.match(/(\d{1,2})\s+de\s+(\w{3})/i);
    if (textMatch) {
      const [, day, monthStr] = textMatch;
      const monthNum = monthMap[monthStr.toLowerCase()];
      if (monthNum !== undefined) {
        return today.getDate() === parseInt(day) && today.getMonth() === monthNum;
      }
    }

    return false;
  }, [activity]);

  // Verificar o status de presença do aluno
  const currentRawReg = rawRegistrations.find((r: Registration) => String(r.activityId) === String(id));
  const currentAttendance = currentRawReg?.attendance || "Pendente";
  const isAluno = userType !== "gestor";

  const handleAction = () => {
    if (!isLogged) {
      router.push("/login");
      return;
    }
    
    if (isRegistered) {
      showConfirm(
        "Cancelar Inscrição",
        "Deseja realmente cancelar sua participação neste evento? Sua vaga será liberada para outros alunos.",
        () => cancelMutation.mutate()
      );
    } else {
      if (activity && activity.availableSpots > 0) {
        registerMutation.mutate();
      }
    }
  };

  const handleDownloadCertificate = async () => {
    if (!activity || !userId) return;

    try {
      const userData = await api.getUserById(userId);
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Design do Certificado
      doc.setDrawColor(0, 75, 141);
      doc.setLineWidth(5);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

      doc.setTextColor(0, 75, 141);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(40);
      doc.text('CERTIFICADO DE CONCLUSÃO', pageWidth / 2, 50, { align: 'center' });

      doc.setTextColor(60, 60, 60);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'normal');
      doc.text('Certificamos que', pageWidth / 2, 80, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(30);
      doc.setFont('helvetica', 'bold');
      doc.text(userData.nome.toUpperCase(), pageWidth / 2, 100, { align: 'center' });

      doc.setTextColor(60, 60, 60);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'normal');
      doc.text(`concluiu com êxito a atividade "${activity.title}"`, pageWidth / 2, 120, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text(`Realizada em: ${activity.date}`, pageWidth / 2, 138, { align: 'center' });
      doc.text(`Carga Horária: ${activity.hours || 0} horas`, pageWidth / 2, 148, { align: 'center' });
      doc.text(`Local: ${activity.location}`, pageWidth / 2, 158, { align: 'center' });

      const splitDescription = doc.splitTextToSize(activity.description || "", 180);
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(splitDescription, pageWidth / 2, 175, { align: 'center' });

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - 40, 195, pageWidth / 2 + 40, 195);
      doc.setTextColor(0, 75, 141);
      doc.setFontSize(12);
      doc.text('Coordenação Senac Motirõ', pageWidth / 2, 205, { align: 'center' });

      doc.save(`certificado_${activity.title.replace(/\s+/g, '_')}.pdf`);
      showAlert("Sucesso", "Seu certificado foi gerado!", "success");

    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      showAlert("Erro", "Não foi possível gerar o certificado.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-senac-blue"></div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-4 bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-900">Atividade não encontrada.</h2>
        <Link href="/atividades">
          <Button variant="outline">Voltar para atividades</Button>
        </Link>
      </div>
    );
  }

  const isSoldOut = activity.availableSpots <= 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <nav className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/atividades" className="flex items-center gap-2 text-slate-500 hover:text-senac-blue font-bold text-sm transition-colors uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex gap-3 items-center">
            {userName && (
              <span className="text-sm font-black text-senac-orange capitalize bg-senac-orange/10 px-3 py-1 rounded-full hidden sm:inline-block">
                Olá, {userName}
              </span>
            )}
            {isLogged && (
              <button
                onClick={() => { logout(); window.location.href = '/'; }}
                className="text-sm font-black text-red-500 bg-red-50 hover:bg-red-100 px-4 py-1.5 rounded-full transition-all uppercase tracking-widest text-[10px]"
              >
                Sair
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-12">
        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-100 overflow-hidden relative">
          
          <div className="flex flex-col md:flex-row gap-12 relative z-10">
            <div className="w-full md:w-1/2 aspect-square rounded-[2rem] overflow-hidden shadow-xl">
              <img src={activity.image || null} className="w-full h-full object-cover" alt={activity.title} />
            </div>
            
            <div className="w-full md:w-1/2 flex flex-col justify-center">
              <div className="flex gap-2 mb-6">
                <div className="inline-block bg-senac-blue/10 text-senac-blue px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest w-fit">
                  {activity.category}
                </div>
                {activity.isCanceled && (
                  <div className="inline-block bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest w-fit">
                    Cancelado
                  </div>
                )}
                {activity.isConcluded && (
                  <div className="inline-block bg-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest w-fit">
                    Concluído
                  </div>
                )}
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                {activity.title}
              </h1>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-slate-600 font-medium">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><Calendar className="w-5 h-5 text-senac-orange" /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Data</p>
                    {activity.date}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600 font-medium">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><Clock className="w-5 h-5 text-senac-orange" /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Horário</p>
                    {activity.time}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600 font-medium">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><MapPin className="w-5 h-5 text-senac-orange" /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Local</p>
                    {activity.location}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600 font-medium">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><Users className="w-5 h-5 text-senac-orange" /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Palestrante</p>
                    {activity.speaker}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600 font-medium">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><Timer className="w-5 h-5 text-senac-orange" /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Carga Horária</p>
                    {activity.hours || 0} Horas
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                 <div className="flex justify-between items-end mb-2">
                   <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Vagas Disponíveis</p>
                   <p className={`text-xl font-black ${isSoldOut ? 'text-red-500' : 'text-emerald-500'}`}>
                     {activity.availableSpots} <span className="text-sm">/ {activity.totalSpots}</span>
                   </p>
                 </div>
                 <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${(activity.availableSpots / activity.totalSpots) * 100}%` }} />
                 </div>
              </div>

              <Button 
                onClick={handleAction}
                disabled={activity.isCanceled || activity.isConcluded || (!isRegistered && isSoldOut) || registerMutation.isPending || cancelMutation.isPending}
                className={`w-full h-16 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                  activity.isCanceled || activity.isConcluded
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-none shadow-none' :
                  isRegistered 
                    ? 'bg-red-50 hover:bg-red-100 text-red-600 border-none'
                    : 'bg-senac-blue hover:bg-senac-blue/90 text-white shadow-xl shadow-senac-blue/20'
                }`}
              >
                {activity.isCanceled ? "Evento Cancelado" :
                 activity.isConcluded ? "Evento Concluído" :
                 registerMutation.isPending || cancelMutation.isPending ? "Processando..." :
                 isRegistered ? "Cancelar Inscrição" : 
                 isSoldOut ? "Vagas Esgotadas" : 
                 "Garantir minha vaga"}
              </Button>

              {/* Botão de Certificado - visível apenas para alunos inscritos em eventos concluídos */}
              {isLogged && isAluno && isRegistered && activity.isConcluded && !activity.isCanceled && (
                <button
                  onClick={handleDownloadCertificate}
                  className="w-full h-16 rounded-2xl font-black text-sm uppercase tracking-widest transition-all mt-3 flex items-center justify-center gap-2 bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02]"
                >
                  <Download className="w-5 h-5" />
                  Baixar Certificado de Conclusão
                </button>
              )}

              {/* Botão de Confirmar Presença - visível para alunos inscritos */}
              {isLogged && isAluno && isRegistered && !activity.isCanceled && !activity.isConcluded && (
                <button
                  onClick={() => confirmAttendanceMutation.mutate()}
                  disabled={confirmAttendanceMutation.isPending || currentAttendance === "Presente"}
                  className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all mt-3 flex items-center justify-center gap-2 ${
                    currentAttendance === "Presente"
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 cursor-default'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-2 border-emerald-200 hover:border-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {confirmAttendanceMutation.isPending
                    ? "Confirmando..."
                    : currentAttendance === "Presente"
                      ? "Presença Confirmada!"
                      : "Confirmar Presença"}
                </button>
              )}

              {isLogged && isAluno && isRegistered && !isEventToday && !activity.isCanceled && !activity.isConcluded && (
                <p className="text-center text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-wider">
                  Nota: Você está confirmando presença antecipadamente.
                </p>
              )}

              {!isLogged && <p className="text-center text-xs text-slate-400 mt-4 font-bold">Você será redirecionado para o login.</p>}
            </div>
          </div>
          
          <div className="mt-12 pt-12 border-t border-slate-100 relative z-10">
            <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">Sobre a Atividade</h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              {activity.description}
            </p>
          </div>
        </div>
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
                Voltar
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
