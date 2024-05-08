import { defineAbilityFor } from "@/auth";
import { userSchema } from "@/auth/models/user";
import { rolesSchema } from "@/auth/roles";
import { authMiddleware } from "@/http/middlewares/auth";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { UnauthorizedError } from "../_erros/unauthorized_error";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_erros/bad_request_error";

export async function updateMemberRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .put(
      "/organizations/:slug/members/:id",
      {
        schema: {
          tags: ["members"],
          summary: "Update member",
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            id: z.string(),
          }),
          body: z.object({
            role: rolesSchema,
          }),
          response: {
            204: z.null(),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { role: newRole } = request.body;
        const { id: memberId, slug: orgSlug } = request.params;
        const { membership } = await request.getUserMembership(orgSlug);

        const ability = defineAbilityFor(
          userSchema.parse({ id: membership.userId, role: membership.role })
        );
        const isAbleToUpdateMember = ability.can("update", "User");
        if (!isAbleToUpdateMember) {
          throw new UnauthorizedError(
            "You are not authorized to update the members of this organization"
          );
        }

        const memberExists = await prisma.member.findUnique({
          where: { id: memberId, organizationId: membership.organizationId },
        });
        if (!memberExists) {
          throw new BadRequestError("Member not found");
        }
        await prisma.member.update({
          where: { id: memberId, organizationId: membership.organizationId },
          data: { role: newRole },
        });

        return reply.status(204).send();
      }
    );
}
