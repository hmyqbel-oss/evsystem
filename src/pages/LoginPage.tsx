import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ClipboardCheck, Shield, Users } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "evaluator">("evaluator");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const name = selectedRole === "admin" ? "مدير النظام" : "أحمد محمد";
    login(selectedRole, name);
    navigate(selectedRole === "admin" ? "/dashboard" : "/evaluations");
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
            <div className="flex gap-2 mb-6">
              <Button
                type="button"
                variant={selectedRole === "evaluator" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setSelectedRole("evaluator")}
              >
                <Users className="w-4 h-4" />
                مُقيّم
              </Button>
              <Button
                type="button"
                variant={selectedRole === "admin" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setSelectedRole("admin")}
              >
                <Shield className="w-4 h-4" />
                مدير
              </Button>
            </div>

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
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                دخول
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4">
              نسخة تجريبية — اضغط "دخول" مباشرة
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
