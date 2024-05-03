import { defineAbilityFor } from "@/auth";
import { authMiddleware } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { UnauthorizedError } from "../_erros/unauthorized_error";
import { userSchema } from "@/auth/models/user";
import { organizationSchema } from "@/auth/models/organization";
import { BadRequestError } from "../_erros/bad_request_error";

export async function updateOrganizationRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .put(
      "/organizations/:slug",
      {
        schema: {
          tags: ["orgs"],
          summary: "Update an orginizations data",
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            name: z.string().nullish(),
            avatarUrl: z.string().nullish(),
            domain: z.string().nullish(),
            shouldAttachUsersByDomain: z.boolean().nullish(),
          }),
          response: {
            204: z.null(),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;
        const userId = await request.getCurrentUserId();
        const { organization, membership } = await request.getUserMembership(
          slug
        );
        const { name, domain, avatarUrl, shouldAttachUsersByDomain } =
          request.body;

        const ability = defineAbilityFor(
          userSchema.parse({ id: userId, role: membership.role })
        );
        const isAbleToUpdate = ability.can(
          "update",
          organizationSchema.parse(organization)
        );
        if (!isAbleToUpdate) {
          throw new UnauthorizedError(
            "You have no authorization to perform update on this organization"
          );
        }

        if (domain && domain !== organization.domain) {
          const isDomainAvalilable = await prisma.organization.findUnique({
            where: { domain },
          });
          if (isDomainAvalilable) {
            throw new BadRequestError("Organization domain is not available");
          }
        }

        await prisma.organization.update({
          where: { id: organization.id },
          data: {
            name: name ?? undefined,
            domain,
            avatarUrl,
            shouldAttachUsersByDomain: shouldAttachUsersByDomain ?? undefined,
          },
        });
        return reply.status(204).send();
      }
    );
}
