import { prisma } from "../lib/prisma";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npx tsx scripts/make-admin.ts your@email.com");
    process.exit(1);
  }

  console.log(`Looking for user: ${email}`);

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      role: "ADMIN",
    },
  });

  console.log("");
  console.log("================================");
  console.log(" ADMIN ACCOUNT CREATED");
  console.log("================================");
  console.log(`ID:    ${updated.id}`);
  console.log(`Name:  ${updated.name}`);
  console.log(`Email: ${updated.email}`);
  console.log(`Role:  ${updated.role}`);
  console.log("================================");
}

main()
  .catch((error) => {
    console.error("ERROR:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
