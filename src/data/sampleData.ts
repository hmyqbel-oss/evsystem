export interface Organization {
  id: string;
  name: string;
  city: string;
  region: string;
  licenseNumber: string;
  foundedDate: string;
  membersCount: number;
  email: string;
  phone: string;
}

export interface Evaluation {
  id: string;
  organizationId: string;
  organizationName: string;
  evaluatorName: string;
  date: string;
  status: 'draft' | 'submitted';
  scores: Record<number, number>; // questionId -> score (1-5)
  visitNumber: number;
}

export const sampleOrganizations: Organization[] = [
  { id: "1", name: "جمعية الشباب الرائد", city: "الرياض", region: "منطقة الرياض", licenseNumber: "1234", foundedDate: "2018-03-15", membersCount: 45, email: "info@shabab.org", phone: "0551234567" },
  { id: "2", name: "جمعية بناء المستقبل", city: "جدة", region: "منطقة مكة المكرمة", licenseNumber: "5678", foundedDate: "2020-01-10", membersCount: 32, email: "info@binaa.org", phone: "0559876543" },
  { id: "3", name: "جمعية أجيال الغد", city: "الدمام", region: "المنطقة الشرقية", licenseNumber: "9012", foundedDate: "2019-07-22", membersCount: 28, email: "info@ajyal.org", phone: "0553456789" },
];

// Generate sample evaluations with random scores
function generateScores(): Record<number, number> {
  const scores: Record<number, number> = {};
  for (let i = 1; i <= 80; i++) {
    scores[i] = Math.floor(Math.random() * 3) + 2; // 2-4 range
  }
  return scores;
}

export const sampleEvaluations: Evaluation[] = [
  { id: "e1", organizationId: "1", organizationName: "جمعية الشباب الرائد", evaluatorName: "أحمد محمد", date: "2024-11-15", status: "submitted", scores: generateScores(), visitNumber: 1 },
  { id: "e2", organizationId: "2", organizationName: "جمعية بناء المستقبل", evaluatorName: "سارة علي", date: "2024-12-01", status: "submitted", scores: generateScores(), visitNumber: 1 },
  { id: "e3", organizationId: "3", organizationName: "جمعية أجيال الغد", evaluatorName: "أحمد محمد", date: "2025-01-10", status: "submitted", scores: generateScores(), visitNumber: 1 },
  { id: "e4", organizationId: "1", organizationName: "جمعية الشباب الرائد", evaluatorName: "سارة علي", date: "2025-02-20", status: "draft", scores: generateScores(), visitNumber: 2 },
];

export function getSectionScore(scores: Record<number, number>, startId: number, count: number): number {
  let total = 0;
  let answered = 0;
  for (let i = startId; i < startId + count; i++) {
    if (scores[i]) {
      total += scores[i];
      answered++;
    }
  }
  return answered > 0 ? Math.round((total / (answered * 5)) * 100) : 0;
}

export function getOverallScore(scores: Record<number, number>): number {
  const vals = Object.values(scores);
  if (vals.length === 0) return 0;
  const total = vals.reduce((a, b) => a + b, 0);
  return Math.round((total / (vals.length * 5)) * 100);
}

export function getScoreLabel(pct: number): string {
  if (pct >= 80) return "ممتاز";
  if (pct >= 60) return "جيد";
  if (pct >= 40) return "متوسط";
  return "يحتاج تطوير";
}

export function getScoreColor(pct: number): string {
  if (pct >= 80) return "text-success";
  if (pct >= 60) return "text-primary";
  if (pct >= 40) return "text-warning";
  return "text-destructive";
}
