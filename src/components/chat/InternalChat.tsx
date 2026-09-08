import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  Lock,
  Send,
  Paperclip,
  ShieldCheck,
  Search,
  CheckCheck,
  FileText,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const InternalChat: React.FC = () => {
  const {
    chatChannels,
    chatMessages,
    activeChatChannelId,
    setActiveChatChannelId,
    activeDirectUserId,
    setActiveDirectUserId,
    teamMembers,
    currentUser,
    sendChatMessage,
    securityStatus
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [searchMember, setSearchMember] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeChatChannelId, activeDirectUserId]);

  const activeChannel = chatChannels.find(c => c.id === activeChatChannelId);
  const activeDirectUser = teamMembers.find(m => m.id === activeDirectUserId);

  // Filter messages for current channel or private conversation
  const currentMessages = chatMessages.filter(msg => {
    if (activeDirectUserId) {
      return (
        (msg.senderId === currentUser.id && msg.receiverId === activeDirectUserId) ||
        (msg.senderId === activeDirectUserId && msg.receiverId === currentUser.id)
      );
    }
    return msg.channelId === activeChatChannelId;
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() && !selectedFile) return;

    try {
      await sendChatMessage(inputMessage.trim() || 'ارسال فایل ضمیمه', selectedFile || undefined);
      setInputMessage('');
      setSelectedFile(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'ارسال پیام ناموفق بود.');
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs animate-in fade-in">
      {/* Sidebar: Channels & Direct Messages */}
      <div className="w-full md:w-80 border-l border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        {/* Top Header of Chat Sidebar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              <span>پیام‌رسان سازمانی پست بانک</span>
            </h3>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Lock className="w-2.5 h-2.5" />
              <span>ارتباط امن</span>
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchMember}
              onChange={e => setSearchMember(e.target.value)}
              placeholder="جستجوی کانال یا همکار..."
              className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Group Channels */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              کانال‌های گروهی پروژه
            </div>
            <div className="space-y-1">
              {chatChannels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => {
                    setActiveChatChannelId(channel.id);
                    setActiveDirectUserId(null);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-right text-xs transition-colors ${
                    !activeDirectUserId && activeChatChannelId === channel.id
                      ? 'bg-teal-700 text-white font-bold shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Users className="w-4 h-4 shrink-0 opacity-80" />
                    <span className="truncate">{channel.name}</span>
                  </div>
                  <span className="text-[10px] opacity-70 shrink-0 font-mono">
                    {channel.membersCount} نفر
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Direct 1-on-1 Messages */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              گفتگوی خصوصی با اعضای تیم
            </div>
            <div className="space-y-1">
              {teamMembers
                .filter(m => m.id !== currentUser.id)
                .filter(m => m.name.toLowerCase().includes(searchMember.toLowerCase()))
                .map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setActiveDirectUserId(member.id);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-right text-xs transition-colors ${
                      activeDirectUserId === member.id
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="relative">
                        <img src={member.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                        <span
                          className={`absolute bottom-0 left-0 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
                            member.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <div className="truncate text-right">
                        <p className="truncate font-semibold">{member.name}</p>
                        <p className="text-[10px] opacity-70 truncate">{member.role}</p>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Thread Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
        {/* Thread Header */}
        <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/30 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            {activeDirectUser ? (
              <div className="flex items-center gap-2.5">
                <img src={activeDirectUser.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {activeDirectUser.name}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {activeDirectUser.role} | {activeDirectUser.isOnline ? 'آنلاین' : 'آخرین بازدید اخیراً'}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {activeChannel?.name || 'کانال گفتگو'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {activeChannel?.description}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>پروتکل رمزنگاری: {securityStatus.cipherSuite}</span>
          </div>
        </div>

        {/* Message Bubble Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
              <Lock className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                گفتگوی امن سازمانی
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                فضای اختصاصی گفتگو و تبادل فایل بین همکاران و اعضای کارگروه‌های پروژه‌های پست بانک ایران.
              </p>
            </div>
          ) : (
            currentMessages.map(msg => {
              const isMine = msg.senderId === currentUser.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMine ? 'justify-start flex-row-reverse' : 'justify-start'}`}
                >
                  <img
                    src={msg.senderAvatar}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs ${
                      isMine
                        ? 'bg-teal-700 text-white rounded-br-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs'
                    }`}
                  >
                    {!isMine && (
                      <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 mb-1">
                        {msg.senderName}
                      </div>
                    )}
                    <p className="leading-relaxed break-words">{msg.text}</p>

                    {msg.attachment && (
                      <div className="mt-2 p-2 rounded-xl bg-black/10 dark:bg-white/10 flex items-center gap-2 text-[11px]">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="truncate">{msg.attachment.name}</span>
                        <span className="text-[9px] opacity-70 shrink-0 font-mono">
                          {msg.attachment.size}
                        </span>
                      </div>
                    )}

                    <div
                      className={`flex items-center justify-end gap-1.5 text-[9px] mt-1.5 ${
                        isMine ? 'text-teal-200' : 'text-slate-400'
                      }`}
                    >
                      <span className="font-mono">{msg.timestamp}</span>
                      <span title={`هش امضای امن: ${msg.integrityHash}`}>
                        <Lock className="w-2.5 h-2.5 opacity-80 inline" />
                      </span>
                      {isMine && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
          {selectedFile && (
            <div className="mb-2 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-between text-xs text-teal-800 dark:text-teal-200">
              <span className="truncate">ضمیمه: {selectedFile.name} ({selectedFile.size})</span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-teal-600 hover:text-teal-800 font-bold ml-2"
              >
                حذف
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors">
              <Paperclip className="w-4 h-4" />
              <input
                type="file"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile({
                      name: file.name,
                      size: `${(file.size / 1024).toFixed(1)} KB`,
                      type: file.type
                    });
                  }
                }}
              />
            </label>

            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder={
                activeDirectUser
                  ? `پیام خصوصی رمزنگاری‌شده به ${activeDirectUser.name}...`
                  : `ارسال پیام در کانال ${activeChannel?.name}...`
              }
              className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />

            <button
              type="submit"
              className="p-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-xs transition-colors"
              title="ارسال پیام"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
