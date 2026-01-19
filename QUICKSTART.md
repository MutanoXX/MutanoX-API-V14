# 🚀 MutanoX-API v14 + Dashboard - Guia Rápido

## 📦 Estrutura Completa

```
mutano-x-api/
├── 📁 endpoints/           # 16 endpoints organizados
│   ├── tools/             # Ferramentas (bypass, discord)
│   ├── ai/                # IA (chat, perplexity, cici, felo, jeeves)
│   ├── search/            # Busca (brainly, douyin, github, gimage)
│   └── br/                # Consultas BR (freefire, phone, name, cpf)
├── 📁 utils/              # Utilitários e middlewares
│   ├── logger.js         # Sistema de logs
│   ├── validator.js      # Validação de parâmetros
│   ├── fetch.js          # Funções HTTP
│   ├── response.js       # Respostas padronizadas
│   └── dashboard-logger.js  # Middleware de logging para dashboard
├── 📁 dashboard/          # 🆕 Mini-service de monitoramento
│   ├── public/
│   │   └── index.html    # Dashboard completo com documentação
│   ├── src/
│   │   └── server.js     # Servidor WebSocket (porta 3003)
│   ├── package.json      # Dependências do dashboard
│   └── README.md        # Documentação do dashboard
├── 📄 index.js           # Servidor principal da API (porta 3000)
├── 📄 package.json       # Dependências da API
├── 📄 discloud.config   # Configuração Discloud
└── 📄 README.md         # Documentação completa

mini-services/
└── api-dashboard/         # Cópia independente do dashboard
```

## 🚀 Como Usar

### Passo 1: Iniciar a API Principal

```bash
cd mutano-x-api

# Instalar dependências (se ainda não instalou)
npm install

# Iniciar a API
npm start

# API estará rodando em: http://localhost:3000
```

### Passo 2: Iniciar o Dashboard

```bash
cd mutano-x-api/dashboard

# Instalar dependências do dashboard
npm install

# Iniciar o servidor do dashboard
npm start

# Dashboard estará disponível em: http://localhost:3003
```

### Passo 3: Acessar o Dashboard

Abra seu navegador e acesse:
```
http://localhost:3003
```

## ✨ Funcionalidades do Dashboard

### 📊 Aba Dashboard
- **Cards de métricas em tempo real:**
  - Total de Requisições
  - Requisições Bem-sucedidas
  - Requisições com Erro
  - Taxa de Sucesso

- **4 Gráficos dinâmicos:**
  - 📈 Requisições por Hora (line chart)
  - ⏱️ Tempo de Resposta (line chart)
  - 🎯 Uso por Endpoint (bar chart)
  - ✅ Status das Requisições (doughnut chart)

- **Requisições recentes** com timestamps e status codes

### 📚 Aba Documentação
- Documentação completa de todos os 16 endpoints
- Organização por categoria (Tools, AI, Search, BR)
- Descrição de cada endpoint
- Lista de parâmetros (required/optional)

### 🔗 Aba Endpoints
- **Gerenciamento detalhado de cada endpoint:**
  - Total de requisições
  - Requisições bem-sucedidas
  - Requisições com erro
  - Tempo médio de resposta
  - Última requisição

- **Interface de teste interativa:**
  - Inputs dinâmicos para cada parâmetro
  - Botão para testar endpoint
  - Resposta formatada em JSON
  - Tempo de resposta exibido

### 📝 Aba Logs
- Logs em tempo real de todas as requisições
- Status de conexão WebSocket
- Botão para limpar logs
- Botão para exportar logs em JSON

## 🔌 Integração Automática

A API principal está automaticamente configurada para enviar logs para o dashboard através do middleware `dashboard-logger.js`.

**Como funciona:**
1. Cada requisição à API é interceptada pelo middleware
2. O middleware calcula o tempo de resposta
3. Os dados são enviados para o dashboard via HTTP POST
4. O dashboard processa e distribui via WebSocket
5. Todos os clientes conectados recebem atualizações em tempo real

## 🎯 Testando os Endpoints

### Via Dashboard (Recomendado)
1. Abra o dashboard em http://localhost:3003
2. Vá para a aba "Endpoints"
3. Encontre o endpoint que deseja testar
4. Preencha os parâmetros nos campos
5. Clique em "🚀 Testar Endpoint"
6. Veja a resposta formatada em tempo real

### Via API Diretamente
```bash
# Exemplo: Testar endpoint de Chat AI
curl "http://localhost:3000/api/ai/chat?question=Olá&apikey=freeApikey"

# Exemplo: Consultar CPF
curl "http://localhost:3000/api/br/consultarcpf?cpf=07803272177"

# Exemplo: Buscar no Brainly
curl "http://localhost:3000/api/search/brainly?query=Capital+do+Brasil&apikey=freeApikey"
```

## 📊 Monitoramento em Tempo Real

Ao fazer requisições para a API, você verá:

1. **No Dashboard - Aba Dashboard:**
   - Cards de métricas atualizados instantaneamente
   - Gráficos com novos dados em tempo real
   - Requisições recentes aparecendo na lista

2. **No Dashboard - Aba Endpoints:**
   - Métricas por endpoint atualizadas
   - Tempo médio de resposta recalculado
   - Contadores de sucesso/erro incrementados

3. **No Dashboard - Aba Logs:**
   - Cada requisição logada com detalhes
   - Timestamp, endpoint, método, status code
   - Tempo de resposta

## 🎨 Características Técnicas

### Dashboard
- **Tecnologias:** Express.js, Socket.io, Chart.js
- **Porta:** 3003
- **Comunicação:** WebSocket para atualizações em tempo real
- **Atualização:** Métricas atualizadas a cada 1 segundo
- **Armazenamento:**
  - Últimas 50 requisições recentes
  - Últimos 1000 registros de tempo de resposta

### API Principal
- **Tecnologias:** Express.js, CORS, Helmet, Rate Limiting
- **Porta:** 3000
- **Endpoints:** 16 endpoints organizados em 4 categorias
- **Middleware:** Logging automático para dashboard

## 🔥 Exemplos de Uso

### Monitorar performance de endpoint
```bash
# Fazer várias requisições para o mesmo endpoint
for i in {1..10}; do
  curl "http://localhost:3000/api/ai/chat?question=Teste+$i&apikey=freeApikey"
  sleep 0.5
done

# O dashboard mostrará:
# - Aumento no contador de requisições
# - Gráfico de tempo de resposta atualizado
# - Taxa de sucesso calculada
```

### Testar diferentes endpoints
```bash
# Ferramentas
curl "http://localhost:3000/api/tools/bypass?url=https://example.com&type=turnstile-min&apikey=freeApikey"

# IA
curl "http://localhost:3000/api/ai/perplexity?prompt=Quem+é+o+presidente+do+Brasil?&apikey=freeApikey"

# Busca
curl "http://localhost:3000/api/search/github?username=NajmyW&apikey=freeApikey"

# Consultas BR
curl "http://localhost:3000/api/br/infoff?id=8082446244"
```

### Exportar logs
1. Abra o dashboard em http://localhost:3003
2. Vá para a aba "Logs"
3. Clique em "💾 Exportar Logs"
4. O arquivo JSON será baixado automaticamente

## 🌐 Acesso Remoto (Opcional)

Para acessar o dashboard remotamente:

### Opção 1: Usar ngrok (para testes)
```bash
# No terminal da API
ngrok http 3000

# No terminal do dashboard
ngrok http 3003

# Compartilhe os URLs gerados
```

### Opção 2: Deploy no Discloud
```bash
# A API já está configurada para Discloud
# Basta fazer push para o GitHub

# O dashboard precisará de configuração adicional
# para rodar em um serviço separado
```

## 🐛 Troubleshooting

### Dashboard não mostra logs
1. Verifique se a API está rodando na porta 3000
2. Verifique se o dashboard está rodando na porta 3003
3. Verifique o indicador de conexão WebSocket (deve ser verde)
4. Veja o console do navegador para erros

### Gráficos não atualizam
1. Verifique se o WebSocket está conectado
2. Faça uma requisição para a API
3. Aguarde até 1 segundo para a atualização
4. Recarregue a página se necessário

### Testes de endpoint falham
1. Verifique se a API está rodando
2. Verifique o console do navegador para erros de CORS
3. Verifique se os parâmetros estão preenchidos corretamente
4. Veja a aba "Logs" para mais detalhes

## 📈 Métricas Disponíveis

### Gerais
- Total de requisições processadas
- Taxa de sucesso (%)
- Conexões WebSocket ativas

### Por Endpoint
- Total de requisições
- Requisições bem-sucedidas (2xx-3xx)
- Requisições com erro (4xx-5xx)
- Tempo médio de resposta (ms)
- Última requisição (timestamp)
- Distribuição por hora

## 🎓 Dicas de Uso

1. **Monitoramento constante:** Mantenha o dashboard aberto enquanto desenvolve
2. **Teste antes de deploy:** Use a aba "Endpoints" para testar tudo
3. **Analise patterns:** Use os gráficos para identificar padrões de uso
4. **Exporte logs regularmente:** Mantenha histórico de performance
5. **Monitore tempos lentos:** Identifique endpoints que precisam de otimização

## 🚀 Próximos Passos

1. ✅ API e Dashboard rodando localmente
2. ✅ Teste todos os endpoints
3. ✅ Monitore métricas em tempo real
4. ⏭️ Configure deploy em produção
5. ⏭️ Implemente alertas de erro
6. ⏭️ Adicione autenticação

---

**Repositório GitHub:** https://github.com/MutanoXX/MutanoX-API-V14
**API:** http://localhost:3000
**Dashboard:** http://localhost:3003

**Desenvolvido por:** MutanoX
**Versão:** 14.0.0
