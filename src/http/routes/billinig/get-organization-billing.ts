import { defineAbilityFor } from "@/auth";
import { userSchema } from "@/auth/models/user";
import { authMiddleware } from "@/http/middlewares/auth";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { BadRequestError } from "../_erros/bad_request_error";
import { prisma } from "@/lib/prisma";

export async function getOrganizationBillingRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .get(
      "/organizations/:slug/billing",
      {
        schema: {
          tags: ["billings"],
          summary: "Get organization billings",
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              billing: z.object({
                seats: z.object({
                  amount: z.number(),
                  unit: z.number(),
                  price: z.number(),
                }),
                projects: z.object({
                  amount: z.number(),
                  unit: z.number(),
                  price: z.number(),
                }),
                total: z.number(),
              }),
            }),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { slug: orgSlug } = request.params;
        const { membership } = await request.getUserMembership(orgSlug);

        const ability = defineAbilityFor(
          userSchema.parse({ id: membership.userId, role: membership.role })
        );
        if (ability.cannot("get", "Billing")) {
          throw new BadRequestError(
            "You are not authorized to get this organization billings"
          );
        }

        const [amountOfMembers, amountOfProjects] = await Promise.all([
          prisma.member.count({
            where: {
              organizationId: membership.organizationId,
              role: {
                not: "BILLING",
              },
            },
          }),
          prisma.project.count({
            where: { organizationId: membership.organizationId },
          }),
        ]);

        return reply.status(200).send({
          billing: {
            seats: {
              amount: amountOfMembers,
              unit: 10,
              price: amountOfMembers * 10,
            },
            projects: {
              amount: amountOfProjects,
              unit: 20,
              price: amountOfProjects * 20,
            },
            total: amountOfMembers * 10 + amountOfProjects * 20,
          },
        });
      }
    );
}
