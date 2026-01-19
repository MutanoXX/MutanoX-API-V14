import { createServer } from 'http';

/**
 * Middleware para logging de requisições da API para o Dashboard
 * Este middleware intercepta todas as requisições e envia dados para o dashboard em tempo real
 */

export const loggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Log da requisição
    const requestData = {
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime: responseTime,
      requestData: {
        query: req.query,
        body: req.body
      }
    };

    // Enviar para o dashboard de forma assíncrona
    sendToDashboard(requestData).catch(err => {
      console.error('Error sending to dashboard:', err);
    });

    // Chamar o método original
    originalSend.call(this, data);
  };

  next();
};

/**
 * Envia dados de requisição para o dashboard
 */
async function sendToDashboard(data) {
  try {
    const response = await fetch('http://localhost:3003/api/log-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error('Dashboard logging failed:', await response.text());
    }
  } catch (error) {
    // Silenciar erros de conexão com dashboard (não deve afetar a API)
    // console.error('Error sending to dashboard:', error);
  }
}

/**
 * Inicia o serviço de dashboard
 */
export function startDashboardService() {
  console.log('📊 Dashboard logging middleware initialized');
  console.log('   - Sending logs to http://localhost:3003');
}
