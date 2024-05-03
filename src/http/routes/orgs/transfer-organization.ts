import { defineAbilityFor } from "@/auth";
import { organizationSchema } from "@/auth/models/organization";
import { userSchema } from "@/auth/models/user";
import { authMiddleware } from "@/http/middlewares/auth";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { UnauthorizedError } from "../_erros/unauthorized_error";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_erros/bad_request_error";

export async function transferOrganizationRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .patch(
      "/organizations/:slug/owner",
      {
        schema: {
          tags: ["orgs"],
          summary: "Transfer organization ownership",
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            tranferToUserId: z.string(),
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
        const { tranferToUserId } = request.body;

        const ability = defineAbilityFor(
          userSchema.parse({ id: membership.userId, role: membership.role })
        );
        const isAbleToTranfer = ability.can(
          "transfer_ownership",
          organizationSchema.parse(organization)
        );

        if (!isAbleToTranfer) {
          throw new UnauthorizedError(
            "You have no authorization to tranfer the ownership of this organization"
          );
        }

        const tranferToMembership = await prisma.member.findUnique({
          where: {
            organizationId_userId: {
              userId: tranferToUserId,
              organizationId: organization.id,
            },
          },
        });
        if (!tranferToMembership) {
          throw new BadRequestError(
            "Target user is not a member of this organization"
          );
        }

        await prisma.$transaction([
          prisma.member.update({
            where: {
              organizationId_userId: {
                userId: tranferToUserId,
                organizationId: organization.id,
              },
            },
            data: {
              role: "ADMIN",
            },
          }),
          prisma.organization.update({
            where: { id: organization.id },
            data: { ownerId: tranferToUserId },
          }),
        ]);

        return reply.status(204).send();
      }
    );
}
