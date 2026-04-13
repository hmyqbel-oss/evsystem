import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sections, questions, sectionColors } from "@/data/assessmentQuestions";
import { getOverallScore, getSectionScore, getScoreLabel, getScoreColor } from "@/data/sampleData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { Loader2, ArrowRight, Download, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import * as XLSX from "xlsx";

interface EvalData {
  id: string;
  organization_id: string;
  scores: Record<string, number>;
  status: string;
  visit_number: number;
  created_at: string;
  organizations: {
    name: string;
    city: string;
    region: string;
    specialty: string;
    data_entry_name: string;
    data_entry_role: string;
    email: string;
    phone: string;
  } | null;
}

const scoreLabels: Record<number, string> = {
  1: "غير متحقق",
  2: "بداية التطبيق",
  3: "تطبيق جزئي",
  4: "تطبيق جيد",
  5: "تطبيق متميز",
};

function ScoreIcon({ score }: { score: number }) {
  if (score >= 4) return <CheckCircle2 className="w-4 h-4 text-success" />;
  if (score >= 3) return <MinusCircle className="w-4 h-4 text-warning" />;
  return <XCircle className="w-4 h-4 text-destructive" />;
}

const ResultsPage = () => {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState<EvalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select("*, organizations(name, city, region, specialty, data_entry_name, data_entry_role, email, phone)")
        .eq("id", id)
        .single();
      if (!error && data) setEvaluation(data as unknown as EvalData);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!evaluation) return <div className="p-8 text-center text-muted-foreground">لم يتم العثور على التقييم</div>;

  const scores: Record<number, number> = {};
  if (evaluation.scores && typeof evaluation.scores === "object") {
    Object.entries(evaluation.scores).forEach(([k, v]) => { scores[Number(k)] = v as number; });
  }

  const overallScore = getOverallScore(scores);
  const org = evaluation.organizations;
  const orgName = org?.name || "—";
  const date = new Date(evaluation.created_at).toLocaleDateString("ar-SA");

  const sectionData = sections.map((s, i) => {
    const startId = i * 16 + 1;
    const score = getSectionScore(scores, startId, 16);
    return { name: s.name, score, fill: sectionColors[i] };
  });

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ["تقرير التقييم الذاتي"],
      [],
      ["اسم الجمعية", orgName],
      ["المنطقة", org?.region || ""],
      ["المدينة", org?.city || ""],
      ["التخصص", org?.specialty || ""],
      ["مدخل البيانات", org?.data_entry_name || ""],
      ["صفة مدخل البيانات", org?.data_entry_role || ""],
      ["البريد الإلكتروني", org?.email || ""],
      ["رقم الهاتف", org?.phone || ""],
      [],
      ["تاريخ التقييم", date],
      ["رقم الزيارة", evaluation.visit_number],
      ["الحالة", evaluation.status === "submitted" ? "مكتمل" : "مسودة"],
      ["النتيجة الإجمالية", `${overallScore}%`],
      ["التقدير", getScoreLabel(overallScore)],
      [],
      ["المحور", "النتيجة"],
      ...sectionData.map(s => [s.name, `${s.score}%`]),
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1["!cols"] = [{ wch: 30 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws1, "ملخص");

    // Sheet 2: All Questions & Answers
    const detailRows = [
      ["رقم السؤال", "المحور", "السؤال", "الأدلة المطلوبة", "الدرجة (1-5)", "التقدير"],
    ];
    questions.forEach(q => {
      const s = scores[q.id] || 0;
      detailRows.push([
        String(q.id),
        q.section,
        q.questionText,
        q.evidence,
        s ? String(s) : "لم يُجب",
        s ? scoreLabels[s] || "" : "",
      ]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
    ws2["!cols"] = [{ wch: 10 }, { wch: 25 }, { wch: 60 }, { wch: 25 }, { wch: 12 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws2, "تفاصيل الأسئلة");

    XLSX.writeFile(wb, `تقييم_${orgName}_${date}.xlsx`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/evaluations">
            <Button variant="ghost" size="icon"><ArrowRight className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">تقرير التقييم</h1>
        </div>
        <Button onClick={handleExportExcel} className="gap-2">
          <Download className="w-4 h-4" />
          تحميل Excel
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="bg-primary/5 p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">{orgName}</h2>
              <p className="text-sm text-muted-foreground">
                {org?.region} — {org?.city} — {date} — الزيارة #{evaluation.visit_number}
              </p>
              {org?.data_entry_name && (
                <p className="text-xs text-muted-foreground">مدخل البيانات: {org.data_entry_name} ({org.data_entry_role})</p>
              )}
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}%</div>
              <div className={`text-sm font-medium ${getScoreColor(overallScore)}`}>{getScoreLabel(overallScore)}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
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

      {/* Section Score Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectionData.map((s) => (
          <Card key={s.name} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                <span className={`text-lg font-bold ${getScoreColor(s.score)}`}>{s.score}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${s.score}%`, backgroundColor: s.fill }} />
              </div>
              <p className={`text-xs mt-2 font-medium ${getScoreColor(s.score)}`}>{getScoreLabel(s.score)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Questions & Answers Detail */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">تفاصيل الأسئلة والإجابات</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={sections[0].name} dir="rtl">
            <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1.5">
              {sections.map((s, i) => {
                const startId = i * 16 + 1;
                const sScore = getSectionScore(scores, startId, 16);
                return (
                  <TabsTrigger key={s.name} value={s.name} className="text-xs flex-1 min-w-[100px]">
                    {s.name}
                    <span className={`mr-1 text-[10px] ${getScoreColor(sScore)}`}>({sScore}%)</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {sections.map((s) => (
              <TabsContent key={s.name} value={s.name} className="space-y-2 mt-4">
                {s.questions.map((q) => {
                  const score = scores[q.id] || 0;
                  return (
                    <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        {q.id}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed">{q.questionText}</p>
                        <p className="text-xs text-muted-foreground mt-1">الأدلة: {q.evidence}</p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {score > 0 ? (
                          <>
                            <ScoreIcon score={score} />
                            <div className="text-left">
                              <span className="text-sm font-bold text-foreground">{score}/5</span>
                              <p className="text-[10px] text-muted-foreground">{scoreLabels[score]}</p>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">لم يُجب</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsPage;
