import { PrismaClient } from "@prisma/client";
import { factions, provinces } from "../src/game/seed-data";

const prisma = new PrismaClient();

async function main() {
  for (const faction of factions) {
    await prisma.faction.upsert({
      where: { id: faction.id },
      update: faction,
      create: faction,
    });
  }

  for (const province of provinces) {
    await prisma.province.upsert({
      where: { id: province.id },
      update: province,
      create: province,
    });
  }

  await prisma.siege.upsert({
    where: { id: "siege-constantinople-1453" },
    update: {},
    create: {
      id: "siege-constantinople-1453",
      provinceId: "constantinople",
      attackerFactionId: "ottomans",
      defenderFactionId: "byzantium",
      progress: 22,
      defenderMorale: 0.72,
      foodSupply: 38,
      artilleryStrength: 84,
      navalBlockade: false,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
