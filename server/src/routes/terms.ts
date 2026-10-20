import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";

export const termsRouter = Router();

termsRouter.get("/", async (_req, res) => {
  const terms = await prisma.term.findMany({ orderBy: { startDate: "desc" } });
  res.json(terms);
});

termsRouter.post("/", requireAdmin, async (req, res) => {
  const { name, startDate, endDate } = req.body;
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ error: "name, startDate, and endDate are required" });
  }
  try {
    const term = await prisma.term.create({
      data: { name, startDate: new Date(startDate), endDate: new Date(endDate) },
    });
    res.status(201).json(term);
  } catch (err: any) {
    if (err.code === "P2002") return res.status(409).json({ error: "Term name already exists" });
    res.status(500).json({ error: "Failed to create term" });
  }
});

termsRouter.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.term.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err: any) {
    if (err.code === "P2025") return res.status(404).json({ error: "Term not found" });
    res.status(500).json({ error: "Failed to delete term" });
  }
});
