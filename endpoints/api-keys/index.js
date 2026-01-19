// Exportar funções dos endpoints de API Keys
export { generateApiKey, listApiKeys, revokeApiKey, activateApiKey, deleteApiKey, getApiKeyStats } from './manage.js';
export { getGlobalStats, clearOldLogs } from './stats.js';
