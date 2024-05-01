import { fastify } from "fastify";
import fastifyCors from "@fastify/cors";
import {
  // jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { createAccountRoute } from "./routes/auth/create-account";

const app = fastify().withTypeProvider<ZodTypeProvider>();
app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);
app.register(fastifyCors);

app.register(createAccountRoute);

const PORT = 3000;
app.listen({ port: PORT }).then(() => {
  console.log(`App is running on port ${PORT}`);
});
