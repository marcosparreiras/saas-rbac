import { rolesSchema } from "@/auth/roles";
import { authMiddleware } from "@/http/middlewares/auth";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

export async function getMembershipRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .get(
      "/organizations/:slug/membership",
      {
        schema: {
          tags: ["orgs"],
          summary: "Get user membership on given organization",
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              membership: z.object({
                role: rolesSchema,
                id: z.string(),
                organizationId: z.string(),
              }),
            }),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;
        const { membership } = await request.getUserMembership(slug);
        return reply.status(200).send({
          membership: {
            role: membership.role,
            id: membership.id,
            organizationId: membership.organizationId,
          },
        });
      }
    );
}
