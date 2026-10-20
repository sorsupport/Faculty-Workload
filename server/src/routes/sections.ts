import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";

export const sectionsRouter = Router();

sectionsRouter.get("/", async (req, res) => {
  const { termId } = req.query;
  const sections = await prisma.section.findMany({
    where: termId ? { termId: Number(termId) } : undefined,
    include: { course: true, term: true, assignments: { include: { faculty: true } } },
    orderBy: [{ course: { code: "asc" } }, { sectionNumber: "asc" }],
  });
  res.json(sections);
});

sectionsRouter.post("/", requireAdmin, async (req, res) => {
  const { sectionNumber, courseId, termId, capacity } = req.body;
  if (!sectionNumber || !courseId || !termId) {
    return res.status(400).json({ error: "sectionNumber, courseId, and termId are required" });
  }
  try {
    const section = await prisma.section.create({
      data: {
        sectionNumber,
        courseId: Number(courseId),
        termId: Number(termId),
        capacity: capacity != null ? Number(capacity) : null,
      },
      include: { course: true, term: true },
    });
    res.status(201).json(section);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(409).json({ error: "That section number already exists for this course and term" });
    res.status(500).json({ error: "Failed to create section" });
  }
});

sectionsRouter.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.section.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err: any) {
    if (err.code === "P2025") return res.status(404).json({ error: "Section not found" });
    res.status(500).json({ error: "Failed to delete section" });
  }
});
