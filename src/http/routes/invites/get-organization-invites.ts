import { defineAbilityFor } from "@/auth";
import { userSchema } from "@/auth/models/user";
import { authMiddleware } from "@/http/middlewares/auth";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { UnauthorizedError } from "../_erros/unauthorized_error";
import { prisma } from "@/lib/prisma";
import { rolesSchema } from "@/auth/roles";

export async function getOrganizationInvitesRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .get(
      "/organizations/:slug/invites",
      {
        schema: {
          tags: ["invites"],
          summary: "Get organization invites",
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              invites: z.array(
                z.object({
                  id: z.string(),
                  email: z.string(),
                  role: rolesSchema,
                  createdAt: z.date(),
                  authorName: z.string().nullable(),
                  authorId: z.string().nullable(),
                  authorAvatarUrl: z.string().nullable(),
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
        if (ability.cannot("get", "Invite")) {
          throw new UnauthorizedError(
            "You are not authorized to get this organization invites"
          );
        }

        const invites = await prisma.invite.findMany({
          where: { organizationId: membership.organizationId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            author: {
              select: {
                name: true,
                id: true,
                avatarUrl: true,
              },
            },
          },
        });

        return reply.status(200).send({
          invites: invites.map(({ author, ...inviteData }) => ({
            authorName: author?.name ?? null,
            authorId: author?.id ?? null,
            authorAvatarUrl: author?.avatarUrl ?? null,
            ...inviteData,
          })),
        });
      }
    );
}
