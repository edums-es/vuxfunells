import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { adminTokenStorage, adminMe, AdminUser } from '../../lib/api';
import { LayoutDashboard, Filter, Users, LogOut, Menu, X, ChevronRight, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    adminMe().then(setUser).catch(() => {
      // Token might be invalid or expired
      navigate('/admin/login');
    });
  }, [navigate]);

  const menuItems = [
    { path: '/admin/overview', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/funnels', label: 'Funis', icon: Filter },
    { path: '/admin/leads', label: 'Leads', icon: Users },
    { path: '/admin/users', label: 'Usuários', icon: Shield, adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly) return user?.role === 'admin';
    return true;
  });

  const handleLogout = () => {
    adminTokenStorage.clear();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="h-screen w-full bg-neutral-950 text-white flex overflow-hidden font-sans selection:bg-purple-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-white/5 bg-neutral-900/50 backdrop-blur-xl relative z-10 h-full">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="font-bold text-lg text-white">JF</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Jornada F.</h1>
              <p className="text-xs text-neutral-400">Admin Console</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden',
                  isActive
                    ? 'text-white bg-white/5 shadow-inner'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-l-2 border-purple-500 animate-in fade-in duration-300"
                    />
                  )}
                  <item.icon className={cn("w-5 h-5 relative z-10 transition-colors", isActive ? "text-purple-400" : "group-hover:text-purple-400")} />
                  <span className="relative z-10 font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-purple-400 relative z-10" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="font-medium">Sair do sistema</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-neutral-900/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <span className="font-bold text-sm text-white">JF</span>
          </div>
          <span className="font-bold">Admin</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-neutral-400">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-neutral-950 pt-20 px-4 animate-in slide-in-from-top-10 fade-in duration-300"
        >
          <nav className="space-y-2">
              {filteredMenuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-4 rounded-xl transition-all',
                      isActive ? 'bg-white/10 text-white' : 'text-neutral-400'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-4 rounded-xl text-red-400 w-full mt-8"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sair</span>
              </button>
            </nav>
          </div>
        )}
      {/* End Mobile Menu */}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 pt-20 lg:pt-0">
        <div className="w-full max-w-[1920px] mx-auto p-4 lg:p-8 space-y-8">
           {/* Header Area for Breadcrumbs/Title could go here */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

