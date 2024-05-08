import { defineAbilityFor } from "@/auth";
import { userSchema } from "@/auth/models/user";
import { authMiddleware } from "@/http/middlewares/auth";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { UnauthorizedError } from "../_erros/unauthorized_error";
import { prisma } from "@/lib/prisma";
import { rolesSchema } from "@/auth/roles";

export async function getOrganizationMembersRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .get(
      "/organizations/:slug/members",
      {
        schema: {
          tags: ["members"],
          summary: "Get organization members",
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          response: {
            200: z.object({
              members: z.array(
                z.object({
                  role: rolesSchema,
                  id: z.string(),
                  userId: z.string(),
                  name: z.string().nullable(),
                  email: z.string(),
                  avatarUrl: z.string().nullable(),
                })
              ),
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
        const isAbleToGetOrganizationMembers = ability.can("get", "User");
        if (!isAbleToGetOrganizationMembers) {
          throw new UnauthorizedError(
            "You have no authorization to see organization members"
          );
        }

        const members = await prisma.member.findMany({
          where: { organizationId: membership.organizationId },
          orderBy: { role: "asc" },
          select: {
            id: true,
            role: true,
            user: {
              select: {
                name: true,
                id: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        });

        return reply.status(200).send({
          members: members.map(
            ({ user: { id: userId, ...user }, ...member }) => ({
              userId,
              ...member,
              ...user,
            })
          ),
        });
      }
    );
}
