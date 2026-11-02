import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate } from "../lib/subscriptions.js";

const ACCEPT = ".jpg,.jpeg,.png,.webp";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function UploadPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [upload, setUpload] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUploads = useCallback(async () => {
    if (!isAuthenticated) return;
    setListLoading(true);
    try {
      const { data } = await api.get("/uploads");
      setUploads(data.uploads || []);
    } catch {} finally {
      setListLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void fetchUploads();
  }, [fetchUploads]);

  const onFile = (f) => {
    setErr("");
    setSuccessMsg("");
    setUpload(null);
    setSubscription(null);
    if (!f) return;
    if (!allowedTypes.has(f.type)) {
      return setErr("Unsupported file type. Please upload a JPEG, JPG, PNG, or WEBP image.");
    }
    if (f.size > 10 * 1024 * 1024) {
      return setErr("File too large. Maximum size is 10 MB.");
    }
    setFile(f);
  };

  const doUpload = async () => {
    if (!file) return setErr("Please choose an image file first.");
    setUploading(true);
    setErr("");
    setSuccessMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newUpload = data.upload;
      setUpload(newUpload);
      // Immediately reflect in list and upload count
      setUploads((prev) => [newUpload, ...prev.filter((u) => (u.id || u._id) !== (newUpload.id || newUpload._id))]);
      setSuccessMsg("Invoice uploaded successfully. Click below to extract subscription details.");
      setFile(null);
    } catch (e) {
      setErr(e.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const doExtract = async (targetUpload) => {
    const toExtract = targetUpload || upload;
    if (!toExtract) return;
    const targetId = toExtract.id || toExtract._id;
    setExtracting(true);
    setErr("");
    setSuccessMsg("");
    try {
      const { data } = await api.post(`/uploads/${targetId}/extract`);
      setSubscription(data.subscription);
      setSuccessMsg(
        data.isExisting
          ? "Subscription already exists in your vault."
          : "Subscription extracted and saved to vault successfully!"
      );
      // Update upload status in local list
      if (data.upload) {
        setUploads((prev) =>
          prev.map((u) => ((u.id || u._id) === targetId ? { ...u, ...data.upload } : u))
        );
        setUpload(data.upload);
      } else {
        fetchUploads();
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.message || "Extraction failed.";
      setErr(msg);
    } finally {
      setExtracting(false);
    }
  };

  const doDeleteUpload = async (u) => {
    const id = u.id || u._id;
    if (!window.confirm(`Delete upload "${u.originalName}"?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/uploads/${id}`);
      setUploads((prev) => prev.filter((item) => (item.id || item._id) !== id));
      if (upload && (upload.id || upload._id) === id) {
        setUpload(null);
        setSubscription(null);
      }
    } catch (e) {
      setErr(e.response?.data?.message || "Could not delete upload.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] dark:bg-[#09090b] pt-[76px] transition-colors">
        <div className="mx-auto max-w-[640px] px-4 sm:px-6 py-16 text-center">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Sign In Required
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Your invoices and subscription documents are stored privately in your account.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/login"
                className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full border border-zinc-200 dark:border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-[#09090b] pt-[76px] transition-colors">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Upload Subscription Invoice
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Supports JPEG, JPG, PNG, and WEBP images · Max 10 MB per file
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-1 text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 shadow-sm">
              {uploads.length} file{uploads.length === 1 ? "" : "s"} stored
            </span>
            <Link
              to="/dashboard"
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
            >
              Dashboard →
            </Link>
          </div>
        </div>

        {/* Upload & Extraction Grid */}
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          {/* Left panel: Upload dropzone & active extract */}
          <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm transition">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
              Document Upload
            </h2>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) onFile(f);
              }}
              className={`rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition ${
                dragOver
                  ? "border-zinc-900 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-800"
                  : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40"
              }`}
            >
              <div className="mx-auto h-11 w-11 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-lg shadow-sm">
                ↑
              </div>
              <div className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Drag and drop your invoice here
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Receipts, billing confirmation screenshots, or invoices (PNG, JPG, WEBP)
              </div>
              <label className="mt-4 inline-flex items-center gap-2 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition shadow-sm">
                <span>Browse file</span>
                <input
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0] || null)}
                />
              </label>

              {file && (
                <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-3 text-left">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={file.name}>
                    Selected: {file.name}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type || "image"}
                  </div>
                </div>
              )}

              {uploading && (
                <div className="mt-4 space-y-1.5">
                  <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full w-2/3 bg-zinc-900 dark:bg-zinc-100 animate-pulse rounded-full" />
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Uploading invoice…</div>
                </div>
              )}
            </div>

            {err && (
              <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                {err}
              </div>
            )}

            {successMsg && (
              <div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                {successMsg}
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={doUpload}
                disabled={!file || uploading}
                className="flex-1 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2.5 text-xs sm:text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition shadow-sm"
              >
                {uploading ? "Uploading…" : "Upload to Vault"}
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setUpload(null);
                  setSubscription(null);
                  setErr("");
                  setSuccessMsg("");
                }}
                className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
              >
                Clear
              </button>
            </div>

            {/* Uploaded state & Extract button */}
            {upload && (
              <div className="mt-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/50 p-4 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
                    Ready for Extraction
                  </span>
                  <span className="rounded-full border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">
                    {upload.status}
                  </span>
                </div>
                <div
                  className="mt-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                  title={upload.originalName}
                >
                  {upload.originalName}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {upload.mimeType} · {(upload.size / 1024).toFixed(0)} KB
                </div>

                <button
                  onClick={() => doExtract(upload)}
                  disabled={extracting}
                  className="mt-3 w-full rounded-full bg-white dark:bg-zinc-900 border border-zinc-900 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 py-2.5 text-xs sm:text-sm font-semibold hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900 disabled:opacity-40 transition shadow-sm"
                >
                  {extracting ? "Running AI OCR extraction…" : "Extract Subscription Details →"}
                </button>
              </div>
            )}

            {/* Extracted Subscription Card */}
            {subscription && (
              <div className="mt-4 rounded-2xl bg-zinc-900 dark:bg-zinc-800 text-white p-5 shadow-sm transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase">
                    Extracted & Saved
                  </span>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-[10px] font-medium">
                    Active
                  </span>
                </div>
                <div className="mt-2 text-base font-bold">
                  {subscription.name} · {subscription.currency} {subscription.amount}
                </div>
                <div className="text-xs text-white/70 mt-1">
                  Renews {formatDate(subscription.renewalDate)} ·{" "}
                  <span className="capitalize">{subscription.billingCycle}</span>
                  {subscription.category ? ` · ${subscription.category}` : ""}
                </div>
                <Link
                  to="/dashboard"
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-white text-zinc-900 px-4 py-1.5 text-xs font-semibold hover:bg-zinc-100 transition"
                >
                  View in dashboard →
                </Link>
              </div>
            )}
          </div>

          {/* Right panel: Uploads history */}
          <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm transition flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Upload History
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Stored document images in your vault
                </p>
              </div>
              <button
                onClick={fetchUploads}
                disabled={listLoading}
                className="text-xs rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
              >
                {listLoading ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {listLoading && uploads.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400 animate-pulse">
                Loading upload history…
              </div>
            ) : uploads.length === 0 ? (
              <div className="my-auto py-12 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-8 text-center">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No uploads yet</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[280px] mx-auto">
                  Your vault is ready. Upload your first subscription invoice screenshot to get started.
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2.5 max-h-[560px] overflow-auto pr-1">
                {uploads.map((u) => {
                  const id = u.id || u._id;
                  const isBusyDeleting = deletingId === id;
                  return (
                    <div
                      key={id}
                      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 p-3.5 flex items-center gap-3 transition hover:border-zinc-300 dark:hover:border-zinc-700"
                    >
                      <span className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-700/60 border border-zinc-200 dark:border-zinc-700 grid place-items-center text-[10px] font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
                        IMG
                      </span>

                      <div className="min-w-0 flex-1">
                        <div
                          className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                          title={u.originalName}
                        >
                          {u.originalName}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2">
                          <span>{(u.size / 1024).toFixed(0)} KB</span>
                          <span>·</span>
                          <span className="capitalize">{u.status}</span>
                          <span>·</span>
                          <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {u.status !== "processed" && (
                          <button
                            onClick={() => doExtract(u)}
                            disabled={extracting}
                            className="rounded-full border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                          >
                            Extract
                          </button>
                        )}
                        <button
                          onClick={() => doDeleteUpload(u)}
                          disabled={isBusyDeleting}
                          title="Delete upload"
                          className="h-7 w-7 rounded-full text-zinc-400 hover:text-red-600 dark:hover:text-red-400 grid place-items-center transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
