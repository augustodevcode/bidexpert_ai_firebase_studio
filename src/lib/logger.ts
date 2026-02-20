/**
 * Centralized Winston logger with environment-aware transports.
 * - Production/serverless: console JSON only (safe for Vercel/AWS runtimes)
 * - Local development: file transports + colorful console output
 */
import winston from 'winston';
import path from 'path';

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, json, colorize, errors } = format;

// Define a custom format for console logging with colors
const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (stack) {
    msg += `\n${stack}`;
  }
  // Add metadata if any
  if(Object.keys(metadata).length > 0) {
    msg += `\n${JSON.stringify(metadata, null, 2)}`;
  }
  return msg;
});

// Determine runtime characteristics
const isProduction = process.env.NODE_ENV === 'production';
const isServerlessRuntime = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.VERCEL_URL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.AWS_EXECUTION_ENV ||
  process.env.NOW_REGION ||
  process.env.K_SERVICE ||
  process.env.FUNCTION_TARGET
);

const useFileTransports = !isProduction && !isServerlessRuntime;

// Determine the log level from environment variables, defaulting to 'info'
const logLevel = process.env.LOG_LEVEL || 'info';

const loggerTransports: winston.transport[] = [];

if (useFileTransports) {
  loggerTransports.push(
    new transports.File({
      filename: path.join(process.cwd(), 'logs/error.log'),
      level: 'error',
      format: combine(
        timestamp(),
        json()
      )
    }),
    new transports.File({
      filename: path.join(process.cwd(), 'logs/app.log'),
      format: combine(
        timestamp(),
        json()
      )
    })
  );
}

if (isProduction || isServerlessRuntime) {
  loggerTransports.push(
    new transports.Console({
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      )
    })
  );
} else {
  loggerTransports.push(
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      )
    })
  );
}

const logger = createLogger({
  level: logLevel,
  format: combine(
    timestamp(),
    errors({ stack: true }), // This will add the stack trace to error logs
    json() // Default format for transports that don't specify one
  ),
  transports: loggerTransports,
});

export default logger;
