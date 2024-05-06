import { defineAbilityFor } from "@/auth";
import { userSchema } from "@/auth/models/user";
import { authMiddleware } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { UnauthorizedError } from "../_erros/unauthorized_error";
import { BadRequestError } from "../_erros/bad_request_error";
import { projectSchema } from "@/auth/models/project";

export async function getProjectRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .get(
      "/organizations/:orgSlug/projects/:projectSlug",
      {
        schema: {
          tags: ["projects"],
          summary: "Get project details",
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
            projectSlug: z.string(),
          }),
          response: {
            200: z.object({
              project: z.object({
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
              }),
            }),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { orgSlug, projectSlug } = request.params;
        const { membership } = await request.getUserMembership(orgSlug);

        const project = await prisma.project.findUnique({
          where: {
            slug: projectSlug,
            organizationId: membership.organizationId,
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
            ownerId: true,
            owner: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        });
        if (!project) {
          throw new BadRequestError("Project not found");
        }

        const ability = defineAbilityFor(
          userSchema.parse({ id: membership.userId, role: membership.role })
        );
        const isAbleToDeleteProject = ability.can(
          "get",
          projectSchema.parse(project)
        );
        if (!isAbleToDeleteProject) {
          throw new UnauthorizedError(
            "You have no authorization to get this project details"
          );
        }

        return reply.status(200).send({ project });
      }
    );
}
