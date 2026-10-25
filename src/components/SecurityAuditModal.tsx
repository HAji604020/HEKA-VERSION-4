import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Play, CheckCircle2, XCircle, X, Lock, Terminal } from 'lucide-react';
import { SecurityAuditResult, Language } from '../types';
import { translations } from '../translations';
import { api } from '../services/api';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({
  isOpen,
  onClose,
  currentLang,
}) => {
  if (!isOpen) return null;
  const t = translations[currentLang];

  const [isRunning, setIsRunning] = useState(false);
  const [auditData, setAuditData] = useState<{
    timestamp: string;
    totalTests: number;
    allPassed: boolean;
    results: SecurityAuditResult[];
  } | null>(null);

  const handleRunAudit = async () => {
    setIsRunning(true);
    try {
      const data = await api.runSecurityAudit();
      setAuditData(data);
    } catch (err: any) {
      alert(`Audit execution error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101C35]/60 dark:bg-black/75 backdrop-blur-md">
      <div className="glass-modal rounded-3xl max-w-2xl w-full overflow-hidden my-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#101C35] dark:text-white text-base">{t.securityAuditTitle}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Institutional Multi-Tenant Access Verification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">{t.securityAuditDesc}</p>

          {/* Action to trigger tests */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#101C35] to-[#1c2e56] text-white p-5 rounded-2xl border border-white/10 shadow-md">
            <div>
              <span className="font-bold text-sm block">Run Cross-Tenant Security Audit</span>
              <span className="text-[11px] text-slate-300">
                Executes 4 real attack vectors against backend authorization rules.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRunAudit}
              disabled={isRunning}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? t.runningAudit : t.runAuditNowBtn}</span>
            </button>
          </div>

          {/* Results Display */}
          {auditData && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border flex items-center gap-2.5 font-bold text-xs backdrop-blur-xs ${
                  auditData.allPassed
                    ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-900 dark:text-rose-300 border-rose-500/30'
                }`}
              >
                {auditData.allPassed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t.allPassedBanner}</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{t.breachBanner}</span>
                  </>
                )}
              </div>

              {/* Test Items */}
              <div className="space-y-3">
                {auditData.results.map((test) => (
                  <div
                    key={test.testId}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-slate-800/40 space-y-2 text-xs backdrop-blur-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200">
                          {test.testId}
                        </span>
                        <strong className="text-slate-900 dark:text-white">{test.testName}</strong>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          test.isIsolated
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {test.isIsolated ? 'BLOCKED (SECURE)' : 'LEAK DETECTED'}
                      </span>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">{test.testDescription}</p>

                    <div className="bg-slate-900/90 dark:bg-black/60 border border-white/5 text-emerald-400 p-3 rounded-xl font-mono text-[11px] space-y-1">
                      <div className="text-slate-400">Action: {test.actionAttempted}</div>
                      <div>Status: HTTP {test.statusCodeReceived} (Expected: {test.expectedStatus})</div>
                      <div className="text-slate-300 text-[10px] pt-0.5">{test.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/40 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#101C35] hover:bg-[#192b52] dark:bg-[#C9A96E] dark:hover:bg-[#d4b984] text-white dark:text-[#101C35] transition cursor-pointer shadow-sm border border-[#C9A96E]/30 active:scale-95"
          >
            {t.closeModal}
          </button>
        </div>
      </div>
    </div>
  );
};
