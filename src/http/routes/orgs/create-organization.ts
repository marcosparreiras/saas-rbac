import z from "zod";
import type { FastifyInstance } from "fastify";
import { authMiddleware } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { BadRequestError } from "../_erros/bad_request_error";
import { generateSlug } from "@/utils/create-slug";

export async function createOrganizationRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .post(
      "/organizations",
      {
        schema: {
          tags: ["orgs"],
          summary: "Create a new organization",
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            avatarUrl: z.string().nullish(),
            domain: z.string().nullish(),
            shouldAttachUsersByDomain: z.boolean().nullish(),
          }),
          response: {
            201: z.object({ organizationId: z.string() }),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const ownerId = await request.getCurrentUserId();
        const { name, domain, avatarUrl, shouldAttachUsersByDomain } =
          request.body;
        const slug = generateSlug(name);

        const organizationAlreadyExists = await prisma.organization.findUnique({
          where: { slug },
        });
        if (organizationAlreadyExists) {
          throw new BadRequestError("Organization already exists");
        }

        if (domain) {
          const isDomainAvalilable = await prisma.organization.findUnique({
            where: { domain },
          });
          if (isDomainAvalilable) {
            throw new BadRequestError("Organization domain is not available");
          }
        }

        const { id: organizationId } = await prisma.organization.create({
          data: {
            ownerId,
            name,
            slug,
            domain,
            avatarUrl,
            shouldAttachUsersByDomain: shouldAttachUsersByDomain ?? undefined,
            members: {
              create: {
                userId: ownerId,
                role: "ADMIN",
              },
            },
          },
          select: { id: true },
        });

        return reply.status(201).send({ organizationId });
      }
    );
}
