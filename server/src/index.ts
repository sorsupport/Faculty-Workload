import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { facultyRouter } from "./routes/faculty";
import { coursesRouter } from "./routes/courses";
import { termsRouter } from "./routes/terms";
import { sectionsRouter } from "./routes/sections";
import { assignmentsRouter } from "./routes/assignments";
import { loadsRouter } from "./routes/loads";
import { requireAuth } from "./middleware/auth";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);

app.use("/api/faculty", requireAuth, facultyRouter);
app.use("/api/courses", requireAuth, coursesRouter);
app.use("/api/terms", requireAuth, termsRouter);
app.use("/api/sections", requireAuth, sectionsRouter);
app.use("/api/assignments", requireAuth, assignmentsRouter);
app.use("/api/loads", requireAuth, loadsRouter);

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || "127.0.0.1";
app.listen(port, host, () => {
  console.log(`FWL server listening on http://${host}:${port}`);
});
