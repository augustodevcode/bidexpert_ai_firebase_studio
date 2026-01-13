import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(server);

    // Redis Adapter Setup
    // Use environment variables for Redis connection
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    // Only use Redis adapter if URL is provided (allows local dev without redis if needed, though strictly we need it for scale)
    if (process.env.REDIS_URL) {
        const pubClient = new Redis(redisUrl);
        const subClient = pubClient.duplicate();

        Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
            io.adapter(createAdapter(pubClient, subClient));
            console.log('Redis Adapter connected');
        }).catch(err => {
            console.error('Redis connection failed', err);
        });
    }

    io.on('connection', (socket) => {
        console.log('Client connected', socket.id);

        socket.on('join_auction', (auctionId) => {
            socket.join(`auction:${auctionId}`);
        });

        socket.on('leave_auction', (auctionId) => {
            socket.leave(`auction:${auctionId}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });

    // Global event emitter bridge
    // This allows parts of the app to emit events to socket.io without importing the server instance directly
    // In a real microservice, we might publish to Redis directly from the app logic.
    // For now, we listen to process events or setup a basic bus?
    // Actually, standard pattern in Next.js Custom Server is to attach io to req? 
    // Or usage of global singleton for pure backend logic? 
    // Let's attach to global for simplicity in this monolith migration.
    (global as any).io = io;

    server.listen(port, () => {
        console.log(
            `> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV
            }`
        );
    });
});
