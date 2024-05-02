import { prisma } from "@/lib/prisma";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { BadRequestError } from "../_erros/bad_request_error";
import { authMiddleware } from "@/http/middlewares/auth";

export async function getProfileRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .get(
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
            400: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId();

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        });
        if (!user) {
          throw new BadRequestError("User not found");
        }

        return reply.status(200).send({ user });
      }
    );
}
