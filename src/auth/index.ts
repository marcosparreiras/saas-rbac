import {
  AbilityBuilder,
  CreateAbility,
  createMongoAbility,
  MongoAbility,
} from "@casl/ability";
import { z } from "zod";
import { User } from "./models/user";
import { permissions } from "./permissions";
import { userSubject } from "./subjects/user";
import { projectSubject } from "./subjects/project";
import { organizationSubject } from "./subjects/organizations";
import { inviteSubject } from "./subjects/invite";
import { billingSubject } from "./subjects/billing";

const appAbilitiesSchema = z.union([
  userSubject,
  projectSubject,
  organizationSubject,
  inviteSubject,
  billingSubject,
  z.tuple([z.literal("manage"), z.literal("all")]),
]);

type AppAbilities = z.infer<typeof appAbilitiesSchema>;

export type AppAbility = MongoAbility<AppAbilities>;
const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

export function defineAbilityFor(user: User) {
  const builder = new AbilityBuilder(createAppAbility);
  if (typeof permissions[user.role] !== "function") {
    throw new Error(`Permission for ${user.role} not found`);
  }
  permissions[user.role](user, builder);

  const ability = builder.build({
    detectSubjectType(subject) {
      return subject.__typename;
    },
  });
  return ability;
}
