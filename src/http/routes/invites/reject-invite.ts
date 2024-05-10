import { authMiddleware } from "@/http/middlewares/auth";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { BadRequestError } from "../_erros/bad_request_error";
import { prisma } from "@/lib/prisma";

export async function rejectInviteRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .post(
      "/invites/:id/reject",
      {
        schema: {
          tags: ["invites"],
          summary: "Reject invite",
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string(),
          }),
          response: {
            204: z.null(),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { id: inviteId } = request.params;
        const userId = await request.getCurrentUserId();
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        if (!user) {
          throw new BadRequestError("User not found");
        }

        const invite = await prisma.invite.findUnique({
          where: { id: inviteId, email: user.email },
        });
        if (!invite) {
          throw new BadRequestError("Invite not found");
        }

        await prisma.invite.delete({
          where: { id: invite.id },
        });

        return reply.status(204).send();
      }
    );
}
