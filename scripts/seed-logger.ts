import fs from 'fs';
import path from 'path';

export class SeedLogger {
    private logFile: string;
    private metricsFile: string;
    private startTime: number;

    constructor() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logDir = path.join(process.cwd(), 'logs', 'seed');
        
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        this.logFile = path.join(logDir, `seed-${timestamp}.log`);
        this.metricsFile = path.join(logDir, `metrics-${timestamp}.json`);
        this.startTime = Date.now();
    }

    error(operation: string, error: any) {
        const logEntry = {
            level: 'ERROR',
            operation,
            message: error.message,
            code: error.code,
            details: error.details,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };

        console.error(`[SEED ERROR] ${operation}:`, logEntry);
        this.writeToLog(logEntry);
    }

    info(operation: string, details?: any) {
        const logEntry = {
            level: 'INFO',
            operation,
            details,
            timestamp: new Date().toISOString()
        };

        console.log(`[SEED INFO] ${operation}:`, details || '');
        this.writeToLog(logEntry);
    }

    warn(operation: string, message: string, details?: any) {
        const logEntry = {
            level: 'WARN',
            operation,
            message,
            details,
            timestamp: new Date().toISOString()
        };

        console.warn(`[SEED WARN] ${operation}:`, message, details || '');
        this.writeToLog(logEntry);
    }

    metric(operation: string, duration: number, success: boolean, details?: any) {
        const metricEntry = {
            operation,
            duration,
            success,
            details,
            timestamp: new Date().toISOString()
        };

        fs.appendFileSync(this.metricsFile, JSON.stringify(metricEntry) + '\n');
    }

    private writeToLog(entry: any) {
        fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
    }

    getDuration() {
        return Date.now() - this.startTime;
    }
}

export const seedLogger = new SeedLogger();