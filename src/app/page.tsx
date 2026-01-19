'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Key, Plus, Settings, RotateCw, Trash2, Activity, Shield, AlertCircle, CheckCircle2, Clock, BarChart3, Zap, Server, LogOut } from 'lucide-react';
import Login from '@/components/Login';

interface DashboardStats {
  summary: {
    totalKeys: number;
    activeKeys: number;
    inactiveKeys: number;
    totalRequests: number;
    totalErrors: number;
    successRate: number;
    avgResponseTime: number;
  };
  topEndpoints: Array<{ endpoint: string; totalRequests: number }>;
  keys: Array<{
    id: string;
    name: string;
    keyPrefix: string;
    isActive: boolean;
    periodRequests: number;
    totalRequests: number;
    totalErrors: number;
    lastUsedAt: string | null;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    timestamp: string;
    apiKey: {
      id: string;
      name: string;
      keyPrefix: string;
    };
  }>;
}

interface APIKey {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  rateLimitEnabled: boolean;
  rateLimitPerHour: number | null;
  totalRequests: number;
  totalErrors: number;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  logsCount: number;
  endpointsUsed: number;
}

const ADMIN_API_KEY = 'MutanoX3397';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('24h');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRateLimitEnabled, setNewKeyRateLimitEnabled] = useState(false);
  const [newKeyRateLimitPerHour, setNewKeyRateLimitPerHour] = useState(1000);

  // Verificar login ao montar
  useEffect(() => {
    const loggedIn = localStorage.getItem('admin_logged_in') === 'true';
    if (loggedIn) {
      setIsLoggedIn(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, keysRes] = await Promise.all([
        fetch(`/api/dashboard/stats/overview?period=${period}`),
        fetch('/api/dashboard/api-keys'),
      ]);

      const statsData = await statsRes.json();
      const keysData = await keysRes.json();

      if (statsData.success) setStats(statsData.data);
      if (keysData.success) setApiKeys(keysData.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Criar nova API Key
  const createAPIKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Nome da API Key é obrigatório');
      return;
    }

    try {
      const res = await fetch('/api/dashboard/api-keys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          rateLimitEnabled: newKeyRateLimitEnabled,
          rateLimitPerHour: newKeyRateLimitEnabled ? newKeyRateLimitPerHour : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('API Key criada com sucesso!');
        setNewKeyName('');
        setNewKeyRateLimitEnabled(false);
        setNewKeyRateLimitPerHour(1000);
        setShowCreateDialog(false);
        loadData();
      } else {
        toast.error(data.error || 'Erro ao criar API Key');
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Erro ao criar API Key');
    }
  };

  // Toggle API Key active status
  const toggleAPIKey = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/dashboard/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`API Key ${isActive ? 'desativada' : 'ativada'} com sucesso!`);
        loadData();
      } else {
        toast.error(data.error || 'Erro ao atualizar API Key');
      }
    } catch (error) {
      console.error('Error toggling API key:', error);
      toast.error('Erro ao atualizar API Key');
    }
  };

  // Delete API Key
  const deleteAPIKey = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/api-keys/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('API Key deletada com sucesso!');
        setSelectedKey(null);
        loadData();
      } else {
        toast.error(data.error || 'Erro ao deletar API Key');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Erro ao deletar API Key');
    }
  };

  // Rotate API Key
  const rotateAPIKey = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/api-keys/${id}/rotate`, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('API Key rotacionada com sucesso!');
        loadData();
      } else {
        toast.error(data.error || 'Erro ao rotacionar API Key');
      }
    } catch (error) {
      console.error('Error rotating API key:', error);
      toast.error('Erro ao rotacionar API Key');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('admin_api_key');
    localStorage.removeItem('admin_logged_in');
    setIsLoggedIn(false);
    toast.success('Logout realizado com sucesso!');
  };

  // Atualizar dados periodicamente
  useEffect(() => {
    if (isLoggedIn) {
      loadData();
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, period]);

  // Mostrar tela de login se não estiver logado
  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">MutanoX API Dashboard</h1>
              <p className="text-xs text-slate-400">Gestão e Monitoramento - V14</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="1h">1 hora</SelectItem>
                <SelectItem value="24h">24 horas</SelectItem>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Nova API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Criar Nova API Key</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Crie uma nova API Key para autenticar suas requisições
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">Nome</Label>
                    <Input
                      id="name"
                      placeholder="Ex: App Produção"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rate-limit" className="text-slate-300">Habilitar Rate Limit</Label>
                      <Switch
                        id="rate-limit"
                        checked={newKeyRateLimitEnabled}
                        onCheckedChange={setNewKeyRateLimitEnabled}
                      />
                    </div>
                    {newKeyRateLimitEnabled && (
                      <div className="space-y-2">
                        <Label htmlFor="rate-limit-value" className="text-slate-300">Requisições por hora</Label>
                        <Input
                          id="rate-limit-value"
                          type="number"
                          value={newKeyRateLimitPerHour}
                          onChange={(e) => setNewKeyRateLimitPerHour(parseInt(e.target.value) || 1000)}
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                    )}
                  </div>
                  <Button onClick={createAPIKey} className="w-full bg-primary hover:bg-primary/90">
                    Criar API Key
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Sair"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 flex-1">
        {loading && !stats ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Activity className="h-12 w-12 text-slate-500 animate-pulse mx-auto mb-4" />
              <p className="text-slate-400">Carregando dashboard...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-[600px] bg-slate-800/50 border border-slate-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">Visão Geral</TabsTrigger>
              <TabsTrigger value="keys" className="data-[state=active]:bg-slate-700">API Keys</TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-slate-700">Logs</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {stats && (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-slate-200">API Keys</CardTitle>
                          <Key className="h-4 w-4 text-slate-500" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.summary.totalKeys}</div>
                        <p className="text-xs text-slate-400 mt-1">
                          {stats.summary.activeKeys} ativas, {stats.summary.inactiveKeys} inativas
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-slate-200">Total Requisições</CardTitle>
                          <Activity className="h-4 w-4 text-slate-500" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.summary.totalRequests.toLocaleString()}</div>
                        <p className="text-xs text-slate-400 mt-1">
                          Último período: {period}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-slate-200">Taxa de Sucesso</CardTitle>
                          <CheckCircle2 className="h-4 w-4 text-slate-500" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.summary.successRate.toFixed(1)}%</div>
                        <p className="text-xs text-slate-400 mt-1">
                          {stats.summary.totalErrors} erros no período
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-slate-200">Tempo Médio</CardTitle>
                          <Zap className="h-4 w-4 text-slate-500" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.summary.avgResponseTime.toFixed(0)}ms</div>
                        <p className="text-xs text-slate-400 mt-1">
                          Tempo de resposta médio
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-200">
                          <BarChart3 className="h-5 w-5" />
                          Top Endpoints
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Endpoints mais utilizados no período
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-3">
                            {stats.topEndpoints.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary">{index + 1}</Badge>
                                  <span className="text-sm font-medium text-slate-200">{item.endpoint}</span>
                                </div>
                                <Badge variant="outline" className="border-slate-600 text-slate-300">{item.totalRequests.toLocaleString()}</Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-200">
                          <Clock className="h-5 w-5" />
                          Atividade Recente
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Últimas requisições processadas
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {stats.recentActivity.map((log) => (
                              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                                <Badge variant={log.statusCode >= 400 ? 'destructive' : 'default'}>
                                  {log.statusCode}
                                </Badge>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-200 truncate">{log.endpoint}</p>
                                  <p className="text-xs text-slate-400">
                                    {log.apiKey.name} • {new Date(log.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                <span className="text-xs text-slate-400">
                                  {log.responseTime}ms
                                </span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="keys" className="space-y-4">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-200">API Keys</CardTitle>
                  <CardDescription className="text-slate-400">
                    Gerencie suas API Keys de autenticação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800">
                        <TableHead className="text-slate-300">Nome</TableHead>
                        <TableHead className="text-slate-300">Key Prefix</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Requisições</TableHead>
                        <TableHead className="text-slate-300">Último Uso</TableHead>
                        <TableHead className="text-slate-300">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                            Nenhuma API Key encontrada. Crie uma nova para começar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        apiKeys.map((key) => (
                          <TableRow key={key.id} className="border-slate-800">
                            <TableCell className="font-medium text-slate-200">{key.name}</TableCell>
                            <TableCell>
                              <code className="bg-slate-800 px-2 py-1 rounded text-sm text-slate-300">
                                {key.keyPrefix}...
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge variant={key.isActive ? 'default' : 'secondary'}>
                                {key.isActive ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="text-slate-200">{key.totalRequests.toLocaleString()}</div>
                                {key.totalErrors > 0 && (
                                  <div className="text-xs text-red-400">
                                    {key.totalErrors} erros
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {key.lastUsedAt ? (
                                <span className="text-sm text-slate-400">
                                  {new Date(key.lastUsedAt).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-500">Nunca</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toggleAPIKey(key.id, key.isActive)}
                                  title={key.isActive ? 'Desativar' : 'Ativar'}
                                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                  {key.isActive ? (
                                    <AlertCircle className="h-4 w-4" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => rotateAPIKey(key.id)}
                                  title="Rotacionar"
                                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                  <RotateCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja deletar esta API Key?')) {
                                      deleteAPIKey(key.id);
                                    }
                                  }}
                                  title="Deletar"
                                  className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-200">Logs de Requisições</CardTitle>
                  <CardDescription className="text-slate-400">
                    Veja o histórico completo de requisições
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-400">
                    <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Logs em breve...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-200">Configurações</CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure as opções do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-400">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Configurações em breve...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/50 py-6 mt-auto">
        <div className="container text-center">
          <p className="text-sm text-slate-400">
            MutanoX API Dashboard V14 - © 2026 MutanoXX
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Sistema de autenticação e monitoramento de API Keys
          </p>
        </div>
      </footer>
    </div>
  );
}
