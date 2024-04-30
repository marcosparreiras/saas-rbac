import { rolesSchema } from "../roles";
import { z } from "zod";

export const userSchema = z.object({
  role: rolesSchema,
});

export type User = z.infer<typeof userSchema>;
