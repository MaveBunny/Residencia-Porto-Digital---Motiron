"use client";

import { useState } from "react";
import { Search, Calendar, MapPin, ArrowRight, Filter, Timer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/data/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import Link from "next/link";
import { isAuthenticated, getUserId, logout, getUserName, getUserType } from "@/utils/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";



export default function Atividades() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      setUserId(getUserId());
      setUserName(getUserName());
      setUserRole(getUserType());
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: api.getActivities
  });
  const events: Event[] = Array.isArray(data) ? data : [];

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories
  });
  const dynamicCategories = Array.isArray(categoriesData) ? ["Todos", ...categoriesData.map(c => c.name)] : ["Todos"];

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "Todos" || event.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 pt-24 px-6 pb-24">
      {/* Navbar simplificada */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter text-slate-900 uppercase">
            Senac<span className="text-senac-orange">Eventos</span>
          </Link>
          <div className="flex gap-4 items-center">
            {isAuthenticated() ? (
              <>
                {userName && (
                  <span className="text-sm font-black text-senac-orange capitalize bg-senac-orange/10 px-3 py-1 rounded-full hidden sm:inline-block mr-2">
                    Olá, {userName}
                  </span>
                )}
                {userRole === "aluno" && (
                  <Link href="/agenda" className="text-sm font-bold text-slate-600 hover:text-senac-blue mr-2">Minha Agenda</Link>
                )}
                {userRole === "gestor" && (
                  <Link href="/dashboard" className="text-sm font-bold text-slate-600 hover:text-senac-blue mr-2">Dashboard</Link>
                )}
                <button
                  onClick={() => { logout(); window.location.href = '/'; }}
                  className="text-sm font-black text-red-500 bg-red-50 hover:bg-red-100 px-4 py-1.5 rounded-full transition-all uppercase tracking-widest text-[10px]"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link href="/login">
                <Button className="bg-senac-blue text-white hover:bg-senac-blue/90 rounded-full px-8 h-11 font-black uppercase tracking-[0.2em] text-[10px]">
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4">
            Catálogo de <span className="text-senac-blue">Atividades</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">Encontre as melhores palestras, workshops e conferências. Explore por categorias ou pesquise diretamente.</p>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-12 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-1/3 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-senac-blue transition-colors" />
            <Input 
              type="text" 
              placeholder="Pesquisar atividades..." 
              className="w-full pl-12 h-14 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-senac-blue/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-1 flex gap-2 overflow-x-auto w-full pb-2 md:pb-0">
            {dynamicCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap ${
                  activeCategory === category 
                  ? "bg-senac-blue text-white shadow-md shadow-senac-blue/20" 
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-senac-blue"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group h-full border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2rem] overflow-hidden bg-white">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={event.image || null} 
                      alt={event.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-[1000ms]"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className="bg-white/95 text-senac-blue border-none px-4 py-1.5 rounded-xl shadow-sm font-black text-[10px] tracking-widest uppercase">
                        {event.category}
                      </Badge>
                      {event.isCanceled && (
                        <Badge className="bg-red-500/90 text-white border-none px-4 py-1.5 rounded-xl shadow-sm font-black text-[10px] tracking-widest uppercase">
                          Cancelado
                        </Badge>
                      )}
                      {event.isConcluded && (
                        <Badge className="bg-indigo-500/90 text-white border-none px-4 py-1.5 rounded-xl shadow-sm font-black text-[10px] tracking-widest uppercase">
                          Concluído
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardHeader className="pt-6 px-6 pb-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-3">
                       <span className="text-senac-orange flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {event.date}</span>
                       <span className={`px-2 py-1 rounded-md ${event.isCanceled ? 'bg-red-100 text-red-600' : event.isConcluded ? 'bg-indigo-100 text-indigo-600' : event.availableSpots > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                         {event.isCanceled ? 'Cancelado' : event.isConcluded ? 'Concluído' : event.availableSpots > 0 ? `${event.availableSpots} Vagas` : 'Esgotado'}
                       </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-senac-blue transition-colors leading-tight">
                      {event.title}
                    </h3>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <p className="text-slate-500 line-clamp-2 text-sm font-medium mb-4">
                      {event.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <MapPin className="w-4 h-4 text-slate-300" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <Timer className="w-4 h-4 text-slate-300" />
                        {event.hours || 0} Horas
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0 mt-auto">
                    <Link href={`/atividades/${event.id}`} className="w-full">
                      <Button variant="outline" className="w-full h-12 rounded-xl group/btn transition-all font-black uppercase text-[10px] tracking-[0.2em] border-slate-200 hover:border-senac-blue hover:bg-senac-blue hover:text-white">
                        Detalhes e Inscrição
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Nenhuma atividade encontrada.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
