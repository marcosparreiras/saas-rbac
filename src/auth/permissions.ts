import { AppAbility } from ".";
import { AbilityBuilder } from "@casl/ability";
import { User } from "./models/user";
import { Roles } from "./roles";

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>
) => void;

export const permissions: Record<Roles, PermissionsByRole> = {
  ADMIN(_user, { can }) {
    can("manage", "all");
  },
  MEMBER(_user, { can }) {
    can("manage", "User");
  },
  BILLING(_user, { can }) {},
};
