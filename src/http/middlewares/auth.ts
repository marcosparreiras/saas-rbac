import type { FastifyRequest } from "fastify";
import { UnauthorizedError } from "../routes/_erros/unauthorized_error";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../routes/_erros/bad_request_error";

export async function authMiddleware(request: FastifyRequest) {
  request.getCurrentUserId = async () => {
    try {
      const { sub } = await request.jwtVerify<{ sub: string }>();
      return sub;
    } catch (error: unknown) {
      throw new UnauthorizedError("Invalid auth token");
    }
  };

  request.getUserMembership = async (slug: string) => {
    try {
      const { sub } = await request.jwtVerify<{ sub: string }>();
      const member = await prisma.member.findFirst({
        where: {
          userId: sub,
          organization: {
            slug,
          },
        },
        include: {
          organization: true,
        },
      });
      if (!member) {
        throw new UnauthorizedError(
          "You are not a member of this organization"
        );
      }
      const { organization, ...membership } = member;
      return { organization, membership };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError("Invalid auth token");
    }
  };
}
