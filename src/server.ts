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

app.prepare().then(async () => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
        transports: ['websocket', 'polling'],
        pingInterval: 25000,
        pingTimeout: 20000,
    });

    // Redis Adapter Setup
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    if (process.env.REDIS_URL) {
        try {
            const pubClient = new Redis(redisUrl);
            const subClient = pubClient.duplicate();
            await Promise.all([pubClient.connect(), subClient.connect()]);
            io.adapter(createAdapter(pubClient, subClient));
            console.log('[Socket.io] Redis Adapter connected');
        } catch (err) {
            console.error('[Socket.io] Redis connection failed, using in-memory adapter', err);
        }
    }

    // --- Connection handling ---
    io.on('connection', (socket) => {
        console.log('[Socket.io] Client connected', socket.id);

        socket.on('join_auction', (auctionId: string) => {
            const room = `auction:${auctionId}`;
            socket.join(room);
            console.log(`[Socket.io] ${socket.id} joined ${room}`);
        });

        socket.on('join_lot', (lotId: string) => {
            const room = `lot:${lotId}`;
            socket.join(room);
        });

        socket.on('leave_auction', (auctionId: string) => {
            socket.leave(`auction:${auctionId}`);
        });

        socket.on('leave_lot', (lotId: string) => {
            socket.leave(`lot:${lotId}`);
        });

        socket.on('disconnect', () => {
            console.log('[Socket.io] Client disconnected', socket.id);
        });
    });

    // --- V2: Bridge bidEventEmitter → Socket.io broadcast ---
    try {
        const { bidEventEmitter } = await import('@/services/realtime-bids.service');

        // Listen for ALL bid events (using wildcard via tenant/auction channels)
        // The emitter fires: bid:<lotId>, bid:tenant:<tenantId>, bid:auction:<auctionId>
        bidEventEmitter.on('newListener', () => {}); // Prevent max listener warnings

        // We need to intercept emits - override emitBid to also broadcast via Socket.io
        const originalEmitBid = bidEventEmitter.emitBid.bind(bidEventEmitter);
        bidEventEmitter.emitBid = function(event) {
            // First, fire the original EventEmitter events
            originalEmitBid(event);
            // Then broadcast to Socket.io rooms
            const bidPayload = {
                lotId: event.lotId.toString(),
                auctionId: event.auctionId.toString(),
                amount: event.amount,
                bidderId: event.bidderId.toString(),
                bidderDisplay: event.bidderDisplay,
                timestamp: event.timestamp.toISOString(),
                tenantId: event.tenantId.toString(),
            };
            // Broadcast to lot-specific room
            io.to(`lot:${event.lotId}`).emit('bid:new', bidPayload);
            // Broadcast to auction-wide room
            io.to(`auction:${event.auctionId}`).emit('bid:new', bidPayload);
        };

        // Bridge soft-close events
        const originalEmitSoftClose = bidEventEmitter.emitSoftClose.bind(bidEventEmitter);
        bidEventEmitter.emitSoftClose = function(event) {
            originalEmitSoftClose(event);
            const payload = {
                lotId: event.lotId.toString(),
                auctionId: event.auctionId.toString(),
                minutesRemaining: event.minutesRemaining,
                timestamp: event.timestamp.toISOString(),
            };
            io.to(`lot:${event.lotId}`).emit('softclose:extended', payload);
            io.to(`auction:${event.auctionId}`).emit('softclose:extended', payload);
        };

        console.log('[Socket.io] BidEventEmitter bridge established');
    } catch (err) {
        console.warn('[Socket.io] Could not setup bid event bridge:', err);
    }

    // Attach to global for legacy access
    (global as any).io = io;

    server.listen(port, () => {
        console.log(
            `> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`
        );
    });
});
