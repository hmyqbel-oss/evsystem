import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getSectionScore,
  getOverallScore,
  getScoreLabel,
  getScoreColor,
} from "@/data/sampleData";
import { sections, sectionColors } from "@/data/assessmentQuestions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { ClipboardCheck, Building2, TrendingUp, Loader2 } from "lucide-react";

interface DbEvaluation {
  id: string;
  organization_id: string;
  scores: Record<number, number>;
  status: string;
  created_at: string;
}

interface DbOrganization {
  id: string;
  name: string;
}

const Dashboard = () => {
  const [evaluations, setEvaluations] = useState<DbEvaluation[]>([]);
  const [organizations, setOrganizations] = useState<DbOrganization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [evRes, orgRes] = await Promise.all([
        supabase.from("evaluations").select("id, organization_id, scores, status, created_at").order("created_at", { ascending: false }),
        supabase.from("organizations").select("id, name"),
      ]);
      setEvaluations((evRes.data as any) || []);
      setOrganizations((orgRes.data as any) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const orgMap = Object.fromEntries(organizations.map((o) => [o.id, o.name]));
  const submittedEvals = evaluations.filter((e) => e.status === "submitted");
  const avgScore = submittedEvals.length > 0
    ? Math.round(submittedEvals.reduce((sum, e) => sum + getOverallScore(e.scores), 0) / submittedEvals.length)
    : 0;

  const sectionAvgData = sections.map((s, i) => {
    const startId = i * 16 + 1;
    const avg = submittedEvals.length > 0
      ? Math.round(submittedEvals.reduce((sum, e) => sum + getSectionScore(e.scores, startId, 16), 0) / submittedEvals.length)
      : 0;
    return { name: s.name, score: avg, fill: sectionColors[i] };
  });

  const orgScores = organizations.map((org) => {
    const orgEvals = submittedEvals.filter((e) => e.organization_id === org.id);
    const avg = orgEvals.length > 0
      ? Math.round(orgEvals.reduce((s, e) => s + getOverallScore(e.scores), 0) / orgEvals.length)
      : 0;
    return { name: org.name, score: avg };
  });

  const scoreDistribution = [
    { name: "ممتاز (80+)", value: submittedEvals.filter((e) => getOverallScore(e.scores) >= 80).length },
    { name: "جيد (60-79)", value: submittedEvals.filter((e) => { const s = getOverallScore(e.scores); return s >= 60 && s < 80; }).length },
    { name: "متوسط (40-59)", value: submittedEvals.filter((e) => { const s = getOverallScore(e.scores); return s >= 40 && s < 60; }).length },
    { name: "ضعيف (<40)", value: submittedEvals.filter((e) => getOverallScore(e.scores) < 40).length },
  ].filter((d) => d.value > 0);

  const pieColors = ["hsl(var(--success))", "hsl(var(--chart-1))", "hsl(var(--warning))", "hsl(var(--destructive))"];

  const stats = [
    { label: "إجمالي التقييمات", value: evaluations.length, icon: ClipboardCheck, color: "bg-primary/10 text-primary" },
    { label: "عدد الجمعيات", value: organizations.length, icon: Building2, color: "bg-accent/10 text-accent" },
    { label: "متوسط النتيجة", value: `${avgScore}%`, icon: TrendingUp, color: "bg-success/10 text-success" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Section Averages Bar Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">متوسط النتائج حسب المحور</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectionAvgData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip formatter={(v: number) => [`${v}%`, "النتيجة"]} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24}>
                  {sectionAvgData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distribution Pie */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">توزيع مستويات التقييم</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {scoreDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={scoreDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`} fontSize={10}>
                    {scoreDistribution.map((_, i) => (<Cell key={i} fill={pieColors[i]} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm py-12">لا توجد بيانات بعد</p>
            )}
          </CardContent>
        </Card>

        {/* Org Scores */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">نتائج الجمعيات</CardTitle></CardHeader>
          <CardContent>
            {orgScores.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={orgScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "النتيجة"]} />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm py-12">لا توجد بيانات بعد</p>
            )}
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">تحليل شامل</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={sectionAvgData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Evaluations Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">التقييمات الأخيرة</CardTitle></CardHeader>
        <CardContent>
          {evaluations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">الجمعية</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">التاريخ</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">النتيجة</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.slice(0, 10).map((ev) => {
                    const score = getOverallScore(ev.scores);
                    return (
                      <tr key={ev.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2 font-medium">{orgMap[ev.organization_id] || "—"}</td>
                        <td className="py-3 px-2 text-muted-foreground">{new Date(ev.created_at).toLocaleDateString("ar-SA")}</td>
                        <td className="py-3 px-2">
                          <span className={`font-bold ${getScoreColor(score)}`}>{score}%</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ev.status === "submitted" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                          }`}>
                            {ev.status === "submitted" ? "مكتمل" : "مسودة"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-8 text-center">لا توجد تقييمات بعد</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
