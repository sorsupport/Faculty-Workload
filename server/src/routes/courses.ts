import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";

export const coursesRouter = Router();

coursesRouter.get("/", async (_req, res) => {
  const courses = await prisma.course.findMany({ orderBy: { code: "asc" } });
  res.json(courses);
});

coursesRouter.post("/", requireAdmin, async (req, res) => {
  const { code, title, creditHours, department } = req.body;
  if (!code || !title || creditHours == null || !department) {
    return res.status(400).json({ error: "code, title, creditHours, and department are required" });
  }
  try {
    const course = await prisma.course.create({
      data: { code, title, creditHours: Number(creditHours), department },
    });
    res.status(201).json(course);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(409).json({ error: "Course code already exists" });
    res.status(500).json({ error: "Failed to create course" });
  }
});

coursesRouter.put("/:id", requireAdmin, async (req, res) => {
  const { code, title, creditHours, department } = req.body;
  try {
    const course = await prisma.course.update({
      where: { id: Number(req.params.id) },
      data: { code, title, creditHours: creditHours != null ? Number(creditHours) : undefined, department },
    });
    res.json(course);
  } catch (err: any) {
    if (err.code === "P2025") return res.status(404).json({ error: "Course not found" });
    res.status(500).json({ error: "Failed to update course" });
  }
});

coursesRouter.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err: any) {
    if (err.code === "P2025") return res.status(404).json({ error: "Course not found" });
    res.status(500).json({ error: "Failed to delete course" });
  }
});
