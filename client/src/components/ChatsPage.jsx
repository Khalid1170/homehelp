import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Search, Briefcase, User, ArrowLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JobChatModal from './JobChatModal';
import Navbar from './Navbar';

export default function ChatsPage() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'past'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(null);
  
  // Mobile responsive toggle view state
  const [showMobileChatWindow, setShowMobileChatWindow] = useState(false);

  // Extract authentication data smoothly once outside the hot return path
//   const { authToken, currentUserId } = useMemo(() => {
//     const token = localStorage.getItem('token');
//     if (!token) return { authToken: null, currentUserId: null };
//     try {
//       const payload = JSON.parse(atob(token.split('.')[1]));
//       return { authToken: token, currentUserId: payload.id || payload.user_id };
//     } catch (e) {
//       console.error("JWT token formatting evaluation failed:", e);
//       return { authToken: token, currentUserId: null };
//     }
//   }, []);

// Extract authentication data smoothly once outside the hot return path
  const { authToken, currentUserId } = useMemo(() => {
    const token = localStorage.getItem('token');
    if (!token) return { authToken: null, currentUserId: null };
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // 🕵️‍♂️ Temporary Debug Log: Open your browser console (F12) to see your exact token structure
      console.log("YOUR JWT PAYLOAD KEYS LOOK LIKE THIS:", payload);

      // Check for every common Flask-JWT identity key structure
      const extractedId = 
        payload.id || 
        payload.user_id || 
        payload.sub || 
        (typeof payload.identity === 'object' ? payload.identity.id : payload.identity);

      return { 
        authToken: token, 
        currentUserId: extractedId ? Number(extractedId) : null 
      };
    } catch (e) {
      console.error("JWT token formatting evaluation failed:", e);
      return { authToken: token, currentUserId: null };
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      if (!authToken) return;
      const res = await fetch('http://localhost:5000/api/chats', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        // Clean initial state focus assignment
        if (data.length > 0) {
          setSelectedJobId(data[0].job_id);
        }
      }
    } catch (err) {
      console.error("Error fetching inbox threads:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter items based on tab navigation & search query text
  const filteredChats = chats.filter(chat => {
    const matchesTab = activeTab === 'active' ? chat.is_active : !chat.is_active;
    const matchesSearch = chat.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          chat.other_party_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const selectedChatDetails = chats.find(c => c.job_id === selectedJobId);

  const handleSelectChat = (jobId) => {
    setSelectedJobId(jobId);
    setShowMobileChatWindow(true);
  };

  // Helper badge generator for managing active status indicators
  const renderStatusBadge = (status) => {
    const configurations = {
      pending: "bg-amber-50 text-amber-700 border-amber-200/60",
      accepted: "bg-blue-50 text-blue-700 border-blue-200/60",
      in_progress: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalization ${configurations[status] || 'bg-slate-50 text-slate-600'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <>
            <Navbar />

    <div className="flex h-screen bg-slate-50 overflow-hidden antialiased font-sans">
      
      {/* SIDEBAR: CHAT THREADS LIST */}
      <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 transition-transform duration-300 ${
        showMobileChatWindow ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Header Area */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors border border-transparent hover:border-slate-200/60"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">Message Inbox</h1>
            <div className="w-8 h-8" />
          </div>

          {/* Search Inputs */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search contracts or names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200/60 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
            />
          </div>

          {/* Segmented Filter Switches */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Active
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'past' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Past
            </button>
          </div>
        </div>

        {/* Dynamic Thread Feed Stack */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
          {loading ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Loading conversations...</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-8 text-center space-y-2 mt-4">
              <AlertCircle className="w-5 h-5 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">No conversations found here.</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isSelected = selectedJobId === chat.job_id;
              return (
                <div
                  key={chat.job_id}
                  onClick={() => handleSelectChat(chat.job_id)}
                  className={`p-4 cursor-pointer transition-all flex flex-col gap-2 relative border-l-4 ${
                    isSelected 
                      ? 'bg-blue-50/50 border-blue-600 shadow-inner-left' 
                      : 'hover:bg-slate-50/80 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 flex items-center gap-1.5">
                      <Briefcase className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
                      {chat.job_title}
                    </h4>
                    {renderStatusBadge(chat.job_status)}
                  </div>
                  
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{chat.other_party_name}</span>
                    </div>
                  </div>

                  <p className={`text-xs line-clamp-1 pl-5 ${isSelected ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                    {chat.last_message}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT DISPLAY VIEW WINDOW */}
      <div className={`flex-1 bg-slate-50 h-full flex flex-col relative ${
        !showMobileChatWindow ? 'hidden md:flex' : 'flex'
      }`}>
        {selectedJobId ? (
          <div className="w-full h-full bg-white flex flex-col shadow-xs">
            
            {/* Header Area */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3 md:gap-0 justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                {/* Back button visible strictly on mobile view breakpoints */}
                <button 
                  onClick={() => setShowMobileChatWindow(false)}
                  className="p-2 -ml-1 hover:bg-slate-100 rounded-xl text-slate-500 md:hidden transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">{selectedChatDetails?.job_title}</h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Chatting with <span className="text-slate-800 font-semibold">{selectedChatDetails?.other_party_name}</span>
                  </p>
                </div>
              </div>
              <div className="hidden sm:block">
                {renderStatusBadge(selectedChatDetails?.job_status)}
              </div>
            </div>

            {/* Embedded Live Messaging View Panel */}
            <div className="flex-1 overflow-hidden bg-slate-50">
              {authToken && currentUserId ? (
                <JobChatModal 
                  jobId={selectedJobId} 
                  token={authToken}
                  currentUserId={currentUserId}
                  isInline={true} 
                />
              ) : (
                <div className="p-4 text-center text-xs text-red-500">
                  Authentication failure. Please log in again.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Neutral Empty Selection Landing View Placeholder */
          <div className="text-center space-y-3 m-auto max-w-xs px-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/60 shadow-xs flex items-center justify-center mx-auto text-slate-400 animate-pulse">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 tracking-tight">Your Workspace Channels</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select an active workspace channel from your history queue to load direct message channels with workers or clients.
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}