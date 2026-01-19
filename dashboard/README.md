# 🚀 MutanoX-API Dashboard

Dashboard avançado e interativo para monitoramento em tempo real da MutanoX-API v14.

## ✨ Funcionalidades

### 📊 Dashboard em Tempo Real
- **Métricas ao vivo**: Visualização instantânea de todas as requisições
- **Gráficos dinâmicos**: Atualização automática com Chart.js
- **WebSocket integration**: Comunicação em tempo real com Socket.io
- **Multiple charts**: Requisições por hora, tempo de resposta, uso por endpoint, status codes

### 📚 Documentação Interativa
- **Teste de endpoints**: Teste cada endpoint diretamente do dashboard
- **Parâmetros dinâmicos**: Insira parâmetros e veja respostas em tempo real
- **Organização por categoria**: Tools, AI, Search, Brazilian queries
- **Respostas formatadas**: JSON syntax-highlighted

### 🔍 Gerenciamento Avançado
- **Logs detalhados**: Histórico completo de todas as requisições
- **Exportação de logs**: Baixe logs em formato JSON
- **Performance metrics**: Tempo médio de resposta por endpoint
- **Success rate tracking**: Taxa de sucesso em tempo real
- **Active connections**: Monitoramento de conexões WebSocket ativas

### 📈 Analytics
- **Requisições por hora**: Gráfico de linha mostrando tendências
- **Tempo de resposta**: Análise de performance ao longo do tempo
- **Uso por endpoint**: Barras mostrando os endpoints mais utilizados
- **Status distribution**: Gráfico de rosca mostrando sucesso/erro

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+ ou Bun
- MutanoX-API v14 rodando em `http://localhost:3000`

### Setup

```bash
# Navegue até o diretório do mini-service
cd mini-services/api-dashboard

# Instale as dependências
bun install

# Inicie o servidor
bun run dev
```

O dashboard estará disponível em `http://localhost:3003`

## 🔧 Configuração

### Porta
O servidor do dashboard roda por padrão na porta **3003**. Para alterar:

```javascript
// src/server.js
const PORT = 3003; // Altere conforme necessário
```

### Integração com API Principal

A API principal já está configurada para enviar logs automaticamente para o dashboard através do middleware `dashboard-logger.js`. Certifique-se de que:

1. A API está rodando em `http://localhost:3000`
2. O dashboard está rodando em `http://localhost:3003`
3. O middleware está importado em `mutano-x-api/index.js`

## 📱 Estrutura do Dashboard

### Abas de Navegação

#### 1. **Dashboard**
- Cards com métricas principais (Total, Sucesso, Erro, Taxa de Sucesso)
- Gráficos em tempo real:
  - Requisições por hora (line chart)
  - Tempo de resposta (line chart)
  - Uso por endpoint (bar chart)
  - Status das requisições (doughnut chart)
- Requisições recentes com timestamps

#### 2. **Documentação**
- Documentação completa de todos os 16 endpoints
- Organização por categoria (Tools, AI, Search, BR)
- Descrição de cada endpoint
- Lista de parâmetros (required/optional)

#### 3. **Endpoints**
- Gerenciamento detalhado de cada endpoint
- Métricas por endpoint:
  - Total de requisições
  - Requisições bem-sucedidas
  - Requisições com erro
  - Tempo médio de resposta
  - Última requisição
- Interface de teste para cada endpoint

#### 4. **Logs**
- Logs em tempo real de todas as requisições
- Status de conexão WebSocket
- Opção de limpar logs
- Opção de exportar logs em JSON

## 🎨 Tecnologias Utilizadas

- **Express.js**: Servidor web
- **Socket.io**: Comunicação em tempo real
- **Chart.js**: Gráficos e visualizações
- **Vanilla JS**: Frontend sem frameworks
- **WebSocket**: Comunicação bidirecional

## 🔌 API do Dashboard

### Endpoints Disponíveis

#### POST `/api/log-request`
Envia dados de uma requisição para o dashboard.

**Body:**
```json
{
  "endpoint": "/api/ai/chat",
  "method": "GET",
  "statusCode": 200,
  "responseTime": 123,
  "requestData": {
    "query": { ... },
    "body": { ... }
  }
}
```

#### GET `/api/metrics`
Retorna todas as métricas atuais.

**Response:**
```json
{
  "totalRequests": 150,
  "successfulRequests": 145,
  "failedRequests": 5,
  "endpoints": { ... },
  "recentRequests": [ ... ],
  "activeConnections": 3
}
```

#### GET `/api/endpoints`
Retorna a lista de todos os endpoints disponíveis.

**Response:**
```json
{
  "tools": [ ... ],
  "ai": [ ... ],
  "search": [ ... ],
  "br": [ ... ]
}
```

## 🔌 Eventos WebSocket

### Client → Server

#### `get:endpoint-details`
Solicita detalhes de um endpoint específico.

```javascript
socket.emit('get:endpoint-details', '/api/ai/chat');
```

#### `clear:history`
Limpa o histórico de logs.

```javascript
socket.emit('clear:history');
```

### Server → Client

#### `metrics:initial`
Envia métricas iniciais quando um cliente se conecta.

```javascript
socket.on('metrics:initial', (metrics) => {
  // Inicializar dashboard com métricas
});
```

#### `metrics:update`
Envia atualização de métricas em tempo real.

```javascript
socket.on('metrics:update', (data) => {
  // Atualizar dashboard
});
```

#### `dashboard:update`
Envia atualização completa do dashboard (a cada 1 segundo).

```javascript
socket.on('dashboard:update', (data) => {
  // Atualizar gráficos e métricas
});
```

#### `connection:update`
Atualiza o número de conexões ativas.

```javascript
socket.on('connection:update', (data) => {
  document.getElementById('activeConnections').textContent = data.activeConnections;
});
```

## 📊 Métricas Disponíveis

### Métricas Gerais
- `totalRequests`: Total de requisições processadas
- `successfulRequests`: Requisições com status 2xx-3xx
- `failedRequests`: Requisições com status 4xx-5xx
- `successRate`: Taxa de sucesso em porcentagem
- `activeConnections`: Número de conexões WebSocket ativas

### Métricas por Endpoint
- `totalRequests`: Total de requisições para o endpoint
- `successfulRequests`: Requisições bem-sucedidas
- `failedRequests`: Requisições com erro
- `averageResponseTime`: Tempo médio de resposta (ms)
- `lastRequest`: Timestamp da última requisição
- `hourlyRequests`: Requisições por hora

## 🎯 Casos de Uso

### Monitoramento de Produção
```javascript
// O dashboard coleta automaticamente todas as requisições
// Basta iniciar o servidor e acessar http://localhost:3003
```

### Debug de Endpoints
```javascript
// Use a aba "Endpoints" para testar cada endpoint
// Veja respostas e tempos de resposta em tempo real
```

### Análise de Performance
```javascript
// Use os gráficos para identificar:
// - Endpoints mais lentos
// - Horas de pico de uso
// - Taxa de erro por endpoint
```

### Exportação de Logs
```javascript
// Na aba "Logs", clique em "Exportar Logs"
// Baixe um arquivo JSON com todos os logs recentes
```

## 🔒 Segurança

- CORS habilitado para desenvolvimento
- Rate limiting configurado na API principal
- Logs não expõem dados sensíveis (API keys são ocultadas)
- WebSocket usa autenticação opcional

## 🐛 Troubleshooting

### Dashboard não está recebendo logs
1. Verifique se a API está rodando em `http://localhost:3000`
2. Verifique se o dashboard está rodando em `http://localhost:3003`
3. Verifique se o middleware `dashboard-logger.js` está importado na API
4. Verifique o console para erros de conexão

### Gráficos não estão atualizando
1. Verifique se o WebSocket está conectado (indicador verde)
2. Verifique o console do navegador para erros
3. Recarregue a página

### Testes de endpoint falhando
1. Verifique se a API está rodando
2. Verifique se os parâmetros estão corretos
3. Verifique o console para erros de CORS

## 📝 Notas

- O dashboard armazena até 1000 registros de tempo de resposta
- Mantém as últimas 50 requisições recentes
- Atualizações em tempo real a cada 1 segundo
- Logs podem ser exportados em qualquer momento
- Conexões WebSocket são gerenciadas automaticamente

## 🤝 Contribuindo

Para contribuir com o desenvolvimento do dashboard:

1. Faça fork do projeto
2. Crie uma branch para sua feature
3. Faça commit das suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto faz parte da MutanoX-API v14 e segue a mesma licença.

---

**Desenvolvido por:** MutanoX
**Versão:** 1.0.0
**Atualizado:** 2024
