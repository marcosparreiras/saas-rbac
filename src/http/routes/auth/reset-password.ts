import { prisma } from "@/lib/prisma";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { hash } from "bcryptjs";
import { UnauthorizedError } from "../_erros/unauthorized_error";

export async function resetPasswordRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/password/reset",
    {
      schema: {
        tags: ["auth"],
        summary: "Reset password",
        body: z.object({
          code: z.string(),
          newPassword: z.string().min(6),
        }),
        response: {
          204: z.null(),
          401: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { newPassword, code } = request.body;

      const tokenFromCode = await prisma.token.findUnique({
        where: { id: code },
        select: { userId: true },
      });
      if (!tokenFromCode) {
        throw new UnauthorizedError();
      }

      const newPasswordHash = await hash(newPassword, 6);
      await prisma.user.update({
        where: { id: tokenFromCode.userId },
        data: { passwordHash: newPasswordHash },
      });

      return reply.status(204).send();
    }
  );
}
