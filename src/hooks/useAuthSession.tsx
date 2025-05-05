// hooks/useAuthSession.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

// Definir o tipo de usuário
interface User {
    id: string;
    name: string;
    email: string;
    companyId: number;
  }
  
  // Definir o tipo da sessão
  interface Session {
    user: User;
    expires: string;
  }

export function useAuthSession() {
  const { data, status } = useSession();
  const [devSession, setDevSession] = useState<Session | null>(null);
  
  useEffect(() => {
    // Verificar modo de desenvolvimento no cliente
    if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
      setDevSession({
        user: {
          id: 'dev-user-id',
          name: 'Desenvolvedor',
          email: 'dev@example.com',
          companyId: 1,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }, []);
  
  // Se estamos em modo de desenvolvimento e temos uma sessão mock, use-a
  if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true' && devSession) {
    return { 
      data: devSession, 
      status: 'authenticated' 
    };
  }
  
  // Caso contrário, use o comportamento normal
  return { data, status };
}