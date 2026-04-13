import { sampleEvaluations, sampleOrganizations, getOverallScore, getScoreColor, getScoreLabel } from "@/data/sampleData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Eye, FileEdit } from "lucide-react";

const EvaluationsListPage = () => {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">التقييمات</h1>
        <Link to="/evaluations/new">
          <Button className="gap-2"><Plus className="w-4 h-4" /> تقييم جديد</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {sampleEvaluations.map((ev) => {
          const score = getOverallScore(ev.scores);
          return (
            <Card key={ev.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{ev.organizationName}</h3>
                  <p className="text-sm text-muted-foreground">{ev.date} — الزيارة #{ev.visitNumber}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getScoreColor(score)}`}>{score}%</div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ev.status === "submitted" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>
                      {ev.status === "submitted" ? "مكتمل" : "مسودة"}
                    </span>
                  </div>
                  <Link to={`/results/${ev.id}`}>
                    <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default EvaluationsListPage;
