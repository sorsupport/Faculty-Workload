import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const term = await prisma.term.upsert({
    where: { name: "Fall 2026" },
    update: {},
    create: {
      name: "Fall 2026",
      startDate: new Date("2026-08-24"),
      endDate: new Date("2026-12-12"),
    },
  });

  const [cs101, cs201, math150] = await Promise.all([
    prisma.course.upsert({
      where: { code: "CS101" },
      update: {},
      create: { code: "CS101", title: "Intro to Computer Science", creditHours: 3, department: "Computer Science" },
    }),
    prisma.course.upsert({
      where: { code: "CS201" },
      update: {},
      create: { code: "CS201", title: "Data Structures", creditHours: 4, department: "Computer Science" },
    }),
    prisma.course.upsert({
      where: { code: "MATH150" },
      update: {},
      create: { code: "MATH150", title: "Calculus I", creditHours: 4, department: "Mathematics" },
    }),
  ]);

  const [drSmith, profLee] = await Promise.all([
    prisma.faculty.upsert({
      where: { email: "smith@university.edu" },
      update: {},
      create: {
        name: "Dr. Alice Smith",
        email: "smith@university.edu",
        department: "Computer Science",
        employmentType: "full-time",
        maxLoad: 12,
      },
    }),
    prisma.faculty.upsert({
      where: { email: "lee@university.edu" },
      update: {},
      create: {
        name: "Prof. David Lee",
        email: "lee@university.edu",
        department: "Mathematics",
        employmentType: "part-time",
        maxLoad: 6,
      },
    }),
  ]);

  const section1 = await prisma.section.upsert({
    where: { courseId_termId_sectionNumber: { courseId: cs101.id, termId: term.id, sectionNumber: "001" } },
    update: {},
    create: { courseId: cs101.id, termId: term.id, sectionNumber: "001", capacity: 30 },
  });
  const section2 = await prisma.section.upsert({
    where: { courseId_termId_sectionNumber: { courseId: cs201.id, termId: term.id, sectionNumber: "001" } },
    update: {},
    create: { courseId: cs201.id, termId: term.id, sectionNumber: "001", capacity: 25 },
  });
  const section3 = await prisma.section.upsert({
    where: { courseId_termId_sectionNumber: { courseId: math150.id, termId: term.id, sectionNumber: "001" } },
    update: {},
    create: { courseId: math150.id, termId: term.id, sectionNumber: "001", capacity: 40 },
  });

  await prisma.assignment.upsert({
    where: { facultyId_sectionId: { facultyId: drSmith.id, sectionId: section1.id } },
    update: {},
    create: { facultyId: drSmith.id, sectionId: section1.id, role: "primary", loadHours: 3 },
  });
  await prisma.assignment.upsert({
    where: { facultyId_sectionId: { facultyId: drSmith.id, sectionId: section2.id } },
    update: {},
    create: { facultyId: drSmith.id, sectionId: section2.id, role: "primary", loadHours: 4 },
  });
  await prisma.assignment.upsert({
    where: { facultyId_sectionId: { facultyId: profLee.id, sectionId: section3.id } },
    update: {},
    create: { facultyId: profLee.id, sectionId: section3.id, role: "primary", loadHours: 4 },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
