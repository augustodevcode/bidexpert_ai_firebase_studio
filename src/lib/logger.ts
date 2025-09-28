// src/lib/logger.ts
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

// Determine the log level from environment variables, defaulting to 'info'
const logLevel = process.env.LOG_LEVEL || 'info';

const logger = createLogger({
  level: logLevel,
  format: combine(
    timestamp(),
    errors({ stack: true }), // This will add the stack trace to error logs
    json() // Default format for transports that don't specify one
  ),
  transports: [
    // Transport for writing logs to a file in a structured JSON format
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
    }),
  ],
});

// In non-production environments (like development), also log to the console
// with a more readable, colorful format.
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    )
  }));
}

export default logger;
