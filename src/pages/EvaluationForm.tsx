import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { sections } from "@/data/assessmentQuestions";
import { getOverallScore, getScoreLabel, getScoreColor } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Save, Send, CheckCircle2, Building2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import RatingInput from "@/components/evaluation/RatingInput";

const EvaluationForm = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [orgs, setOrgs] = useState<{ id: string; name: string; city: string; region: string }[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [currentSection, setCurrentSection] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [evaluationId, setEvaluationId] = useState<string | null>(editId || null);

  const totalQuestions = 80;
  const answeredCount = Object.keys(scores).length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  useEffect(() => {
    supabase.from("organizations").select("id, name, city, region").then(({ data }) => {
      if (data) setOrgs(data);
    });
  }, []);

  useEffect(() => {
    if (!editId) return;
    supabase.from("evaluations").select("*").eq("id", editId).single().then(({ data }) => {
      if (data) {
        setSelectedOrgId(data.organization_id);
        const loadedScores: Record<number, number> = {};
        if (data.scores && typeof data.scores === "object" && !Array.isArray(data.scores)) {
          Object.entries(data.scores as Record<string, number>).forEach(([k, v]) => {
            loadedScores[Number(k)] = v;
          });
        }
        setScores(loadedScores);
      }
    });
  }, [editId]);

  const section = sections[currentSection];
  const selectedOrg = orgs.find((o) => o.id === selectedOrgId);

  const handleScore = (questionId: number, score: number) => {
    setScores((prev) => ({ ...prev, [questionId]: score }));
  };

  const saveToDb = async (status: "draft" | "submitted") => {
    if (!selectedOrgId) { toast.error("يرجى اختيار الجمعية أولاً"); return false; }
    if (!user) { toast.error("يجب تسجيل الدخول أولاً"); return false; }
    if (status === "submitted" && answeredCount < totalQuestions) {
      toast.error(`يرجى الإجابة على جميع الأسئلة (${answeredCount}/${totalQuestions})`);
      return false;
    }
    setSaving(true);
    try {
      const payload = { organization_id: selectedOrgId, evaluator_id: user.id, scores: scores as any, status };
      if (evaluationId) {
        const { error } = await supabase.from("evaluations").update(payload).eq("id", evaluationId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("evaluations").insert(payload).select("id").single();
        if (error) throw error;
        if (data) setEvaluationId(data.id);
      }
      return true;
    } catch (err: any) {
      toast.error("حدث خطأ أثناء الحفظ: " + (err.message || ""));
      return false;
    } finally { setSaving(false); }
  };

  const handleSaveDraft = async () => { const ok = await saveToDb("draft"); if (ok) toast.success("تم حفظ المسودة بنجاح"); };
  const handleSubmit = async () => { const ok = await saveToDb("submitted"); if (ok) { toast.success("تم إرسال التقييم بنجاح"); navigate("/evaluations"); } };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">{editId ? "تعديل التقييم" : "نموذج التقييم"}</h1>
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium text-foreground">الجمعية المُقيَّمة *</label>
            </div>
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger className={!selectedOrgId ? "border-destructive/50" : ""}>
                <SelectValue placeholder="اختر الجمعية..." />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    <div className="flex items-center gap-2">
                      <span>{org.name}</span>
                      <span className="text-xs text-muted-foreground">— {org.city}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOrg && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <span>{selectedOrg.city} — {selectedOrg.region}</span>
              </div>
            )}
            {!selectedOrgId && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                يجب اختيار الجمعية قبل بدء التقييم
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">التقدم الكلي</span>
              <span className="text-sm font-semibold text-primary">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">{answeredCount} من {totalQuestions} سؤال</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((s, i) => {
          const sAnswered = s.questions.filter((q) => scores[q.id]).length;
          const isComplete = sAnswered === s.questions.length;
          return (
            <button key={s.name} onClick={() => { setCurrentSection(i); window.scrollTo(0, 0); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                i === currentSection ? "bg-primary text-primary-foreground shadow-md" : "bg-card text-muted-foreground hover:bg-secondary"
              }`}>
              {isComplete && <CheckCircle2 className="w-4 h-4" />}
              {s.name}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                i === currentSection ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{sAnswered}/{s.questions.length}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentSection} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
          {section.questions.map((q) => (
            <Card key={q.id} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{q.id}</span>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm font-medium leading-relaxed text-foreground">{q.questionText}</p>
                    <p className="text-xs text-muted-foreground">الأدلة المطلوبة: {q.evidence}</p>
                    <RatingInput value={scores[q.id] || 0} onChange={(val) => handleScore(q.id, val)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4">
        <Button variant="outline" onClick={() => { setCurrentSection(Math.max(0, currentSection - 1)); window.scrollTo(0, 0); }} disabled={currentSection === 0} className="gap-2 text-xs sm:text-sm">
          <ChevronRight className="w-4 h-4" /> السابق
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ مسودة
          </Button>
          {currentSection === sections.length - 1 ? (
            <Button onClick={handleSubmit} disabled={saving} className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} إرسال التقييم
            </Button>
          ) : (
            <Button onClick={() => { setCurrentSection(Math.min(sections.length - 1, currentSection + 1)); window.scrollTo(0, 0); }} className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
              التالي <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {answeredCount > 0 && (
        <Card className="border-0 bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">النتيجة الحالية</span>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${getScoreColor(getOverallScore(scores))}`}>{getOverallScore(scores)}%</span>
              <span className={`text-sm font-medium ${getScoreColor(getOverallScore(scores))}`}>{getScoreLabel(getOverallScore(scores))}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EvaluationForm;
