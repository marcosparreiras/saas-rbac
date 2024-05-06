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

export async function updateProjectRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .put(
      "/organizations/:orgSlug/projects/:projectSlug",
      {
        schema: {
          tags: ["projects"],
          summary: "Update project",
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
            projectSlug: z.string(),
          }),
          body: z.object({
            name: z.string().nullish(),
            description: z.string().nullish(),
            avatarUrl: z.string().nullish(),
          }),
          response: {
            204: z.null(),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { orgSlug, projectSlug } = request.params;
        const { membership } = await request.getUserMembership(orgSlug);
        const { name, description, avatarUrl } = request.body;

        const project = await prisma.project.findUnique({
          where: {
            slug: projectSlug,
            organizationId: membership.organizationId,
          },
        });
        if (!project) {
          throw new BadRequestError("Project not found");
        }

        const ability = defineAbilityFor(
          userSchema.parse({ id: membership.userId, role: membership.role })
        );
        const isAbleToUpdateProject = ability.can(
          "update",
          projectSchema.parse(project)
        );
        if (!isAbleToUpdateProject) {
          throw new UnauthorizedError(
            "You have no authorization update this project"
          );
        }

        await prisma.project.update({
          where: { id: project.id, organizationId: membership.organizationId },
          data: {
            name: name ?? undefined,
            description: description ?? undefined,
            avatarUrl,
          },
        });

        return reply.status(204).send();
      }
    );
}
