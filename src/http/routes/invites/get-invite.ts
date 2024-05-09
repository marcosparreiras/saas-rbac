import { rolesSchema } from "@/auth/roles";
import { authMiddleware } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { BadRequestError } from "../_erros/bad_request_error";

export async function getInviteRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/invites/:id",
    {
      schema: {
        tags: ["invites"],
        summary: "Get invite",
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({
            invite: z.object({
              id: z.string(),
              email: z.string(),
              role: rolesSchema,
              createdAt: z.date(),
              authorName: z.string().nullable(),
              authorId: z.string().nullable(),
              authorAvatarUrl: z.string().nullable(),
              organizationName: z.string(),
              organizationId: z.string(),
            }),
          }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id: inviteId } = request.params;

      const invite = await prisma.invite.findUnique({
        where: { id: inviteId },
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
      if (!invite) {
        throw new BadRequestError("Invite not found");
      }

      const { author, organization, ...inviteData } = invite;
      return reply.status(200).send({
        invite: {
          authorName: author?.name ?? null,
          authorId: author?.id ?? null,
          authorAvatarUrl: author?.avatarUrl ?? null,
          organizationName: organization.name,
          organizationId: organization.id,
          ...inviteData,
        },
      });
    }
  );
}
