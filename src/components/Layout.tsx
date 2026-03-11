import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Users,
  UserRound,
  Settings,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Stethoscope,
  Box,
  Bot,
  MessageSquare,
  Smartphone,
  Monitor
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active
        ? "bg-accent-blue text-white shadow-lg shadow-accent-blue/20"
        : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
    )}
  >
    <Icon size={20} className={cn(
      "transition-colors",
      active ? "text-white" : "text-text-secondary group-hover:text-text-primary"
    )} />
    {label && <span className="font-medium">{label}</span>}
  </button>
);

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: { name: string, role: string } | null;
  onLogout: () => void;
}

export const Layout = ({ children, activeTab, setActiveTab, user, onLogout }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(window.innerWidth > 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
    { id: 'agent', label: 'Agente IA', icon: Bot },
    { id: 'agenda', label: 'Calendario', icon: Calendar },
    { id: 'tv-monitor', label: 'Monitor Operativo', icon: Monitor, adminOnly: true },
    { id: 'patients', label: 'Pacientes', icon: Users, adminOnly: true },
    { id: 'professionals', label: 'Profesionales', icon: Stethoscope, adminOnly: true },
    { id: 'resources', label: 'Recursos', icon: Box, adminOnly: true },
    { id: 'settings', label: 'Configuración', icon: Settings, adminOnly: true },
  ].filter(item => !item.adminOnly || isAdmin);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    if (window.innerWidth <= 768) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-navy-main text-text-primary overflow-hidden">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop & Mobile */}
      <motion.aside
        initial={false}
        animate={{
          width: isSidebarOpen ? 260 : 80,
          x: window.innerWidth <= 768 ? (isMobileMenuOpen ? 0 : -260) : 0
        }}
        className={cn(
          "bg-navy-deep border-r border-border-subtle flex flex-col z-40 shadow-2xl transition-all duration-300",
          "fixed md:relative h-full"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {(isSidebarOpen || isMobileMenuOpen) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              <h1 className="text-xl font-bold text-text-primary tracking-tighter">440<span className="font-light opacity-50">clinic</span></h1>
              <span className="text-[10px] uppercase tracking-[0.2em] text-accent-blue font-bold">Agenda Pro</span>
            </motion.div>
          )}
          <button
            onClick={() => window.innerWidth <= 768 ? setIsMobileMenuOpen(false) : setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-xl text-text-secondary hover:text-text-primary transition-colors"
          >
            {isSidebarOpen || isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={(isSidebarOpen || isMobileMenuOpen) ? item.label : ''}
              active={activeTab === item.id}
              onClick={() => handleTabChange(item.id)}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-border-subtle">
          {user && (isSidebarOpen || isMobileMenuOpen) && (
            <div className="mb-4 px-4 py-3 bg-navy-card rounded-xl border border-border-subtle">
              <p className="text-sm font-bold text-text-primary truncate">{user.name}</p>
              <p className="text-xs text-text-secondary capitalize">{user.role}</p>
            </div>
          )}
          <button
            onClick={onLogout}
            className="flex items-center w-full gap-3 px-4 py-3 text-text-secondary hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all group"
          >
            <LogOut size={20} />
            {(isSidebarOpen || isMobileMenuOpen) && <span className="font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        <header className="sticky top-0 bg-navy-main/80 backdrop-blur-md z-10 px-4 md:px-8 py-4 md:py-6 border-b border-border-subtle flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-white/5 rounded-xl text-text-secondary md:hidden"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg md:text-2xl font-bold text-text-primary capitalize tracking-tight">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs md:text-sm font-medium text-text-secondary">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-navy-main">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};
