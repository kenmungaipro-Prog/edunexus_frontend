// ============================================================
// app/pages/messages/index.tsx
// ============================================================
import { useState, useEffect, useRef } from "react";
import type { Route as MsgRoute } from "./+types/index";
import { apiService, type MessageThread, type Message, type MessageContact } from "~/lib/api";

export async function clientLoader() {
  try {
    const response = await apiService.messages.threads();
    return { initialThreads: response.data || [], initialThreadsError: "" };
  } catch (error) {
    console.error("Failed to load threads:", error);
    return { initialThreads: [], initialThreadsError: "Unable to load conversations. Please try again." };
  }
}

export default function MessagesPage({ loaderData }: MsgRoute.ComponentProps) {
  const { initialThreads, initialThreadsError } = loaderData as {
    initialThreads: MessageThread[];
    initialThreadsError: string;
  };
  
  const [threads, setThreads] = useState<MessageThread[]>(initialThreads);
  const [activeContact, setActiveContact] = useState<MessageContact | null>(() => initialThreads[0]?.contact ?? null);
  const [chat, setChat] = useState<Message[]>([]);
  const [msg, setMsg] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [threadsError, setThreadsError] = useState(initialThreadsError);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredThreads = threads.filter(t =>
    t.contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!activeContact) return;

    let cancelled = false;
    const loadConversation = async () => {
      try {
        const [conversation, latestThreads] = await Promise.all([
          apiService.messages.thread(activeContact.id),
          apiService.messages.threads(),
        ]);
        if (cancelled) return;
        setChat(conversation.data);
        setThreads(latestThreads.data.map(thread => (
          thread.contact.id === activeContact.id ? { ...thread, unread: 0 } : thread
        )));
        setThreadsError("");
        setChatError("");
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load chat:", error);
          setThreadsError("Unable to refresh your conversation list.");
          setChatError("Unable to load this conversation. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoadingChat(false);
      }
    };

    setIsLoadingChat(true);
    void loadConversation();
    const interval = window.setInterval(() => void loadConversation(), 10000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeContact?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    if (!showNewConversation) return;

    setIsLoadingContacts(true);
    setContactsError("");
    apiService.messages.contacts()
      .then(response => setContacts(response.data))
      .catch(error => {
        console.error("Failed to load message contacts:", error);
        setContactsError("Unable to load school users. Please try again.");
      })
      .finally(() => setIsLoadingContacts(false));
  }, [showNewConversation]);

  const sendMessage = async () => {
    if (!msg.trim() || !activeContact || isSending) return;
    
    const textToSend = msg.trim();
    setIsSending(true);
    setChatError("");

    try {
      const res = await apiService.messages.send({
        receiver_id: activeContact.id,
        body: textToSend,
      });

      setChat(prev => [...prev, res.data]);
      setMsg("");
      const updatedThread: MessageThread = {
        contact: activeContact,
        last_message: res.data,
        unread: 0,
      };
      setThreads(prev => [updatedThread, ...prev.filter(thread => thread.contact.id !== activeContact.id)]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setChatError("Message could not be sent. Your text is still here; please retry.");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="relative h-[calc(100vh-110px)] sm:h-[calc(100vh-130px)] flex gap-4 font-sans">
      {/* Sidebar: Threads */}
      <div className={`w-full md:w-80 flex-shrink-0 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-lg shadow-slate-900/20 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 sm:p-5 border-b border-slate-700/80 flex items-center justify-between bg-slate-800">
          <h3 className="font-semibold text-slate-100 text-lg tracking-tight">Messages</h3>
          <button onClick={() => setShowNewConversation(true)} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 hover:text-blue-300 transition-all flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            New
          </button>
        </div>
        
        <div className="p-3 sm:p-4 border-b border-slate-700/80 bg-slate-800/50">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all" 
              placeholder="Search conversations..." 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {threadsError ? (
            <div role="alert" className="p-5 text-center text-sm text-red-300">{threadsError}</div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              {searchQuery ? "No matches found." : "No messages yet."}
            </div>
          ) : (
            filteredThreads.map(t => {
              const isSelected = activeContact?.id === t.contact.id;
              return (
                <button
                  key={t.contact.id}
                  type="button"
                  className={`flex items-center gap-3 px-4 py-3.5 mx-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? "bg-blue-500/10 border border-blue-500/20" 
                      : "border border-transparent hover:bg-slate-700/30"
                  }`}
                  onClick={() => {
                    setActiveContact(t.contact);
                    if (activeContact?.id !== t.contact.id) setChat([]);
                    setChatError("");
                    setMobileShowChat(true);
                  }}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm ${
                    isSelected ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300"
                  }`}>
                    {t.contact.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <p className={`text-sm truncate ${t.unread > 0 ? "font-bold text-slate-100" : "font-medium text-slate-200"}`}>
                        {t.contact.name}
                      </p>
                      <span className="text-[11px] text-slate-500 flex-shrink-0 ml-2">
                        {t.last_message ? formatTime(t.last_message.created_at) : ''}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${t.unread > 0 ? "text-slate-300 font-medium" : "text-slate-500"}`}>
                      {t.last_message?.body || "No messages yet"}
                    </p>
                  </div>
                  {t.unread > 0 && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm shadow-blue-500/30">
                      {t.unread}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Area: Chat Window */}
      <div className={`flex-1 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col shadow-lg shadow-slate-900/20 overflow-hidden relative ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-700/80 flex items-center justify-between bg-slate-800/80 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
                  aria-label="Back to threads"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-blue-500/20">
                    {activeContact.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-100 text-sm sm:text-base">{activeContact.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{activeContact.role}</p>
                </div>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-900/20 custom-scrollbar">
              {chatError && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{chatError}</p>}
              {isLoadingChat ? (
                <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-3">
                  <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm">Loading history...</p>
                </div>
              ) : chat.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 p-4 text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  </div>
                  <p className="text-sm font-medium">Say hello to {activeContact.name.split(" ")[0]}!</p>
                  <p className="text-xs">Send a message to start the conversation.</p>
                </div>
              ) : (
                chat.map((m) => {
                  const isMine = m.sender_id !== activeContact.id;
                  
                  return (
                    <div key={m.id} className={`flex ${isMine ? "flex-row-reverse" : "flex-row"} gap-2 items-end group`}>
                      {!isMine && (
                         <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mb-5">
                           {activeContact.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                         </div>
                      )}
                      <div className={`relative max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                        isMine 
                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-blue-900/20" 
                          : "bg-slate-700 text-slate-100 rounded-bl-sm border border-slate-600/50"
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{m.body}</p>
                        <p className={`text-[10px] mt-1.5 flex items-center gap-1 ${isMine ? "text-blue-100/70 justify-end" : "text-slate-400"}`}>
                          {formatTime(m.created_at)}
                          {isMine && m.read_at && (
                             <svg className="w-3 h-3 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {/* Invisible element to anchor scroll */}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Message Input Form */}
            <div className="p-3 sm:p-4 border-t border-slate-700/80 bg-slate-800">
              <div className="flex gap-2 items-end">
                <textarea
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none max-h-32 custom-scrollbar"
                  placeholder="Type your message..."
                  rows={1}
                  style={{ minHeight: "46px" }}
                />
                <button 
                  onClick={sendMessage}
                  disabled={!msg.trim() || isSending}
                  className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0 flex items-center justify-center"
                >
                  {isSending ? (
                     <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                  ) : (
                    <svg className="w-5 h-5 ml-0.5 sm:ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-2 hidden sm:block">Press <span className="font-semibold text-slate-400">Enter</span> to send, <span className="font-semibold text-slate-400">Shift + Enter</span> for a new line</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-800/50 p-6 text-center">
            <div className="w-20 h-20 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-1">Your Messages</h3>
            <p className="text-sm">Select a conversation or start a new message with someone at your school.</p>
          </div>
        )}
      </div>

      {showNewConversation && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="new-message-title">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
              <h2 id="new-message-title" className="font-semibold text-slate-100">New message</h2>
              <button type="button" onClick={() => setShowNewConversation(false)} className="text-slate-400 hover:text-white" aria-label="Close">✕</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-3">
              {isLoadingContacts ? (
                <p className="p-5 text-center text-sm text-slate-400">Loading school users...</p>
              ) : contactsError ? (
                <p role="alert" className="p-5 text-center text-sm text-red-300">{contactsError}</p>
              ) : contacts.length === 0 ? (
                <p className="p-5 text-center text-sm text-slate-400">There are no other active users in your school.</p>
              ) : contacts.map(contact => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => {
                    setActiveContact(contact);
                    if (activeContact?.id !== contact.id) setChat([]);
                    setMsg("");
                    setChatError("");
                    setShowNewConversation(false);
                    setMobileShowChat(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-slate-700/60"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-slate-200">
                    {contact.name.split(" ").map(part => part[0]).join("").substring(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-100">{contact.name}</span>
                    <span className="block text-xs capitalize text-slate-400">{contact.role}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global styles for custom scrollbar to match the dark aesthetic */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}