import { useState } from "react";
import { sampleOrganizations, type Organization } from "@/data/sampleData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Building2, MapPin, Phone, Mail, Edit } from "lucide-react";
import { toast } from "sonner";

const OrganizationsPage = () => {
  const [organizations, setOrganizations] = useState<Organization[]>(sampleOrganizations);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Organization>>({});

  const handleSave = () => {
    if (!formData.name) { toast.error("يرجى إدخال اسم المنظمة"); return; }
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
    setFormData({});
    setIsOpen(false);
    toast.success("تمت إضافة المنظمة بنجاح");
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">إدارة المنظمات</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> إضافة منظمة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة منظمة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">اسم الجمعية</label>
                <Input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">المدينة</label>
                  <Input value={formData.city || ""} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">المنطقة</label>
                  <Input value={formData.region || ""} onChange={(e) => setFormData({ ...formData, region: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">رقم الترخيص</label>
                  <Input value={formData.licenseNumber || ""} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">عدد الأعضاء</label>
                  <Input type="number" value={formData.membersCount || ""} onChange={(e) => setFormData({ ...formData, membersCount: parseInt(e.target.value) })} dir="ltr" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">البريد الإلكتروني</label>
                <Input type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} dir="ltr" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">رقم الجوال</label>
                <Input value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} dir="ltr" />
              </div>
              <Button onClick={handleSave} className="w-full">حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organizations.map((org) => (
          <Card key={org.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{org.name}</h3>
                    <p className="text-xs text-muted-foreground">ترخيص: {org.licenseNumber}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{org.city} — {org.region}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span dir="ltr">{org.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">{org.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrganizationsPage;
