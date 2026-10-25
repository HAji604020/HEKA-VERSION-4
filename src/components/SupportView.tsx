import React, { useState } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Languages,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  X,
  FileText,
  Calendar,
  User,
  ArrowUpDown,
  Layers,
  Send,
  Database,
  Building,
  RefreshCw,
  Eye,
  Info
} from 'lucide-react';
import {
  SupportTicket,
  Company,
  Language,
  ConversationLanguage,
  TicketStatus,
  TicketPriority,
  TicketCategory
} from '../types';
import { translations, tr } from '../translations';
import { api } from '../services/api';

interface SupportViewProps {
  company: Company;
  tickets: SupportTicket[];
  currentLang: Language;
  onRefresh: () => void;
}

export const SupportView: React.FC<SupportViewProps> = ({
  company,
  tickets,
  currentLang,
  onRefresh
}) => {
  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'fa' || currentLang === 'ps';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form State for New Ticket
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<TicketCategory>('general');
  const [formPriority, setFormPriority] = useState<TicketPriority>('medium');
  // Independent Conversation Language default
  const [formConvLang, setFormConvLang] = useState<ConversationLanguage>(
    currentLang === 'ps' ? 'ps' : currentLang === 'fa' ? 'fa' : 'en'
  );
  const [formAttachment, setFormAttachment] = useState('');
  const [formUploadedFiles, setFormUploadedFiles] = useState<string[]>([]);

  // Status options as required by specification
  const statusOptions: { value: TicketStatus; label: string; color: string; dotColor: string }[] = [
    { value: 'new', label: t.statusNew, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20', dotColor: 'bg-blue-500' },
    { value: 'open', label: t.statusOpen, color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20', dotColor: 'bg-indigo-500' },
    { value: 'in_progress', label: t.statusInProgress, color: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25', dotColor: 'bg-amber-500' },
    { value: 'waiting_customer', label: t.statusWaitingCustomer, color: 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/25', dotColor: 'bg-purple-500' },
    { value: 'resolved', label: t.statusResolved, color: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20', dotColor: 'bg-emerald-500' },
    { value: 'closed', label: t.statusClosed, color: 'bg-black/5 dark:bg-white/10 text-[#5A657D] dark:text-slate-400 border-slate-200/60 dark:border-white/10', dotColor: 'bg-slate-400' }
  ];

  // Priority helpers
  const priorityMap: Record<TicketPriority, { label: string; badgeClass: string }> = {
    low: { label: t.priorityLow, badgeClass: 'bg-black/5 dark:bg-white/10 text-[#5A657D] dark:text-slate-300 border-slate-200/60 dark:border-white/10' },
    medium: { label: t.priorityMedium, badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' },
    high: { label: t.priorityHigh, badgeClass: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30' },
    urgent: { label: t.priorityUrgent, badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold' }
  };

  // Category helpers
  const categoryMap: Record<TicketCategory, string> = {
    technical: t.catTechnical,
    billing: t.catBilling,
    logistics: t.catLogistics,
    quality: t.catQuality,
    account: t.catAccount,
    general: t.catGeneral
  };

  // Conversation language label helper
  const getConversationLangLabel = (code: ConversationLanguage) => {
    switch (code) {
      case 'en':
        return { label: t.langEnglish, short: 'English (LTR)', isRtl: false, flag: 'EN' };
      case 'fa':
        return { label: t.langDari, short: 'دری (RTL)', isRtl: true, flag: 'دری' };
      case 'ps':
        return { label: t.langPashto, short: 'پښتو (RTL)', isRtl: true, flag: 'پښتو' };
      default:
        return { label: code, short: code, isRtl: false, flag: code };
    }
  };

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || ticket.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate quick metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'new').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const waitingCount = tickets.filter((t) => t.status === 'waiting_customer').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

  // Handle Form Submission
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formDescription.trim()) return;

    setIsSubmitting(true);
    try {
      const attachmentsList = [...formUploadedFiles];
      if (formAttachment.trim()) {
        attachmentsList.push(formAttachment.trim());
      }

      await api.createSupportTicket({
        companyId: company.id,
        subject: formSubject.trim(),
        description: formDescription.trim(),
        category: formCategory,
        priority: formPriority,
        conversationLanguage: formConvLang,
        attachments: attachmentsList
      });

      // Clear form
      setFormSubject('');
      setFormDescription('');
      setFormCategory('general');
      setFormPriority('medium');
      setFormAttachment('');
      setFormUploadedFiles([]);
      setIsCreateModalOpen(false);

      setSuccessBanner(t.ticketCreatedSuccess);
      setTimeout(() => setSuccessBanner(null), 4000);

      onRefresh();
    } catch (err: any) {
      alert(`Ticket submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Ticket Status Update
  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    setIsUpdatingStatus(true);
    try {
      await api.updateSupportTicket(ticketId, { status: newStatus });
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      onRefresh();
    } catch (err: any) {
      alert(`Could not update ticket status: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormUploadedFiles((prev) => [...prev, file.name]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Frosted Header */}
      <div className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#101C35] dark:text-slate-100 tracking-tight">
              {t.supportTitle}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-black/5 dark:bg-white/10 text-[#101C35] dark:text-slate-200 border border-slate-200/60 dark:border-white/10 tabular-nums">
              {tickets.length} {tr(currentLang, 'Tickets', 'تیکت سازمانی', 'ټکټونه')}
            </span>
          </div>
          <p className="text-xs text-[#5A657D] dark:text-slate-400 mt-1 max-w-2xl">
            {t.supportSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            className="p-2.5 rounded-xl glass-card hover:border-[#C9A96E]/50 text-[#101C35] dark:text-slate-200 transition cursor-pointer shadow-2xs"
            title="Refresh tickets"
          >
            <RefreshCw className="w-4 h-4 text-[#C9A96E]" />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#101C35] dark:bg-[#C9A96E] hover:bg-[#192b52] dark:hover:bg-[#d8be8d] text-white dark:text-[#0B1220] transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#C9A96E] dark:text-[#0B1220]" />
            <span>{t.newTicketBtn}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">{t.persistentDbNotice}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <span className="text-[11px] font-bold text-[#5A657D] dark:text-slate-400 block">{t.filterStatusAll}</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#101C35] dark:text-slate-100 font-mono tabular-nums">{totalCount}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {tr(currentLang, 'Recorded', 'ثبت‌شده', 'ثبت شوي')}
            </span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block">{t.statusOpen} / {t.statusNew}</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono tabular-nums">{openCount}</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
              {tr(currentLang, 'Needs Attention', 'نیازمند بررسی', 'پاملرنې ته اړتیا لري')}
            </span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">{t.statusInProgress}</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-800 dark:text-amber-300 font-mono tabular-nums">{inProgressCount}</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              {tr(currentLang, 'Under Review', 'در دست اقدام', 'تر کار لاندې')}
            </span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">{t.statusResolved}</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300 font-mono tabular-nums">{resolvedCount}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {tr(currentLang, 'Completed', 'تکمیل‌شده', 'بشپړ شوي')}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5A657D] dark:text-slate-400 absolute start-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchTicketsPlaceholder}
              className="w-full text-xs sm:text-sm ps-10 pe-4 py-2.5 rounded-xl glass-input"
            />
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2.5 rounded-xl glass-input"
            >
              <option value="ALL" className="dark:bg-[#101C35]">{currentLang === 'fa' ? 'همه دسته‌بندی‌ها' : currentLang === 'ps' ? 'ټولې وېشنیزې' : 'All Categories'}</option>
              {Object.entries(categoryMap).map(([key, label]) => (
                <option key={key} value={key} className="dark:bg-[#101C35]">
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-200/60 dark:border-white/10 pt-2">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs'
                : 'bg-black/5 dark:bg-white/10 text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white'
            }`}
          >
            {t.filterStatusAll} ({totalCount})
          </button>
          {statusOptions.map((opt) => {
            const count = tickets.filter((tk) => tk.status === opt.value).length;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === opt.value
                    ? 'bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] font-bold shadow-xs'
                    : 'bg-black/5 dark:bg-white/10 text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${opt.dotColor}`} />
                <span>{opt.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tickets List Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right">
            <thead className="glass-table-head text-[#5A657D] dark:text-slate-300 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200/60 dark:border-white/10">
              <tr>
                <th className="px-4 py-3.5">{t.ticketNumber}</th>
                <th className="px-4 py-3.5">{t.subjectLabel}</th>
                <th className="px-4 py-3.5">{t.categoryLabel}</th>
                <th className="px-4 py-3.5">{t.priorityLabel}</th>
                <th className="px-4 py-3.5">
                  <span className="flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>{t.conversationLangLabel}</span>
                  </span>
                </th>
                <th className="px-4 py-3.5">{t.statusLabel}</th>
                <th className="px-4 py-3.5">{t.creationDateLabel}</th>
                <th className="px-4 py-3.5 text-center">{t.actionsLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#5A657D] dark:text-slate-400 space-y-2">
                    <LifeBuoy className="w-10 h-10 mx-auto text-slate-400/50" />
                    <p className="font-semibold text-sm text-[#101C35] dark:text-slate-100">{t.noTicketsFound}</p>
                    <p className="text-xs text-[#5A657D] dark:text-slate-400">{t.noTicketsMatchingFilter}</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const statusInfo = statusOptions.find((s) => s.value === ticket.status) || statusOptions[0];
                  const priorityInfo = priorityMap[ticket.priority] || priorityMap.medium;
                  const convLangInfo = getConversationLangLabel(ticket.conversationLanguage);

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="glass-table-row cursor-pointer group"
                    >
                      {/* Ticket Number */}
                      <td className="px-4 py-3.5 font-mono font-bold text-[#101C35] dark:text-slate-100 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 text-[11px]">
                          {ticket.ticketNumber}
                        </span>
                      </td>

                      {/* Subject */}
                      <td className="px-4 py-3.5 max-w-xs sm:max-w-md">
                        <div className="font-bold text-[#101C35] dark:text-slate-100 group-hover:text-[#C9A96E] dark:group-hover:text-[#C9A96E] line-clamp-1 transition-colors">
                          {ticket.subject}
                        </div>
                        <p className="text-[11px] text-[#5A657D] dark:text-slate-400 line-clamp-1 mt-0.5">
                          {ticket.description}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-[#101C35] dark:text-slate-200 font-medium">
                        {categoryMap[ticket.category] || ticket.category}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${priorityInfo.badgeClass}`}
                        >
                          {priorityInfo.label}
                        </span>
                      </td>

                      {/* Independent Conversation Language */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#101C35] dark:text-slate-200 border border-slate-200/60 dark:border-white/10 font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
                          <span>{convLangInfo.short}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-[#5A657D] dark:text-slate-400 font-mono text-[11px]">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(ticket);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#101C35] dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#C9A96E]" />
                          <span>{t.viewTicket}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Corporate Storage & Data Integrity Footer */}
      <div className="rounded-xl glass-card p-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#5A657D] dark:text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#C9A96E]" />
          <span>
            {tr(
              currentLang,
              'All support tickets are stored in the HEKA corporate database and persist across sessions.',
              'تیکت‌های ثبت‌شده در پایگاه داده اختصاصی شرکت ذخیره شده و پس از ریفرش حفظ می‌شوند.',
              'ثبت شوي ټکټونه د شرکت په ځانګړي ډیټابیس کې خوندي کېږي او له ریفرش وروسته ساتل کېږي.'
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{tr(currentLang, 'Tenant Isolated:', 'تفکیک داده‌های شرکت:', 'د شرکت جلا معلومات:')} {company.name}</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* INITIAL TICKET CREATION MODAL */}
      {/* ============================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
          <div className="glass-modal rounded-2xl max-w-xl w-full my-8 overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-white/10 bg-black/5 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-[#C9A96E]" />
                <div>
                  <h3 className="font-extrabold text-[#101C35] dark:text-slate-100 text-base">{t.createTicketTitle}</h3>
                  <span className="text-[11px] text-[#5A657D] dark:text-slate-400 block">{company.name}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
              <p className="text-xs text-[#5A657D] dark:text-slate-300 bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-slate-200/60 dark:border-white/10">
                {t.createTicketDesc}
              </p>

              {/* 1. Subject */}
              <div>
                <label className="block text-xs font-bold text-[#101C35] dark:text-slate-200 mb-1">
                  {t.subjectLabel} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder={t.subjectPlaceholder}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl glass-input"
                />
              </div>

              {/* 2. Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#101C35] dark:text-slate-200 mb-1">
                    {t.categoryLabel}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TicketCategory)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl glass-input"
                  >
                    {Object.entries(categoryMap).map(([key, label]) => (
                      <option key={key} value={key} className="dark:bg-[#101C35]">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101C35] dark:text-slate-200 mb-1">
                    {t.priorityLabel}
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TicketPriority)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl glass-input"
                  >
                    <option value="low" className="dark:bg-[#101C35]">{t.priorityLow}</option>
                    <option value="medium" className="dark:bg-[#101C35]">{t.priorityMedium}</option>
                    <option value="high" className="dark:bg-[#101C35]">{t.priorityHigh}</option>
                    <option value="urgent" className="dark:bg-[#101C35]">{t.priorityUrgent}</option>
                  </select>
                </div>
              </div>

              {/* 3. Independent Conversation Language Selector (Specification Requirement #2) */}
              <div className="p-3.5 rounded-xl border border-[#C9A96E]/40 bg-[#C9A96E]/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#101C35] dark:text-slate-100 flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-[#C9A96E]" />
                    <span>{t.conversationLangLabel}</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded glass-badge-gold">
                    {t.independentLangBadge}
                  </span>
                </div>
                <p className="text-[11px] text-[#5A657D] dark:text-slate-400">
                  {t.conversationLangDesc}
                </p>

                {/* 3-way radio button selector for English / Dari / Pashto */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { code: 'en' as ConversationLanguage, label: 'English', sub: 'Left-to-Right' },
                    { code: 'fa' as ConversationLanguage, label: 'دری (Dari)', sub: 'Right-to-Left' },
                    { code: 'ps' as ConversationLanguage, label: 'پښتو (Pashto)', sub: 'Right-to-Left' }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setFormConvLang(lang.code)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        formConvLang === lang.code
                          ? 'border-[#C9A96E] bg-[#101C35] dark:bg-[#C9A96E] text-white dark:text-[#0B1220] shadow-xs font-bold'
                          : 'border-slate-200/60 dark:border-white/10 glass-card text-[#101C35] dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      <strong className="block text-xs">{lang.label}</strong>
                      <span className="text-[10px] opacity-75 block mt-0.5">{lang.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#101C35] dark:text-slate-200">
                    {t.descriptionLabel} <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-[#5A657D] dark:text-slate-400 font-mono">
                    Text dir: {formConvLang === 'en' ? 'LTR' : 'RTL'}
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  dir={formConvLang === 'en' ? 'ltr' : 'rtl'}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={t.descriptionPlaceholder}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl glass-input leading-relaxed resize-none"
                />
              </div>

              {/* 5. Optional Attachment Field */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#101C35] dark:text-slate-200">
                  {t.attachmentsLabel}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formAttachment}
                    onChange={(e) => setFormAttachment(e.target.value)}
                    placeholder={t.attachmentsPlaceholder}
                    className="flex-1 text-xs px-3.5 py-2 rounded-xl glass-input"
                  />
                  <label className="px-3 py-2 rounded-xl glass-card hover:border-[#C9A96E]/50 text-[#101C35] dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Paperclip className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>{tr(currentLang, 'Upload', 'بارگذاری فایل', 'فایل پورته کول')}</span>
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {/* Uploaded files list */}
                {formUploadedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formUploadedFiles.map((fn, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md glass-card text-[#101C35] dark:text-slate-200"
                      >
                        <FileText className="w-3 h-3 text-[#C9A96E]" />
                        <span>{fn}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A657D] dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#101C35] dark:bg-[#C9A96E] hover:bg-[#192b52] dark:hover:bg-[#d8be8d] text-white dark:text-[#0B1220] transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5 text-[#C9A96E] dark:text-[#0B1220] rtl:-scale-x-100" />
                  <span>{isSubmitting ? tr(currentLang, 'Submitting...', 'در حال ثبت...', 'په ثبتولو کې...') : t.newTicketBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TICKET DETAILS MODAL */}
      {/* ============================================================== */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
          <div className="glass-modal rounded-2xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-white/10 bg-black/5 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded bg-[#101C35] dark:bg-[#C9A96E] text-[#C9A96E] dark:text-[#0B1220] shadow-2xs">
                  {selectedTicket.ticketNumber}
                </span>
                <h3 className="font-extrabold text-[#101C35] dark:text-slate-100 text-base truncate max-w-sm">
                  {t.ticketDetailsTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-[#5A657D] dark:text-slate-400 hover:text-[#101C35] dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
              {/* Subject Banner */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#5A657D] dark:text-slate-400 uppercase tracking-wider block">
                  {t.subjectLabel}
                </span>
                <h2 className="text-base sm:text-lg font-black text-[#101C35] dark:text-slate-100 leading-snug">
                  {selectedTicket.subject}
                </h2>
              </div>

              {/* Status and Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/5 dark:bg-white/5 p-3.5 rounded-xl border border-slate-200/60 dark:border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5A657D] dark:text-slate-400 block">{t.statusLabel}</span>
                  <div className="mt-1">
                    <select
                      value={selectedTicket.status}
                      disabled={isUpdatingStatus}
                      onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as TicketStatus)}
                      className="text-xs font-bold px-2 py-1 rounded-lg glass-input"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="dark:bg-[#101C35]">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5A657D] dark:text-slate-400 block">{t.priorityLabel}</span>
                  <span className="font-bold text-[#101C35] dark:text-slate-100 block mt-1">
                    {priorityMap[selectedTicket.priority]?.label || selectedTicket.priority}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5A657D] dark:text-slate-400 block">{t.categoryLabel}</span>
                  <span className="font-bold text-[#101C35] dark:text-slate-100 block mt-1 truncate">
                    {categoryMap[selectedTicket.category] || selectedTicket.category}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5A657D] dark:text-slate-400 block">
                    {t.conversationLangLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#101C35] dark:text-[#C9A96E] block mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
                    <span>{getConversationLangLabel(selectedTicket.conversationLanguage).short}</span>
                  </span>
                </div>
              </div>

              {/* Description box formatted with conversation language's text direction */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101C35] dark:text-slate-200">{t.descriptionLabel}</span>
                  <span className="text-[10px] font-mono text-[#5A657D] dark:text-slate-400 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded">
                    Conversation: {getConversationLangLabel(selectedTicket.conversationLanguage).short}
                  </span>
                </div>
                <div
                  dir={selectedTicket.conversationLanguage === 'en' ? 'ltr' : 'rtl'}
                  className="glass-card p-4 rounded-xl text-xs sm:text-sm text-[#101C35] dark:text-slate-100 leading-relaxed whitespace-pre-wrap font-sans shadow-2xs"
                >
                  {selectedTicket.description}
                </div>
              </div>

              {/* Attachments Section */}
              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#101C35] dark:text-slate-200 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>{t.attachmentsLabel}</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card text-xs font-semibold text-[#101C35] dark:text-slate-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <span>{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Metadata */}
              <div className="border-t border-slate-200/60 dark:border-white/10 pt-3 flex flex-wrap items-center justify-between text-[11px] text-[#5A657D] dark:text-slate-400 gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span>Created by: {selectedTicket.createdBy || 'Staff'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Logged: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#101C35] dark:bg-[#C9A96E] hover:bg-[#192b52] dark:hover:bg-[#d8be8d] text-white dark:text-[#0B1220] transition cursor-pointer"
                >
                  {t.closeModal}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
