import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, UserCog, Loader2, Search, UserCheck, UserX } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  user_roles: { role: string }[];
}

const UsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<string>("admin");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      const rolesMap = new Map((rolesRes.data || []).map((r) => [r.user_id, r.role]));
      const users = (profilesRes.data || []).map((p) => ({
        ...p,
        user_roles: [{ role: rolesMap.get(p.user_id) || "admin" }],
      }));
      setUsers(users as UserProfile[]);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddDialog = () => {
    setEditUser(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormPassword("");
    setFormRole("admin");
    setDialogOpen(true);
  };

  const openEditDialog = (user: UserProfile) => {
    setEditUser(user);
    setFormName(user.full_name);
    setFormEmail(user.email);
    setFormPhone(user.phone || "");
    setFormPassword("");
    setFormRole(user.user_roles?.[0]?.role || "admin");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || (!editUser && (!formEmail.trim() || !formPassword.trim()))) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    setSaving(true);

    if (editUser) {
      const res = await supabase.functions.invoke("admin-create-user", {
        body: {
          action: "update",
          user_id: editUser.user_id,
          full_name: formName,
          phone: formPhone,
          role: formRole,
        },
      });
      if (res.error) {
        toast({ title: "خطأ", description: "فشل تحديث المستخدم", variant: "destructive" });
      } else {
        toast({ title: "تم", description: "تم تحديث المستخدم بنجاح" });
        setDialogOpen(false);
        fetchUsers();
      }
    } else {
      const res = await supabase.functions.invoke("admin-create-user", {
        body: {
          action: "create",
          email: formEmail,
          password: formPassword,
          full_name: formName,
          phone: formPhone,
          role: formRole,
        },
      });
      if (res.error || res.data?.error) {
        toast({ title: "خطأ", description: res.data?.error || "فشل إنشاء المستخدم", variant: "destructive" });
      } else {
        toast({ title: "تم", description: "تم إنشاء المستخدم بنجاح" });
        setDialogOpen(false);
        fetchUsers();
      }
    }
    setSaving(false);
  };

  const toggleActive = async (user: UserProfile) => {
    const res = await supabase.functions.invoke("admin-create-user", {
      body: {
        action: "update",
        user_id: user.user_id,
        is_active: !user.is_active,
      },
    });
    if (!res.error) {
      toast({ title: "تم", description: user.is_active ? "تم تعطيل المستخدم" : "تم تفعيل المستخدم" });
      fetchUsers();
    }
  };

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h1>
          <p className="text-muted-foreground text-sm mt-1">إضافة وتعديل صلاحيات المستخدمين</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة مستخدم
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
              <p className="text-xs text-muted-foreground">إجمالي المستخدمين</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{users.filter((u) => u.is_active).length}</p>
              <p className="text-xs text-muted-foreground">مستخدمون نشطون</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <UserX className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{users.filter((u) => !u.is_active).length}</p>
              <p className="text-xs text-muted-foreground">مستخدمون معطلون</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو البريد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا يوجد مستخدمون
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                      <TableCell dir="ltr" className="text-left">{user.email}</TableCell>
                      <TableCell dir="ltr" className="text-left">{user.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="default">مدير</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "outline" : "destructive"} className={user.is_active ? "border-green-500 text-green-600" : ""}>
                          {user.is_active ? "نشط" : "معطل"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                            تعديل
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={user.is_active ? "text-destructive" : "text-green-600"}
                            onClick={() => toggleActive(user)}
                          >
                            {user.is_active ? "تعطيل" : "تفعيل"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">الاسم الكامل *</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="الاسم الكامل" />
            </div>
            {!editUser && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">البريد الإلكتروني *</label>
                  <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@example.com" dir="ltr" className="text-left" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">كلمة المرور *</label>
                  <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="كلمة مرور قوية" dir="ltr" className="text-left" />
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">رقم الهاتف</label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="05xxxxxxxx" dir="ltr" className="text-left" />
            </div>
            <input type="hidden" value="admin" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              {editUser ? "حفظ التعديلات" : "إنشاء المستخدم"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
