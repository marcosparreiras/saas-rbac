import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { BadRequestError } from "./routes/_erros/bad_request_error";
import { UnauthorizedError } from "./routes/_erros/unauthorized_error";

type FastifyErrorHandler = FastifyInstance["errorHandler"];

export const errorHandler: FastifyErrorHandler = async (
  error,
  _request,
  reply
) => {
  console.log(error);

  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Validation Error",
      errors: error.flatten().fieldErrors,
    });
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      message: error.message,
    });
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      message: error.message,
    });
  }

  console.log(error);
  // TO-DO: Send error to some observability plataform

  return reply.status(500).send({
    message: "Internal server error",
  });
};
