import { primsa } from "@/lib/prisma";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

export async function requestPsswordRecoverRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/password/recover",
    {
      schema: {
        tags: ["auth"],
        summary: "Request password recover",
        body: z.object({
          email: z.string(),
        }),
        response: {
          201: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body;

      const user = await primsa.user.findUnique({ where: { email } });
      if (!user) {
        // We don't want people to know if a user really exists
        return reply.status(201).send();
      }

      const { id: code } = await primsa.token.create({
        data: {
          type: "PASSWORD_RECOVER",
          userId: user.id,
        },
      });

      // TO-DO: Send email with password recover link
      console.log("Recover password token " + code);

      return reply.status(201).send();
    }
  );
}
