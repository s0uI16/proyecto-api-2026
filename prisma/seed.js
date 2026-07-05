import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

const TOPICS = [
  {
    title: "Ingeniería Civil Informática",
    description: "Discusión sobre mallas curriculares, especialidades y campo laboral en informática.",
  },
  {
    title: "Ciberseguridad",
    description: "Orientación sobre carreras técnicas y profesionales en seguridad de la información.",
  },
  {
    title: "Salud y Enfermería",
    description: "Dudas y experiencias sobre carreras del área de la salud.",
  },
  {
    title: "Administración de Empresas",
    description: "Conversación sobre mención, prácticas y salidas laborales en negocios.",
  },
  {
    title: "Diseño y Comunicación",
    description: "Espacio para futuros estudiantes de diseño gráfico, publicidad y comunicación audiovisual.",
  },
];

async function main() {
  console.log("🧹 Limpiando base de datos...");
  await prisma.post.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Creando usuarios base...");
  const basePasswordHash = await bcrypt.hash("Password123", SALT_ROUNDS);

  const baseUsers = await Promise.all([
    prisma.user.create({
      data: {
        username: "admin_cft",
        email: "admin@cft.cl",
        password: basePasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        username: "orientador_1",
        email: "orientador@cft.cl",
        password: basePasswordHash,
      },
    }),
  ]);

  console.log("👥 Creando usuarios de prueba (faker)...");
  const fakerUsers = [];
  for (let i = 0; i < 20; i++) {
    const user = await prisma.user.create({
      data: {
        username: faker.internet.username(),
        email: faker.internet.email().toLowerCase(),
        password: basePasswordHash,
      },
    });
    fakerUsers.push(user);
  }

  const allUsers = [...baseUsers, ...fakerUsers];

  console.log("📚 Creando tópicos...");
  const topics = await Promise.all(
    TOPICS.map((topic) => prisma.topic.create({ data: topic }))
  );

  console.log("📝 Creando posts...");
  const postsToCreate = 40;
  for (let i = 0; i < postsToCreate; i++) {
    const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    await prisma.post.create({
      data: {
        title: faker.lorem.sentence({ min: 4, max: 8 }),
        content: faker.lorem.paragraph(),
        userId: randomUser.id,
        topicId: randomTopic.id,
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    topics: await prisma.topic.count(),
    posts: await prisma.post.count(),
  };

  console.log("✅ Seed completado:", counts);
}

main()
  .catch((error) => {
    console.error("❌ Error ejecutando el seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
