import { authMiddleware } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export async function getOrganizationsRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .get(
      "/organizations",
      {
        schema: {
          tags: ["orgs"],
          summary: "List authenticated user organizations",
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              organizations: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  slug: z.string(),
                  avatarUrl: z.string().nullable(),
                  role: z.string(),
                })
              ),
            }),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId();
        const organizations = await prisma.organization.findMany({
          orderBy: { createtAt: "desc" },
          where: {
            members: {
              some: {
                userId,
              },
            },
          },
          select: {
            id: true,
            name: true,
            slug: true,
            avatarUrl: true,
            members: {
              select: {
                role: true,
              },
              where: {
                userId,
              },
            },
          },
        });

        return reply.status(200).send({
          organizations: organizations.map(({ members, ...org }) => {
            return {
              ...org,
              role: members[0].role,
            };
          }),
        });
      }
    );
}
