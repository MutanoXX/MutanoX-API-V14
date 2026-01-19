import { PrismaClient } from '@prisma/client';

/**
 * MEGA PROMPT: Criar cliente Prisma para gerenciar API Keys

REQUISITOS:
- Inicializar Prisma com as configurações corretas
- Exportar instância db para uso em toda a aplicação
- Gerenciar conexão com SQLite
- Tratamento de erros de conexão
- Query otimizadas

IMPLEMENTAÇÃO:
- Singleton do Prisma Client
- Conexão com database via DATABASE_URL
- Exportação da instância db
- Tratamento de erros com logging
*/

const prisma = new PrismaClient();

export { prisma };

// Garantir que a conexão seja encerrada ao encerrar a aplicação
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
