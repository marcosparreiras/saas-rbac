import { AppAbility } from ".";
import { AbilityBuilder } from "@casl/ability";
import { User } from "./models/user";
import { Roles } from "./roles";

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>
) => void;

export const permissions: Record<Roles, PermissionsByRole> = {
  ADMIN(user, { can, cannot }) {
    can("manage", "all");
    cannot(["transfer_ownership", "update", "delete"], "Organization");
    can(["transfer_ownership", "update"], "Organization", {
      ownerId: { $eq: user.id },
    });
  },
  MEMBER(user, { can }) {
    can("get", "User");
    can(["create", "get"], "Project");
    can(["update", "delete"], "Project", { ownerId: { $eq: user.id } });
  },
  BILLING(_user, { can }) {
    can("manage", "Billing");
  },
};
