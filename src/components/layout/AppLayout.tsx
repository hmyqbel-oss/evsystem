import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, ClipboardCheck, Building2, FileBarChart, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

const adminLinks = [
  { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
  { title: "المنظمات", url: "/organizations", icon: Building2 },
  { title: "النتائج", url: "/results", icon: FileBarChart },
];

const evaluatorLinks = [
  { title: "التقييمات", url: "/evaluations", icon: ClipboardCheck },
  { title: "النتائج", url: "/results", icon: FileBarChart },
];

function AppSidebarContent() {
  const { role, userName, logout } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const links = role === "admin" ? adminLinks : evaluatorLinks;

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarContent className="flex flex-col justify-between h-full">
        <div>
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="w-4 h-4 text-sidebar-primary-foreground" />
              </div>
              {!collapsed && <span className="font-bold text-sidebar-foreground text-sm">منصة التقييم</span>}
            </div>
          </div>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {links.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <item.icon className="w-4 h-4 ml-2" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* User info & logout */}
        <div className="p-4 border-t border-sidebar-border">
          {!collapsed && (
            <p className="text-xs text-sidebar-foreground/60 mb-2">{userName}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && "تسجيل الخروج"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebarContent />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4">
            <SidebarTrigger className="ml-2">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
          </header>
          <main className="flex-1 bg-background">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
