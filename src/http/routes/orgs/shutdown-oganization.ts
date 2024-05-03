import { defineAbilityFor } from "@/auth";
import { organizationSchema } from "@/auth/models/organization";
import { userSchema } from "@/auth/models/user";
import { authMiddleware } from "@/http/middlewares/auth";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { UnauthorizedError } from "../_erros/unauthorized_error";
import { prisma } from "@/lib/prisma";

export async function shutdownOrganizationRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .delete(
      "/organizations/:slug",
      {
        schema: {
          tags: ["orgs"],
          summary: "Delete an organization",
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            204: z.null(),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;
        const { membership, organization } = await request.getUserMembership(
          slug
        );

        const ability = defineAbilityFor(
          userSchema.parse({ id: membership.userId, role: membership.role })
        );
        const isAbleToDelete = ability.can(
          "delete",
          organizationSchema.parse(organization)
        );
        if (!isAbleToDelete) {
          throw new UnauthorizedError(
            "You have no authorization to delete this organization"
          );
        }
        await prisma.organization.delete({ where: { id: organization.id } });
        return reply.status(204).send();
      }
    );
}
