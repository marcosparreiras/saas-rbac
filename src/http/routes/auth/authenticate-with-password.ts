import { primsa } from "@/lib/prisma";
import { compare } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { BadRequestError } from "../_erros/bad_request_error";

export async function authenticateWithPasswordRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/sessions/password",
    {
      schema: {
        tags: ["auth"],
        summary: "Authenticate with email password",
        body: z.object({
          email: z.string(),
          password: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const user = await primsa.user.findUnique({ where: { email } });
      if (!user) {
        throw new BadRequestError("Invalid credentials");
      }
      if (!user.passwordHash) {
        throw new BadRequestError(
          "User does not has a password, use social login"
        );
      }

      const isPasswordValid = await compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new BadRequestError("Invalid credentials");
      }

      const token = await reply.jwtSign(
        { sub: user.id },
        { sign: { expiresIn: "7d" } }
      );

      return reply.status(201).send({ token });
    }
  );
}
