
import React from 'react';
import { User, ConnectionItem } from '../types';
import { useConnections } from '../hooks/useConnections';
import { UserPlus, Search, UserCheck, X, Check, Trash2, Clock, Mail } from 'lucide-react';

interface ConnectionsProps {
  currentUser: User;
}

const Connections: React.FC<ConnectionsProps> = ({ currentUser }) => {
  const {
    activeTab,
    setActiveTab,
    inviteEmail,
    setInviteEmail,
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

  const renderCard = (item: ConnectionItem) => {
    const { otherUser, status, date, id } = item;

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
            <div className={`flex items-center gap-1.5 text-xs ${textSecondary}`}>
              <Mail size={12} />
              <span>{otherUser.email}</span>
            </div>
            <p className={`text-[10px] mt-1 flex items-center gap-1 font-mono ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>
              <Clock size={10} />
              {status === 'CONNECTED' ? 'Since' : 'Date'}: {date}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {status === 'CONNECTED' && (
            <button
              onClick={() => handleAction(id, 'REMOVE')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors"
            >
              <Trash2 size={14} /> Remove
            </button>
          )}

          {status === 'SENT' && (
            <button
              onClick={() => handleAction(id, 'CANCEL')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium border rounded-lg transition-colors ${isLight ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' : 'text-zinc-400 bg-white/5 hover:bg-white/10 border-white/5'}`}
            >
              <X size={14} /> Cancel Request
            </button>
          )}

          {status === 'RECEIVED' && (
            <>
              <button
                onClick={() => handleAction(id, 'DECLINE')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium border rounded-lg transition-colors ${isLight ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' : 'text-zinc-400 bg-white/5 hover:bg-white/10 border-white/5'}`}
              >
                <X size={14} /> Decline
              </button>
              <button
                onClick={() => handleAction(id, 'ACCEPT')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-lg bg-${accentColor}-600 hover:bg-${accentColor}-500 shadow-${accentColor}-900/20`}
              >
                <Check size={14} /> Accept
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
          <h1 className={`text-2xl font-bold tracking-tight ${textPrimary}`}>Connections</h1>
          <p className={`text-sm mt-1 ${textSecondary}`}>Grow your professional network</p>
        </div>

        <div className={`p-1.5 rounded-xl border flex flex-col md:flex-row gap-2 relative ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e0e10] border-white/5'}`}>
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} size={16} />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email to connect..."
              className={`w-full pl-9 pr-4 py-2 rounded-lg border outline-none text-sm transition-all ${inputBg}`}
            />
          </div>
          <button
            onClick={handleSendInvite}
            disabled={loading || !inviteEmail}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${loading || !inviteEmail
                ? (isLight ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white/5 text-zinc-500 cursor-not-allowed')
                : (isLight ? `bg-${accentColor}-600 text-white hover:bg-${accentColor}-700 shadow-md` : 'bg-white text-black hover:bg-zinc-200')
              }`}
          >
            {loading ? 'Sending...' : <><UserPlus size={14} /> Connect</>}
          </button>

          {/* Notification Toast (Inline) */}
          {message && (
            <div className={`absolute top-full mt-2 left-0 right-0 p-3 rounded-lg text-xs font-medium flex items-center gap-2 border ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              } animate-fade-in z-10 backdrop-blur-md`}>
              {message.type === 'success' ? <Check size={12} /> : <X size={12} />}
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex p-1 border rounded-xl w-fit ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/5'}`}>
        {[
          { id: 'connections', label: 'My Connections', count: data.connections.length },
          { id: 'received', label: 'Received', count: data.received.length },
          { id: 'sent', label: 'Sent', count: data.sent.length }
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

      {/* List */}
      <div className="space-y-3">
        {getActiveList().length === 0 ? (
          <div className={`text-center py-20 rounded-xl border border-dashed ${isLight ? 'bg-white border-slate-200' : 'bg-[#0e0e10] border-white/5'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isLight ? 'bg-slate-50 text-slate-400' : 'bg-white/5 text-zinc-600'}`}>
              <UserCheck size={24} />
            </div>
            <h3 className={`text-sm font-bold ${textPrimary}`}>
              {activeTab === 'connections' && "No connections yet"}
              {activeTab === 'received' && "No pending requests"}
              {activeTab === 'sent' && "No sent invitations"}
            </h3>
            <p className={`text-xs mt-1 ${textSecondary}`}>
              {activeTab === 'connections' && "Start growing your network by inviting colleagues."}
              {activeTab === 'received' && "Incoming connection requests will appear here."}
              {activeTab === 'sent' && "Requests you send will be listed here."}
            </p>
          </div>
        ) : (
          getActiveList().map(item => renderCard(item))
        )}
      </div>
    </div>
  );
};

export default Connections;
