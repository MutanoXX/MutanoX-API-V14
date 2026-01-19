// MEGAS PROMPTS UTILIZADOS:

// MEGA PROMPT 1 - utils/auth.js: Sistema JWT original
// MEGA PROMPT 2 - utils/api-key-auth.js: Sistema de API Keys
// MEGA PROMPT 3 - endpoints/auth/login.js: Login JWT
// MEGA PROMPT 4 - endpoints/api-keys/manage.js: Gerenciamento de API Keys
// MEGA PROMPT 5 - endpoints/api-keys/stats.js: Estatísticas

/**
 * Sistema JWT original mantido para compatibilidade
 * Sistema novo usa API Keys em utils/api-key-auth.js
 * Este arquivo foi substituído por api-key-auth.js
 */

export { JWT_SECRET, TOKEN_EXPIRATION, ADMIN_CREDENTIALS } from './api-key-auth.js';
