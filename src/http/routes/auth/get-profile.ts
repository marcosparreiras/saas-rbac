import { primsa } from "@/lib/prisma";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

export async function getProfileRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/profile",
    {
      schema: {
        tags: ["auth"],
        summary: "Get authenticated user profile",
        response: {
          200: z.object({
            user: z.object({
              id: z.string().uuid(),
              name: z.string().nullable(),
              email: z.string(),
              avatarUrl: z.string().nullable(),
            }),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { sub } = await request.jwtVerify<{ sub: string }>();

      const user = await primsa.user.findUnique({
        where: { id: sub },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      });
      if (!user) {
        return reply.status(404).send({
          message: "User not found",
        });
      }

      return reply.status(200).send({ user });
    }
  );
}
