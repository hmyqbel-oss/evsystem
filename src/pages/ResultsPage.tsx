import { sampleEvaluations, getOverallScore, getSectionScore, getScoreLabel, getScoreColor } from "@/data/sampleData";
import { sections, sectionColors } from "@/data/assessmentQuestions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { useParams } from "react-router-dom";

const ResultsPage = () => {
  const { id } = useParams();
  const evaluation = sampleEvaluations.find(e => e.id === (id || "e1")) || sampleEvaluations[0];
  const overallScore = getOverallScore(evaluation.scores);

  const sectionData = sections.map((s, i) => {
    const startId = i * 16 + 1;
    const score = getSectionScore(evaluation.scores, startId, 16);
    return { name: s.name, score, fill: sectionColors[i] };
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">تقرير التقييم</h1>

      {/* Summary */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="bg-primary/5 p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{evaluation.organizationName}</h2>
              <p className="text-sm text-muted-foreground">المُقيّم: {evaluation.evaluatorName} — التاريخ: {evaluation.date}</p>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}%</div>
              <div className={`text-sm font-medium ${getScoreColor(overallScore)}`}>{getScoreLabel(overallScore)}</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">التحليل الشامل</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={sectionData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Section Bars */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">النتائج حسب المحور</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={130} />
                <Tooltip formatter={(v: number) => [`${v}%`, "النتيجة"]} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
                  {sectionData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Section Detail Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectionData.map((s, i) => (
          <Card key={s.name} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                <span className={`text-lg font-bold ${getScoreColor(s.score)}`}>{s.score}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${s.score}%`, backgroundColor: s.fill }}
                />
              </div>
              <p className={`text-xs mt-2 font-medium ${getScoreColor(s.score)}`}>{getScoreLabel(s.score)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResultsPage;
