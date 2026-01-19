#!/usr/bin/env node

/**
 * MutanoX API V14 - Production Entry Point
 * Este arquivo é apenas um wrapper para o servidor Next.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando MutanoX API V14...');
console.log('📦 Next.js 16 + TypeScript + Prisma');

// Start Next.js server
const nextDir = path.join(__dirname, '.next', 'standalone');
const serverPath = path.join(nextDir, 'server.js');

const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
  },
});

server.on('exit', (code) => {
  console.log(`🔴 Servidor encerrado com código: ${code}`);
  process.exit(code);
});

server.on('error', (err) => {
  console.error('❌ Erro ao iniciar servidor:', err);
  process.exit(1);
});
