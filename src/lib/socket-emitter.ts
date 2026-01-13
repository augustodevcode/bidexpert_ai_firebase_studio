import { Emitter } from '@socket.io/redis-emitter';
import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = new Redis(redisUrl);

export const socketEmitter = new Emitter(redisClient);
