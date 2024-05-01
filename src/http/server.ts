import { fastify } from "fastify";
import fastifyCors from "@fastify/cors";
import {
  // jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";

const app = fastify().withTypeProvider<ZodTypeProvider>();
app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);
app.register(fastifyCors);

const PORT = 3000;
app.listen({ port: PORT }).then(() => {
  console.log(`App is running on port ${PORT}`);
});
