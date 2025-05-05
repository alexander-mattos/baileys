// logger.ts
import winston from 'winston';

// Configuração do logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'socket-service' },
  transports: [
    // Logs de console durante o desenvolvimento
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Adicione mais transportes conforme necessário (arquivo, Sentry, etc.)
  ],
});

// Configuração para produção
if (process.env.NODE_ENV === 'production') {
  // Adicionar transporte de arquivo para produção
  logger.add(new winston.transports.File({ filename: 'error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'combined.log' }));
  
  // Você poderia adicionar integrações com serviços como Sentry ou Datadog aqui
}