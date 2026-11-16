import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "FocusFlow API", version: "1.0.0" });
});

// Rule-based planner for the first working version.
// Later, this route can be connected to an AI provider from the server only.
app.post("/api/plan", (req, res) => {
  const { subjects = [], hoursPerDay = 2, examDate = "" } = req.body || {};
  const cleanSubjects = subjects
    .filter((s) => typeof s.name === "string" && s.name.trim())
    .slice(0, 8);

  if (!cleanSubjects.length) {
    return res.status(400).json({ error: "أضف مادة واحدة على الأقل أولاً." });
  }

  const totalHours = Math.max(1, Math.min(8, Number(hoursPerDay) || 2));
  const slots = [];
  const perSubject = totalHours / cleanSubjects.length;

  cleanSubjects.forEach((subject, index) => {
    const minutes = Math.max(25, Math.round(perSubject * 60));
    slots.push({
      id: `${Date.now()}-${index}`,
      subject: subject.name.trim(),
      duration: minutes,
      type: index % 2 === 0 ? "مذاكرة وفهم" : "حل وتطبيق",
      tip: index % 2 === 0
        ? "ابدأ بمراجعة العناوين ثم ركّز على أهم فكرة."
        : "حل أسئلة قصيرة واكتب الأخطاء التي تحتاج مراجعتها."
    });
  });

  res.json({
    title: "خطة مذاكرة مقترحة",
    examDate,
    totalHours,
    slots,
    note: "هذه خطة مبدئية مبنية على توزيع الوقت بالتساوي، ويمكنك تعديلها حسب صعوبة كل مادة."
  });
});

app.listen(PORT, () => {
  console.log(`FocusFlow API running at http://localhost:${PORT}`);
});
