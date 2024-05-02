import type { FastifyRequest } from "fastify";
import { UnauthorizedError } from "../routes/_erros/unauthorized_error";

export async function authMiddleware(request: FastifyRequest) {
  request.getCurrentUserId = async () => {
    try {
      const { sub } = await request.jwtVerify<{ sub: string }>();
      return sub;
    } catch (error: unknown) {
      throw new UnauthorizedError("Invalid auth token");
    }
  };
}
