import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  MapPin, Briefcase, User, BadgeCheck, Mail, Phone,
} from "lucide-react";
import { toast } from "sonner";
import RatingInput from "@/components/evaluation/RatingInput";

type Step = "org-info" | "evaluation" | "thank-you";

function TopBar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">منصة التقييم الذاتي</h2>
        </div>
        {/* Desktop */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="hidden sm:flex gap-2 text-muted-foreground">
          <LogIn className="w-4 h-4" />
          تسجيل الدخول
        </Button>
        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden flex flex-col gap-[5px] p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="القائمة"
        >
          <motion.span animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.25 }} className="block w-5 h-[2px] bg-foreground rounded-full origin-center" />
          <motion.span animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} transition={{ duration: 0.2 }} className="block w-5 h-[2px] bg-foreground rounded-full" />
          <motion.span animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.25 }} className="block w-5 h-[2px] bg-foreground rounded-full origin-center" />
        </button>
      </div>
      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="sm:hidden overflow-hidden border-t border-border"
          >
            <div className="px-4 py-3 space-y-2">
              <Button variant="ghost" size="sm" onClick={() => { navigate("/login"); setMenuOpen(false); }} className="w-full justify-start gap-2 text-muted-foreground">
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PublicEvaluation = () => {
  const [step, setStep] = useState<Step>("org-info");
  const [orgForm, setOrgForm] = useState({
    name: "", city: "", region: "", specialty: "",
    data_entry_name: "", data_entry_role: "", email: "", phone: "",
  });
  const [currentSection, setCurrentSection] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [orgSaved, setOrgSaved] = useState(false);

  const totalQuestions = 80;
  const answeredCount = Object.keys(scores).length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  const handleOrgFormChange = (field: string, value: string) => {
    setOrgForm((prev) => ({ ...prev, [field]: value }));
    if (orgSaved) setOrgSaved(false);
  };

  const saveOrgData = async (): Promise<boolean> => {
    if (!orgForm.name.trim()) {
      toast.error("يرجى إدخال اسم الجمعية");
      return false;
    }
    if (!orgForm.data_entry_name.trim()) {
      toast.error("يرجى إدخال اسم مدخل البيانات");
      return false;
    }
    setSaving(true);
    try {
      const payload = {
        name: orgForm.name,
        city: orgForm.city,
        region: orgForm.region,
        specialty: orgForm.specialty,
        data_entry_name: orgForm.data_entry_name,
        data_entry_role: orgForm.data_entry_role,
        email: orgForm.email,
        phone: orgForm.phone,
      };
      if (orgId) {
        const { error } = await supabase.from("organizations").update(payload).eq("id", orgId);
        if (error) throw error;
      } else {
        const newId = crypto.randomUUID();
        const { error } = await supabase.from("organizations").insert({ ...payload, id: newId });
        if (error) throw error;
        setOrgId(newId);
      }
      return true;
    } catch (err: any) {
      toast.error("حدث خطأ: " + (err.message || ""));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrgOnly = async () => {
    const ok = await saveOrgData();
    if (ok) {
      setOrgSaved(true);
      toast.success("تم حفظ بيانات الجمعية بنجاح");
    }
  };

  const handleProceedToEvaluation = async () => {
    const ok = await saveOrgData();
    if (ok) { setStep("evaluation"); window.scrollTo(0, 0); }
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
        const newId = crypto.randomUUID();
        const { error } = await supabase.from("evaluations").insert({ ...payload, id: newId });
        if (error) throw error;
        setEvaluationId(newId);
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
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="flex items-center justify-center p-4" style={{ minHeight: "calc(100vh - 57px)" }}>
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
            <p className="text-muted-foreground text-lg">تم إرسال التقييم بنجاح</p>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-3">
                <p className="text-sm text-muted-foreground">النتيجة الإجمالية</p>
                <div className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}%</div>
                <div className={`text-lg font-medium ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
              </CardContent>
            </Card>
            <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              <p>نشكر لكم وقتكم وتعاونكم، ومساهمتكم القيمة في إنجاح مشروع تطوير نماذج الاستدامة وتعزيز أثر الجمعيات الشبابية.</p>
              <p>مشاركتكم تمثل خطوة مهمة نحو بناء أثر مستدام للقطاع الشبابي</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── STEP: Organization Info ───
  if (step === "org-info") {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground">التقييم الذاتي للجمعية</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">المرحلة الأولى: بيانات الجمعية</p>
            <div className="flex justify-center gap-3">
              <StepIndicator active label="بيانات الجمعية" number={1} />
              <StepIndicator active={false} label="التقييم" number={2} />
              <StepIndicator active={false} label="الإرسال" number={3} />
            </div>
          </motion.div>

          {/* Welcome Message */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="shadow-sm border-primary/20 overflow-hidden">
              <div className="relative bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
                <div className="absolute top-0 left-0 w-24 h-24 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-16 h-16 bg-primary/5 rounded-full translate-x-1/3 translate-y-1/3" />
                <div className="relative space-y-3 text-right">
                  <p className="text-xs sm:text-sm leading-relaxed text-foreground/85">
                    في إطار مشروع تطوير نماذج الاستدامة وتعزيز أثر الجمعيات الشبابية، تم تطوير هذه الأداة لفهم واقع الجمعيات وتحليل قدراتها وتحديد فرص التطوير بناءً على بيانات دقيقة.
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed text-foreground/85">
                    تعتمد مخرجات المشروع بشكل مباشر على جودة البيانات المقدمة، حيث تسهم مشاركتكم الصادقة في تكوين صورة واقعية، وتحديد الفجوات، ودعم تصميم حلول عملية.
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed text-foreground/85 font-medium">
                    نؤكد أن الهدف هو تمكين الجمعيات وتعزيز استدامتها، وليس التقييم الرقابي؛ لذا نأمل تعبئة البيانات بمصداقية عالية لضمان تحقيق أفضل النتائج لكم.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Section 1: Organization Info */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-sm overflow-hidden">
              <div className="bg-primary/5 border-b px-4 py-2.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h2 className="text-xs sm:text-sm font-semibold text-foreground">معلومات الجمعية</h2>
              </div>
              <CardContent className="p-5 space-y-4">
                <IconField icon={Building2} label="اسم الجمعية" required>
                  <Input
                    value={orgForm.name}
                    onChange={(e) => handleOrgFormChange("name", e.target.value)}
                    placeholder="مثال: جمعية التنمية الاجتماعية"
                  />
                </IconField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <IconField icon={MapPin} label="المنطقة">
                    <Input
                      value={orgForm.region}
                      onChange={(e) => handleOrgFormChange("region", e.target.value)}
                      placeholder="مثال: منطقة الرياض"
                    />
                  </IconField>
                  <IconField icon={MapPin} label="المدينة">
                    <Input
                      value={orgForm.city}
                      onChange={(e) => handleOrgFormChange("city", e.target.value)}
                      placeholder="مثال: الرياض"
                    />
                  </IconField>
                </div>
                <IconField icon={Briefcase} label="مجال تخصص الجمعية">
                  <Input
                    value={orgForm.specialty}
                    onChange={(e) => handleOrgFormChange("specialty", e.target.value)}
                    placeholder="مثال: التنمية المجتمعية، رعاية الأيتام..."
                  />
                </IconField>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 2: Data Entry Person */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-sm overflow-hidden">
              <div className="bg-accent/5 border-b px-4 py-2.5 flex items-center gap-2">
                <User className="w-4 h-4 text-accent-foreground" />
                <h2 className="text-xs sm:text-sm font-semibold text-foreground">بيانات مدخل البيانات</h2>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <IconField icon={User} label="اسم مدخل البيانات" required>
                    <Input
                      value={orgForm.data_entry_name}
                      onChange={(e) => handleOrgFormChange("data_entry_name", e.target.value)}
                      placeholder="الاسم الكامل"
                    />
                  </IconField>
                  <IconField icon={BadgeCheck} label="صفته في الجمعية">
                    <Input
                      value={orgForm.data_entry_role}
                      onChange={(e) => handleOrgFormChange("data_entry_role", e.target.value)}
                      placeholder="مثال: مدير تنفيذي، مسؤول الجودة..."
                    />
                  </IconField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <IconField icon={Mail} label="البريد الإلكتروني">
                    <Input
                      type="email"
                      value={orgForm.email}
                      onChange={(e) => handleOrgFormChange("email", e.target.value)}
                      placeholder="example@org.sa"
                      dir="ltr"
                      className="text-right"
                    />
                  </IconField>
                  <IconField icon={Phone} label="رقم الهاتف">
                    <Input
                      type="tel"
                      value={orgForm.phone}
                      onChange={(e) => handleOrgFormChange("phone", e.target.value)}
                      placeholder="05XXXXXXXX"
                      dir="ltr"
                      className="text-right"
                    />
                  </IconField>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Proceed Button */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button onClick={handleProceedToEvaluation} disabled={saving} className="w-full h-12 gap-2 text-base font-medium shadow-md">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronLeft className="w-5 h-5" />}
              حفظ والانتقال للتقييم
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── STEP: Evaluation ───
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">التقييم الذاتي</h1>
          <p className="text-muted-foreground">المرحلة الثانية: تعبئة نموذج التقييم</p>
          <div className="flex justify-center gap-3">
            <StepIndicator active={false} completed label="بيانات الجمعية" number={1} />
            <StepIndicator active label="التقييم" number={2} />
            <StepIndicator active={false} label="الإرسال" number={3} />
          </div>
        </div>

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

        <div className="bg-card rounded-xl shadow-sm border p-1.5 grid grid-cols-1 sm:grid-cols-5 gap-1">
          {sections.map((s, i) => {
            const sAnswered = s.questions.filter((q) => scores[q.id]).length;
            const isComplete = sAnswered === s.questions.length;
            const isActive = i === currentSection;
            return (
              <motion.button
                key={s.name}
                onClick={() => { setCurrentSection(i); window.scrollTo(0, 0); }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center sm:flex-col sm:items-center gap-2 sm:gap-1 px-3 sm:px-2 py-2.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {isComplete && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-3 h-3 text-success-foreground" />
                  </motion.span>
                )}
                <span className="truncate text-right sm:text-center leading-tight flex-1 sm:flex-none sm:w-full" style={{ fontSize: '11px' }}>{s.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors duration-200 ${
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {sAnswered}/{s.questions.length}
                </span>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4">
          <div className="flex gap-2">
            {currentSection === 0 && (
              <Button variant="outline" onClick={() => setStep("org-info")} className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
                <ChevronRight className="w-4 h-4" />
                العودة لبيانات الجمعية
              </Button>
            )}
            {currentSection > 0 && (
              <Button variant="outline" onClick={() => { setCurrentSection(currentSection - 1); window.scrollTo(0, 0); }} className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
                <ChevronRight className="w-4 h-4" />
                السابق
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ مسودة
            </Button>
            {currentSection === sections.length - 1 ? (
              <Button onClick={handleSubmit} disabled={saving} className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                إرسال التقييم
              </Button>
            ) : (
              <Button onClick={() => { setCurrentSection(currentSection + 1); window.scrollTo(0, 0); }} className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm">
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

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

function IconField({
  icon: Icon, label, required, children,
}: {
  icon: any; label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function StepIndicator({ active, completed, label, number }: { active: boolean; completed?: boolean; label: string; number: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
        completed ? "bg-success text-success-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}>
        {completed ? <CheckCircle2 className="w-4 h-4" /> : number}
      </div>
      <span className={`text-sm hidden sm:inline ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}

export default PublicEvaluation;
