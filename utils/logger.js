import morgan from 'morgan';
import path from 'path';

// Custom Morgan token for better logging
morgan.token('date', (req, res) => {
  return new Date().toISOString();
});

morgan.token('body', (req) => {
  if (req.method === 'POST' && req.body) {
    return JSON.stringify(req.body);
  }
  return '-';
});

// Format: ":date - :method :url :status - :response-time ms - :body"
export const logger = morgan(':date - :method :url :status - :response-time ms');

/**
 * Custom logger function
 */
export const log = {
  info: (message, data = null) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message, error = null) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error ? error.stack : '');
  },
  warn: (message, data = null) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};
