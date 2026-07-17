// ============================================================
// app/pages/messages/index.tsx
// ============================================================
import { useState, useEffect, useRef } from "react";
import type { Route as MsgRoute } from "./+types/index";
import apiService, { type MessageThread, type Message } from "~/lib/api";

export async function clientLoader() {
  try {
    const response = await apiService.messages.threads();
    return { initialThreads: response.data || [] };
  } catch (error) {
    console.error("Failed to load threads:", error);
    return { initialThreads: [] };
  }
}

export default function MessagesPage({ loaderData }: MsgRoute.ComponentProps) {
  const { initialThreads } = loaderData as { initialThreads: MessageThread[] };
  
  const [threads, setThreads] = useState<MessageThread[]>(initialThreads);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [chat, setChat] = useState<Message[]>([]);
  const [msg, setMsg] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derived state
  const filteredThreads = threads.filter(t => 
    t.contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeThread = filteredThreads[activeIdx] || threads[activeIdx];
  const activeContact = activeThread?.contact;

  // 1. Fetch chat history when the active thread changes
  useEffect(() => {
    if (!activeContact) return;

    setIsLoadingChat(true);
    apiService.messages.thread(activeContact.id)
      .then(res => {
        setChat(res.data);
        // Optimistically clear unread count for this thread locally
        setThreads(prev => 
          prev.map(t => t.contact.id === activeContact.id ? { ...t, unread: 0 } : t)
        );
      })
      .catch(err => console.error("Failed to load chat:", err))
      .finally(() => setIsLoadingChat(false));
  }, [activeContact?.id]);

  // 2. Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // 3. Handle sending a new message
  const sendMessage = async () => {
    if (!msg.trim() || !activeContact || isSending) return;
    
    const textToSend = msg.trim();
    setMsg(""); // Clear input immediately for better UX
    setIsSending(true);

    try {
      const res = await apiService.messages.send({
        receiver_id: activeContact.id,
        body: textToSend,
      });

      // Append new message to chat
      setChat(prev => [...prev, res.data]);

      // Update the thread list to show the new last message
      setThreads(prev => 
        prev.map(t => 
          t.contact.id === activeContact.id 
            ? { ...t, last_message: res.data } 
            : t
        )
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      setMsg(textToSend); // Restore message on failure
    } finally {
      setIsSending(false);
    }
  };

  // Utility to format timestamps
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div style={{ height: "calc(100vh - 130px)" }} className="flex gap-4 font-sans">
      {/* Sidebar: Threads */}
      <div className="w-80 flex-shrink-0 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-lg shadow-slate-900/20">
        <div className="p-5 border-b border-slate-700/80 flex items-center justify-between bg-slate-800">
          <h3 className="font-semibold text-slate-100 text-lg tracking-tight">Messages</h3>
          <button className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 hover:text-blue-300 transition-all flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            New
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-700/80 bg-slate-800/50">
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
          {filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              {searchQuery ? "No matches found." : "No messages yet."}
            </div>
          ) : (
            filteredThreads.map((t, i) => {
              const isSelected = activeContact?.id === t.contact.id;
              return (
                <div 
                  key={t.contact.id}
                  className={`flex items-center gap-3 px-4 py-3.5 mx-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? "bg-blue-500/10 border border-blue-500/20" 
                      : "border border-transparent hover:bg-slate-700/30"
                  }`}
                  onClick={() => setActiveIdx(i)}
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
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Area: Chat Window */}
      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col shadow-lg shadow-slate-900/20 overflow-hidden relative">
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-700/80 flex items-center justify-between bg-slate-800/80 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-blue-500/20">
                    {activeContact.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-800 rounded-full"></div>
                </div>
                <div>
                  <p className="font-semibold text-slate-100">{activeContact.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{activeContact.role}</p>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/20 custom-scrollbar">
              {isLoadingChat ? (
                <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-3">
                  <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm">Loading history...</p>
                </div>
              ) : chat.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  </div>
                  <p className="text-sm font-medium">Say hello to {activeContact.name.split(" ")[0]}!</p>
                  <p className="text-xs">Send a message to start the conversation.</p>
                </div>
              ) : (
                chat.map((m) => {
                  // If the sender_id matches the active contact's ID, it's from them. Otherwise, it's mine.
                  const isMine = m.sender_id !== activeContact.id;
                  
                  return (
                    <div key={m.id} className={`flex ${isMine ? "flex-row-reverse" : "flex-row"} gap-2 items-end group`}>
                      {!isMine && (
                         <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mb-5">
                           {activeContact.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                         </div>
                      )}
                      <div className={`relative max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
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
            <div className="p-4 border-t border-slate-700/80 bg-slate-800">
              <div className="flex gap-2 items-end">
                <button className="p-3 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-xl transition-colors flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                </button>
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
                    <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-2">Press <span className="font-semibold text-slate-400">Enter</span> to send, <span className="font-semibold text-slate-400">Shift + Enter</span> for a new line</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-800/50">
            <div className="w-20 h-20 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-1">Your Messages</h3>
            <p className="text-sm">Select a conversation from the sidebar to start chatting.</p>
          </div>
        )}
      </div>

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