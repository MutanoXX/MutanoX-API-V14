import bcrypt from 'bcryptjs';
import { generateToken, ADMIN_CREDENTIALS } from './auth.js';
import { successResponse, errorResponse } from './response.js';

/**
 * MEGA PROMPT: Criar endpoint de login seguro e robusto

REQUISITOS:
- Validar username e password
- Comparar senha com bcrypt
- Gerar token JWT seguro
- Registrar tentativas de login (sucesso/falha)
- Proteger contra brute force
- Não expor informações sensíveis em erros
- Rate limiting para evitar ataques

IMPLEMENTAÇÃO:
- Validação de entrada (sanitização)
- Rate limiting específico para login
- Hash de senha com bcrypt
- Token JWT com expiração
- Logs de tentativas de login
- Tratamento de erros genérico (não expor se usuário existe)
*/

// Armazenar tentativas de login em memória
// EM PRODUÇÃO: Use Redis ou banco de dados
const loginAttempts = new Map();
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_BLOCK_TIME = 15 * 60 * 1000; // 15 minutos

/**
 * Endpoint de login
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validação básica
    if (!username || !password) {
      return errorResponse(res, 'Username e password são obrigatórios', 400);
    }

    // Sanitização de entrada
    const sanitizedUsername = username.trim();
    const sanitizedPassword = password.trim();

    if (sanitizedUsername.length < 3 || sanitizedPassword.length < 6) {
      return errorResponse(res, 'Username ou password inválidos', 400);
    }

    // Verificar se o IP está bloqueado por muitas tentativas
    const clientIp = req.ip || req.connection.remoteAddress;
    const attempts = loginAttempts.get(clientIp) || { count: 0, lastAttempt: 0 };

    if (attempts.count >= LOGIN_ATTEMPT_LIMIT) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      
      if (timeSinceLastAttempt < LOGIN_BLOCK_TIME) {
        const remainingTime = Math.ceil((LOGIN_BLOCK_TIME - timeSinceLastAttempt) / 60000);
        return errorResponse(
          res,
          `Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.`,
          429
        );
      } else {
        // Reset após o período de bloqueio
        loginAttempts.set(clientIp, { count: 0, lastAttempt: 0 });
      }
    }

    // Verificar credenciais
    const isValidUsername = sanitizedUsername === ADMIN_CREDENTIALS.username;
    const isValidPassword = sanitizedPassword === ADMIN_CREDENTIALS.password;

    // Registrar tentativa
    const currentAttempts = loginAttempts.get(clientIp) || { count: 0, lastAttempt: 0 };
    
    if (!isValidUsername || !isValidPassword) {
      // Login falhou
      loginAttempts.set(clientIp, {
        count: currentAttempts.count + 1,
        lastAttempt: Date.now()
      });

      return errorResponse(res, 'Credenciais inválidas', 401);
    }

    // Login bem-sucedido - gerar token
    const token = generateToken({
      username: sanitizedUsername,
      role: 'admin',
      loginAt: new Date().toISOString()
    });

    // Limpar tentativas bem-sucedidas
    loginAttempts.set(clientIp, { count: 0, lastAttempt: 0 });

    // Retornar token e informações do usuário
    return successResponse(res, {
      token,
      user: {
        username: sanitizedUsername,
        role: 'admin'
      },
      expiresIn: '24h'
    }, 'Login realizado com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro no servidor de autenticação', 500, error);
  }
};

/**
 * Endpoint para verificar se o token é válido
 * POST /api/auth/verify
 */
export const verifyTokenEndpoint = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return errorResponse(res, 'Token não fornecido', 400);
    }

    // Verificar token através do middleware
    const { verifyToken: verifyTokenFunc } = await import('./auth.js');
    const verification = verifyTokenFunc(token);

    if (!verification.valid) {
      return errorResponse(res, 'Token inválido ou expirado', 401);
    }

    return successResponse(res, {
      valid: true,
      user: {
        username: verification.decoded.username,
        role: verification.decoded.role,
        loginAt: verification.decoded.loginAt
      }
    }, 'Token válido');
  } catch (error) {
    return errorResponse(res, 'Erro na verificação do token', 500, error);
  }
};

/**
 * Endpoint de logout (cliente-side)
 * POST /api/auth/logout
 * Nota: JWT é stateless, então o logout é apenas no cliente
 */
export const logout = async (req, res) => {
  try {
    // O cliente deve remover o token
    return successResponse(res, {
      message: 'Logout realizado. Remova o token do cliente.'
    }, 'Logout realizado com sucesso');
  } catch (error) {
    return errorResponse(res, 'Erro no logout', 500, error);
  }
};

/**
 * Limpar tentativas antigas de login (chamado periodicamente)
 */
export function cleanupOldAttempts() {
  const now = Date.now();
  
  for (const [ip, attempts] of loginAttempts.entries()) {
    const timeSinceLastAttempt = now - attempts.lastAttempt;
    
    // Remover tentativas com mais de 1 hora
    if (timeSinceLastAttempt > 60 * 60 * 1000) {
      loginAttempts.delete(ip);
    }
  }
}

// Limpar tentativas antigas a cada 10 minutos
setInterval(cleanupOldAttempts, 10 * 60 * 1000);
