import { authMiddleware } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { BadRequestError } from "../_erros/bad_request_error";
import { rolesSchema } from "@/auth/roles";

export async function getPendingInvitesRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .get(
      "/pending-invites",
      {
        schema: {
          tags: ["invites"],
          summary: "Get all user pending invites",
          security: [{ bearerAuth: [] }],
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
                  organizationName: z.string(),
                  organizationId: z.string(),
                })
              ),
            }),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId();

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        if (!user) {
          throw new BadRequestError("User not found");
        }

        const invites = await prisma.invite.findMany({
          where: { email: user.email },
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
            organization: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        });

        return reply.status(200).send({
          invites: invites.map(({ author, organization, ...inviteData }) => ({
            authorName: author?.name ?? null,
            authorId: author?.id ?? null,
            authorAvatarUrl: author?.avatarUrl ?? null,
            organizationName: organization.name,
            organizationId: organization.id,
            ...inviteData,
          })),
        });
      }
    );
}
