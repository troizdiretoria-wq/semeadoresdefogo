import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Flame,
  GraduationCap,
  FileText,
  Building2,
  ChevronRight,
  Globe,
  Award,
} from 'lucide-react';
import { Logo } from './Logo.js';
import { useAuth } from '../../context/AuthContext.js';

export type NavTab =
  | 'dashboard'
  | 'regions'
  | 'evangelisms'
  | 'consolidation'
  | 'crusades'
  | 'courses'
  | 'certificates'
  | 'reports'
  | 'ai_analysis'
  | 'departments'
  | 'tasks'
  | 'meetings'
  | 'media'
  | 'admin_users'
  | 'financial'
  | 'legal'
  | 'public_site';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  permission?: string;
  highlight?: boolean;
}

interface NavSection {
  title: string;
  adminOnly?: boolean;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { currentUser, isGlobalAdmin, canAccessModule } = useAuth();

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const navSections: NavSection[] = [
    {
      title: 'VISÃO GERAL',
      items: [
        { id: 'dashboard', label: 'Dashboard Global', icon: LayoutDashboard },
      ],
    },
    {
      title: 'OPERAÇÃO MINISTERIAL',
      items: [
        { id: 'regions', label: 'Regionais', icon: MapPin, permission: 'regions' },
        { id: 'evangelisms', label: 'Evangelismos', icon: Flame, permission: 'evangelisms' },
      ],
    },
    {
      title: 'FORMAÇÃO',
      items: [
        { id: 'courses', label: 'Cursos e Ensino', icon: GraduationCap, permission: 'courses' },
        { id: 'certificates', label: 'Certificados Digitais', icon: Award, permission: 'courses' },
      ],
    },
    {
      title: 'GESTÃO',
      items: [
        { id: 'reports', label: 'Relatórios Bimestrais', icon: FileText, permission: 'reports', highlight: true },
        { id: 'departments', label: 'Departamentos', icon: Building2, permission: 'departments' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-stone-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-stone-900 text-stone-300 flex flex-col border-r border-stone-800 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-stone-800/80 bg-stone-950/40">
          <Logo variant="light" showSubtitle={true} />
        </div>

        {/* Public Site Quick Link */}
        <div className="px-3 pt-3">
          <button
            onClick={() => handleNavClick('public_site')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'public_site'
                ? 'bg-red-950/80 text-red-300 border border-red-800/50'
                : 'bg-stone-800/60 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-700/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-red-500" />
              <span>Ver Site Institucional Público</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((sec) => {
            if (sec.adminOnly && !isGlobalAdmin) return null;

            const accessibleItems = sec.items.filter((item) => {
              if (item.permission) {
                return canAccessModule(item.permission);
              }
              return true;
            });

            if (accessibleItems.length === 0) return null;

            return (
              <div key={sec.title} className="space-y-1">
                <p className="px-3 text-[10px] font-bold tracking-wider text-stone-500 uppercase">
                  {sec.title}
                </p>
                <div className="space-y-0.5 pt-1">
                  {accessibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                          isActive
                            ? 'bg-red-800 text-white shadow-sm shadow-red-950/50 font-semibold'
                            : item.highlight
                            ? 'text-stone-200 hover:bg-stone-800/80 hover:text-white'
                            : 'text-stone-400 hover:bg-stone-800/60 hover:text-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              isActive
                                ? 'text-white'
                                : item.highlight
                                ? 'text-red-400 group-hover:text-red-300'
                                : 'text-stone-400 group-hover:text-stone-300'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.highlight && !isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Profile Mini Footer */}
        {currentUser && (
          <div className="p-3 border-t border-stone-800 bg-stone-950/30">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-stone-800/40 border border-stone-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-800 to-amber-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-200 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-stone-400 truncate">
                  {currentUser.role === 'admin_global'
                    ? 'Liderança Global'
                    : currentUser.role === 'coordenador_regional'
                    ? 'Coord. Regional'
                    : currentUser.role === 'lider_evangelismo'
                    ? 'Líder de Ação'
                    : currentUser.role === 'equipe_consolidacao'
                    ? 'Consolidação'
                    : currentUser.role === 'equipe_ensino'
                    ? 'Ensino'
                    : 'Mídia & Comunicação'}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
