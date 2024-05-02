import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { BadRequestError } from "../_erros/bad_request_error";
import { prisma } from "@/lib/prisma";

export async function authenticateWithGithubRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/sessions/github",
    {
      schema: {
        tags: ["auth"],
        summary: "Authenticate with Github",
        body: z.object({
          code: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { code } = request.body;

      const githubOAuthUrl = new URL(
        "https://github.com/login/oauth/access_token"
      );
      githubOAuthUrl.searchParams.set("client_id", "Ov23liFUEDNZIF1m1nwL"),
        githubOAuthUrl.searchParams.set(
          "client_secret",
          "d4715264a199789b87b1f9ac21583db8c08b191c"
        ),
        githubOAuthUrl.searchParams.set(
          "redirect_uri",
          "http://localhost:3000/api/auth/callback"
        );
      githubOAuthUrl.searchParams.set("code", code);

      const githubAccessTokenResponse = await fetch(githubOAuthUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });
      const githubAccessTokenData = await githubAccessTokenResponse.json();

      const githubAccessTokenDataSchema = z.object({
        access_token: z.string(),
        token_type: z.literal("bearer"),
        scope: z.string(),
      });

      const { access_token: githubAccessToken } =
        githubAccessTokenDataSchema.parse(githubAccessTokenData);

      const githubUserResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${githubAccessToken}`,
        },
      });

      const githubUserData = await githubUserResponse.json();

      const githubUserDataSchema = z.object({
        id: z.number().int().transform(String),
        avatar_url: z.string().url(),
        name: z.string().nullable(),
        email: z.string().nullable(),
      });

      const {
        id: githubId,
        avatar_url: avatarUrl,
        email,
        name,
      } = githubUserDataSchema.parse(githubUserData);

      if (!email) {
        throw new BadRequestError(
          "Your github account must have an email to authenticate"
        );
      }

      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            avatarUrl,
            name,
          },
        });
      }

      let account = await prisma.account.findUnique({
        where: {
          provider_userId: {
            provider: "GITHUB",
            userId: user.id,
          },
        },
      });

      if (!account) {
        account = await prisma.account.create({
          data: {
            provider: "GITHUB",
            providerAccountId: githubId,
            userId: user.id,
          },
        });
      }

      const token = await reply.jwtSign(
        { sub: user.id },
        { sign: { expiresIn: "7d" } }
      );

      return reply.status(201).send({ token });
    }
  );
}
