import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Filter, User, Clock, ChevronLeft, ChevronRight, Search, Zap, Layers, LayoutGrid, Target, Shield, ArrowRight } from 'lucide-react';
import { adminService } from '../../api/adminService';

const ACTION_CONFIG = {
  CREATE: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', label: 'Tạo mới' },
  UPDATE: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', label: 'Cập nhật' },
  DELETE: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', label: 'Xóa bỏ' },
};

export default function ActivityLogPage() {
  const [page, setPage] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity-logs', page, filterAction, filterEntityType],
    queryFn: () => adminService.getActivityLogs({
      page,
      size: 15,
      ...(filterAction && { action: filterAction }),
      ...(filterEntityType && { entityType: filterEntityType }),
    }),
  });

  const logs = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const truncateJson = (str, maxLen = 80) => {
    if (!str) return '—';
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 italic font-black uppercase">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shadow-sm shadow-gray-100">
               <Activity size={16} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic leading-none font-black italic">Audit Trail & Security</span>
          </div>
          <h1 className="text-4xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">
            Lịch sử <span className="text-gray-500 font-black not-italic">Hoạt động</span>
          </h1>
          <p className="text-gray-500 mt-3 font-medium text-sm flex items-center gap-2 font-black italic">
            <Clock size={14} className="text-gray-300 font-black italic uppercase italic" />
            Đang lưu trữ <span className="text-gray-950 font-black italic underline decoration-gray-200">{totalElements}</span> bản ghi vận hành trong hệ thống
          </p>
        </div>
      </div>

      {/* Advanced Filters PRO MAX */}
      <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] p-6 shadow-sm">
         <div className="flex flex-col lg:flex-row gap-6 items-center italic font-black uppercase">
            <div className="flex items-center gap-3 shrink-0 italic font-black italic">
               <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 font-black italic">
                  <Filter size={18} />
               </div>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-black">Bộ lọc truy vấn</span>
            </div>

            <div className="flex flex-1 w-full gap-4 italic font-black">
              <select
                value={filterAction}
                onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
                className="flex-1 px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-950 focus:ring-4 focus:ring-gray-100 transition-all appearance-none cursor-pointer italic font-black uppercase"
              >
                <option value="">TẤT CẢ HÀNH ĐỘNG</option>
                <option value="CREATE">TẠO MỚI (INITIAL)</option>
                <option value="UPDATE">CẬP NHẬT (PATCH)</option>
                <option value="DELETE">XÓA BỎ (DROP)</option>
              </select>

              <select
                value={filterEntityType}
                onChange={(e) => { setFilterEntityType(e.target.value); setPage(0); }}
                className="flex-1 px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-950 focus:ring-4 focus:ring-gray-100 transition-all appearance-none cursor-pointer italic font-black uppercase"
              >
                <option value="">TẤT CẢ PHÂN ĐOẠN</option>
                <option value="Product">SẢN PHẨM</option>
                <option value="Order">ĐƠN HÀNG</option>
                <option value="User">TÀI KHOẢN</option>
                <option value="Category">DANH MỤC</option>
                <option value="Brand">THƯƠNG HIỆU</option>
                <option value="Voucher">CHIẾN DỊCH VOUCHER</option>
                <option value="Review">ĐÁNH GIÁ</option>
                <option value="ServiceBooking">ĐẶT DỊCH VỤ</option>
              </select>
            </div>

            {(filterAction || filterEntityType) && (
              <button
                onClick={() => { setFilterAction(''); setFilterEntityType(''); setPage(0); }}
                className="px-6 py-4 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all italic font-black uppercase"
              >
                Reset Filter
              </button>
            )}
         </div>
      </div>

      {/* Audit Table PRO MAX */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden font-black uppercase italic">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 italic font-black uppercase">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 border-t-gray-600 italic font-black uppercase" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse italic font-black uppercase">Đang quét nhật ký vận hành...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-32 font-black uppercase italic">
            <Activity size={48} className="mx-auto mb-6 text-gray-200 font-black italic uppercase" />
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Không tìm thấy dữ liệu vận hành</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar font-black uppercase italic">
            <table className="w-full text-left border-collapse font-black uppercase italic">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 font-black uppercase italic">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-black uppercase">Timelog Event</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-black uppercase">Operator Info</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-black uppercase">Action Node</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-black uppercase">Entity Target</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-black uppercase">Metadata Trace (Before / After)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 italic font-black uppercase">
                {logs.map((log) => {
                  const cfg = ACTION_CONFIG[log.action] || { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-600', label: log.action };
                  return (
                    <tr key={log.idLog} className="group hover:bg-gray-50/80 transition-all duration-300 font-black italic uppercase font-black uppercase">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-900 font-black italic uppercase">
                          <Clock size={14} className="text-gray-300 italic font-black uppercase" />
                          <span className="text-[11px] font-bold font-variant-numeric: tabular-nums italic font-black uppercase">{formatDate(log.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap font-black italic uppercase">
                        <div className="flex items-center gap-3 font-black italic uppercase">
                          <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 shrink-0 font-black italic uppercase italic">
                             <User size={16} className="italic font-black uppercase italic" />
                          </div>
                          <div>
                            <p className="text-[12px] font-black text-gray-900 uppercase tracking-tight italic font-black uppercase italic">{log.userFullName || log.username}</p>
                            <p className="text-[9px] font-bold text-gray-400 italic font-black uppercase italic">@{log.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap font-black italic uppercase">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                           {log.action === 'DELETE' ? <Zap size={10} /> : <Target size={10} />}
                           {cfg.label.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap font-black italic uppercase font-black uppercase">
                        <div className="flex flex-col gap-0.5 font-black italic uppercase font-black uppercase">
                           <span className="text-[11px] font-black text-gray-900 italic font-black uppercase">{log.entityType}</span>
                           <span className="text-[9px] font-black text-gray-400 font-mono tracking-tighter italic font-black uppercase font-black italic">UID: #{log.entityId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 min-w-[300px] font-black italic uppercase font-black uppercase">
                        <div className="space-y-1.5 font-black uppercase italic font-black uppercase">
                           <div className="flex items-start gap-2 group/trace italic font-black uppercase">
                              <span className="text-[8px] font-black text-gray-300 uppercase shrink-0 mt-1 italic font-black uppercase">PRE:</span>
                              <span className="text-[10px] text-gray-400 italic font-medium leading-relaxed font-black uppercase" title={log.oldValue}>{truncateJson(log.oldValue, 60)}</span>
                           </div>
                           <div className="flex items-start gap-2 group/trace font-black italic uppercase">
                              <span className="text-[8px] font-black text-blue-400 uppercase shrink-0 mt-1 italic font-black uppercase">POST:</span>
                              <span className="text-[10px] text-gray-900 italic font-black leading-relaxed font-black uppercase italic font-black uppercase italic" title={log.newValue}>{truncateJson(log.newValue, 60)}</span>
                           </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination PRO MAX */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 italic font-black uppercase">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-black uppercase">
              Analyzing <span className="text-gray-950 font-black italic font-black uppercase">{logs.length}</span> audit nodes // segment {page + 1}/{totalPages}
            </p>
            <div className="flex items-center gap-2 font-black italic uppercase">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="w-11 h-11 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-400 hover:bg-gray-950 hover:text-white transition-all disabled:opacity-30 active:scale-90 shadow-sm font-black italic uppercase"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 border border-gray-100 rounded-[1.5rem] italic font-black uppercase">
                 <span className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest italic leading-none font-black italic uppercase">Sector Control</span>
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="w-11 h-11 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-400 hover:bg-gray-950 hover:text-white transition-all disabled:opacity-30 active:scale-90 shadow-sm font-black italic uppercase"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f1f1f1;
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #e2e2e2;
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-in {
          animation-fill-mode: forwards;
        }
        .fade-in {
          animation-name: fade-in;
        }
      `}</style>
    </div>
  );
}
