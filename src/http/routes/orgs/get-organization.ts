import { prisma } from "@/lib/prisma";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { BadRequestError } from "../_erros/bad_request_error";
import { authMiddleware } from "@/http/middlewares/auth";
import { rolesSchema } from "@/auth/roles";

export async function getOrganizationRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .get(
      "/organizations/:slug",
      {
        schema: {
          tags: ["orgs"],
          summary: "Get organization of an authenticated user by slug",
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              organization: z.object({
                id: z.string(),
                name: z.string(),
                slug: z.string(),
                domain: z.string().nullable(),
                ownerId: z.string(),
                shouldAttachUsersByDomain: z.boolean(),
                avatarUrl: z.string().nullable(),
                createtAt: z.date(),
                updatedAt: z.date(),
                role: rolesSchema,
              }),
            }),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;
        const { organization, membership } = await request.getUserMembership(
          slug
        );
        return reply.status(200).send({
          organization: {
            ...organization,
            role: membership.role,
          },
        });
      }
    );
}
