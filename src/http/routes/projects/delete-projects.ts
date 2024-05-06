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

export async function deleteProjectRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .delete(
      "/organizations/:orgSlug/projects/:projectSlug",
      {
        schema: {
          tags: ["projects"],
          summary: "Delete a project",
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
            projectSlug: z.string(),
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

        const project = await prisma.project.findUnique({
          where: { slug: projectSlug },
        });
        if (!project) {
          throw new BadRequestError("Project not found");
        }

        const ability = defineAbilityFor(
          userSchema.parse({ id: membership.userId, role: membership.role })
        );
        const isAbleToDeleteProject = ability.can(
          "delete",
          projectSchema.parse(project)
        );
        if (!isAbleToDeleteProject) {
          throw new UnauthorizedError(
            "You have no authorization to create a project"
          );
        }

        await prisma.project.delete({ where: { id: project.id } });

        return reply.status(204).send();
      }
    );
}
