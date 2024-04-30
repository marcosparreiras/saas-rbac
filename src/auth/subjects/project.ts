import { z } from "zod";

export const projetcSubject = z.tuple([
  z.union([
    z.literal("crete"),
    z.literal("get"),
    z.literal("update"),
    z.literal("delete"),
    z.literal("manage"),
  ]),
  z.literal("Project"),
]);

export type ProjectSubject = z.infer<typeof projetcSubject>;
