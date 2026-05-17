import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { matricula, senha } = await request.json();

    const { data: user, error } = await supabase
      .from('usuario')
      .select('id, nome, matricula, tipo')
      .eq('matricula', matricula)
      .eq('senha', senha)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return NextResponse.json(
          { success: false, message: 'Credenciais inválidas' },
          { status: 401 }
        );
      }
      throw error;
    }

    if (user) {
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          nome: user.nome,
          matricula: user.matricula,
          tipo: user.tipo
        }
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Credenciais inválidas' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
