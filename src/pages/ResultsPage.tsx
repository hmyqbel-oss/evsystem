import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sections, questions } from "@/data/assessmentQuestions";
import { getSectionScore, getOverallScore, getScoreLabel, getScoreColor } from "@/data/sampleData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Download } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";

const ResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("evaluations")
        .select("*, organizations(name, region, city)")
        .eq("id", id!)
        .maybeSingle();
      setEvaluation(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!evaluation) return <div className="p-8 text-center text-muted-foreground">التقييم غير موجود</div>;

  const scores: Record<number, number> = {};
  if (evaluation.scores && typeof evaluation.scores === "object") {
    Object.entries(evaluation.scores as Record<string, number>).forEach(([k, v]) => { scores[Number(k)] = v; });
  }

  const overall = getOverallScore(scores);
  let qIndex = 1;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-foreground">نتائج التقييم</h1>
        <Link to="/evaluations">
          <Button variant="outline" className="gap-2">
            <ArrowRight className="w-4 h-4" /> العودة للتقييمات
          </Button>
        </Link>
      </div>

      {/* Organization info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-1">
          <p className="font-semibold text-foreground">{evaluation.organizations?.name || "—"}</p>
          <p className="text-sm text-muted-foreground">
            {evaluation.organizations?.region} — {evaluation.organizations?.city} — الزيارة #{evaluation.visit_number}
          </p>
          <p className="text-sm text-muted-foreground">
            التاريخ: {new Date(evaluation.created_at).toLocaleDateString("ar-SA")}
          </p>
        </CardContent>
      </Card>

      {/* Overall score */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">النتيجة الإجمالية</p>
          <p className={`text-4xl font-bold ${getScoreColor(overall)}`}>{overall}%</p>
          <p className={`text-lg font-medium ${getScoreColor(overall)}`}>{getScoreLabel(overall)}</p>
        </CardContent>
      </Card>

      {/* Sections breakdown */}
      {sections.map((section, sIdx) => {
        const startId = qIndex;
        const sectionScore = getSectionScore(scores, startId, section.questions.length);

        const sectionContent = (
          <Card key={section.name} className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{section.name}</CardTitle>
                <span className={`text-lg font-bold ${getScoreColor(sectionScore)}`}>{sectionScore}%</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                {section.questions.map((q) => {
                  const qScore = scores[q.id] || 0;
                  const maxScore = 5;
                  return (
                    <div key={q.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                      <span className="text-xs text-muted-foreground mt-1 min-w-[24px]">{q.id}</span>
                      <p className="flex-1 text-sm text-foreground">{q.questionText}</p>
                      <span className={`font-semibold text-sm min-w-[40px] text-left ${
                        qScore >= 4 ? "text-success" : qScore >= 3 ? "text-primary" : qScore >= 2 ? "text-warning" : "text-destructive"
                      }`}>
                        {qScore}/{maxScore}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );

        qIndex += section.questions.length;
        return sectionContent;
      })}
    </div>
  );
};

export default ResultsPage;
