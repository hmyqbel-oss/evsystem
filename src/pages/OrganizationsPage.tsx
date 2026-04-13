import { useState } from "react";
import { sampleOrganizations, type Organization } from "@/data/sampleData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Building2, MapPin, Phone, Mail, Calendar, Users, Hash, Edit, Trash2, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const OrganizationsPage = () => {
  const [organizations, setOrganizations] = useState<Organization[]>(sampleOrganizations);
  const [isOpen, setIsOpen] = useState(false);
  const [viewOrg, setViewOrg] = useState<Organization | null>(null);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<Partial<Organization>>({});

  const resetForm = () => setFormData({});

  const handleSave = () => {
    if (!formData.name) { toast.error("يرجى إدخال اسم الجمعية"); return; }

    if (editOrg) {
      setOrganizations(orgs => orgs.map(o => o.id === editOrg.id ? { ...o, ...formData } as Organization : o));
      setEditOrg(null);
      toast.success("تم تحديث بيانات الجمعية بنجاح");
    } else {
      const newOrg: Organization = {
        id: String(Date.now()),
        name: formData.name || "",
        city: formData.city || "",
        region: formData.region || "",
        licenseNumber: formData.licenseNumber || "",
        foundedDate: formData.foundedDate || "",
        membersCount: formData.membersCount || 0,
        email: formData.email || "",
        phone: formData.phone || "",
      };
      setOrganizations([...organizations, newOrg]);
      toast.success("تمت إضافة الجمعية بنجاح");
    }
    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (org: Organization) => {
    setEditOrg(org);
    setFormData(org);
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    setOrganizations(orgs => orgs.filter(o => o.id !== id));
    toast.success("تم حذف الجمعية");
  };

  const filtered = organizations.filter(o =>
    o.name.includes(searchQuery) || o.city.includes(searchQuery) || o.region.includes(searchQuery)
  );

  const FormField = ({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      {children}
    </div>
  );

  const orgForm = (
    <div className="space-y-6">
      {/* القسم: البيانات الأساسية */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h3 className="font-semibold text-foreground">البيانات الأساسية</h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="اسم الجمعية" icon={Building2}>
              <Input value={formData.name || ""} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="أدخل اسم الجمعية" />
            </FormField>
            <FormField label="رقم الترخيص" icon={Hash}>
              <Input value={formData.licenseNumber || ""} onChange={e => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))} placeholder="مثال: 1234" dir="ltr" className="text-right" />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="المدينة" icon={MapPin}>
              <Input value={formData.city || ""} onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="مثال: الرياض" />
            </FormField>
            <FormField label="المنطقة" icon={MapPin}>
              <Input value={formData.region || ""} onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))} placeholder="مثال: منطقة الرياض" />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="تاريخ التأسيس" icon={Calendar}>
              <Input type="date" value={formData.foundedDate || ""} onChange={e => setFormData(prev => ({ ...prev, foundedDate: e.target.value }))} dir="ltr" className="text-right" />
            </FormField>
            <FormField label="عدد الأعضاء" icon={Users}>
              <Input type="number" value={formData.membersCount || ""} onChange={e => setFormData(prev => ({ ...prev, membersCount: parseInt(e.target.value) || 0 }))} placeholder="0" dir="ltr" className="text-right" />
            </FormField>
          </div>
        </div>
      </div>

      {/* القسم: بيانات التواصل */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-accent" />
          <h3 className="font-semibold text-foreground">بيانات التواصل</h3>
        </div>
        <div className="space-y-4">
          <FormField label="البريد الإلكتروني" icon={Mail}>
            <Input type="email" value={formData.email || ""} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="example@org.sa" dir="ltr" className="text-right" />
          </FormField>
          <FormField label="رقم الجوال" icon={Phone}>
            <Input value={formData.phone || ""} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="05XXXXXXXX" dir="ltr" className="text-right" />
          </FormField>
        </div>
      </div>

      <Button onClick={handleSave} className="w-full h-11 text-base font-medium">
        {editOrg ? "تحديث البيانات" : "إضافة الجمعية"}
      </Button>
    </div>
  );

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </span>
      <span className="text-sm font-medium text-foreground" dir={typeof value === 'number' ? 'ltr' : undefined}>{value}</span>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="ابحث عن جمعية..."
          className="pr-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "إجمالي الجمعيات", value: organizations.length, color: "bg-primary/10 text-primary" },
          { label: "إجمالي الأعضاء", value: organizations.reduce((s, o) => s + o.membersCount, 0), color: "bg-accent/50 text-accent-foreground" },
          { label: "المدن", value: new Set(organizations.map(o => o.city)).size, color: "bg-secondary text-secondary-foreground" },
          { label: "المناطق", value: new Set(organizations.map(o => o.region)).size, color: "bg-muted text-muted-foreground" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Organization Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground leading-tight">{org.name}</h3>
                        <Badge variant="secondary" className="mt-1 text-[10px] font-normal">
                          ترخيص: {org.licenseNumber}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewOrg(org)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(org)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(org.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{org.city} — {org.region}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>{org.membersCount} عضو</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span dir="ltr" className="text-xs truncate">{org.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span dir="ltr">{org.phone}</span>
                    </div>
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

      {/* View Dialog */}
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
                <Badge variant="outline" className="mt-2">ترخيص رقم: {viewOrg.licenseNumber}</Badge>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">البيانات الأساسية</p>
                <div className="bg-muted/30 rounded-lg px-4">
                  <InfoRow icon={MapPin} label="المدينة" value={viewOrg.city} />
                  <InfoRow icon={MapPin} label="المنطقة" value={viewOrg.region} />
                  <InfoRow icon={Calendar} label="تاريخ التأسيس" value={viewOrg.foundedDate || "—"} />
                  <InfoRow icon={Users} label="عدد الأعضاء" value={viewOrg.membersCount} />
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
