/**
 * Middleware para logging de requisições da API para o Dashboard
 * Este middleware intercepta todas as requisições e envia dados para o dashboard em tempo real
 */

export const loggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  const originalEnd = res.end;

  // Flag para verificar se o response já foi finalizado
  let responseSent = false;

  // Interceptar res.send para endpoints normais
  res.send = function (data) {
    if (responseSent) {
      return originalSend.call(this, data);
    }
    responseSent = true;

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
    return originalSend.call(this, data);
  };

  // Interceptar res.end para endpoints de streaming
  res.end = function (chunk, encoding) {
    if (!responseSent) {
      responseSent = true;
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Log da requisição (para endpoints de streaming)
      const requestData = {
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode || 200,
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
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Envia dados de requisição para o dashboard
 */
async function sendToDashboard(data) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos de timeout

    const response = await fetch('http://localhost:3003/api/log-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Dashboard logging failed:', await response.text());
    }
  } catch (error) {
    // Silenciar erros de conexão com dashboard (não deve afetar a API)
    // Erro de abort (timeout) é esperado e deve ser ignorado
    if (error.name !== 'AbortError') {
      // console.error('Error sending to dashboard:', error);
    }
  }
}
