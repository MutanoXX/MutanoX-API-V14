'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Key, Plus, Settings, RotateCw, Trash2, Activity, Shield, AlertCircle, CheckCircle2, Clock, BarChart3, Zap, Server } from 'lucide-react';

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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('24h');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRateLimitEnabled, setNewKeyRateLimitEnabled] = useState(false);
  const [newKeyRateLimitPerHour, setNewKeyRateLimitPerHour] = useState(1000);

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

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, [period]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">MutanoX API Dashboard</h1>
              <p className="text-xs text-muted-foreground">Gestão e Monitoramento</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 hora</SelectItem>
                <SelectItem value="24h">24 horas</SelectItem>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova API Key</DialogTitle>
                  <DialogDescription>
                    Crie uma nova API Key para autenticar suas requisições
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      placeholder="Ex: App Produção"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rate-limit">Habilitar Rate Limit</Label>
                      <Switch
                        id="rate-limit"
                        checked={newKeyRateLimitEnabled}
                        onCheckedChange={setNewKeyRateLimitEnabled}
                      />
                    </div>
                    {newKeyRateLimitEnabled && (
                      <div className="space-y-2">
                        <Label htmlFor="rate-limit-value">Requisições por hora</Label>
                        <Input
                          id="rate-limit-value"
                          type="number"
                          value={newKeyRateLimitPerHour}
                          onChange={(e) => setNewKeyRateLimitPerHour(parseInt(e.target.value) || 1000)}
                        />
                      </div>
                    )}
                  </div>
                  <Button onClick={createAPIKey} className="w-full">
                    Criar API Key
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {loading && !stats ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Activity className="h-12 w-12 text-muted-foreground animate-pulse mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando dashboard...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="keys">API Keys</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {stats && (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">API Keys</CardTitle>
                          <Key className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.summary.totalKeys}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stats.summary.activeKeys} ativas, {stats.summary.inactiveKeys} inativas
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">Total Requisições</CardTitle>
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.summary.totalRequests.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Último período: {period}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.summary.successRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stats.summary.totalErrors} erros no período
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                          <Zap className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.summary.avgResponseTime.toFixed(0)}ms</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tempo de resposta médio
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Top Endpoints
                        </CardTitle>
                        <CardDescription>
                          Endpoints mais utilizados no período
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-3">
                            {stats.topEndpoints.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary">{index + 1}</Badge>
                                  <span className="text-sm font-medium">{item.endpoint}</span>
                                </div>
                                <Badge variant="outline">{item.totalRequests.toLocaleString()}</Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Atividade Recente
                        </CardTitle>
                        <CardDescription>
                          Últimas requisições processadas
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {stats.recentActivity.map((log) => (
                              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <Badge variant={log.statusCode >= 400 ? 'destructive' : 'default'}>
                                  {log.statusCode}
                                </Badge>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{log.endpoint}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {log.apiKey.name} • {new Date(log.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
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
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Gerencie suas API Keys de autenticação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Key Prefix</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requisições</TableHead>
                        <TableHead>Último Uso</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nenhuma API Key encontrada. Crie uma nova para começar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        apiKeys.map((key) => (
                          <TableRow key={key.id}>
                            <TableCell className="font-medium">{key.name}</TableCell>
                            <TableCell>
                              <code className="bg-muted px-2 py-1 rounded text-sm">
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
                                <div>{key.totalRequests.toLocaleString()}</div>
                                {key.totalErrors > 0 && (
                                  <div className="text-xs text-destructive">
                                    {key.totalErrors} erros
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {key.lastUsedAt ? (
                                <span className="text-sm text-muted-foreground">
                                  {new Date(key.lastUsedAt).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">Nunca</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toggleAPIKey(key.id, key.isActive)}
                                  title={key.isActive ? 'Desativar' : 'Ativar'}
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
              <Card>
                <CardHeader>
                  <CardTitle>Logs de Requisições</CardTitle>
                  <CardDescription>
                    Veja o histórico completo de requisições
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Logs em breve...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações</CardTitle>
                  <CardDescription>
                    Configure as opções do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Configurações em breve...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
