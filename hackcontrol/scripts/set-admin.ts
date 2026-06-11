import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setUserAsAdmin(email: string) {
  try {
    console.log(`Setting user with email ${email} as ADMIN...`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      return;
    }

    // Check current role using raw SQL
    const roleCheck = await prisma.$queryRaw<{ role: string }[]>`
      SELECT role FROM users WHERE email = ${email}
    `;

    if (roleCheck[0]?.role === "ADMIN") {
      console.log(`User ${user.name} (${email}) is already an ADMIN.`);
      return;
    }

    // Update role using raw SQL
    await prisma.$executeRaw`
      UPDATE users SET role = 'ADMIN' WHERE email = ${email}
    `;

    console.log(
      `✅ Successfully updated user ${user.name} (${email}) to ADMIN role.`,
    );
  } catch (error) {
    console.error("Error updating user role:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error("Please provide an email address as an argument.");
  console.error("Usage: npx tsx scripts/set-admin.ts user@example.com");
  process.exit(1);
}

setUserAsAdmin(email);
