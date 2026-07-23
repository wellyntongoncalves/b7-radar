import { computeContribution, computePriceForMargin, FeeListingType } from '@b7/calculations';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const listingType = z.nativeEnum(FeeListingType);

const costFields = {
  productCostReais: z.number().nonnegative(),
  packagingReais: z.number().nonnegative().optional(),
  extraCostsReais: z.number().nonnegative().optional(),
  taxPercent: z.number().min(0).max(100).optional(),
  adPercent: z.number().min(0).max(100).optional(),
  returnRatePercent: z.number().min(0).max(100).optional(),
  shippingCostReais: z.number().nonnegative().optional(),
  shippingSubsidyReais: z.number().nonnegative().optional(),
  listingType,
};

const contributionSchema = z.object({
  ...costFields,
  priceReais: z.number().positive(),
  monthlySalesEstimate: z.number().nonnegative().optional(),
});

const priceForMarginSchema = z.object({
  ...costFields,
  desiredMarginPercent: z.number().min(0).max(99),
  currentPriceReais: z.number().positive().optional(),
});

/**
 * B7 Margem endpoints. The route only validates input and delegates to the pure
 * @b7/calculations module — no financial logic lives here.
 */
export async function calculationRoutes(app: FastifyInstance): Promise<void> {
  app.post('/v1/calculations/margin', async (request, reply) => {
    const parsed = contributionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'validation_error', issues: parsed.error.issues });
    }
    return { result: computeContribution(parsed.data) };
  });

  app.post('/v1/calculations/price-for-margin', async (request, reply) => {
    const parsed = priceForMarginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'validation_error', issues: parsed.error.issues });
    }
    try {
      return { result: computePriceForMargin(parsed.data) };
    } catch (err) {
      return reply
        .status(422)
        .send({ error: 'infeasible', message: (err as Error).message });
    }
  });
}
