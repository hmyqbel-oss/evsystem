import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOverallScore, getScoreColor } from "@/data/sampleData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Eye, FileEdit, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface EvaluationRow {
  id: string;
  organization_id: string;
  evaluator_id: string;
  scores: Record<string, number>;
  status: string;
  visit_number: number;
  created_at: string;
  organizations: { name: string } | null;
}

const EvaluationsListPage = () => {
  const { role } = useAuth();
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvaluations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("evaluations")
      .select("*, organizations(name)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEvaluations(data as unknown as EvaluationRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEvaluations(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التقييم؟")) return;
    const { error } = await supabase.from("evaluations").delete().eq("id", id);
    if (error) {
      toast.error("فشل الحذف");
    } else {
      toast.success("تم الحذف");
      setEvaluations((prev) => prev.filter((e) => e.id !== id));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">التقييمات</h1>
        <Link to="/evaluations/new">
          <Button className="gap-2"><Plus className="w-4 h-4" /> تقييم جديد</Button>
        </Link>
      </div>

      {evaluations.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            لا توجد تقييمات بعد. ابدأ بإنشاء تقييم جديد.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {evaluations.map((ev) => {
            const numericScores: Record<number, number> = {};
            if (ev.scores && typeof ev.scores === "object") {
              Object.entries(ev.scores).forEach(([k, v]) => { numericScores[Number(k)] = v; });
            }
            const score = getOverallScore(numericScores);
            const orgName = ev.organizations?.name || "—";
            const evaluatorName = "";
            const date = new Date(ev.created_at).toLocaleDateString("ar-SA");

            return (
              <Card key={ev.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{orgName}</h3>
                    <p className="text-sm text-muted-foreground">{date} — {evaluatorName} — الزيارة #{ev.visit_number}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getScoreColor(score)}`}>{score}%</div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        ev.status === "submitted" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}>
                        {ev.status === "submitted" ? "مكتمل" : "مسودة"}
                      </span>
                    </div>
                    {ev.status === "draft" && (
                      <Link to={`/evaluations/${ev.id}/edit`}>
                        <Button variant="ghost" size="icon"><FileEdit className="w-4 h-4" /></Button>
                      </Link>
                    )}
                    <Link to={`/results/${ev.id}`}>
                      <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                    </Link>
                    {role === "admin" && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ev.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EvaluationsListPage;
