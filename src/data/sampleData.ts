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
