import { Router } from "express";
import { prisma } from "../lib/prisma";

export const loadsRouter = Router();

// Returns, for a given term, each faculty member's total assigned load
// alongside their contracted max load and the resulting status.
loadsRouter.get("/", async (req, res) => {
  const { termId } = req.query;
  if (!termId) return res.status(400).json({ error: "termId query param is required" });

  const faculty = await prisma.faculty.findMany({
    include: {
      assignments: {
        where: { section: { termId: Number(termId) } },
        include: { section: { include: { course: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  const loads = faculty.map((f) => {
    const totalLoad = f.assignments.reduce((sum, a) => sum + a.loadHours, 0);
    const status = totalLoad > f.maxLoad ? "over" : totalLoad === f.maxLoad ? "at" : "under";
    return {
      facultyId: f.id,
      name: f.name,
      department: f.department,
      employmentType: f.employmentType,
      maxLoad: f.maxLoad,
      totalLoad,
      status,
      assignments: f.assignments.map((a) => ({
        id: a.id,
        role: a.role,
        loadHours: a.loadHours,
        courseCode: a.section.course.code,
        courseTitle: a.section.course.title,
        sectionNumber: a.section.sectionNumber,
      })),
    };
  });

  res.json(loads);
});
