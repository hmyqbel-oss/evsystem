import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sections } from "@/data/assessmentQuestions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { ClipboardCheck, Building2, Users, MapPin, Loader2, TrendingUp, Calendar } from "lucide-react";

interface DbEvaluation {
  id: string;
  organization_id: string;
  status: string;
  created_at: string;
}

interface DbOrganization {
  id: string;
  name: string;
  city: string;
  region: string;
  specialty: string;
}

const StatCard = ({ icon: Icon, label, value, subtitle, color, delay }: {
  icon: any; label: string; value: string | number; subtitle?: string; color: string; delay: number;
}) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${color} opacity-10 -translate-y-8 translate-x-8`} />
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-15 flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            {subtitle && <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const Dashboard = () => {
  const [evaluations, setEvaluations] = useState<DbEvaluation[]>([]);
  const [organizations, setOrganizations] = useState<DbOrganization[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [evRes, orgRes, usersRes] = await Promise.all([
        supabase.from("evaluations").select("id, organization_id, status, created_at").order("created_at", { ascending: false }),
        supabase.from("organizations").select("id, name, city, region, specialty"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      setEvaluations((evRes.data as any) || []);
      setOrganizations((orgRes.data as any) || []);
      setUserCount(usersRes.count || 0);
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

  const submittedEvals = evaluations.filter((e) => e.status === "submitted");
  const draftEvals = evaluations.filter((e) => e.status === "draft");
  const cities = new Set(organizations.map((o) => o.city).filter(Boolean));
  const regions = new Set(organizations.map((o) => o.region).filter(Boolean));
  const specialties = new Set(organizations.map((o) => o.specialty).filter(Boolean));

  // Recent evaluations (last 7 days)
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentEvals = evaluations.filter((e) => new Date(e.created_at) >= weekAgo);

  // Evaluations by region
  const orgMap = Object.fromEntries(organizations.map((o) => [o.id, o]));
  const regionCounts: Record<string, number> = {};
  submittedEvals.forEach((e) => {
    const org = orgMap[e.organization_id];
    if (org?.region) {
      regionCounts[org.region] = (regionCounts[org.region] || 0) + 1;
    }
  });
  const regionData = Object.entries(regionCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const barColors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

  // Recent evaluations list
  const recentList = evaluations.slice(0, 8);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground mt-1">نظرة عامة على إحصائيات المنصة</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="إجمالي الجمعيات" value={organizations.length} subtitle={`في ${cities.size} مدينة`} color="bg-primary text-primary" delay={0} />
        <StatCard icon={ClipboardCheck} label="إجمالي التقييمات" value={evaluations.length} subtitle={`${submittedEvals.length} مكتمل · ${draftEvals.length} مسودة`} color="bg-accent text-accent" delay={0.1} />
        <StatCard icon={Users} label="المستخدمون" value={userCount} color="bg-chart-1 text-chart-1" delay={0.2} />
        <StatCard icon={MapPin} label="المناطق" value={regions.size} subtitle={`${specialties.size} تخصص`} color="bg-chart-2 text-chart-2" delay={0.3} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">{submittedEvals.length}</p>
              <p className="text-xs text-muted-foreground">تقييم مكتمل</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
                <ClipboardCheck className="w-5 h-5 text-warning" />
              </div>
              <p className="text-2xl font-bold text-foreground">{draftEvals.length}</p>
              <p className="text-xs text-muted-foreground">مسودة</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{recentEvals.length}</p>
              <p className="text-xs text-muted-foreground">آخر 7 أيام</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Region Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">التقييمات حسب المنطقة</CardTitle></CardHeader>
          <CardContent>
            {regionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={regionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v: number) => [v, "عدد التقييمات"]} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                    {regionData.map((_, i) => (<Cell key={i} fill={barColors[i % barColors.length]} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm py-12 text-center">لا توجد بيانات بعد</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Evaluations */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">آخر التقييمات</CardTitle></CardHeader>
          <CardContent>
            {recentList.length > 0 ? (
              <div className="space-y-3">
                {recentList.map((ev) => {
                  const org = orgMap[ev.organization_id];
                  return (
                    <div key={ev.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{org?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleDateString("ar-SA")}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        ev.status === "submitted" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}>
                        {ev.status === "submitted" ? "مكتمل" : "مسودة"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-12 text-center">لا توجد تقييمات بعد</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
