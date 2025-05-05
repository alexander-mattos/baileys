import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Pular verificação de autenticação em desenvolvimento
    if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
        return NextResponse.next();
    }

    // Caminhos que não precisam de autenticação
    const publicPaths = ['/login', '/register', '/api/auth'];

    // Verificar se o caminho atual é público
    const isPublicPath = publicPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    );

    if (isPublicPath) {
        return NextResponse.next();
    }

    // Verificar token JWT
    const token = getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    });

    // Se não houver token, redirecionar para login
    if (!token) {
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', request.url);
        return NextResponse.redirect(url);
    }

    // Obter a resposta
    const response = NextResponse.next();

    // Adicionar cabeçalhos CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return NextResponse.next();
}

// Configurar os caminhos para aplicar o middleware
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
        '/api/:path*'
    ],
}