/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Agenda } from './components/Agenda';
import { Patients } from './components/Patients';
import { Professionals } from './components/Professionals';
import { Resources } from './components/Resources';
import { Settings } from './components/Settings';
import { AgendaAgent } from './components/AgendaAgent';
import { TVMonitor } from './components/TVMonitor';
import { Login } from './components/Login';
import { ErrorBoundary } from './components/ErrorBoundary';
import { supabase } from './lib/supabase';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [user, setUser] = React.useState<{ id: string, name: string, role: string } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // If no real Supabase credentials, skip session check and show login
    if (!supabaseUrl || !supabaseKey) {
      setLoading(false);
      return;
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Supabase getSession error:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        const role = data.role || 'reception';
        setUser({ id: data.id, name: data.name, role });
        setIsAuthenticated(true);
        // Set default tab based on role
        if (role !== 'admin') {
          setActiveTab('agent');
        }
      } else {
        // Fallback for new users or if profile missing
        setUser({ id: userId, name: 'Usuario', role: 'admin' });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    // In a real app, this would be a real login form or OAuth
    // For now, we'll simulate success if the user clicks the button
    // (In Supabase, you'd typically use supabase.auth.signInWithPassword)
    setIsAuthenticated(true);
    setUser({ id: 'admin-123', name: 'Administrador 440', role: 'admin' });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-main flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin shadow-lg shadow-accent-blue/20" />
          <p className="text-text-primary font-bold tracking-[0.2em] uppercase text-xs">Cargando Agenda 440...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = user.role === 'admin';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return isAdmin ? <Dashboard onNavigate={setActiveTab} /> : <AgendaAgent userId={user.id} />;
      case 'agenda':
        return <Agenda userId={user.id} userRole={user.role} />;
      case 'tv-monitor':
        return <TVMonitor />;
      case 'agent':
        return <AgendaAgent userId={user.id} />;
      case 'patients':
        return isAdmin ? <Patients /> : <AgendaAgent userId={user.id} />;
      case 'professionals':
        return isAdmin ? <Professionals /> : <AgendaAgent userId={user.id} />;
      case 'resources':
        return isAdmin ? <Resources /> : <AgendaAgent userId={user.id} />;
      case 'settings':
        return isAdmin ? <Settings /> : <AgendaAgent userId={user.id} />;
      default:
        return isAdmin ? <Dashboard /> : <AgendaAgent userId={user.id} />;
    }
  };

  return (
    <ErrorBoundary>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      >
        {renderContent()}
      </Layout>
    </ErrorBoundary>
  );
}
