import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export default function UploadPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [err, setErr] = useState("");
  const [upload, setUpload] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const fetchUploads = useCallback(async () => {
    if (!isAuthenticated) return;
    setListLoading(true);
    try {
      const { data } = await api.get("/uploads");
      setUploads(data.uploads || []);
    } catch {} finally { setListLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { void fetchUploads(); }, [fetchUploads]);

  const onFile = (f) => {
    setErr(""); setUpload(null); setSubscription(null);
    if (!f) return;
    if (!allowedTypes.has(f.type)) return setErr("Unsupported file type — use JPEG, PNG, WEBP or PDF.");
    if (f.size > 10 * 1024 * 1024) return setErr("File too large — max 10MB.");
    setFile(f);
  };

  const doUpload = async () => {
    if (!file) return setErr("Choose a file first.");
    setUploading(true); setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setUpload(data.upload);
      fetchUploads();
    } catch (e) {
      setErr(e.response?.data?.message || "Upload failed");
    } finally { setUploading(false); }
  };

  const doExtract = async () => {
    if (!upload) return;
    // PDF guard: show unavailable state per spec, don't fake
    if (upload.mimeType === "application/pdf") {
      setErr("PDF extraction is not available yet — image formats (PNG/JPG/WEBP) work today. Your PDF is safely stored.");
      return;
    }
    setExtracting(true); setErr("");
    try {
      const { data } = await api.post(`/uploads/${upload.id || upload._id}/extract`);
      setSubscription(data.subscription);
      fetchUploads();
    } catch (e) {
      const msg = e.response?.data?.message || e.message || "Extraction failed";
      setErr(msg);
    } finally { setExtracting(false); }
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] pt-[72px]">
        <div className="mx-auto max-w-[640px] px-4 sm:px-6 py-16 text-center">
          <h1 className="text-xl font-semibold">Upload requires sign-in</h1>
          <p className="text-sm text-zinc-500 mt-2">Your uploads are private to your account.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/login" className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-semibold">Login</Link>
            <Link to="/signup" className="rounded-full border border-zinc-200 px-6 py-2.5 text-sm font-medium">Sign up</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] pt-[72px]">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Upload your subscription invoice</h1>
            <p className="text-sm text-zinc-500 mt-1">JPEG · JPG · PNG · WEBP · PDF · 10MB · Extraction for images today</p>
          </div>
          <div className="text-xs text-zinc-400 font-mono">{uploads.length} upload(s)</div>
        </div>

        {/* upload-empty adapted: drag drop + progress */}
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
              className={`rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition ${dragOver ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-zinc-50/50"}`}
            >
              <div className="mx-auto h-10 w-10 rounded-xl bg-zinc-900 text-white grid place-items-center">↑</div>
              <div className="mt-3 text-sm font-semibold text-zinc-900">Drag & drop or click to browse</div>
              <div className="text-xs text-zinc-500 mt-1">Supported: JPEG, JPG, PNG, WEBP, PDF (PDF stored, extraction later)</div>
              <label className="mt-4 inline-flex rounded-full bg-white border border-zinc-200 px-5 py-2 text-xs font-medium cursor-pointer hover:bg-zinc-50">
                Choose file
                <input type="file" accept={ACCEPT} className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
              </label>
              {file && <div className="mt-3 text-xs text-zinc-700 truncate">Selected: {file.name} · {(file.size/1024/1024).toFixed(2)}MB</div>}
              {uploading && <div className="mt-3 h-1.5 rounded-full bg-zinc-200 overflow-hidden"><div className="h-full w-1/2 bg-zinc-900 animate-pulse" /></div>}
            </div>

            {err && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{err}</div>}

            <div className="mt-4 flex gap-2">
              <button onClick={doUpload} disabled={!file || uploading} className="flex-1 rounded-full bg-zinc-900 text-white py-3 text-sm font-semibold disabled:opacity-40 hover:bg-zinc-800">
                {uploading ? "Uploading…" : "Upload"}
              </button>
              <button onClick={() => { setFile(null); setUpload(null); setSubscription(null); setErr(""); }} className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-medium">Clear</button>
            </div>

            {upload && (
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-xs font-mono tracking-widest text-zinc-400">UPLOADED</div>
                <div className="mt-1 text-sm font-medium truncate">{upload.originalName}</div>
                <div className="text-xs text-zinc-500">{upload.mimeType} · {(upload.size/1024).toFixed(0)}KB · {upload.status}</div>
                {upload.mimeType === "application/pdf" && <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">PDF is stored safely. Extraction for PDFs is intentionally paused — use PNG/JPG/WEBP for now.</div>}
                <button onClick={doExtract} disabled={extracting} className="mt-3 w-full rounded-full bg-white border border-zinc-900 text-zinc-900 py-2.5 text-sm font-semibold hover:bg-zinc-900 hover:text-white disabled:opacity-40">
                  {extracting ? "Extracting…" : "Extract subscription → Save to vault"}
                </button>
              </div>
            )}

            {subscription && (
              <div className="mt-4 rounded-2xl bg-zinc-900 text-white p-4">
                <div className="text-xs tracking-widest text-white/50">EXTRACTED & SAVED</div>
                <div className="mt-2 text-sm font-semibold">{subscription.name} · {subscription.currency} {subscription.amount}</div>
                <div className="text-xs text-white/60 mt-1">Renews {new Date(subscription.renewalDate).toLocaleDateString()} · {subscription.billingCycle} · {subscription.category}</div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Your uploads</h2>
              <button onClick={fetchUploads} className="text-xs rounded-full border border-zinc-200 px-3 py-1.5">Refresh</button>
            </div>
            {listLoading ? <div className="mt-4 text-sm text-zinc-500">Loading…</div> : uploads.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
                <div className="text-sm font-medium text-zinc-700">No uploads yet</div>
                <div className="text-xs text-zinc-500 mt-1">Your vault is empty — upload your first invoice to see extraction in action.</div>
              </div>
            ) : (
              <div className="mt-4 space-y-2 max-h-[520px] overflow-auto pr-1">
                {uploads.map((u) => (
                  <div key={u.id || u._id} className="rounded-xl border border-zinc-200 px-3 py-3 flex items-center gap-3">
                    <span className="h-8 w-8 rounded-lg bg-zinc-900/5 border border-zinc-200 grid place-items-center text-[10px]">{u.mimeType?.includes("pdf") ? "PDF" : "IMG"}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{u.originalName}</div>
                      <div className="text-[11px] text-zinc-500">{u.status} · {(u.size/1024).toFixed(0)}KB</div>
                    </div>
                    <span className="ml-auto text-[11px] font-mono text-zinc-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              Backend: <code>POST /api/uploads</code> · <code>POST /api/uploads/:id/extract</code> · Real OCR, no fake data.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
