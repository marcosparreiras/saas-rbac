import { defineAbilityFor } from "@/auth";
import { userSchema } from "@/auth/models/user";
import { authMiddleware } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/utils/create-slug";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { UnauthorizedError } from "../_erros/unauthorized_error";
import { BadRequestError } from "../_erros/bad_request_error";

export async function createProjectRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .post(
      "/organizations/:slug/projects",
      {
        schema: {
          tags: ["projects"],
          summary: "Create a new project",
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            name: z.string(),
            description: z.string(),
            avatarUrl: z.string().nullish(),
          }),
          response: {
            201: z.object({ projectId: z.string() }),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { slug: orgSlug } = request.params;
        const { membership } = await request.getUserMembership(orgSlug);
        const { name, description, avatarUrl } = request.body;

        const ability = defineAbilityFor(
          userSchema.parse({ id: membership.userId, role: membership.role })
        );
        const isAbleToCreateProject = ability.can("create", "Project");
        if (!isAbleToCreateProject) {
          throw new UnauthorizedError(
            "You have no authorization to create a project"
          );
        }

        const slug = generateSlug(name);

        const projectAlreadyExists = await prisma.project.findUnique({
          where: { slug },
        });
        if (projectAlreadyExists) {
          throw new BadRequestError("Project already exists");
        }

        const { id: projectId } = await prisma.project.create({
          data: {
            name,
            slug,
            description,
            avatarUrl,
            ownerId: membership.userId,
            organizationId: membership.organizationId,
          },
          select: {
            id: true,
          },
        });

        return reply.status(201).send({ projectId });
      }
    );
}
