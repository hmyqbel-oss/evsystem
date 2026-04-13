import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ClipboardCheck, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "خطأ", description: "يرجى إدخال البريد الإلكتروني وكلمة المرور", variant: "destructive" });
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) {
      toast({ title: "خطأ في تسجيل الدخول", description: "البريد الإلكتروني أو كلمة المرور غير صحيحة", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <ClipboardCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">منصة التقييم</h1>
          <p className="text-muted-foreground mt-2">تقييم الجمعيات غير الربحية</p>
        </div>

        <Card className="shadow-lg border-0 shadow-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-center">تسجيل الدخول</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">البريد الإلكتروني</label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-left"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">كلمة المرور</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-left"
                  dir="ltr"
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                دخول
              </Button>
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link to="/">
                  <ArrowRight className="w-4 h-4 ml-1" />
                  العودة للصفحة الرئيسية
                </Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
