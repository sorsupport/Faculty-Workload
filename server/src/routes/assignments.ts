import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";

export const assignmentsRouter = Router();

assignmentsRouter.get("/", async (req, res) => {
  const { termId, facultyId } = req.query;
  const assignments = await prisma.assignment.findMany({
    where: {
      facultyId: facultyId ? Number(facultyId) : undefined,
      section: termId ? { termId: Number(termId) } : undefined,
    },
    include: { faculty: true, section: { include: { course: true, term: true } } },
    orderBy: { id: "desc" },
  });
  res.json(assignments);
});

assignmentsRouter.post("/", requireAdmin, async (req, res) => {
  const { facultyId, sectionId, role, loadHours } = req.body;
  if (!facultyId || !sectionId || loadHours == null) {
    return res.status(400).json({ error: "facultyId, sectionId, and loadHours are required" });
  }
  try {
    const assignment = await prisma.assignment.create({
      data: {
        facultyId: Number(facultyId),
        sectionId: Number(sectionId),
        role: role || "primary",
        loadHours: Number(loadHours),
      },
      include: { faculty: true, section: { include: { course: true, term: true } } },
    });
    res.status(201).json(assignment);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(409).json({ error: "This faculty member is already assigned to that section" });
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

assignmentsRouter.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.assignment.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err: any) {
    if (err.code === "P2025") return res.status(404).json({ error: "Assignment not found" });
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});
