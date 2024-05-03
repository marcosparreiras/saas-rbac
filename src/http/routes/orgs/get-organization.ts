import { prisma } from "@/lib/prisma";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { BadRequestError } from "../_erros/bad_request_error";

export async function getOrganizationRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/organizations/:organizationId",
    {
      schema: {
        tags: ["orgs"],
        summary: "Get organization by a given id",
        params: z.object({
          organizationId: z.string(),
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
            }),
          }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { organizationId } = request.params;
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });
      if (!organization) {
        throw new BadRequestError("Organization not found");
      }
      return reply.status(200).send({ organization });
    }
  );
}
