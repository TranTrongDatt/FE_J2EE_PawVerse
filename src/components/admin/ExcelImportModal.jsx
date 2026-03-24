import { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  Package, 
  RefreshCw,
  FileText,
  ShieldCheck,
  Zap,
  ChevronRight,
  Database,
  ArrowDownToLine,
  Layout
} from 'lucide-react';
import { adminService } from '../../api/adminService';
import { formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

const STEPS = {
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  IMPORTING: 'importing',
  DONE: 'done',
};

export default function ExcelImportModal({ isOpen, onClose, onImportSuccess }) {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const reset = () => {
    setStep(STEPS.UPLOAD);
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await adminService.downloadImportTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mau-import-san-pham.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Đã tải file mẫu!');
    } catch {
      toast.error('Không thể tải file mẫu');
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.endsWith('.xlsx') && !selected.name.endsWith('.xls')) {
      toast.error('Chỉ chấp nhận file Excel (.xlsx hoặc .xls)');
      return;
    }
    setFile(selected);
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await adminService.previewImportExcel(file);
      setPreview(result);
      setStep(STEPS.PREVIEW);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lỗi xử lý file Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setStep(STEPS.IMPORTING);
    setLoading(true);
    try {
      const result = await adminService.confirmImportExcel(file);
      setImportResult(result);
      setStep(STEPS.DONE);
      if (result.message) {
        toast.success(result.message);
      }
      onImportSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lỗi import sản phẩm');
      setStep(STEPS.PREVIEW);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm animate-in fade-in duration-500" onClick={handleClose} />
      
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.3)] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500">
        
        {/* Header Section Compact */}
        <div className="flex items-center justify-between px-8 py-5 shrink-0 border-b border-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-950 rounded-xl flex items-center justify-center text-white shadow-xl rotate-3">
              <FileSpreadsheet size={20} className="text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                 <Database size={10} className="text-emerald-500" />
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] italic leading-none">IMPORT BLOCK DATA</span>
              </div>
              <h2 className="text-xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">
                Import <span className="text-emerald-600">Excel</span>
              </h2>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-gray-950 hover:text-white rounded-xl transition-all duration-300 active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Indicator Slim */}
        <div className="px-8 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-6 justify-center">
           {[
             { id: STEPS.UPLOAD, label: 'Tải tệp', icon: Upload },
             { id: STEPS.PREVIEW, label: 'Kiểm tra', icon: Layout },
             { id: STEPS.DONE, label: 'Hoàn tất', icon: CheckCircle },
           ].map((s, idx) => {
             const isCurrent = step === s.id || (step === STEPS.IMPORTING && s.id === STEPS.PREVIEW);
             const isPast = (step === STEPS.PREVIEW && s.id === STEPS.UPLOAD) || (step === STEPS.DONE) || (step === STEPS.IMPORTING && s.id === STEPS.UPLOAD);
             
             return (
               <div key={idx} className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 transition-all duration-300 ${isCurrent ? 'opacity-100' : isPast ? 'opacity-60' : 'opacity-30'}`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black italic text-[10px] shadow-sm ${
                      isCurrent ? 'bg-gray-950 text-white shadow-gray-200' : isPast ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                       <s.icon size={12} />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? 'text-gray-950' : 'text-gray-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && <ChevronRight size={12} className="text-gray-300" />}
               </div>
             )
           })}
        </div>

        {/* Content Body Compact */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {/* STEP: UPLOAD */}
          {step === STEPS.UPLOAD && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-6">
                {/* Template Download Card Compact */}
                <div className="relative group overflow-hidden bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100">
                   <div className="absolute top-0 right-0 p-4 opacity-5 -rotate-12 translate-x-2">
                      <FileSpreadsheet size={80} />
                   </div>
                   <div className="relative z-10">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-gray-50 mb-4">
                         <Download size={20} />
                      </div>
                      <h4 className="text-lg font-black text-gray-950 uppercase italic tracking-tight mb-1">Tệp mẫu chuẩn</h4>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
                        Tải tệp Excel mẫu để cấu hình chính xác các trường dữ liệu nhập kho.
                      </p>
                      <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-[10px] font-black text-blue-600 uppercase tracking-widest rounded-xl hover:bg-gray-950 hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        <ArrowDownToLine size={14} /> Tải mẫu (.xlsx)
                      </button>
                   </div>
                </div>

                {/* Notices Compact */}
                <div className="bg-orange-50/50 p-5 rounded-[1.5rem] border border-orange-100 relative">
                   <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
                   <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-orange-500 shadow-sm shrink-0 border border-orange-100 mt-0.5">
                         <AlertTriangle size={16} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-orange-800 uppercase tracking-widest">Lưu ý chuẩn hóa</p>
                        <ul className="space-y-1.5">
                           {[
                             'Tự động cộng dồn tồn kho sản phẩm trùng.',
                             'Cập nhật Giá bán & Ảnh mới nhất.',
                             'Brand phải khớp 100% với hệ thống.'
                           ].map((text, i) => (
                             <li key={i} className="flex items-center gap-2 text-[11px] text-orange-700 font-medium italic">
                               <div className="w-1 h-1 bg-orange-300 rounded-full shrink-0" />
                               {text}
                             </li>
                           ))}
                        </ul>
                      </div>
                   </div>
                </div>
              </div>

              {/* Upload Dropzone Compact */}
              <div className="flex flex-col h-full">
                <div
                  className={`flex-1 border-2 border-dashed rounded-[1.8rem] flex flex-col items-center justify-center p-8 text-center transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                    file ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-200 hover:border-emerald-400 bg-gray-50 hover:bg-white'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {file ? (
                    <div className="space-y-4 animate-in zoom-in-95 duration-300">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-lg border border-emerald-50 mx-auto">
                         <FileText size={32} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-black text-gray-950 uppercase italic truncate max-w-[240px]">{file.name}</p>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB • Valid</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="px-5 py-1.5 bg-rose-50 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-xs"
                      >
                        Chọn lại
                      </button>
                    </div>
                  ) : (
                    <div className="transition-transform duration-300">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-300 shadow-sm border border-gray-100 mx-auto mb-4 group-hover:text-emerald-500 transition-colors">
                         <Upload size={24} />
                      </div>
                      <p className="text-gray-950 font-black text-md uppercase italic tracking-tight">Thả file vào đây</p>
                      <p className="text-[9px] text-gray-400 font-medium mt-0.5 uppercase tracking-widest">Duyệt tệp .xlsx / .xls</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP: PREVIEW */}
          {step === STEPS.PREVIEW && preview && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Stats Compact */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Tổng số', val: preview.totalRows, color: 'text-gray-900', bg: 'bg-gray-50' },
                  { label: 'Hợp lệ', val: preview.validRows, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Lỗi', val: preview.invalidRows, color: 'text-rose-600', bg: 'bg-rose-50' },
                  { label: 'Trùng', val: preview.existingProducts, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map((stat, i) => (
                  <div key={i} className={`${stat.bg} p-4 rounded-[1.25rem] text-center border border-white shadow-xs ring-1 ring-black/[0.01]`}>
                    <p className={`text-xl font-black italic tracking-tighter ${stat.color} mb-0.5 font-variant-numeric: tabular-nums`}>{stat.val}</p>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Table Preview Slim */}
              <div className="bg-white border border-gray-100 rounded-[1.5rem] overflow-hidden shadow-xs ring-1 ring-black/[0.01]">
                <div className="overflow-x-auto custom-scrollbar max-h-[350px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-md z-10">
                      <tr className="border-b border-gray-100">
                        <th className="px-5 py-3 text-[8px] font-black text-gray-400 uppercase tracking-widest italic">Row</th>
                        <th className="px-4 py-3 text-[8px] font-black text-gray-400 uppercase tracking-widest italic text-center">Security</th>
                        <th className="px-4 py-3 text-[8px] font-black text-gray-400 uppercase tracking-widest italic">Product Identity</th>
                        <th className="px-4 py-3 text-[8px] font-black text-gray-400 uppercase tracking-widest italic text-right">Pricing</th>
                        <th className="px-5 py-3 text-center text-[8px] font-black text-gray-400 uppercase tracking-widest italic">Command</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {preview.rows?.map((row, idx) => (
                        <tr key={idx} className={`group hover:bg-gray-50/50 transition-all ${!row.valid ? 'bg-rose-50/20' : row.exists ? 'bg-blue-50/15' : ''}`}>
                          <td className="px-5 py-3 text-[10px] font-bold text-gray-400 family-mono italic">{row.rowNumber}</td>
                          <td className="px-4 py-3 text-center">
                            {!row.valid ? (
                              <XCircle size={14} className="text-rose-500 mx-auto" />
                            ) : (
                              <CheckCircle size={14} className="text-emerald-500 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-[11px] font-black text-gray-950 uppercase tracking-tighter truncate max-w-[200px] mb-0.5">{row.tenProduct}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase italic opacity-60 truncate max-w-[150px]">{row.danhMuc} • {row.thuongHieu}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                             <span className="text-[11px] font-black italic text-gray-900">{row.giaBan ? formatPrice(row.giaBan) : '—'}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            {row.valid ? (
                              <span className={`inline-flex px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                row.action === 'UPDATE' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              }`}>
                                {row.action === 'UPDATE' ? 'Update' : 'New'}
                              </span>
                            ) : (
                              <div className="text-[9px] text-rose-600 font-bold italic truncate flex flex-col items-center">
                                 {row.errors?.[0] || 'Invalid format'}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP: IMPORTING */}
          {step === STEPS.IMPORTING && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
               <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center shadow-inner border border-gray-100">
                  <RefreshCw size={32} className="text-emerald-500 animate-spin" />
               </div>
               <div className="text-center space-y-1">
                  <h4 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">Đang đồng bộ kho</h4>
                  <p className="text-xs text-gray-400 font-medium italic opacity-60 tracking-wider animate-pulse uppercase">Syncing protocol active...</p>
               </div>
            </div>
          )}

          {/* STEP: DONE */}
          {step === STEPS.DONE && importResult && (
            <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in fade-in duration-500">
               <div className="w-16 h-16 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-emerald-100 rotate-12 rotate-animation relative">
                  <CheckCircle size={32} />
               </div>
               
               <div className="text-center space-y-1">
                  <h3 className="text-2xl font-black text-gray-950 uppercase italic tracking-tighter">SUCCESS SYNC</h3>
                  <p className="text-xs text-gray-500 font-medium">{importResult.message}</p>
               </div>

               <div className="flex gap-3 w-full max-w-sm">
                  <div className="flex-1 bg-emerald-50 p-6 rounded-[1.8rem] text-center border border-white">
                    <p className="text-3xl font-black text-emerald-600 italic tracking-tighter mb-0.5 font-variant-numeric: tabular-nums">{importResult.data?.newProducts ?? 0}</p>
                    <p className="text-[8px] font-black text-emerald-800/60 uppercase tracking-widest">New Items</p>
                  </div>
                  <div className="flex-1 bg-blue-50 p-6 rounded-[1.8rem] text-center border border-white">
                    <p className="text-3xl font-black text-blue-600 italic tracking-tighter mb-0.5 font-variant-numeric: tabular-nums">{importResult.data?.existingProducts ?? 0}</p>
                    <p className="text-[8px] font-black text-blue-800/60 uppercase tracking-widest">Updated</p>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Action Footer Compact */}
        <div className="px-8 py-5 border-t border-gray-100 bg-white/50 flex items-center justify-between shrink-0">
          <div>
            {(step === STEPS.PREVIEW || step === STEPS.DONE) && (
              <button
                onClick={() => { reset(); }}
                className="flex items-center gap-2 group text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-950 transition-colors"
              >
                <ArrowRight size={12} className="rotate-180" /> {step === STEPS.DONE ? 'Import thêm' : 'Đổi file'}
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {step === STEPS.UPLOAD && (
              <button
                onClick={handlePreview}
                disabled={!file || loading}
                className="px-8 py-4 bg-gray-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] italic hover:bg-emerald-600 transition-all duration-300 shadow-lg active:scale-95 disabled:opacity-30 relative overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  {loading ? (
                    <><RefreshCw size={14} className="animate-spin" /> Analyzing...</>
                  ) : (
                    <><Upload size={14} /> Kiểm duyệt dữ liệu</>
                  )}
                </div>
              </button>
            )}

            {step === STEPS.PREVIEW && preview && preview.validRows > 0 && (
              <button
                onClick={handleConfirmImport}
                disabled={loading}
                className="px-8 py-4 bg-gray-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] italic hover:bg-orange-600 transition-all duration-300 shadow-lg active:scale-95 disabled:opacity-30 relative overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} />
                  Xác nhận tích hợp ({preview.validRows})
                </div>
              </button>
            )}

            {step === STEPS.DONE && (
              <button
                onClick={handleClose}
                className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50 active:scale-95"
              >
                Hoàn tất
              </button>
            )}

            {(step !== STEPS.DONE && step !== STEPS.IMPORTING) && (
              <button
                onClick={handleClose}
                className="px-6 py-4 border border-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest rounded-xl hover:text-gray-950 transition-all active:scale-95"
              >
                Hủy
              </button>
            )}
          </div>
        </div>
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
        .family-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .font-variant-numeric\\: { font-variant-numeric: tabular-nums; }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotate-animation {
          animation: rotate-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
