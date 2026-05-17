import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { nome, email, matricula, senha, tipo } = await request.json();

    const { data: user, error } = await supabase
      .from('usuario')
      .insert([
        { nome, email, matricula, senha, tipo: tipo || 'aluno' }
      ])
      .select('id, nome, email, matricula, tipo')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, user, message: 'Usuário cadastrado com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao cadastrar usuário:', error);
    if (error.code === '23505') {
      return NextResponse.json({ success: false, message: 'Matrícula ou E-mail já cadastrados.' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Erro interno ao cadastrar usuário.' }, { status: 500 });
  }
}
