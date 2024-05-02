import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_erros/bad_request_error";

export async function createAccountRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/account",
    {
      schema: {
        tags: ["auth"],
        summary: "Create a new account",
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string().min(6),
        }),
        response: {
          201: z.object({
            userId: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body;
      const userWithSameEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (userWithSameEmail) {
        throw new BadRequestError(`User with email ${email} already exists`);
      }

      const [, domain] = email.split("@");
      const autoJoinOrganization = await prisma.organization.findFirst({
        where: {
          domain,
          shouldAttachUsersByDomain: true,
        },
      });

      const passwordHash = await hash(password, 6);
      const { id: userId } = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          member_on: autoJoinOrganization
            ? {
                create: {
                  organizationId: autoJoinOrganization.id,
                },
              }
            : undefined,
        },
        select: {
          id: true,
        },
      });
      return reply.status(201).send({ userId });
    }
  );
}
