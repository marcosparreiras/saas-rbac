import { prisma } from "@/lib/prisma";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export async function getOrganizationsRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/organizations",
    {
      schema: {
        tags: ["orgs"],
        summary: "List organizations",
        querystring: z.object({
          page: z.coerce.number().int().default(1),
        }),
        response: {
          200: z.object({
            organizations: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                slug: z.string(),
                domain: z.string().nullable(),
                ownerId: z.string(),
                shouldAttachUsersByDomain: z.boolean(),
                avatarUrl: z.string().nullable(),
                createtAt: z.date(),
                updatedAt: z.date(),
              })
            ),
          }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { page } = request.query;
      const organizations = await prisma.organization.findMany({
        orderBy: { createtAt: "desc" },
        take: 20,
        skip: (page - 1) * 20,
      });

      return reply.status(200).send({ organizations });
    }
  );
}
