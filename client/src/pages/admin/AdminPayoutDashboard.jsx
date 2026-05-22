import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminTopbar from './AdminTopbar';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Search, 
  ShieldAlert,
  Loader2,
  Calendar,
  CreditCard,
  TrendingUp,
  ArrowLeft,
  LayoutDashboard
} from 'lucide-react';

export default function AdminPayoutDashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  
  // Platform Transaction Data Feeds
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | completed
  const [processingId, setProcessingId] = useState(null);

  const fetchPayoutRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/admin/payout-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        if (res.status === 403) throw new Error('Access denied. Administrator clearance mandatory.');
        throw new Error('Failed to retrieve systemic payout ledger.');
      }
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPayoutRequests();
  }, [token]);

  const handleApprovePayout = async (requestId) => {
    if (!window.confirm(`Confirm systematic authorization for payout request #${requestId}?`)) return;
    
    setProcessingId(requestId);
    try {
      const res = await fetch(`http://localhost:5000/admin/payout-requests/${requestId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Execution engine encountered an approval failure.');

      alert('Payout state committed. Balances updated successfully.');
      
      // Hot reload matrix rows cleanly
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'completed', processed_at: new Date().toISOString() } 
          : req
      ));
    } catch (err) {
      alert(`Approval Exception: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Telemetry Metric Calculations
  const totalPendingVolume = requests
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const totalSettledVolume = requests
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  // Filtering Matrix Logic
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      String(req.worker_id).includes(searchTerm) ||
      String(req.id).includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 🔄 LOADING BOUNDARY LAYOUT
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs font-bold tracking-widest uppercase text-slate-500">Extracting Ledger Balance Pipeline...</p>
        </div>
      </div>
    );
  }

  // 🛡️ SECURITY / ERROR BOUNDARY LAYOUT
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        <AdminTopbar logout={logout} navigate={navigate} fetchAdminData={fetchPayoutRequests} />
        <main className="max-w-xl mx-auto my-16 p-6 bg-slate-900 border border-red-500/20 rounded-2xl text-center shadow-2xl">
          <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2 animate-pulse" />
          <h3 className="font-bold text-white text-lg">Security Exception Logs</h3>
          <p className="text-xs text-red-400 font-medium mt-2 font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800">{error}</p>
          <button onClick={fetchPayoutRequests} className="mt-5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer border border-slate-700">
            Re-Authenticate Ledger Pipeline
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      
      {/* 🔓 Global System Header Block */}
      <AdminTopbar logout={logout} navigate={navigate} fetchAdminData={fetchPayoutRequests} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* 🧭 NEW NAVIGATION HEADER BRIDGE */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black tracking-widest bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-md uppercase">
              Financial Architecture
            </span>
            <h1 className="text-2xl font-black text-white mt-2 tracking-tight">System Payout Ledger</h1>
            <p className="text-xs text-slate-500 font-medium">Verify, process, and clear active specialist transaction queues</p>
          </div>

          <button 
            onClick={() => navigate('/admin/dashboard')} // 👈 Adjust string path matching your route config
            className="group flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition shadow-lg cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            <span>Back to Core Systems</span>
          </button>
        </section>

        {/* 📊 Section 1: Financial Telemetry Ledger Aggregates */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pending Escrow Queue</span>
              <span className="text-2xl font-black text-white mt-0.5 block">£{totalPendingVolume.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Disbursed Payouts</span>
              <span className="text-2xl font-black text-emerald-400 mt-0.5 block">£{totalSettledVolume.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">System Volume Load</span>
              <span className="text-2xl font-black text-white mt-0.5 block">{requests.length} Requests</span>
            </div>
          </div>
        </section>

        {/* 🛠️ Section 2: Control Filter Switchboard */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search by worker info, ID key, or ledger token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-950 transition"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            {['all', 'pending', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-xs font-bold px-4 py-2.5 rounded-xl border capitalize transition w-full md:w-auto cursor-pointer whitespace-nowrap ${
                  statusFilter === status 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/10' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                {status} Requests
              </button>
            ))}
          </div>
        </div>

        {/* 📋 Section 3: Master Data Stream Table Panel */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead className="bg-slate-950 text-xs text-slate-500 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-4">Transfer ID</th>
                  <th className="p-4">Worker Identification</th>
                  <th className="p-4">Method Parameters</th>
                  <th className="p-4">Requested Date</th>
                  <th className="p-4">Volume Amount</th>
                  <th className="p-4 text-right">Process Action Overrides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-500 italic font-normal">
                      No matching payout logs localized inside current filtering arrays.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-850/10 transition">
                      
                      {/* ID Tracking Block */}
                      <td className="p-4 font-mono text-xs text-slate-500">
                        #PO-{req.id}
                      </td>
                      
                      {/* Worker Profile Meta Block */}
                      <td className="p-4">
                        <span className="text-white font-bold block text-sm">{req.worker_name}</span>
                        <span className="text-[11px] text-slate-500 block font-mono mt-0.5">Ref ID: #WK-{req.worker_id}</span>
                      </td>
                      
                      {/* Channel Parameters Descriptor */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded font-black uppercase tracking-wide">
                          <CreditCard className="w-3 h-3 text-blue-400" />
                          {req.payout_method || 'Stripe Connect'}
                        </span>
                        {req.stripe_account_id && (
                          <span className="block text-[10px] font-mono text-slate-500 mt-1 max-w-[160px] truncate">
                            {req.stripe_account_id}
                          </span>
                        )}
                      </td>

                      {/* Timeline Configuration Layout */}
                      <td className="p-4 text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </td>

                      {/* Operational Capital Volume Values */}
                      <td className="p-4">
                        <span className="text-sm font-black text-white block">
                          £{Number(req.amount).toFixed(2)}
                        </span>
                      </td>

                      {/* State Dispatch Management Actions */}
                      <td className="p-4 text-right">
                        {req.status === 'pending' ? (
                          <button
                            onClick={() => handleApprovePayout(req.id)}
                            disabled={processingId === req.id}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold px-3 py-1.5 rounded-lg transition cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
                          >
                            {processingId === req.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              'Authorize Disbursal'
                            )}
                          </button>
                        ) : (
                          <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                            ✓ Settled Asset
                          </span>
                        )}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}