import jwt from 'jsonwebtoken';

/**
 * MEGA PROMPT: Criar sistema de autenticação JWT seguro

REQUISITOS:
- Validar token JWT em cada requisição protegida
- Verificar expiração do token
- Tratar tokens inválidos adequadamente
- Não bloquear o sistema com erros de autenticação
- Retornar respostas consistentes

IMPLEMENTAÇÃO:
- Função para verificar token JWT
- Função para gerar token JWT
- Middleware para proteger rotas
- Tratamento de erros específico
*/

// Segredo para assinar os tokens JWT
// EM PRODUÇÃO: Use variável de ambiente!
const JWT_SECRET = process.env.JWT_SECRET || 'MutanoX-Secret-Key-2024-V14';

// Duração do token em horas
const TOKEN_EXPIRATION = '24h';

// Credenciais do admin
const ADMIN_CREDENTIALS = {
  username: 'ADMIN',
  password: 'MutanoX3397'
};

/**
 * Gera um token JWT para um usuário
 * @param {Object} payload - Dados do usuário
 * @returns {String} Token JWT
 */
export function generateToken(payload) {
  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000) // Issued At
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRATION }
  );
}

/**
 * Verifica e decodifica um token JWT
 * @param {String} token - Token JWT
 * @returns {Object|null} Payload decodificado ou null se inválido
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      valid: true,
      decoded
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Middleware para proteger rotas com autenticação JWT
 * Verifica o token no header Authorization
 */
export const authMiddleware = (req, res, next) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido',
        error: 'No token provided'
      });
    }

    // Token deve estar no formato: "Bearer <token>"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    // Verificar token
    const verification = verifyToken(token);

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação inválido ou expirado',
        error: 'Invalid token'
      });
    }

    // Adicionar informações do usuário ao request
    req.user = verification.decoded;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro na verificação de autenticação',
      error: error.message
    });
  }
};

/**
 * Middleware opcional para autenticação
 * Permite acesso se não houver token, mas adiciona usuário se houver
 */
export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    const verification = verifyToken(token);

    if (verification.valid) {
      req.user = verification.decoded;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

export { JWT_SECRET, TOKEN_EXPIRATION, ADMIN_CREDENTIALS };
