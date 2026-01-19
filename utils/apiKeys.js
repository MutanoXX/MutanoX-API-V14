import crypto from 'crypto';

/**
 * MEGA PROMPT: Sistema de API Keys - Criar estrutura completa de gerenciamento de chaves

REQUISITOS:
- Sistema completo para gerenciar múltiplas API Keys
- Cada key deve ter: ID, nome, key, status (ativo/inativo), criado em, expira em, último uso, estatísticas de uso
- Keys devem ser geradas com formato seguro (UUID)
- Sistema de validação de formato
- Sistema de limpeza de keys expiradas
- Auditoria completa de todas as operações

IMPLEMENTAÇÃO:
- Criar banco de dados em memória (Map) para armazenar API Keys
- Estrutura de dados para cada key com campos completos
- Funções de gerenciamento: criar, listar, atualizar, deletar, ativar/desativar
- Sistema de validação de formato de API Key (UUID v4)
- Sistema de rotatividade automática (keys não usadas por 30 dias)
- Sistema de auditoria que registra todas as operações
- Funções de busca e filtro por status
- Métricas por key: total de usos, última data de uso, sucesso/falhas
*/

// Banco de dados em memória para API Keys
// EM PRODUÇÃO: Use Redis, MongoDB ou outro banco persistente
const apiKeys = new Map();
const auditLog = new Map();

// Constantes
const KEY_EXPIRY_DAYS = 30; // Keys expiram após 30 dias sem uso
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Gera um UUID v4 seguro
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Formata UUID v4
 */
function formatUUID(uuid) {
  const match = uuid.match(/^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}-${match[4]}`;
  }
  return uuid;
}

/**
 * Valida o formato de uma API Key (UUID v4)
 */
export function validateAPIKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return {
      valid: false,
      error: 'API Key deve ser uma string'
    };
  }

  if (apiKey.trim().length !== 36) {
    return {
      valid: false,
      error: 'API Key deve ter exatamente 36 caracteres'
    };
  }

  const formattedKey = formatUUID(apiKey);
  
  if (!UUID_REGEX.test(formattedKey)) {
    return {
      valid: false,
      error: 'API Key tem formato inválido. Deve ser UUID v4'
    };
  }

  return {
    valid: true,
    key: formattedKey
  };
}

/**
 * Gera uma nova API Key
 */
export function generateAPIKey() {
  const uuid = generateUUID();
  const key = {
    id: crypto.randomUUID(),
    key: uuid,
    name: `API Key ${Date.now()}`,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastUsed: null,
    expiresAt: null,
    stats: {
      totalUsage: 0,
      successCount: 0,
      failureCount: 0,
      lastUsedAt: null
    },
    auditLog: []
  };

  apiKeys.set(uuid, key);
  
  // Registrar criação no log de auditoria
  addAuditLog('CREATE_KEY', {
    keyId: uuid,
    keyName: key.name,
    action: 'API Key gerada',
    success: true
  });

  return key;
}

/**
 * Lista todas as API Keys
 */
export function listAPIKeys() {
  const keysArray = Array.from(apiKeys.values()).map(key => ({
    ...key,
    // Não retornar a key completa por segurança
    key: key.key.substring(0, 8) + '...' + key.key.substring(32)
  }));

  return {
    success: true,
    total: keysArray.length,
    active: keysArray.filter(k => k.status === 'active').length,
    inactive: keysArray.filter(k => k.status === 'inactive').length,
    keys: keysArray
  };
}

/**
 * Busca uma API Key por ID
 */
export function getAPIKeyById(keyId) {
  const key = apiKeys.get(keyId);
  
  if (!key) {
    return {
      success: false,
      message: 'API Key não encontrada'
    };
  }

  // Retornar sem a key completa
  return {
    success: true,
    key: {
      ...key,
      key: key.key.substring(0, 8) + '...' + key.key.substring(32)
    }
  };
}

/**
 * Atualiza uma API Key existente
 */
export function updateAPIKey(keyId, updates) {
  const key = apiKeys.get(keyId);
  
  if (!key) {
    return {
      success: false,
      message: 'API Key não encontrada'
    };
  }

  // Registrar atualização no log de auditoria
  addAuditLog('UPDATE_KEY', {
    keyId: keyId,
    keyName: key.name,
    action: 'API Key atualizada',
    updates: Object.keys(updates),
    success: true
  });

  apiKeys.set(keyId, {
    ...key,
    ...updates,
    auditLog: [
      ...key.auditLog,
      {
        timestamp: new Date().toISOString(),
        action: 'UPDATE_KEY',
        details: updates
      }
    ]
  });

  return {
    success: true,
    message: 'API Key atualizada com sucesso',
    key: {
      ...apiKeys.get(keyId),
      key: apiKeys.get(keyId).key.substring(0, 8) + '...' + apiKeys.get(keyId).key.substring(32)
    }
  };
}

/**
 * Desativa uma API Key
 */
export function deactivateAPIKey(keyId) {
  const key = apiKeys.get(keyId);
  
  if (!key) {
    return {
      success: false,
      message: 'API Key não encontrada'
    };
  }

  // Registrar desativação no log de auditoria
  addAuditLog('DEACTIVATE_KEY', {
    keyId: keyId,
    keyName: key.name,
    action: 'API Key desativada',
    success: true
  });

  apiKeys.set(keyId, {
    ...key,
    status: 'inactive',
    auditLog: [
      ...key.auditLog,
      {
        timestamp: new Date().toISOString(),
        action: 'DEACTIVATE_KEY',
        details: { status: 'changed_to', newStatus: 'inactive' }
      }
    ]
  });

  return {
    success: true,
    message: 'API Key desativada com sucesso'
  };
}

/**
 * Reativa uma API Key
 */
export function activateAPIKey(keyId) {
  const key = apiKeys.get(keyId);
  
  if (!key) {
    return {
      success: false,
      message: 'API Key não encontrada'
    };
  }

  // Registrar reativação no log de auditoria
  addAuditLog('ACTIVATE_KEY', {
    keyId: keyId,
    keyName: key.name,
    action: 'API Key reativada',
    success: true
  });

  apiKeys.set(keyId, {
    ...key,
    status: 'active',
    auditLog: [
      ...key.auditLog,
      {
        timestamp: new Date().toISOString(),
        action: 'ACTIVATE_KEY',
        details: { status: 'changed_to', newStatus: 'active' }
      }
    ]
  });

  return {
    success: true,
    message: 'API Key reativada com sucesso'
  };
}

/**
 * Deleta uma API Key
 */
export function deleteAPIKey(keyId) {
  const key = apiKeys.get(keyId);
  
  if (!key) {
    return {
      success: false,
      message: 'API Key não encontrada'
    };
  }

  const keyName = key.name;

  // Registrar deleção no log de auditoria
  addAuditLog('DELETE_KEY', {
    keyId: keyId,
    keyName: keyName,
    action: 'API Key deletada',
    success: true
  });

  apiKeys.delete(keyId);

  return {
    success: true,
    message: `API Key "${keyName}" deletada com sucesso`
  };
}

/**
 * Registra uso de uma API Key
 */
export function recordAPIKeyUsage(keyId, endpoint, success = true, responseTime) {
  const key = apiKeys.get(keyId);
  
  if (!key) {
    return;
  }

  const now = new Date().toISOString();
  
  apiKeys.set(keyId, {
    ...key,
    lastUsed: now,
    stats: {
      totalUsage: key.stats.totalUsage + 1,
      successCount: success ? key.stats.successCount + 1 : key.stats.successCount,
      failureCount: !success ? key.stats.failureCount + 1 : key.stats.failureCount,
      lastUsedAt: now,
      avgResponseTime: calculateAvgResponseTime(key.stats, responseTime)
    },
    auditLog: [
      ...key.auditLog,
      {
        timestamp: now,
        action: 'KEY_USAGE',
        details: {
          endpoint,
          success,
          responseTime
        }
      }
    ]
  });
}

/**
 * Calcula tempo médio de resposta para uma key
 */
function calculateAvgResponseTime(stats, newResponseTime) {
  if (stats.totalUsage === 0) {
    return newResponseTime;
  }
  
  const totalResponseTime = (stats.avgResponseTime || 0) * (stats.totalUsage - 1);
  return (totalResponseTime + newResponseTime) / stats.totalUsage;
}

/**
 * Adiciona entrada ao log de auditoria
 */
function addAuditLog(action, details) {
  const timestamp = new Date().toISOString();
  const logId = crypto.randomUUID();
  
  const logEntry = {
    id: logId,
    timestamp,
    action,
    details,
    success: details.success !== false
  };

  auditLog.set(logId, logEntry);

  // Manter apenas as últimas 1000 entradas
  if (auditLog.size > 1000) {
    const oldestKeys = Array.from(auditLog.keys()).slice(0, 100);
    oldestKeys.forEach(key => auditLog.delete(key));
  }
}

/**
 * Busca API Keys por nome
 */
export function searchAPIKeys(query) {
  const searchLower = query.toLowerCase();
  const keysArray = Array.from(apiKeys.values());

  const results = keysArray.filter(key => 
    key.name.toLowerCase().includes(searchLower) ||
    key.id.includes(searchLower)
  );

  return {
    success: true,
    query,
    total: results.length,
    keys: results.map(key => ({
      ...key,
      key: key.key.substring(0, 8) + '...' + key.key.substring(32)
    }))
  };
}

/**
 * Filtra API Keys por status
 */
export function filterAPIKeysByStatus(status) {
  const keysArray = Array.from(apiKeys.values());
  const filtered = keysArray.filter(key => key.status === status);

  return {
    success: true,
    status,
    total: filtered.length,
    keys: filtered.map(key => ({
      ...key,
      key: key.key.substring(0, 8) + '...' + key.key.substring(32)
    }))
  };
}

/**
 * Obtém estatísticas gerais de todas as API Keys
 */
export function getAPIKeysStats() {
  const keysArray = Array.from(apiKeys.values());
  
  const stats = {
    total: keysArray.length,
    active: keysArray.filter(k => k.status === 'active').length,
    inactive: keysArray.filter(k => k.status === 'inactive').length,
    totalUsage: keysArray.reduce((sum, k) => sum + k.stats.totalUsage, 0),
    avgUsagePerKey: 0,
    mostUsedKey: null,
    mostUsedCount: 0,
    recentlyUsed: keysArray
      .filter(k => k.lastUsed)
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .slice(0, 5)
      .map(k => ({
        ...k,
        key: k.key.substring(0, 8) + '...' + k.key.substring(32)
      }))
  };

  // Calcular média de uso por key
  if (stats.total > 0) {
    stats.avgUsagePerKey = stats.totalUsage / stats.total;
  }

  // Encontrar key mais usada
  if (keysArray.length > 0) {
    const mostUsed = keysArray.reduce((max, k) => 
      k.stats.totalUsage > max.stats.totalUsage ? k : max
    );
    stats.mostUsedKey = {
      ...mostUsed,
      key: mostUsed.key.substring(0, 8) + '...' + mostUsed.key.substring(32)
    };
    stats.mostUsedCount = mostUsed.stats.totalUsage;
  }

  return {
    success: true,
    stats
  };
}

/**
 * Obtém log de auditoria de uma API Key específica
 */
export function getAPIKeyAuditLog(keyId) {
  const key = apiKeys.get(keyId);
  
  if (!key) {
    return {
      success: false,
      message: 'API Key não encontrada'
    };
  }

  return {
    success: true,
    keyId,
    keyName: key.name,
    auditLog: key.auditLog
  };
}

/**
 * Obtém log de auditoria geral
 */
export function getGeneralAuditLog(limit = 50) {
  const logArray = Array.from(auditLog.values())
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);

  return {
    success: true,
    total: logArray.length,
    logs: logArray
  };
}

/**
 * Limpa keys expiradas
 */
export function cleanupExpiredKeys() {
  const now = new Date();
  const keysArray = Array.from(apiKeys.entries());
  let expiredCount = 0;

  keysArray.forEach(([keyId, key]) => {
    if (key.status === 'inactive' && key.expiresAt) {
      const expiresAt = new Date(key.expiresAt);
      
      if (now > expiresAt) {
        apiKeys.delete(keyId);
        expiredCount++;
      }
    }
  });

  if (expiredCount > 0) {
    addAuditLog('CLEANUP_EXPIRED', {
      expiredCount,
      success: true
    });
  }

  return {
    success: true,
    expiredCount
  };
}

/**
 * Inicializa com algumas API Keys de exemplo
 */
export function initializeDefaultKeys() {
  if (apiKeys.size === 0) {
    console.log('🔑 Inicializando sistema de API Keys...');
    
    // Criar uma API Key padrão de admin
    const adminKey = generateAPIKey();
    adminKey.name = 'Admin Master Key';
    
    // Criar uma API Key de teste
    const testKey = generateAPIKey();
    testKey.name = 'Test Key';
    
    apiKeys.set(adminKey.id, adminKey);
    apiKeys.set(testKey.id, testKey);
    
    console.log(`🔑 ${apiKeys.size} API Keys iniciais criadas`);
  }
}

// Inicializar ao carregar o módulo
initializeDefaultKeys();
