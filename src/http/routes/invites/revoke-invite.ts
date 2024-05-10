import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { defineAbilityFor } from "@/auth";
import { userSchema } from "@/auth/models/user";
import { authMiddleware } from "@/http/middlewares/auth";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { UnauthorizedError } from "../_erros/unauthorized_error";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_erros/bad_request_error";

export async function revokeInviteRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .post(
      "/organizations/:slug/invites/:id/revoke",
      {
        schema: {
          tags: ["invites"],
          summary: "Revoke an invite",
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
        const { slug: orgSlug, id: inviteId } = request.params;
        const { membership } = await request.getUserMembership(orgSlug);

        const ability = defineAbilityFor(
          userSchema.parse({ id: membership.userId, role: membership.role })
        );
        const isAbleToRevokeInvites = ability.can("delete", "Invite");
        if (!isAbleToRevokeInvites) {
          throw new UnauthorizedError(
            "You are not authorized to revoke invites for this organization"
          );
        }

        const invite = await prisma.invite.findUnique({
          where: { id: inviteId, organizationId: membership.organizationId },
          select: { id: true },
        });
        if (!invite) {
          throw new BadRequestError("Invite not found");
        }

        await prisma.invite.delete({ where: { id: invite.id } });

        return reply.status(204).send();
      }
    );
}
