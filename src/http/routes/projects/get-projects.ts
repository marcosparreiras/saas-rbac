import { defineAbilityFor } from "@/auth";
import { userSchema } from "@/auth/models/user";
import { authMiddleware } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { UnauthorizedError } from "../_erros/unauthorized_error";

export async function getProjectsRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .get(
      "/organizations/:slug/projects",
      {
        schema: {
          tags: ["projects"],
          summary: "Get organization projects details",
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              projects: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  slug: z.string(),
                  description: z.string(),
                  avatarUrl: z.string().nullable(),
                  createtAt: z.date(),
                  updatedAt: z.date(),
                  organizationId: z.string(),
                  owner: z.object({
                    id: z.string(),
                    name: z.string().nullable(),
                    avatarUrl: z.string().nullable(),
                  }),
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

        const projects = await prisma.project.findMany({
          where: {
            organizationId: membership.organizationId,
          },
          orderBy: {
            createtAt: "desc",
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            avatarUrl: true,
            createtAt: true,
            updatedAt: true,
            organizationId: true,
            owner: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        });

        const ability = defineAbilityFor(
          userSchema.parse({ id: membership.userId, role: membership.role })
        );
        const isAbleToGetOrganizationProjects = ability.can("get", "Project");
        if (!isAbleToGetOrganizationProjects) {
          throw new UnauthorizedError(
            "You have no authorization to get this organizations projects"
          );
        }

        return reply.status(200).send({ projects });
      }
    );
}
