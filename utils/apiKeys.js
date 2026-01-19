import { db } from './db.js';

/**
 * MEGA PROMPT: Criar sistema de gerenciamento de API Keys

REQUISITOS:
- Gerar chaves no formato mk_xxxxxxxxxxxx (32 caracteres)
- Criar, listar, atualizar e deletar API Keys
- Controlar ativação de chaves
- Rastrear uso de cada chave (contador, última vez usada)
- Validar chaves em requisições
- Bloquear chaves expiradas
- Implementar rate limit por chave (não global)

IMPLEMENTAÇÃO:
- generateApiKey() - Gera chave única
- createApiKey() - Cria nova chave no banco
- getApiKeys() - Lista todas as chaves
- getApiKey() - Busca chave por ID
- updateApiKey() - Atualiza chave
- deleteApiKey() - Deleta chave
- validateApiKey() - Valida chave e rastreia uso
- incrementUsage() - Incrementa contador de uso
- deactivateExpiredKeys() - Desativa chaves expiradas
*/

/**
 * Gera uma API Key única no formato: mk_xxxxxxxxxxxx
 */
export function generateApiKey() {
  const prefix = 'mk_';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomBytes = new Uint8Array(28);
  crypto.getRandomValues(randomBytes);
  
  let key = prefix;
  for (let i = 0; i < 28; i++) {
    key += chars[randomBytes[i] % chars.length];
  }
  
  return key;
}

/**
 * Cria uma nova API Key
 */
export async function createApiKey(name, options = {}) {
  try {
    const {
      description,
      rateLimit = 100,
      permissions = [],
      expiresIn = null
    } = options;

    const apiKey = generateApiKey();
    let expiresAt = null;
    
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn);
    }

    const newKey = await db.apiKey.create({
      data: {
        key: apiKey,
        name: name || 'API Key',
        description: description || null,
        rateLimit: rateLimit,
        permissions: permissions,
        expiresAt: expiresAt,
        isActive: true
      }
    });

    return {
      success: true,
      data: newKey
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Lista todas as API Keys
 */
export async function getApiKeys(filters = {}) {
  try {
    const { includeInactive = false } = filters;
    
    const where = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const keys = await db.apiKey.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      data: keys
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Busca uma API Key por ID
 */
export async function getApiKey(id) {
  try {
    const apiKey = await db.apiKey.findUnique({
      where: { id }
    });

    if (!apiKey) {
      return {
        success: false,
        error: 'API Key não encontrada'
      };
    }

    return {
      success: true,
      data: apiKey
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Atualiza uma API Key
 */
export async function updateApiKey(id, updates) {
  try {
    const apiKey = await db.apiKey.update({
      where: { id },
      data: updates
    });

    return {
      success: true,
      data: apiKey
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Deleta uma API Key
 */
export async function deleteApiKey(id) {
  try {
    await db.apiKey.delete({
      where: { id }
    });

    return {
      success: true,
      message: 'API Key deletada com sucesso'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Valida uma API Key
 */
export async function validateApiKey(key) {
  try {
    const apiKey = await db.apiKey.findUnique({
      where: { key }
    });

    if (!apiKey) {
      return {
        valid: false,
        error: 'API Key inválida'
      };
    }

    // Verificar se está ativa
    if (!apiKey.isActive) {
      return {
        valid: false,
        error: 'API Key está desativada'
      };
    }

    // Verificar expiração
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return {
        valid: false,
        error: 'API Key expirada'
      };
    }

    // Verificar rate limit (não bloquear se for válido)
    if (apiKey.usageCount >= apiKey.rateLimit) {
      return {
        valid: false,
        error: `API Key excedeu o limite de ${apiKey.rateLimit} requisições/minuto`,
        usageCount: apiKey.usageCount,
        rateLimit: apiKey.rateLimit
      };
    }

    return {
      valid: true,
      apiKey: apiKey
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Erro na validação da API Key'
    };
  }
}

/**
 * Incrementa o contador de uso de uma API Key
 */
export async function incrementUsage(key) {
  try {
    await db.apiKey.update({
      where: { key },
      data: {
        usageCount: {
          increment: 1
        },
        lastUsedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Erro ao incrementar uso da API Key:', error);
  }
}

/**
 * Desativa chaves expiradas automaticamente
 * Deve ser chamado periodicamente (ex: a cada 5 minutos)
 */
export async function deactivateExpiredKeys() {
  try {
    const now = new Date();
    
    const expiredKeys = await db.apiKey.findMany({
      where: {
        expiresAt: {
          lte: now
        },
        isActive: true
      }
    });

    if (expiredKeys.length > 0) {
      await db.apiKey.updateMany({
        where: {
          id: {
            in: expiredKeys.map(k => k.id)
          }
        },
        data: {
          isActive: false
        }
      });

      console.log(`✅ Desativadas ${expiredKeys.length} chaves expiradas`);
    }
  } catch (error) {
    console.error('Erro ao desativar chaves expiradas:', error);
  }
}

/**
 * Formata API Key para exibição (mascara parcial)
 */
export function formatApiKeyForDisplay(key) {
  if (!key || key.length < 8) {
    return key;
  }
  
  const prefix = key.substring(0, 4); // mk_xxxxxx
  const masked = '*'.repeat(key.length - 8);
  
  return `${prefix}${masked}`;
}
