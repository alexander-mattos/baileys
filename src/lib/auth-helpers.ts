// lib/auth-helpers.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Sessão fictícia para desenvolvimento
const devSession = {
  user: {
    id: 'dev-user-id',
    name: 'Desenvolvedor',
    email: 'dev@example.com',
    companyId: 1,  // ID da empresa para desenvolvimento
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * Obtém a sessão do usuário, usando uma sessão de desenvolvimento se configurado
 */
export async function getAuthSession() {
  if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
    console.log('🔓 Usando sessão de desenvolvimento');
    return devSession;
  }
  
  return await getServerSession(authOptions);
}

/**
 * Middleware para verificar autenticação com suporte ao modo de desenvolvimento
 */
export async function checkAuth(request: NextRequest, handler: Function) {
  // Obter sessão (real ou de desenvolvimento)
  const session = await getAuthSession();
  
  // Se não há sessão e não estamos pulando autenticação
  if (!session && process.env.NEXT_PUBLIC_SKIP_AUTH !== 'true') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  
  // Executar o handler com a sessão
  return handler(request, session);
}