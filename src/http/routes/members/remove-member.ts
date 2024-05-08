import { defineAbilityFor } from "@/auth";
import { userSchema } from "@/auth/models/user";
import { authMiddleware } from "@/http/middlewares/auth";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { UnauthorizedError } from "../_erros/unauthorized_error";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_erros/bad_request_error";

export async function removeMemberRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .delete(
      "/organizations/:slug/members/:id",
      {
        schema: {
          tags: ["members"],
          summary: "Remove member",
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            id: z.string(),
          }),
          response: {
            204: z.null(),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { id: memberId, slug: orgSlug } = request.params;
        const { membership } = await request.getUserMembership(orgSlug);

        const ability = defineAbilityFor(
          userSchema.parse({ id: membership.userId, role: membership.role })
        );
        const isAbleToRemoveMember = ability.can("delete", "User");
        if (!isAbleToRemoveMember) {
          throw new UnauthorizedError(
            "You are not authorized to remove members of this organization"
          );
        }

        const memberExists = await prisma.member.findUnique({
          where: { id: memberId, organizationId: membership.organizationId },
        });
        if (!memberExists) {
          throw new BadRequestError("Member not found");
        }
        await prisma.member.delete({
          where: { id: memberId, organizationId: membership.organizationId },
        });

        return reply.status(204).send();
      }
    );
}
