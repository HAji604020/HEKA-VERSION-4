import React from 'react';
import { X, Bell, ShoppingCart, MessageSquare, ShieldCheck, Clock } from 'lucide-react';
import { AppNotification, Language } from '../types';
import { tr } from '../translations';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onSelectNotification: (notif: AppNotification) => void;
  isRtl?: boolean;
  currentLang?: Language;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onSelectNotification,
  isRtl = false,
  currentLang,
}) => {
  if (!isOpen) return null;

  const lang: Language =
    currentLang ||
    (typeof document !== 'undefined' && (document.documentElement.lang === 'ps' || document.documentElement.lang === 'fa')
      ? (document.documentElement.lang as Language)
      : isRtl
      ? 'fa'
      : 'en');

  return (
    <div className="fixed inset-0 bg-[#101C35]/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="glass-modal rounded-3xl max-w-lg w-full overflow-hidden my-8 shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#101C35] to-[#1c2e56] dark:from-[#C9A96E]/20 dark:to-[#C9A96E]/5 flex items-center justify-center border border-[#C9A96E]/30">
              <Bell className="w-4 h-4 text-[#C9A96E]" />
            </div>
            <h2 className="text-base font-extrabold text-[#101C35] dark:text-white">
              {tr(lang, 'Notifications & Alerts', 'اعلان‌ها و رویدادهای سیستم', 'خبرتیاوې او د سیستم پېښې')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="text-xs font-bold text-[#101C35] dark:text-[#C9A96E] hover:underline cursor-pointer transition-colors"
            >
              {tr(lang, 'Mark all read', 'علامت‌گذاری همه', 'ټول لوستل شوي نښه کړئ')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-slate-200/60 dark:divide-white/5 max-h-[65vh] overflow-y-auto p-3 space-y-1">
          {notifications.length > 0 ? (
            notifications.map((notif) => {
              const Icon = {
                order: ShoppingCart,
                inquiry: MessageSquare,
                security: ShieldCheck,
                system: Clock,
                inventory: Bell
              }[notif.type] || Bell;

              const iconBg = {
                order: 'bg-[#101C35]/10 dark:bg-white/10 text-[#101C35] dark:text-white',
                inquiry: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
                security: 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30',
                system: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
                inventory: 'bg-[#C9A96E]/20 text-[#8C6D2E] dark:text-[#C9A96E] border-[#C9A96E]/40'
              }[notif.type] || 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';

              return (
                <div
                  key={notif.id}
                  onClick={() => onSelectNotification(notif)}
                  className={`p-3.5 rounded-2xl transition cursor-pointer flex items-start gap-3 backdrop-blur-xs ${
                    notif.read
                      ? 'hover:bg-white/50 dark:hover:bg-slate-800/40 opacity-75'
                      : 'bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 font-medium shadow-xs border border-white/60 dark:border-white/5'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs text-start">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-slate-900 dark:text-white font-bold truncate block">
                        {notif.title}
                      </strong>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                  </div>
                  {!notif.read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C9A96E] shrink-0 mt-1.5 shadow-xs" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              {tr(lang, 'No notifications at this time.', 'هیچ اعلان جدیدی وجود ندارد.', 'اوس مهال هیڅ نوې خبرتیا نشته.')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 text-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#101C35] hover:bg-[#192b52] dark:bg-[#C9A96E] dark:hover:bg-[#d4b984] text-white dark:text-[#101C35] font-bold text-xs cursor-pointer shadow-sm border border-[#C9A96E]/30 active:scale-95"
          >
            {tr(lang, 'Close', 'بستن', 'تړل')}
          </button>
        </div>
      </div>
    </div>
  );
};

