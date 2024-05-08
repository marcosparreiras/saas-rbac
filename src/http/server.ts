import { fastify } from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { createAccountRoute } from "./routes/auth/create-account";
import { authenticateWithPasswordRoute } from "./routes/auth/authenticate-with-password";
import { getProfileRoute } from "./routes/auth/get-profile";
import { errorHandler } from "./error-handler";
import { requestPsswordRecoverRoute } from "./routes/auth/request-password-recover";
import { resetPasswordRoute } from "./routes/auth/reset-password";
import { authenticateWithGithubRoute } from "./routes/auth/authenticate-with-github";
import { env } from "@/env";
import { createOrganizationRoute } from "./routes/orgs/create-organization";
import { getMembershipRoute } from "./routes/orgs/get-membership";
import { getOrganizationsRoute } from "./routes/orgs/get-organizations";
import { getOrganizationRoute } from "./routes/orgs/get-organization";
import { updateOrganizationRoute } from "./routes/orgs/update-organization";
import { shutdownOrganizationRoute } from "./routes/orgs/shutdown-oganization";
import { transferOrganizationRoute } from "./routes/orgs/transfer-organization";
import { createProjectRoute } from "./routes/projects/create-projects";
import { deleteProjectRoute } from "./routes/projects/delete-projects";
import { getProjectRoute } from "./routes/projects/get-project";
import { getProjectsRoute } from "./routes/projects/get-projects";
import { updateProjectRoute } from "./routes/projects/update-project";
import { getOrganizationMembersRoute } from "./routes/members/get-organization-members";

const app = fastify().withTypeProvider<ZodTypeProvider>();
app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);
app.register(fastifyCors);
app.register(fastifyJwt, {
  secret: "default",
});

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Saas RBAC",
      description:
        "A multi-tenant SaaS including authentication and RBAC authorization.",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "jwt",
        },
      },
    },
    servers: [],
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUI, {
  routePrefix: "/docs",
});

app.register(createAccountRoute);
app.register(authenticateWithPasswordRoute);
app.register(getProfileRoute);
app.register(requestPsswordRecoverRoute);
app.register(resetPasswordRoute);
app.register(authenticateWithGithubRoute);
app.register(createOrganizationRoute);
app.register(getMembershipRoute);
app.register(getOrganizationsRoute);
app.register(getOrganizationRoute);
app.register(updateOrganizationRoute);
app.register(shutdownOrganizationRoute);
app.register(transferOrganizationRoute);
app.register(createProjectRoute);
app.register(deleteProjectRoute);
app.register(getProjectRoute);
app.register(getProjectsRoute);
app.register(updateProjectRoute);
app.register(getOrganizationMembersRoute);

app.setErrorHandler(errorHandler);

app.listen({ port: env.PORT }).then(() => {
  console.log(`App is running on port ${env.PORT}`);
});
