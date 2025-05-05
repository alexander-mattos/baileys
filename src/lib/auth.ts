// lib/auth.ts
import { NextRequest, NextResponse } from 'next/server';

// Sessão fictícia para desenvolvimento
export const devSession = {
    user: {
        id: 'dev-user-id',
        name: 'Desenvolvedor',
        email: 'dev@example.com',
        companyId: 1, // ID da empresa para desenvolvimento
    }
};

// Detectar se estamos em modo de desenvolvimento para autenticação
export const isDevAuthMode = () => {
    return process.env.NEXT_PUBLIC_SKIP_AUTH === 'true';
};

/**
 * Middleware simples para verificar autenticação
 * @param handler Função que processa a requisição após verificação
 */
export function withAuth(handler: (req: NextRequest, session: any) => Promise<NextResponse>) {
    return async (request: NextRequest) => {
        // Em modo de desenvolvimento, use a sessão fictícia
        if (isDevAuthMode()) {
            console.log('🔓 Usando autenticação de desenvolvimento');
            return handler(request, devSession);
        }

        // Em modo de produção, verificar token no cookie ou header
        // Aqui você implementaria a lógica real de verificação de token
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const token = authHeader.substring(7);

        try {
            // Aqui você verificaria o token (exemplo simplificado)
            // Na prática, você usaria uma biblioteca como jwt para validar o token
            if (token === 'invalid-token') {
                throw new Error('Token inválido');
            }

            // Simular recuperação de dados do usuário
            const userSession = {
                user: {
                    id: '123',
                    name: 'Usuário Real',
                    email: 'usuario@exemplo.com',
                    companyId: 1,
                }
            };

            return handler(request, userSession);
        } catch (error) {
            console.error('Erro na autenticação:', error);
            return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
        }
    };
}