import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  Search, 
  Briefcase, 
  User, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Inbox
} from 'lucide-react';
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
  const { authToken, currentUserId } = useMemo(() => {
    const token = localStorage.getItem('token');
    if (!token) return { authToken: null, currentUserId: null };
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      console.log("YOUR JWT PAYLOAD KEYS LOOK LIKE THIS:", payload);

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
    const matchesSearch = chat.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          chat.other_party_name?.toLowerCase().includes(searchQuery.toLowerCase());
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
      pending: "bg-amber-50/70 text-amber-700 border-amber-200/50",
      accepted: "bg-blue-50/70 text-blue-700 border-blue-200/50",
      in_progress: "bg-emerald-50/70 text-emerald-700 border-emerald-200/50",
    };
    return (
      <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded-md border uppercase select-none ${configurations[status] || 'bg-slate-50 text-slate-500 border-slate-200/60'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-700 antialiased font-sans overflow-hidden">
      
      {/* 🧭 Global Dashboard Top Navigation Row */}
      <Navbar />

      <div className="flex flex-1 h-full overflow-hidden relative">
        
        {/* ========================================== */}
        {/* 📂 SIDEBAR: INBOX CONVERSATIONS THREAD GRID */}
        {/* ========================================== */}
        <div className={`w-full md:w-80 lg:w-[380px] bg-white border-r border-slate-200/80 flex flex-col h-full shrink-0 z-20 transition-transform duration-300 ${
          showMobileChatWindow ? 'hidden md:flex' : 'flex'
        }`}>
          
          {/* Section Dynamic Header Content Area */}
          <div className="p-5 border-b border-slate-100 bg-white space-y-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-700 transition border border-slate-200/60 bg-white shadow-xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-indigo-600" />
                  Message Inbox
                </h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-tight uppercase mt-0.5">Manage Workspace Channels</p>
              </div>
            </div>

            {/* Premium Floating Search Input Box Context */}
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search contracts or names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/70 text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-hidden transition-all shadow-xs"
              />
            </div>

            {/* Custom Segmented Action Filter Navigation Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/20">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 text-xs font-black py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'active' 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/30' 
                    : 'text-slate-500 hover:text-slate-800 font-bold'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Active
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`flex-1 text-xs font-black py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'past' 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/30' 
                    : 'text-slate-500 hover:text-slate-800 font-bold'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Past
              </button>
            </div>
          </div>

          {/* Dynamic Feed Conversation Stack Pipeline */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white custom-scrollbar">
            {loading ? (
              <div className="p-12 text-center space-y-3">
                <div className="relative w-7 h-7 flex items-center justify-center mx-auto">
                  <div className="absolute inset-0 w-full h-full border-2 border-indigo-600/20 rounded-full"></div>
                  <div className="absolute inset-0 w-full h-full border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest animate-pulse">Syncing threads...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-10 text-center space-y-2.5 mt-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center mx-auto text-slate-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-400 font-bold max-w-[200px] mx-auto leading-relaxed">No conversations found matching this dashboard queue index.</p>
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
                        ? 'bg-indigo-50/40 border-indigo-600' 
                        : 'hover:bg-slate-50/60 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <h4 className="text-xs font-black text-slate-900 tracking-tight line-clamp-1 flex items-center gap-2">
                        <Briefcase className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        {chat.job_title}
                      </h4>
                      <div className="shrink-0">
                        {renderStatusBadge(chat.job_status)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className={isSelected ? 'text-slate-700' : 'text-slate-500'}>{chat.other_party_name}</span>
                    </div>

                    {chat.last_message && (
                      <p className={`text-xs line-clamp-1 pl-5 ${isSelected ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                        {chat.last_message}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* 💬 MAIN VIEW: SELECTED INTERACTIVE CHAT BOX */}
        {/* ========================================== */}
        <div className={`flex-1 bg-slate-50 h-full flex flex-col relative ${
          !showMobileChatWindow ? 'hidden md:flex' : 'flex'
        }`}>
          {selectedJobId ? (
            <div className="w-full h-full bg-white flex flex-col overflow-hidden">
              
              {/* Header Context Tracking Details Block */}
              <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3 md:gap-0 justify-between shrink-0 z-10 shadow-xs">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowMobileChatWindow(false)}
                    className="p-2 -ml-1 hover:bg-slate-50 border border-slate-200/60 bg-white shadow-xs rounded-xl text-slate-500 md:hidden transition-colors active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 tracking-tight leading-snug">{selectedChatDetails?.job_title}</h2>
                    <p className="text-[11px] text-slate-400 font-semibold tracking-tight mt-0.5">
                      Chatting with <span className="text-slate-700 font-black">{selectedChatDetails?.other_party_name}</span>
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  {renderStatusBadge(selectedChatDetails?.job_status)}
                </div>
              </div>

              {/* Embedded Sub-Panel Frame Block */}
              <div className="flex-1 overflow-hidden bg-slate-50">
                {authToken && currentUserId ? (
                  <JobChatModal 
                    jobId={selectedJobId} 
                    token={authToken}
                    currentUserId={currentUserId}
                    isInline={true} 
                  />
                ) : (
                  <div className="p-8 text-center text-xs font-bold text-rose-500 bg-white max-w-sm border border-rose-100 rounded-2xl mx-auto mt-20 shadow-xs">
                    Authentication mismatch error loop triggered. Please log into your profile again.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Neutral Standard Screen Blank State Display */
            <div className="text-center space-y-4 m-auto max-w-sm px-6 animate-[fadeIn_0.2s_ease-out]">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto text-indigo-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Your Workspace Channels</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Select an active workspace channel from your history thread queue to review contracts, confirm milestones, or exchange direct messages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}