// contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
    id: string;
    name: string;
    email: string;
    companyId: number;
};

type AuthContextType = {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Em desenvolvimento, carregar usuário fictício
                if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
                    setUser({
                        id: 'dev-user-id',
                        name: 'Desenvolvedor',
                        email: 'dev@example.com',
                        companyId: 1,
                    });
                    setIsLoading(false);
                    return;
                }

                // Em produção, verificar se há um token e validá-lo
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    setUser(null);
                    setIsLoading(false);
                    return;
                }

                // Verificar o token no servidor (exemplo)
                const response = await fetch('/api/auth/validate', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData.user);
                } else {
                    // Token inválido
                    localStorage.removeItem('auth_token');
                    setUser(null);
                }
            } catch (error) {
                console.error('Erro ao verificar autenticação:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            // Em desenvolvimento, apenas simular login bem-sucedido
            if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
                setUser({
                    id: 'dev-user-id',
                    name: 'Desenvolvedor',
                    email: 'dev@example.com',
                    companyId: 1,
                });
                return true;
            }

            // Em produção, fazer login real
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('auth_token', data.token);
                setUser(data.user);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}