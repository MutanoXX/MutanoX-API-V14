import { get, post } from '../../utils/fetch.js';
import { validateParams } from '../../utils/validator.js';
import { successResponse, validationErrorResponse, errorResponse } from '../../utils/response.js';

// System prompt for the chat AI to understand our system
const SYSTEM_PROMPT = `Você é um assistente de IA integrado ao MutanoX-API v14.

Seu objetivo é ajudar os usuários com suas perguntas e solicitações de forma clara, precisa e útil.

Principais características da API:
- Endpoint de bypass Cloudflare
- Consultas brasileiras (CPF, telefone, nome, Free Fire)
- Integração com Discord
- Múltiplos modelos de IA (Perplexity, Cici, Felo, Jeeves)
- Ferramentas de busca (Brainly, Douyin, GitHub, Google Images)

Forneça respostas úteis e amigáveis, sempre mantendo a confidencialidade e privacidade dos dados.`;

/**
 * Chat AI Endpoint
 * GET /api/ai/chat - Single question
 * POST /api/ai/chat - Multi-turn conversation (streaming)
 */
export const chatAI = async (req, res) => {
  try {
    if (req.method === 'POST') {
      // Streaming mode for multi-turn conversations
      const { question, messages, model, apikey } = req.body;

      const validation = validateParams({ question }, ['question']);
      if (!validation.isValid) {
        return validationErrorResponse(res, 'Missing required parameter: question', validation.missing);
      }

      const finalModel = model || 'google/gemini-2.5-flash-lite';
      const finalApikey = apikey || 'freeApikey';

      // Prepare messages array with system prompt
      const preparedMessages = [
        { role: 'system', content: SYSTEM_PROMPT }
      ];

      if (messages && Array.isArray(messages)) {
        preparedMessages.push(...messages);
      }

      preparedMessages.push({ role: 'user', content: question });

      // Build URL and make POST request for streaming
      const externalUrl = 'https://anabot.my.id/api/ai/chat';

      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const response = await fetch(externalUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question,
            messages: JSON.stringify(preparedMessages),
            model: finalModel,
            apikey: finalApikey
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`External API error: ${response.status} - ${errorText}`);
        }

        // Stream the response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let responseSent = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            if (!responseSent && res.writable) {
              res.write(chunk);
              responseSent = true;
            }
          }
        } catch (streamError) {
          console.error('Stream reading error:', streamError);
          if (!responseSent && res.writable) {
            res.write(`data: {"error": "${streamError.message}"}\n\n`);
          }
        } finally {
          if (res.writable) {
            res.end();
          }
        }
      } catch (error) {
        console.error('Streaming error:', error);
        if (res.writable) {
          // Tentar enviar mensagem de erro no formato SSE
          res.write(`data: {"error": "${error.message}"}\n\n`);
          res.end();
        }
      }

    } else {
      // GET mode for single questions
      const { question, messages, model, apikey } = req.query;

      const validation = validateParams({ question }, ['question']);
      if (!validation.isValid) {
        return validationErrorResponse(res, 'Missing required parameter: question', validation.missing);
      }

      const finalModel = model || 'google/gemini-2.5-flash-lite';
      const finalApikey = apikey || 'freeApikey';

      // Build URL
      const externalUrl = `https://anabot.my.id/api/ai/chat?question=${encodeURIComponent(question)}&messages=${encodeURIComponent(messages || '')}&model=${encodeURIComponent(finalModel)}&apikey=${encodeURIComponent(finalApikey)}`;

      // Fetch data
      const result = await get(externalUrl);

      if (!result.success) {
        return errorResponse(res, 'Failed to get AI response', result.error);
      }

      return successResponse(res, result.data, 'AI response generated successfully');
    }
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
