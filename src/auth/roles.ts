import { z } from "zod";

export const rolesSchema = z.union([
  z.literal("ADMIN"),
  z.literal("MEMBER"),
  z.literal("BILLING"),
]);

export type Roles = z.infer<typeof rolesSchema>;
