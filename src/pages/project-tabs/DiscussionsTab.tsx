
import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import {
    Shield, Loader2, MessageSquare, Send
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProjectMessage, ChannelType, User, Project } from '../../types';
import { useChat } from '../../hooks/useChat';

// URL Regex for basic detection
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

interface DiscussionsTabProps {
    project: Project;
    currentUser: User;
    canAccessAdminChannel: boolean;
    isReadOnly?: boolean;
}

const DiscussionsTab: React.FC<DiscussionsTabProps> = ({
    project,
    currentUser,
    canAccessAdminChannel,
    isReadOnly
}) => {
    const { t } = useTranslation();
    const [selectedChannel, setSelectedChannel] = useState<ChannelType>('GENERAL');

    const {
        messages: chatMessages,
        isLoading,
        sendMessage,
        loadMore,
        hasMore: hasMoreMessages,
        isFetchingMore
    } = useChat(project.id, selectedChannel, currentUser.id);

    const [newMessage, setNewMessage] = useState('');
    const isDecrypting = isLoading; // Map loading state to decryption UI for better UX

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef<number>(0);
    const textInputRef = useRef<HTMLInputElement>(null);

    // Theme
    const isLight = currentUser.preferences?.uiConfig?.theme === 'LIGHT';
    const accentColor = currentUser.preferences?.uiConfig?.accentColor || 'blue';

    const containerBg = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e0e10] border-white/5 shadow-sm';
    const sidebarBg = isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#18181b] border-white/5';
    const headerBg = isLight ? 'bg-white border-slate-100' : 'bg-[#0e0e10] border-white/5';
    const chatAreaBg = isLight ? 'bg-white' : 'bg-[#0e0e10]';
    const textPrimary = isLight ? 'text-slate-900' : 'text-zinc-200';
    const textSecondary = isLight ? 'text-slate-500' : 'text-zinc-500';
    const inputBg = isLight ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white placeholder:text-slate-400' : 'bg-[#18181b] border-white/5 text-white placeholder:text-zinc-600';

    // Map user IDs to User objects for quick lookup
    const userMap = useMemo(() => {
        const map = new Map<string, User>();
        project.members.forEach(m => {
            if (m.user) map.set(m.userId, m.user);
        });
        return map;
    }, [project.members]);

    useEffect(() => {
        if (!isDecrypting && !isFetchingMore && chatMessages.length > 0) {
            scrollToBottom();
        }
    }, [isDecrypting]);

    useLayoutEffect(() => {
        if (isFetchingMore && scrollContainerRef.current) {
            const newHeight = scrollContainerRef.current.scrollHeight;
            const diff = newHeight - prevScrollHeightRef.current;
            if (diff > 0) {
                scrollContainerRef.current.scrollTop = diff;
            }
        }
    }, [chatMessages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight } = e.currentTarget;
        if (scrollTop === 0 && hasMoreMessages && !isDecrypting) {
            prevScrollHeightRef.current = scrollHeight;
            loadMore();
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isReadOnly) return;
        sendMessage(newMessage);
        setNewMessage('');
        setTimeout(scrollToBottom, 50);
    };

    const renderMessageContent = (content: string) => {
        const parts = content.split(URL_REGEX);
        return parts.map((part, i) => {
            if (part.match(URL_REGEX)) {
                return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={`text-${accentColor}-500 hover:underline break-all`}>{part}</a>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className={`flex flex-col lg:flex-row h-[600px] rounded-2xl border overflow-hidden animate-fade-in ${containerBg}`}>
            {/* Channels List */}
            <div className={`w-full lg:w-64 border-r flex flex-col shrink-0 ${sidebarBg}`}>
                <div className={`p-4 font-bold text-xs uppercase tracking-wider ${textSecondary}`}>{t('project.discussions.channels.title')}</div>
                <div className="flex-1 p-2 space-y-1 overflow-y-auto">
                    <button
                        onClick={() => setSelectedChannel('GENERAL')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${selectedChannel === 'GENERAL'
                            ? (isLight ? `bg-white text-${accentColor}-700 shadow-sm border border-slate-200` : 'bg-white/10 text-white shadow-sm border border-white/5')
                            : (isLight ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300')
                            }`}
                    >
                        <span className="text-lg leading-none opacity-50">#</span> {t('project.discussions.channels.general')}
                    </button>
                    {canAccessAdminChannel && (
                        <button
                            onClick={() => setSelectedChannel('ADMIN')}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${selectedChannel === 'ADMIN'
                                ? (isLight ? `bg-white text-${accentColor}-700 shadow-sm border border-slate-200` : 'bg-white/10 text-white shadow-sm border border-white/5')
                                : (isLight ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300')
                                }`}
                        >
                            <Shield size={14} /> {t('project.discussions.channels.adminOnly')}
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col min-w-0 ${chatAreaBg}`}>
                {/* Chat Header */}
                <div className={`h-14 border-b flex items-center px-6 shrink-0 ${headerBg}`}>
                    <div className={`font-bold flex items-center gap-2 ${textPrimary}`}>
                        {selectedChannel === 'ADMIN' ? <Shield size={16} className="text-purple-500" /> : <span className={textSecondary}>#</span>}
                        {selectedChannel === 'ADMIN' ? t('project.discussions.channels.adminDiscussion') : t('project.discussions.channels.generalChat')}
                    </div>
                </div>

                {/* Messages */}
                <div
                    className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth"
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                >
                    {isDecrypting && (
                        <div className={`flex justify-center py-4 text-xs font-medium flex items-center gap-2 ${textSecondary}`}>
                            <Loader2 size={14} className="animate-spin" /> {t('project.discussions.messages.decrypting')}
                        </div>
                    )}

                    {!isDecrypting && chatMessages.length === 0 && (
                        <div className={`flex flex-col items-center justify-center h-full space-y-3 ${textSecondary}`}>
                            <MessageSquare size={48} strokeWidth={1} />
                            <p className="font-medium text-sm">{t('project.discussions.messages.empty')}</p>
                        </div>
                    )}

                    {chatMessages.map((msg, index) => {
                        const isMe = msg.senderId === currentUser.id;
                        const sender = userMap.get(msg.senderId);
                        const showHeader = index === 0 || chatMessages[index - 1].senderId !== msg.senderId || (new Date(msg.timestamp).getTime() - new Date(chatMessages[index - 1].timestamp).getTime() > 300000); // 5 min gap

                        return (
                            <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''} group`}>
                                <div className="flex-shrink-0 w-8">
                                    {showHeader ? (
                                        <img
                                            src={sender?.avatarUrl || `https://ui-avatars.com/api/?name=${sender?.displayName}`}
                                            className={`w-8 h-8 rounded-full border object-cover ${isLight ? 'border-white shadow-sm' : 'border-white/10'}`}
                                            alt={sender?.displayName}
                                        />
                                    ) : <div className="w-8" />}
                                </div>

                                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    {showHeader && (
                                        <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                            <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>{sender?.displayName}</span>
                                            <span className={`text-[10px] ${textSecondary}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    )}
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${isMe
                                        ? `bg-${accentColor}-600 text-white rounded-tr-none`
                                        : isLight
                                            ? 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none'
                                            : 'bg-white/10 border border-white/5 text-zinc-200 rounded-tl-none'
                                        }`}>
                                        {renderMessageContent(msg.content)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className={`p-4 border-t shrink-0 ${headerBg}`}>
                    <form onSubmit={handleSendMessage} className="relative flex gap-2">
                        <input
                            ref={textInputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={isReadOnly ? t('project.discussions.messages.locked') : t('project.discussions.messages.placeholder', { channel: selectedChannel === 'GENERAL' ? 'general' : 'admin' })}
                            disabled={isReadOnly}
                            className={`w-full pl-5 pr-14 py-3.5 rounded-xl border focus:outline-none focus:border-${accentColor}-500 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${inputBg}`}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || isReadOnly}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all disabled:opacity-50 bg-${accentColor}-600 text-white hover:bg-${accentColor}-500`}
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DiscussionsTab;
