import "fastify";
import { Organization, Member } from "@prisma/client";

declare module "fastify" {
  export interface FastifyRequest {
    getCurrentUserId(): Promise<string>;
    getUserMembership(
      organizationId
    ): Promise<{ organization: Organization; membership: Member }>;
  }
}
