import { useState } from "react";
import { sections } from "@/data/assessmentQuestions";
import { getOverallScore, getScoreLabel, getScoreColor } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, Save, Send, CheckCircle2,
  Building2, Loader2, ClipboardCheck, PartyPopper, LogIn,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import RatingInput from "@/components/evaluation/RatingInput";

type Step = "org-info" | "evaluation" | "thank-you";

const PublicEvaluation = () => {
  const [step, setStep] = useState<Step>("org-info");
  const [orgForm, setOrgForm] = useState({
    name: "", city: "", region: "", license_number: "",
    members_count: 0, email: "", phone: "", founded_date: "",
  });
  const [currentSection, setCurrentSection] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);

  const totalQuestions = 80;
  const answeredCount = Object.keys(scores).length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  const handleOrgFormChange = (field: string, value: string | number) => {
    setOrgForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProceedToEvaluation = async () => {
    if (!orgForm.name.trim()) {
      toast.error("يرجى إدخال اسم الجمعية");
      return;
    }

    setSaving(true);
    try {
      // Create new organization record
      const { data, error } = await supabase
        .from("organizations")
        .insert({
          name: orgForm.name,
          city: orgForm.city,
          region: orgForm.region,
          license_number: orgForm.license_number,
          members_count: orgForm.members_count,
          email: orgForm.email,
          phone: orgForm.phone,
          founded_date: orgForm.founded_date || null,
        })
        .select("id")
        .single();

      if (error) throw error;
      setOrgId(data.id);
      setStep("evaluation");
    } catch (err: any) {
      toast.error("حدث خطأ: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const section = sections[currentSection];

  const handleScore = (questionId: number, score: number) => {
    setScores((prev) => ({ ...prev, [questionId]: score }));
  };

  const saveToDb = async (status: "draft" | "submitted") => {
    if (!orgId) return false;
    setSaving(true);
    try {
      const payload = {
        organization_id: orgId,
        evaluator_id: null,
        scores: scores as any,
        status,
      };

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
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    const ok = await saveToDb("draft");
    if (ok) toast.success("تم حفظ المسودة بنجاح");
  };

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      toast.error(`يرجى الإجابة على جميع الأسئلة (${answeredCount}/${totalQuestions})`);
      return;
    }
    const ok = await saveToDb("submitted");
    if (ok) setStep("thank-you");
  };

  // ─── STEP: Thank You ───
  if (step === "thank-you") {
    const score = getOverallScore(scores);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full text-center space-y-6"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
            <PartyPopper className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">شكراً لك!</h1>
          <p className="text-muted-foreground text-lg">
            تم إرسال التقييم بنجاح. نشكركم على استكمال التقييم الذاتي للجمعية.
          </p>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-3">
              <p className="text-sm text-muted-foreground">النتيجة الإجمالية</p>
              <div className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}%</div>
              <div className={`text-lg font-medium ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground">
            سيتم مراجعة التقييم من قبل الفريق المختص. شكراً لتعاونكم.
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── STEP: Organization Info ───
  if (step === "org-info") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">التقييم الذاتي للجمعية</h1>
            <p className="text-muted-foreground">المرحلة الأولى: بيانات الجمعية</p>
            <div className="flex justify-center gap-3">
              <StepIndicator active label="بيانات الجمعية" number={1} />
              <StepIndicator active={false} label="التقييم" number={2} />
              <StepIndicator active={false} label="الإرسال" number={3} />
            </div>
          </div>

          {/* Org Form */}
          <Card className="shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">بيانات الجمعية</h2>
              </div>
              <p className="text-sm text-muted-foreground">يرجى تعبئة بيانات الجمعية للمتابعة</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="اسم الجمعية" value={orgForm.name} onChange={(v) => handleOrgFormChange("name", v)} required />
                <FormField label="رقم الترخيص" value={orgForm.license_number} onChange={(v) => handleOrgFormChange("license_number", v)} />
                <FormField label="المدينة" value={orgForm.city} onChange={(v) => handleOrgFormChange("city", v)} />
                <FormField label="المنطقة" value={orgForm.region} onChange={(v) => handleOrgFormChange("region", v)} />
                <FormField label="البريد الإلكتروني" value={orgForm.email} onChange={(v) => handleOrgFormChange("email", v)} type="email" />
                <FormField label="رقم الهاتف" value={orgForm.phone} onChange={(v) => handleOrgFormChange("phone", v)} type="tel" />
                <FormField label="تاريخ التأسيس" value={orgForm.founded_date} onChange={(v) => handleOrgFormChange("founded_date", v)} type="date" />
                <div className="space-y-2">
                  <Label className="text-sm">عدد الأعضاء</Label>
                  <Input
                    type="number"
                    value={orgForm.members_count}
                    onChange={(e) => handleOrgFormChange("members_count", Number(e.target.value))}
                  />
                </div>
              </div>

              <Button onClick={handleProceedToEvaluation} disabled={saving} className="w-full gap-2 mt-4">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronLeft className="w-4 h-4" />}
                الانتقال لمرحلة التقييم
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── STEP: Evaluation ───
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">التقييم الذاتي</h1>
          <p className="text-muted-foreground">المرحلة الثانية: تعبئة نموذج التقييم</p>
          <div className="flex justify-center gap-3">
            <StepIndicator active={false} completed label="بيانات الجمعية" number={1} />
            <StepIndicator active label="التقييم" number={2} />
            <StepIndicator active={false} label="الإرسال" number={3} />
          </div>
        </div>

        {/* Progress */}
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

        {/* Section Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sections.map((s, i) => {
            const sAnswered = s.questions.filter((q) => scores[q.id]).length;
            const isComplete = sAnswered === s.questions.length;
            return (
              <button
                key={s.name}
                onClick={() => setCurrentSection(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  i === currentSection
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                {isComplete && <CheckCircle2 className="w-4 h-4" />}
                {s.name}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  i === currentSection ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {sAnswered}/{s.questions.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Questions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {section.questions.map((q) => (
              <Card key={q.id} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      {q.id}
                    </span>
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

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-2">
            {currentSection === 0 && (
              <Button variant="outline" onClick={() => setStep("org-info")} className="gap-2">
                <ChevronRight className="w-4 h-4" />
                العودة لبيانات الجمعية
              </Button>
            )}
            {currentSection > 0 && (
              <Button variant="outline" onClick={() => setCurrentSection(currentSection - 1)} className="gap-2">
                <ChevronRight className="w-4 h-4" />
                السابق
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ مسودة
            </Button>
            {currentSection === sections.length - 1 ? (
              <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                إرسال التقييم
              </Button>
            ) : (
              <Button onClick={() => setCurrentSection(currentSection + 1)} className="gap-2">
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Score Preview */}
        {answeredCount > 0 && (
          <Card className="border-0 bg-card shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">النتيجة الحالية</span>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${getScoreColor(getOverallScore(scores))}`}>
                  {getOverallScore(scores)}%
                </span>
                <span className={`text-sm font-medium ${getScoreColor(getOverallScore(scores))}`}>
                  {getScoreLabel(getOverallScore(scores))}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// ─── Helper Components ───

function FormField({
  label, value, onChange, type = "text", required = false,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}{required && " *"}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}

function StepIndicator({ active, completed, label, number }: { active: boolean; completed?: boolean; label: string; number: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        completed ? "bg-success text-success-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}>
        {completed ? <CheckCircle2 className="w-4 h-4" /> : number}
      </div>
      <span className={`text-sm hidden sm:inline ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}

export default PublicEvaluation;
