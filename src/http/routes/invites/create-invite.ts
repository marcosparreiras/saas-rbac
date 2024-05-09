import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { defineAbilityFor } from "@/auth";
import { userSchema } from "@/auth/models/user";
import { rolesSchema } from "@/auth/roles";
import { authMiddleware } from "@/http/middlewares/auth";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { UnauthorizedError } from "../_erros/unauthorized_error";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_erros/bad_request_error";

export async function createInviteRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", authMiddleware)
    .post(
      "/organizations/:slug/invites",
      {
        schema: {
          tags: ["invites"],
          summary: "Invite a member to join an organization",
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            email: z.string().email(),
            role: rolesSchema,
          }),
          response: {
            201: z.object({ inviteId: z.string() }),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { slug: orgSlug } = request.params;
        const { email, role } = request.body;
        const { membership, organization } = await request.getUserMembership(
          orgSlug
        );

        const ability = defineAbilityFor(
          userSchema.parse({ id: membership.userId, role: membership.role })
        );
        const isAbleToSendInvites = ability.can("create", "Invite");
        if (!isAbleToSendInvites) {
          throw new UnauthorizedError(
            "You are not authorized to send invites for this organization"
          );
        }

        const [, domain] = email;
        if (
          organization.shouldAttachUsersByDomain &&
          organization.domain === domain
        ) {
          throw new BadRequestError(
            `User with ${domain} domain will join your organization automatically on login `
          );
        }

        const userTargetExists = await prisma.user.findUnique({
          where: { email },
        });
        if (!userTargetExists) {
          throw new BadRequestError("User not found");
        }

        const inviteWithSameEmailExists = await prisma.invite.findUnique({
          where: {
            email_organizationId: {
              email,
              organizationId: membership.organizationId,
            },
          },
        });

        if (inviteWithSameEmailExists) {
          throw new BadRequestError(
            "Another invite with same email already exists"
          );
        }

        const isUserAlreadyMember = await prisma.member.findFirst({
          where: {
            organizationId: membership.organizationId,
            user: {
              email,
            },
          },
        });

        if (isUserAlreadyMember) {
          throw new BadRequestError(
            "A member with this email already belongs to your organization"
          );
        }

        const { id: inviteId } = await prisma.invite.create({
          data: {
            email,
            role,
            authorId: membership.userId,
            organizationId: membership.organizationId,
          },
          select: {
            id: true,
          },
        });

        return reply.status(201).send({ inviteId });
      }
    );
}
