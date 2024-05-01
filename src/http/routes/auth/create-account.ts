import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { hash } from "bcryptjs";
import { primsa } from "@/lib/prisma";

export async function createAccountRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/account",
    {
      schema: {
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string().min(6),
        }),
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body;
      const userWithSameEmail = await primsa.user.findUnique({
        where: { email },
      });
      if (userWithSameEmail) {
        return reply
          .status(400)
          .send({ message: `User with email ${email} already exists` });
      }
      const passwordHash = await hash(password, 6);
      const { id: userId } = await primsa.user.create({
        data: {
          email,
          name,
          passwordHash,
        },
        select: {
          id: true,
        },
      });
      return reply.status(201).send({ userId });
    }
  );
}
