import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Ruler, Package, Receipt,
  BarChart3, Settings, ChevronLeft, ChevronRight, Scissors, Menu, X, LogOut, Shield
} from 'lucide-react';
import { logout as logoutApi } from '@/services/auth';

// Dynamic navItems moved inside Layout component

import { getMe } from '@/services/auth';
import { useQuery } from '@tanstack/react-query';

export default function Layout() {
  const { data: userData } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const user = userData?.user;
  const roleData = user?.role_record || user?.roleRecord;
  const roleName = (roleData?.role_name || (typeof user?.role === 'string' ? user.role : 'staff')).toLowerCase();
  const isAdmin = roleName === 'admin';
  const isManager = roleName === 'manager';

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/customers', label: 'Customers', icon: Users, permission: 'manage_customers' },
    { path: '/appointments', label: 'Appointments', icon: Calendar, permission: 'manage_appointments' },
    { path: '/measurements', label: 'Measurements', icon: Ruler, permission: 'manage_measurements' },
    { path: '/orders', label: 'Orders', icon: Package, permission: 'manage_orders' },
    { path: '/billing', label: 'Billing', icon: Receipt, permission: 'manage_billing' }, 
    { path: '/reports', label: 'Reports', icon: BarChart3, permission: 'view_reports' },
    { path: '/staff', label: 'Team', icon: Users, permission: 'manage_users' },
    { path: '/settings/roles', label: 'Roles & Permissions', icon: Shield, permission: 'manage_roles' },
    { path: '/staff-monitoring', label: 'Staff Monitor', icon: Users, permission: 'manage_users' },
    { path: '/work-reports', label: 'Work Reports', icon: BarChart3, permission: 'view_reports' },
    { path: '/settings', label: 'Settings', icon: Settings },
  ].filter(item => {
    if (!item.permission) return true;
    if (isAdmin) return true;
    return roleData?.permissions?.some((p: any) => p.permission_name === item.permission);
  });

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutApi();
    } catch {
      // logout() clears token in finally even if the request fails
    } finally {
      setLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        bg-sidebar-bg flex flex-col transition-all duration-200 z-50
        fixed lg:relative inset-y-0 left-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'w-16' : 'w-60'}
      `}>
        <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-hover">
          <Scissors className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && <span className="text-sidebar-fg font-bold text-lg tracking-tight">SPOKE</span>}
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden p-1 rounded-lg text-sidebar-muted hover:text-sidebar-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-hover text-sidebar-fg'
                    : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg'
                }`}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 px-3 py-2 mx-2 mb-1 rounded-lg text-sm font-medium text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg transition-colors disabled:opacity-50"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && <span>{loggingOut ? 'Signing out…' : 'Log out'}</span>}
        </button>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-10 mx-2 mb-2 rounded-lg text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 h-14 px-4 border-b border-border bg-card shrink-0">
          <button type="button" onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <Scissors className="h-5 w-5 text-primary" />
          <span className="font-bold text-foreground tracking-tight flex-1">SPOKE</span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
