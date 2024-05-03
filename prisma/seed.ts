import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

async function seed(): Promise<void> {
  const prisma = new PrismaClient();

  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const passwordHash = await hash("123456", 1);

  const user = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "johndoe@example.com",
      avatarUrl: faker.image.avatarGitHub(),
      passwordHash,
    },
  });

  const anotherUser = await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      avatarUrl: faker.image.avatarGitHub(),
      passwordHash,
    },
  });

  const anotherUser2 = await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      avatarUrl: faker.image.avatarGitHub(),
      passwordHash,
    },
  });

  await prisma.organization.create({
    data: {
      name: "My Organization (Admin)",
      domain: "my-organization.com",
      slug: "my-organization-admin",
      avatarUrl: faker.image.avatarGitHub(),
      shouldAttachUsersByDomain: true,
      ownerId: user.id,
      projects: {
        createMany: {
          data: [
            {
              ownerId: faker.helpers.arrayElement([
                user.id,
                anotherUser.id,
                anotherUser2.id,
              ]),
              name: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
            {
              ownerId: faker.helpers.arrayElement([
                user.id,
                anotherUser.id,
                anotherUser2.id,
              ]),
              name: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
            {
              ownerId: faker.helpers.arrayElement([
                user.id,
                anotherUser.id,
                anotherUser2.id,
              ]),
              name: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
          ],
        },
      },
      members: {
        createMany: {
          data: [
            {
              userId: user.id,
              role: "ADMIN",
            },
            {
              userId: anotherUser.id,
              role: "MEMBER",
            },
            {
              userId: anotherUser2.id,
              role: "MEMBER",
            },
          ],
        },
      },
    },
  });

  await prisma.organization.create({
    data: {
      name: "My Organization (Member)",
      slug: "my-organization-member",
      avatarUrl: faker.image.avatarGitHub(),
      ownerId: user.id,
      projects: {
        createMany: {
          data: [
            {
              ownerId: faker.helpers.arrayElement([
                user.id,
                anotherUser.id,
                anotherUser2.id,
              ]),
              name: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
            {
              ownerId: faker.helpers.arrayElement([
                user.id,
                anotherUser.id,
                anotherUser2.id,
              ]),
              name: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
            {
              ownerId: faker.helpers.arrayElement([
                user.id,
                anotherUser.id,
                anotherUser2.id,
              ]),
              name: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
          ],
        },
      },
      members: {
        createMany: {
          data: [
            {
              userId: user.id,
              role: "MEMBER",
            },
            {
              userId: anotherUser.id,
              role: "ADMIN",
            },
            {
              userId: anotherUser2.id,
              role: "MEMBER",
            },
          ],
        },
      },
    },
  });

  await prisma.organization.create({
    data: {
      name: "My Organization (Billing)",
      slug: "my-organization-billing",
      avatarUrl: faker.image.avatarGitHub(),
      ownerId: user.id,
      projects: {
        createMany: {
          data: [
            {
              ownerId: faker.helpers.arrayElement([
                user.id,
                anotherUser.id,
                anotherUser2.id,
              ]),
              name: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
            {
              ownerId: faker.helpers.arrayElement([
                user.id,
                anotherUser.id,
                anotherUser2.id,
              ]),
              name: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
            {
              ownerId: faker.helpers.arrayElement([
                user.id,
                anotherUser.id,
                anotherUser2.id,
              ]),
              name: faker.lorem.words(5),
              description: faker.lorem.paragraph(),
              slug: faker.lorem.slug(5),
              avatarUrl: faker.image.avatarGitHub(),
            },
          ],
        },
      },
      members: {
        createMany: {
          data: [
            {
              userId: user.id,
              role: "BILLING",
            },
            {
              userId: anotherUser.id,
              role: "ADMIN",
            },
            {
              userId: anotherUser2.id,
              role: "MEMBER",
            },
          ],
        },
      },
    },
  });

  await prisma.$disconnect();
}

seed().then(() => {
  console.log("Database seeded 🌱");
});
