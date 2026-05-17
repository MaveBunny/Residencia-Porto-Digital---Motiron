"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "motion/react";
import { ArrowLeft, Lock, User, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/utils/auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  matricula: z.string().min(1, "A matrícula é obrigatória."),
  senha: z.string().min(1, "A senha é obrigatória.")
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError("");
    const userType = await login(data.matricula, data.senha);

    if (userType === "gestor") {
      router.push("/dashboard");
    } else if (userType === "aluno") {
      router.push("/");
    } else {
      setError("Credenciais inválidas.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-senac-blue/5 via-slate-50 to-slate-50">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-600 hover:text-senac-blue transition-colors group">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span className="font-medium text-sm">Voltar para Home</span>
      </Link>

      {/* card central com entrada suave */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-slate-100">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-senac-blue rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-senac-blue/20 shadow-xl">
              <Lock className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Acesso Restrito</h1>
            <p className="text-slate-500">Área exclusiva para colaboradores e alunos</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* mensagem de erro so aparece se as credenciais forem invalidas */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 animate-shake">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="matricula" className="text-sm font-semibold text-slate-700 ml-1">Matrícula</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input 
                  id="matricula"
                  type="text" 
                  placeholder="Ex: gestor ou aluno" 
                  className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-slate-900"
                  {...register("matricula")}
                />
              </div>
              {errors.matricula && <p className="text-red-500 text-xs mt-1 ml-1">{errors.matricula.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label htmlFor="senha" className="text-sm font-semibold text-slate-700">Senha</label>
                <a href="#" className="text-xs text-senac-orange hover:underline font-medium">Esqueceu a senha?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input 
                  id="senha"
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="pl-12 pr-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-slate-900"
                  {...register("senha")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.senha && <p className="text-red-500 text-xs mt-1 ml-1">{errors.senha.message}</p>}
            </div>

            <Button 
              id="submit-login" 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-14 bg-senac-blue hover:bg-senac-blue/90 text-white rounded-2xl text-lg font-semibold shadow-lg shadow-senac-blue/10 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4 disabled:opacity-50"
            >
              {isSubmitting ? "Autenticando..." : "Entrar na Plataforma"}
            </Button>
          </form>

          <p className="text-center mt-8 text-sm text-slate-400">
            Problemas com o acesso? <a href="#" className="text-senac-orange hover:underline font-medium">Fale com o TI</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
