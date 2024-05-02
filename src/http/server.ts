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

app.setErrorHandler(errorHandler);

const PORT = 3000;
app.listen({ port: PORT }).then(() => {
  console.log(`App is running on port ${PORT}`);
});
