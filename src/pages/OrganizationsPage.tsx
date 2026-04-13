import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Building2, MapPin, Phone, Mail, Briefcase, User, BadgeCheck, Edit, Trash2, Eye, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface DbOrganization {
  id: string;
  name: string;
  city: string;
  region: string;
  specialty: string;
  data_entry_name: string;
  data_entry_role: string;
  email: string;
  phone: string;
}

interface OrgFormData {
  name: string;
  city: string;
  region: string;
  specialty: string;
  data_entry_name: string;
  data_entry_role: string;
  email: string;
  phone: string;
}

const emptyForm: OrgFormData = {
  name: "", city: "", region: "", specialty: "",
  data_entry_name: "", data_entry_role: "", email: "", phone: "",
};

const FormField = ({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </label>
    {children}
  </div>
);

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
    <span className="text-sm text-muted-foreground flex items-center gap-2">
      <Icon className="w-4 h-4" />
      {label}
    </span>
    <span className="text-sm font-medium text-foreground">{value || "—"}</span>
  </div>
);

const OrganizationsPage = () => {
  const [organizations, setOrganizations] = useState<DbOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [viewOrg, setViewOrg] = useState<DbOrganization | null>(null);
  const [editOrg, setEditOrg] = useState<DbOrganization | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<OrgFormData>(emptyForm);

  const fetchOrganizations = useCallback(async () => {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, city, region, specialty, data_entry_name, data_entry_role, email, phone")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("خطأ في تحميل الجمعيات");
    } else {
      setOrganizations((data as any) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrganizations(); }, [fetchOrganizations]);

  const resetForm = () => setFormData(emptyForm);

  const handleSave = async () => {
    if (!formData.name) { toast.error("يرجى إدخال اسم الجمعية"); return; }
    setSaving(true);

    const payload = {
      name: formData.name,
      city: formData.city,
      region: formData.region,
      specialty: formData.specialty,
      data_entry_name: formData.data_entry_name,
      data_entry_role: formData.data_entry_role,
      email: formData.email,
      phone: formData.phone,
    };

    if (editOrg) {
      const { error } = await supabase.from("organizations").update(payload).eq("id", editOrg.id);
      if (error) toast.error("خطأ في تحديث البيانات");
      else { toast.success("تم تحديث بيانات الجمعية بنجاح"); setEditOrg(null); }
    } else {
      const { error } = await supabase.from("organizations").insert(payload);
      if (error) toast.error("خطأ في إضافة الجمعية");
      else toast.success("تمت إضافة الجمعية بنجاح");
    }

    setSaving(false);
    resetForm();
    setIsOpen(false);
    fetchOrganizations();
  };

  const handleEdit = (org: DbOrganization) => {
    setEditOrg(org);
    setFormData({
      name: org.name, city: org.city, region: org.region,
      specialty: org.specialty, data_entry_name: org.data_entry_name,
      data_entry_role: org.data_entry_role, email: org.email, phone: org.phone,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("organizations").delete().eq("id", id);
    if (error) toast.error("خطأ في حذف الجمعية");
    else { toast.success("تم حذف الجمعية"); fetchOrganizations(); }
  };

  const filtered = organizations.filter(o =>
    o.name.includes(searchQuery) || o.city.includes(searchQuery) || o.region.includes(searchQuery)
  );

  const orgForm = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h3 className="font-semibold text-foreground">معلومات الجمعية</h3>
        </div>
        <div className="space-y-4">
          <FormField label="اسم الجمعية" icon={Building2}>
            <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="أدخل اسم الجمعية" />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="المنطقة" icon={MapPin}>
              <Input value={formData.region} onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))} placeholder="مثال: منطقة الرياض" />
            </FormField>
            <FormField label="المدينة" icon={MapPin}>
              <Input value={formData.city} onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="مثال: الرياض" />
            </FormField>
          </div>
          <FormField label="مجال التخصص" icon={Briefcase}>
            <Input value={formData.specialty} onChange={e => setFormData(prev => ({ ...prev, specialty: e.target.value }))} placeholder="مثال: التنمية المجتمعية" />
          </FormField>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-accent" />
          <h3 className="font-semibold text-foreground">بيانات مدخل البيانات والتواصل</h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="اسم مدخل البيانات" icon={User}>
              <Input value={formData.data_entry_name} onChange={e => setFormData(prev => ({ ...prev, data_entry_name: e.target.value }))} placeholder="الاسم الكامل" />
            </FormField>
            <FormField label="صفته في الجمعية" icon={BadgeCheck}>
              <Input value={formData.data_entry_role} onChange={e => setFormData(prev => ({ ...prev, data_entry_role: e.target.value }))} placeholder="مثال: مدير تنفيذي" />
            </FormField>
          </div>
          <FormField label="البريد الإلكتروني" icon={Mail}>
            <Input type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="example@org.sa" dir="ltr" className="text-right" />
          </FormField>
          <FormField label="رقم الجوال" icon={Phone}>
            <Input value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="05XXXXXXXX" dir="ltr" className="text-right" />
          </FormField>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full h-11 text-base font-medium">
        {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
        {editOrg ? "تحديث البيانات" : "إضافة الجمعية"}
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الجمعيات</h1>
          <p className="text-sm text-muted-foreground mt-1">بطاقة تعريف الجمعيات — مشروع تطوير نماذج الاستدامة</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { resetForm(); setEditOrg(null); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-10 px-5 shadow-sm">
              <Plus className="w-4 h-4" /> إضافة جمعية
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">{editOrg ? "تعديل بيانات الجمعية" : "إضافة جمعية جديدة"}</DialogTitle>
            </DialogHeader>
            {orgForm}
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ابحث عن جمعية..." className="pr-10" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "إجمالي الجمعيات", value: organizations.length },
          { label: "المدن", value: new Set(organizations.map(o => o.city).filter(Boolean)).size },
          { label: "المناطق", value: new Set(organizations.map(o => o.region).filter(Boolean)).size },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((org, i) => (
            <motion.div key={org.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground leading-tight">{org.name}</h3>
                        {org.specialty && <Badge variant="secondary" className="mt-1 text-[10px] font-normal">{org.specialty}</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewOrg(org)}><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(org)}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(org.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 flex-shrink-0" /><span>{org.city || "—"} — {org.region || "—"}</span></div>
                    <div className="flex items-center gap-2"><User className="w-4 h-4 flex-shrink-0" /><span>{org.data_entry_name || "—"}</span></div>
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 flex-shrink-0" /><span dir="ltr" className="text-xs truncate">{org.email || "—"}</span></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد جمعيات مطابقة للبحث</p>
        </div>
      )}

      <Dialog open={!!viewOrg} onOpenChange={() => setViewOrg(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              بطاقة تعريف الجمعية
            </DialogTitle>
          </DialogHeader>
          {viewOrg && (
            <div className="space-y-4">
              <div className="text-center pb-4 border-b border-border">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">{viewOrg.name}</h2>
                {viewOrg.specialty && <Badge variant="outline" className="mt-2">{viewOrg.specialty}</Badge>}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">البيانات الأساسية</p>
                <div className="bg-muted/30 rounded-lg px-4">
                  <InfoRow icon={MapPin} label="المنطقة" value={viewOrg.region} />
                  <InfoRow icon={MapPin} label="المدينة" value={viewOrg.city} />
                  <InfoRow icon={Briefcase} label="التخصص" value={viewOrg.specialty} />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">مدخل البيانات</p>
                <div className="bg-muted/30 rounded-lg px-4">
                  <InfoRow icon={User} label="الاسم" value={viewOrg.data_entry_name} />
                  <InfoRow icon={BadgeCheck} label="الصفة" value={viewOrg.data_entry_role} />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">بيانات التواصل</p>
                <div className="bg-muted/30 rounded-lg px-4">
                  <InfoRow icon={Mail} label="البريد الإلكتروني" value={viewOrg.email} />
                  <InfoRow icon={Phone} label="رقم الجوال" value={viewOrg.phone} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => { setViewOrg(null); handleEdit(viewOrg); }}>
                  <Edit className="w-4 h-4" /> تعديل
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationsPage;
