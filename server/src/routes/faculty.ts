import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";

export const facultyRouter = Router();

facultyRouter.get("/", async (_req, res) => {
  const faculty = await prisma.faculty.findMany({ orderBy: { name: "asc" } });
  res.json(faculty);
});

facultyRouter.get("/:id", async (req, res) => {
  const faculty = await prisma.faculty.findUnique({
    where: { id: Number(req.params.id) },
    include: { assignments: { include: { section: { include: { course: true, term: true } } } } },
  });
  if (!faculty) return res.status(404).json({ error: "Faculty not found" });
  res.json(faculty);
});

facultyRouter.post("/", requireAdmin, async (req, res) => {
  const { name, email, department, employmentType, maxLoad } = req.body;
  if (!name || !email || !department || !employmentType || maxLoad == null) {
    return res.status(400).json({ error: "name, email, department, employmentType, and maxLoad are required" });
  }
  try {
    const faculty = await prisma.faculty.create({
      data: { name, email, department, employmentType, maxLoad: Number(maxLoad) },
    });
    res.status(201).json(faculty);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(409).json({ error: "Email already in use" });
    res.status(500).json({ error: "Failed to create faculty" });
  }
});

facultyRouter.put("/:id", requireAdmin, async (req, res) => {
  const { name, email, department, employmentType, maxLoad } = req.body;
  try {
    const faculty = await prisma.faculty.update({
      where: { id: Number(req.params.id) },
      data: { name, email, department, employmentType, maxLoad: maxLoad != null ? Number(maxLoad) : undefined },
    });
    res.json(faculty);
  } catch (err: any) {
    if (err.code === "P2025") return res.status(404).json({ error: "Faculty not found" });
    res.status(500).json({ error: "Failed to update faculty" });
  }
});

facultyRouter.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.faculty.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err: any) {
    if (err.code === "P2025") return res.status(404).json({ error: "Faculty not found" });
    res.status(500).json({ error: "Failed to delete faculty" });
  }
});
