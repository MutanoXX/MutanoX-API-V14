'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Key, Lock, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const ADMIN_API_KEY = 'MutanoX3397';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simular verificação via API (validação local da API Key Admin)
    setTimeout(() => {
      if (apiKey === ADMIN_API_KEY) {
        // Salvar no localStorage
        localStorage.setItem('admin_api_key', apiKey);
        localStorage.setItem('admin_logged_in', 'true');
        toast.success('Login realizado com sucesso!');
        onLogin();
      } else {
        toast.error('API Key inválida! Acesso negado.');
      }
      setLoading(false);
    }, 500);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_api_key');
    localStorage.removeItem('admin_logged_in');
    toast.success('Logout realizado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">MutanoX Premium</h1>
          <p className="text-slate-400">Dashboard de Gestão API - V14</p>
          <p className="text-sm text-slate-500 mt-1">© 2026 MutanoXX</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-white text-center flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              Acesso Administrativo
            </CardTitle>
            <CardDescription className="text-slate-400 text-center">
              Insira sua API Key Admin para acessar o dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-slate-300">
                  API Key Admin
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="apiKey"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gap-2 bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Validando...
                  </>
                ) : (
                  <>
                    Acessar Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="pt-4 border-t border-slate-800">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-xs text-amber-500">
                    <strong>Aviso:</strong> O acesso a este dashboard é restrito. Tentativas não autorizadas serão registradas.
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Sistema de autenticação e monitoramento de API Keys
          </p>
        </div>
      </div>
    </div>
  );
}
