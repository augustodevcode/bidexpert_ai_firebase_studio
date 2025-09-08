// apps/microservice/src/routes/checkout.routes.ts
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { CheckoutService } from '../services/checkout.service';
import type { CheckoutFormValues } from '@bidexpert/core';

interface CheckoutParams {
  winId: string;
}

async function checkoutRoutes(server: FastifyInstance, options: FastifyPluginOptions) {
  const checkoutService = new CheckoutService();

  server.get('/:winId/totals', async (request: FastifyRequest<{ Params: CheckoutParams }>, reply: FastifyReply) => {
    try {
      const totals = await checkoutService.calculateTotals(request.params.winId);
      return reply.send(totals);
    } catch (error: any) {
      request.log.error("Failed to calculate totals:", error);
      reply.status(404).send({ error: "Not Found", message: error.message });
    }
  });

  server.post('/:winId/process-payment', async (request: FastifyRequest<{ Params: CheckoutParams; Body: CheckoutFormValues }>, reply: FastifyReply) => {
    try {
      const result = await checkoutService.processPayment(request.params.winId, request.body);
      if (result.success) {
        return reply.send(result);
      } else {
        return reply.status(400).send(result);
      }
    } catch (error: any) {
      request.log.error("Failed to process payment:", error);
      reply.status(500).send({ error: "Internal Server Error", message: error.message });
    }
  });
}

export default checkoutRoutes;
