"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Calendar, MapPin, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { events } from "@/data/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { isAuthenticated, getUserType, logout, getUserId, getUserName } from "@/utils/auth";

const categories = ["Todos", "Workshop", "Palestra", "Networking", "Conferência"];

// ========== HERO MEDIA (IMAGENS + VÍDEOS) ==========
const heroMedia = [
  {
    id: 1,
    type: "image",
    url: "https://img.freepik.com/fotos-gratis/reuniao-de-trabalho-em-equipe-com-empresarios_23-2148825942.jpg?semt=ais_hybrid&w=740&q=80",
    title: "Conectando Ideias",
    subtitle: "A maior rede de inovacao corporativa do pais."
  },
  {
    id: 2,
    type: "image",
    url: "https://blog.ebaconline.com.br/blog/wp-content/uploads/2024/11/21-o-que-e-networking-significado-para-que-serve-tipos-e-exemplos-como-usar-na-pratica.png",
    title: "Networking de Elite",
    subtitle: "Sua rede de contatos estrategicos comeca aqui."
  },
  {
    id: 3,
    type: "image",
    url: "https://www.remessaonline.com.br/blog/wp-content/uploads/2022/05/profissoes-do-futuro.jpg",
    title: "Futuro em Foco",
    subtitle: "Evolua sua carreira com os maiores especialistas."
  },
];

// anima o texto letra por letra com cursor piscando no final
function CodeReveal({ text, className }: { text: string; className?: string }) {
  return (
    <motion.span className={className}>
      {text.split("").map((char, i) => (
        <motion.span
          key={`${text}-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.1,
            delay: i * 0.03,
            ease: "easeOut"
          }}
        >
          {char}
        </motion.span>
      ))}
      {/* cursor piscando */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ 
          repeat: Infinity, 
          duration: 0.8,
          ease: "easeInOut"
        }}
        className="inline-block w-[2px] h-[1em] bg-senac-orange ml-1 align-middle"
      />
    </motion.span>
  );
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [currentMedia, setCurrentMedia] = useState(0);
  const [isLogged, setIsLogged] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loggedUserName, setLoggedUserName] = useState<string | null>(null);
  const eventsSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsLogged(isAuthenticated());
    setUserRole(getUserType());
    setLoggedUserName(getUserName());
  }, []);

  // troca o media automaticamente a cada 8 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMedia((prev) => (prev + 1) % heroMedia.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // rola ate a secao de eventos ao clicar no botao do hero
  const scrollToEvents = () => {
    eventsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // filtra por texto e por categoria ao mesmo tempo
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "Todos" || event.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* nav fixa no topo com blur */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tighter text-slate-900 uppercase">
            Senac<span className="text-senac-orange">Eventos</span>
          </div>
          <div className="flex gap-4 items-center">
            {isLogged ? (
              <>
                <Link href="/atividades" className="text-sm font-bold text-slate-600 hover:text-senac-blue mr-2">Catálogo</Link>
                {userRole === "aluno" && (
                  <Link href="/agenda" className="text-sm font-bold text-slate-600 hover:text-senac-blue mr-4">Minha Agenda</Link>
                )}
                {userRole === "gestor" && (
                  <Link href="/dashboard" className="text-sm font-bold text-slate-600 hover:text-senac-blue mr-4">Dashboard</Link>
                )}
                {loggedUserName && (
                  <span className="text-sm font-black text-senac-orange capitalize bg-senac-orange/10 px-3 py-1 rounded-full hidden sm:inline-block mr-2">
                    Olá, {loggedUserName}
                  </span>
                )}
                <Button 
                  onClick={() => {
                    logout();
                    setIsLogged(false);
                    setUserRole(null);
                  }} 
                  className="bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full px-6 h-10 font-black uppercase tracking-widest text-[10px] shadow-none border-none transition-all"
                >
                  Sair
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button className="bg-senac-blue text-white hover:bg-senac-blue/90 rounded-full px-8 h-11 font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-senac-blue/20 border-none transition-all hover:scale-105 active:scale-95">
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* hero com imagem/video em loop e transicao suave */}
      <section className="relative h-[100vh] w-full overflow-hidden bg-slate-950">
        <AnimatePresence>
          <motion.div
            key={currentMedia}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
          >
            {/* Renderização condicional: vídeo ou imagem */}
            {heroMedia[currentMedia].type === "video" ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onCanPlay={(e) => {
                  e.currentTarget.play().catch(() => {
                    console.log("autoplay bloqueado pelo navegador");
                  });
                }}
                className="w-full h-full object-cover opacity-60 scale-105"
                src={heroMedia[currentMedia].url}
              />
            ) : (
              <img
                src={heroMedia[currentMedia].url || null}
                alt={heroMedia[currentMedia].title}
                className="w-full h-full object-cover opacity-60 scale-105"
              />
            )}
            {/* gradiente para escurecer a base e destacar o texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-slate-900/60" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <div className="z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="bg-senac-orange text-white border-none mb-8 px-5 py-2 rounded-full text-xs font-black tracking-[0.2em] uppercase shadow-lg shadow-senac-orange/20">
                EXCLUSIVO SENAC
              </Badge>
            </motion.div>
            
            <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter uppercase mb-6 leading-[0.9] flex flex-col items-center min-h-[1.5em] justify-center">
              <CodeReveal text={heroMedia[currentMedia].title} />
            </h1>
            
            <p className="text-xl md:text-3xl text-slate-300 max-w-3xl mx-auto font-light mb-12 italic min-h-[2em] flex items-center justify-center">
              <CodeReveal text={heroMedia[currentMedia].subtitle} />
            </p>

            <div className="flex gap-6 pointer-events-auto justify-center">
              <Button 
                onClick={scrollToEvents}
                className="h-16 px-12 rounded-full bg-white text-slate-900 hover:bg-senac-orange hover:text-white font-black text-xl transition-all duration-500 hover:scale-110 shadow-2xl"
              >
                Explorar Agora
              </Button>
            </div>
          </div>
        </div>

        {/* controles do carousel: setas e indicadores de slide */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-10 z-20">
          <button 
            onClick={() => setCurrentMedia((prev) => (prev - 1 + heroMedia.length) % heroMedia.length)}
            className="text-white/30 hover:text-white transition-all transform hover:scale-125"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <div className="flex gap-4">
            {heroMedia.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentMedia(i)}
                className={`h-1.5 transition-all duration-500 rounded-full ${currentMedia === i ? "w-16 bg-senac-orange" : "w-6 bg-white/10 hover:bg-white/30"}`}
              />
            ))}
          </div>
          <button 
            onClick={() => setCurrentMedia((prev) => (prev + 1) % heroMedia.length)}
            className="text-white/30 hover:text-white transition-all transform hover:scale-125"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      </section>

      {/* secao principal com busca e grid de eventos */}
      <section ref={eventsSectionRef} className="relative z-30 px-6 py-24">
        <div className="max-w-7xl mx-auto flex flex-col items-center mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full max-w-2xl"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-senac-blue/5 blur-3xl rounded-[3rem] group-focus-within:bg-senac-blue/10 transition-all" />
              <div className="relative bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden border border-slate-100">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 w-7 h-7 group-focus-within:text-senac-blue transition-colors" />
                <Input 
                  id="search"
                  type="text" 
                  placeholder="Pesquisar por nome, categoria ou local..." 
                  className="w-full pl-20 pr-10 h-24 rounded-none border-none bg-transparent text-xl font-medium focus:ring-0 placeholder:text-slate-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <p className="text-center mt-6 text-slate-400 font-medium text-sm">Experimente: "Workshop", "São Paulo" ou "Inovação"</p>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-10">
            <div>
              <Badge className="bg-senac-blue/10 text-senac-blue border-none mb-4 px-3 py-1 font-bold">EVENTOS AO VIVO</Badge>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                Próximas <br /><span className="text-senac-blue">Experiências</span>
              </h2>
            </div>
            {/* filtros por categoria */}
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  id={`filter-${category}`}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-8 py-3.5 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${
                    activeCategory === category 
                    ? "bg-senac-blue text-white shadow-2xl shadow-senac-blue/30 scale-105" 
                    : "bg-white text-slate-400 border border-slate-100 hover:border-senac-blue/30 hover:text-slate-600"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* cards dos eventos com animacao ao entrar na tela */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card id={`event-${event.id}`} className="group h-full border-none shadow-[0_8px_32px_rgba(0,0,0,0.02)] hover:shadow-[0_40px_80px_-12px_rgba(0,0,0,0.12)] transition-all duration-1000 rounded-[3rem] overflow-hidden bg-white">
                  <div className="relative aspect-[1.1/1] overflow-hidden">
                    <img 
                      src={event.image || null} 
                      alt={event.title}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-[2000ms]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="absolute top-6 left-6">
                      <Badge className="bg-white/95 backdrop-blur text-senac-blue border-none px-5 py-2 rounded-2xl shadow-xl font-black text-[10px] tracking-widest uppercase italic">
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pt-10 px-10">
                    <div className="flex items-center gap-2 text-senac-orange text-xs font-black uppercase tracking-[0.2em] mb-4">
                      <Calendar className="w-4 h-4" />
                      {event.date} • {event.time}
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 group-hover:text-senac-blue transition-colors leading-[1.1] tracking-tight uppercase">
                      {event.title}
                    </h3>
                  </CardHeader>
                  <CardContent className="px-10 pb-6">
                    <p className="text-slate-500 line-clamp-2 mb-8 leading-relaxed font-light text-base">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-senac-orange" />
                      </div>
                      {event.location}
                    </div>
                  </CardContent>
                  <CardFooter className="p-10 pt-0">
                    <Link href={`/atividades/${event.id}`} className="w-full">
                      <Button id={`view-${event.id}`} variant="ghost" className="w-full h-16 bg-slate-50 hover:bg-senac-blue hover:text-white text-slate-900 rounded-[1.5rem] group/btn transition-all duration-500 font-black uppercase text-xs tracking-[0.3em] shadow-sm hover:shadow-xl">
                        VER DETALHES
                        <ArrowRight className="w-5 h-5 ml-3 group-hover/btn:translate-x-2 transition-transform" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* exibe mensagem quando nenhum evento bate com o filtro */}
          {filteredEvents.length === 0 && (
            <div className="text-center py-40 bg-white rounded-[4rem] border border-dashed border-slate-200">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Search className="w-10 h-10 text-slate-200" />
              </div>
              <p className="text-slate-400 text-2xl font-light mb-8">Nenhum evento encontrado sob este critério.</p>
              <Button variant="link" className="text-senac-blue font-black tracking-[0.3em] uppercase text-sm hover:no-underline hover:opacity-70 transition-opacity" onClick={() => { setSearchTerm(""); setActiveCategory("Todos"); }}>
                RESETAR FILTROS
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* cta de cadastro no fim da pagina */}
      <section className="max-w-7xl mx-auto px-6 mt-32 mb-40 text-center">
        <div className="bg-senac-blue rounded-[5rem] p-24 relative overflow-hidden shadow-3xl shadow-senac-blue/20">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white opacity-[0.03] rounded-full -mr-[200px] -mt-[200px]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-senac-orange opacity-[0.05] rounded-full -ml-[300px] -mb-[300px] blur-[100px]" />
          
          <h2 className="text-5xl md:text-8xl font-black text-white mb-8 leading-[0.9] uppercase tracking-tighter">
            O SEU FUTURO<br /><span className="text-senac-orange">COMEÇA AQUI</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto mb-14 text-xl font-light leading-relaxed">
            Faça parte da maior rede de eventos corporativos. Conecte-se com as melhores empresas e mude sua trajetória.
          </p>
          <Link href="/login">
            <Button className="h-20 px-16 rounded-full bg-white text-senac-blue hover:bg-senac-orange hover:text-white font-black text-xl shadow-2xl transition-all duration-500 hover:scale-110 border-none group">
              PARTICIPE AGORA
              <ArrowRight className="w-6 h-6 ml-4 group-hover:translate-x-2 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* footer */}
      <footer className="bg-black py-32 px-6 overflow-hidden relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-32">
            <div className="col-span-1 md:col-span-2">
              <div className="text-3xl font-black tracking-tighter text-white uppercase mb-8">
                Senac<span className="text-senac-orange">Eventos</span>
              </div>
              <p className="text-slate-500 max-w-sm font-light leading-relaxed text-lg">
                Referência nacional em educação corporativa e organização de eventos de alto impacto.
              </p>
            </div>
            <div>
              <h4 className="font-black text-white uppercase tracking-[0.3em] text-[10px] mb-10">CONTEÚDO</h4>
              <ul className="space-y-6 text-slate-500 font-bold text-xs tracking-widest uppercase">
                <li><a href="#" className="hover:text-senac-orange transition-colors">Workshops</a></li>
                <li><a href="#" className="hover:text-senac-orange transition-colors">Palestras</a></li>
                <li><a href="#" className="hover:text-senac-orange transition-colors">Conferências</a></li>
                <li><a href="#" className="hover:text-senac-orange transition-colors">Inovação</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white uppercase tracking-[0.3em] text-[10px] mb-10">INSTITUCIONAL</h4>
              <ul className="space-y-6 text-slate-500 font-bold text-xs tracking-widest uppercase">
                <li><a href="#" className="hover:text-senac-orange transition-colors">Quem Somos</a></li>
                <li><a href="#" className="hover:text-senac-orange transition-colors">Compliance</a></li>
                <li><a href="#" className="hover:text-senac-orange transition-colors">Segurança</a></li>
                <li><a href="#" className="hover:text-senac-orange transition-colors">Blog</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 gap-12">
            <div className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
              © 2026 Senac Eventos. O Futuro é Agora.
            </div>
            <div className="flex gap-12">
              <a 
                href="https://www.instagram.com/senacpe/" 
                target="_blank" 
                rel="noreferrer"
                className="text-slate-600 hover:text-senac-orange text-[10px] font-black uppercase tracking-[0.3em] transition-all"
              >
                Instagram
              </a>
              <a 
                href="https://www.youtube.com/user/SenacPernambuco" 
                target="_blank" 
                rel="noreferrer"
                className="text-slate-600 hover:text-senac-orange text-[10px] font-black uppercase tracking-[0.3em] transition-all"
              >
                YouTube
              </a>
            </div>
          </div>
        </div>
        {/* detalhe de luz no fundo do footer */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-senac-orange/20 rounded-full blur-[150px]" />
        </div>
      </footer>
    </div>
  );
}
