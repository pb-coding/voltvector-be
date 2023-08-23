import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD as string;
  const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);

  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      password: hashedPassword,
      roles: {
        create: [
          {
            role: Role.ADMIN,
          },
          {
            role: Role.USER,
          },
        ],
      },
    },
  });
}
main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
