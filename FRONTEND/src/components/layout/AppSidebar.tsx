
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { 
  Home, 
  BookOpen, 
  Users, 
  Calendar, 
  FileText, 
  Settings,
  Plus,
  GraduationCap,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  userRole: 'teacher' | 'student';
}

const AppSidebar: React.FC<AppSidebarProps> = ({ userRole }) => {
  const teacherItems = [
    { title: "Dashboard", url: "#", icon: Home },
    { title: "My Classes", url: "#", icon: BookOpen },
    { title: "Students", url: "#", icon: Users },
    { title: "Assignments", url: "#", icon: ClipboardList },
    { title: "Calendar", url: "#", icon: Calendar },
    { title: "Resources", url: "#", icon: FileText },
  ];

  const studentItems = [
    { title: "Dashboard", url: "#", icon: Home },
    { title: "My Classes", url: "#", icon: BookOpen },
    { title: "Assignments", url: "#", icon: ClipboardList },
    { title: "Grades", url: "#", icon: GraduationCap },
    { title: "Calendar", url: "#", icon: Calendar },
    { title: "Resources", url: "#", icon: FileText },
  ];

  const menuItems = userRole === 'teacher' ? teacherItems : studentItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        {userRole === 'teacher' && (
          <Button className="w-full bg-primary hover:bg-primary/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Create Class
          </Button>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-accent hover:text-accent-foreground">
                    <a href={item.url} className="flex items-center space-x-3 px-3 py-2 rounded-lg">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
