
import React from 'react';
import { User, ConnectionItem } from '../types';
import { useConnections } from '../hooks/useConnections';
import { getOrgNamesFromEmails } from '../utils/emailDomains';
import { UserPlus, Search, UserCheck, X, Check, Trash2, Clock, Mail, ChevronDown, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConnectionsProps {
  currentUser: User;
}

const Connections: React.FC<ConnectionsProps> = ({ currentUser }) => {
  const { t } = useTranslation();
  const {
    activeTab,
    setActiveTab,
    inviteEmail,
    setInviteEmail,
    orgFilter,
    setOrgFilter,
    orgOptions,
    loading,
    message,
    data,
    handleSendInvite,
    handleAction,
    getActiveList
  } = useConnections({ currentUser });

  // Theme
  const isLight = currentUser.preferences?.uiConfig?.theme === 'LIGHT';
  const accentColor = currentUser.preferences?.uiConfig?.accentColor || 'blue';

  const cardBg = isLight ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm' : 'bg-[#0e0e10] border-white/5 hover:border-white/10';
  const textPrimary = isLight ? 'text-slate-900' : 'text-zinc-100';
  const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
  const inputBg = isLight ? 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-brand-500' : 'bg-black/20 border-white/5 text-zinc-300 placeholder:text-zinc-600 focus:bg-black/40 focus:border-brand-500/50';
  const currentUserOrgs = React.useMemo(() => {
    const emailOrgs = getOrgNamesFromEmails(currentUser.workMails);
    const dbOrgs = currentUser.orgNames || [];
    return Array.from(new Set([...emailOrgs, ...dbOrgs]));
  }, [currentUser.workMails, currentUser.orgNames]);
  const activeList = getActiveList().filter((item) => {
    if (orgFilter === 'ALL') return true;
    if (orgFilter === 'EXTERNAL') {
      const userOrgs = item.otherUser.orgNames || [];
      const lowerUserOrgs = userOrgs.map(o => o.toLowerCase());
      const lowerCurrentUserOrgs = currentUserOrgs.map(o => o.toLowerCase());
      return !lowerUserOrgs.some((org) => lowerCurrentUserOrgs.includes(org));
    }
    return (item.otherUser.orgNames || []).includes(orgFilter);
  });

  const renderCard = (item: ConnectionItem) => {
    const { otherUser, status, date, id } = item;
    const sameOrg = (otherUser.orgNames || []).some((org) => 
      currentUserOrgs.some(myOrg => myOrg.toLowerCase() === org.toLowerCase())
    );

    return (
      <div key={id} className={`${cardBg} p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in transition-all group`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={otherUser.avatarUrl || `https://ui-avatars.com/api/?name=${otherUser.displayName}`}
              alt={otherUser.displayName}
              className={`w-12 h-12 rounded-full border object-cover ${isLight ? 'border-white shadow-sm' : 'border-white/10'}`}
            />
            {status === 'CONNECTED' && (
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${isLight ? 'bg-emerald-500 border-white' : 'bg-emerald-500 border-[#0e0e10]'}`}></div>
            )}
          </div>
          <div>
            <h3 className={`font-bold text-sm transition-colors ${textPrimary} group-hover:text-${accentColor}-500`}>{otherUser.displayName}</h3>
            <div className={`flex flex-wrap items-center gap-2 text-xs mt-1 ${textSecondary}`}>
              <div className="flex items-center gap-1.5">
                <Mail size={12} />
                <span>{otherUser.email}</span>
              </div>
              
              {otherUser.orgNames && otherUser.orgNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {otherUser.orgNames.map((org) => {
                    const isMyOrg = currentUserOrgs.includes(org);
                    return (
                      <span 
                        key={org} 
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                          isMyOrg 
                            ? (isLight ? `bg-${accentColor}-50 text-${accentColor}-600 border-${accentColor}-200` : `bg-${accentColor}-500/10 text-${accentColor}-400 border-${accentColor}-500/20`)
                            : (isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/5 text-zinc-400 border-white/10')
                        }`}
                      >
                        <Building2 size={8} />
                        {org}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <p className={`text-[10px] mt-1.5 flex items-center gap-1 font-mono ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>
              <Clock size={10} />
              {status === 'CONNECTED' ? t('connections.since') : t('connections.date')}: {date}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {status === 'CONNECTED' && (
            <button
              onClick={() => {
                if (!sameOrg) handleAction(id, 'REMOVE');
              }}
              disabled={sameOrg}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium border rounded-lg transition-colors ${sameOrg ? (isLight ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white/5 text-zinc-600 border-white/10 cursor-not-allowed') : 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20'}`}
            >
              <Trash2 size={14} /> {sameOrg ? t('connections.actions.sameOrg') : t('connections.actions.remove')}
            </button>
          )}

          {status === 'SENT' && (
            <button
              onClick={() => handleAction(id, 'CANCEL')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium border rounded-lg transition-colors ${isLight ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' : 'text-zinc-400 bg-white/5 hover:bg-white/10 border-white/5'}`}
            >
              <X size={14} /> {t('connections.actions.cancel')}
            </button>
          )}

          {status === 'RECEIVED' && (
            <>
              <button
                onClick={() => handleAction(id, 'DECLINE')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium border rounded-lg transition-colors ${isLight ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' : 'text-zinc-400 bg-white/5 hover:bg-white/10 border-white/5'}`}
              >
                <X size={14} /> {t('connections.actions.decline')}
              </button>
              <button
                onClick={() => handleAction(id, 'ACCEPT')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-lg bg-${accentColor}-600 hover:bg-${accentColor}-500 shadow-${accentColor}-900/20`}
              >
                <Check size={14} /> {t('connections.actions.accept')}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header & Invite Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${textPrimary}`}>{t('connections.title')}</h1>
          <p className={`text-sm mt-1 ${textSecondary}`}>{t('connections.growNetwork')}</p>
        </div>

        <form 
          onSubmit={handleSendInvite}
          className={`p-1.5 rounded-xl border flex flex-col md:flex-row gap-2 relative ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e0e10] border-white/5'}`}
        >
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} size={16} />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={t('connections.searchPlaceholder')}
              className={`w-full pl-9 pr-4 py-2 rounded-lg border outline-none text-sm transition-all ${inputBg}`}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !inviteEmail}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${loading || !inviteEmail
                ? (isLight ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white/5 text-zinc-500 cursor-not-allowed')
                : (isLight ? `bg-${accentColor}-600 text-white hover:bg-${accentColor}-700 shadow-md` : 'bg-white text-black hover:bg-zinc-200')
              }`}
          >
            {loading ? t('connections.sending') : <><UserPlus size={14} /> {t('connections.connect')}</>}
          </button>

          {/* Notification Toast (Inline) */}
          {message && (
            <div className={`absolute top-full mt-2 left-0 right-0 p-3 rounded-lg text-xs font-medium flex items-center gap-2 border ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              } animate-fade-in z-10 backdrop-blur-md`}>
              {message.type === 'success' ? <Check size={12} /> : <X size={12} />}
              {message.text}
            </div>
          )}
        </form>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex p-1 border rounded-xl w-fit ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/5'}`}>
        {[
          { id: 'connections', label: t('connections.tabs.myConnections'), count: data.connections.length },
          { id: 'received', label: t('connections.tabs.received'), count: data.received.length },
          { id: 'sent', label: t('connections.tabs.sent'), count: data.sent.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
                ? (isLight ? `bg-slate-100 text-slate-900 shadow-sm border border-slate-200` : 'bg-[#0e0e10] text-white shadow-sm border border-white/5')
                : (isLight ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5')
              }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === tab.id
                  ? (isLight ? 'bg-white text-slate-600 shadow-sm' : 'bg-white/10 text-zinc-200')
                  : (isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-zinc-500')
                }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
        </div>

        {orgOptions.length > 0 && (
          <div className="relative">
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className={`pl-3 pr-8 py-2 text-xs font-bold outline-none appearance-none cursor-pointer rounded-lg border transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0e0e10] border-white/10 text-zinc-300'}`}
            >
              <option className={isLight ? 'bg-white' : 'bg-[#18181b]'} value="ALL">{t('connections.filter.allOrgs')}</option>
              {orgOptions.map((org) => (
                <option key={org} className={isLight ? 'bg-white' : 'bg-[#18181b]'} value={org}>{org}</option>
              ))}
              <option className={isLight ? 'bg-white' : 'bg-[#18181b]'} value="EXTERNAL">{t('connections.filter.external')}</option>
            </select>
            <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {activeList.length === 0 ? (
          <div className={`text-center py-20 rounded-xl border border-dashed ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e10] border-white/5'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isLight ? 'bg-slate-50 text-slate-400' : 'bg-white/5 text-zinc-600'}`}>
              <UserCheck size={24} />
            </div>
            <h3 className={`text-sm font-bold ${textPrimary}`}>
              {activeTab === 'connections' && t('connections.empty.connections')}
              {activeTab === 'received' && t('connections.empty.received')}
              {activeTab === 'sent' && t('connections.empty.sent')}
            </h3>
            <p className={`text-xs mt-1 ${textSecondary}`}>
              {activeTab === 'connections' && t('connections.empty.connectionsDesc')}
              {activeTab === 'received' && t('connections.empty.receivedDesc')}
              {activeTab === 'sent' && t('connections.empty.sentDesc')}
            </p>
          </div>
        ) : (
          activeList.map(item => renderCard(item))
        )}
      </div>
    </div>
  );
};

export default Connections;
