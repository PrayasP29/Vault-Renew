import { Link } from "react-router-dom";
import Reveal from "./Reveal.jsx";

export default function UploadExplain() {
  return (
    <section className="mx-auto max-w-[1160px] px-4 sm:px-6 py-12 sm:py-16">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <Reveal repeat>
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] tracking-widest text-white/60">UPLOAD → EXTRACTION → VAULT</div>
            <h2 className="mt-3 text-[26px] sm:text-[30px] font-semibold tracking-tight text-white">Your invoice already knows. We just read it.</h2>
            <p className="mt-2 text-[14px] leading-6 text-white/60">
              Drag your subscription receipt onto the upload zone. Vault-Renew keeps the file tied to your account, runs extraction for image formats, and shows you the renewal details before anything is saved.
            </p>
            <ul className="mt-4 space-y-2 text-[13px] leading-5 text-white/70">
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/60 shrink-0"/> Supported: JPEG, JPG, PNG, WEBP, PDF (PDF extraction later)</li>
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/60 shrink-0"/> Max 10MB · One file at a time</li>
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/60 shrink-0"/> If extraction is uncertain, we tell you — we never guess quietly</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <Link to="/upload" className="inline-flex rounded-full bg-white text-zinc-900 px-6 py-2.5 text-sm font-semibold hover:bg-zinc-100">Open Upload</Link>
              <a href="#faq" className="inline-flex rounded-full border border-white/15 bg-white/[0.06] backdrop-blur px-6 py-2.5 text-sm font-medium text-white hover:bg-white/10">Read FAQ</a>
            </div>
          </div>
        </Reveal>

        <Reveal repeat from="scale" delay={130}>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-4">
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
              <div className="mx-auto h-10 w-10 rounded-xl bg-white text-zinc-900 grid place-items-center text-sm">↑</div>
              <div className="mt-3 text-sm font-semibold text-white">Upload your subscription invoice</div>
              <div className="text-xs text-white/60 mt-1">JPEG · JPG · PNG · WEBP · PDF · 10MB</div>
              <div className="mt-4 inline-flex rounded-full bg-white text-zinc-900 px-4 py-2 text-xs font-medium">Drag & drop or click to browse</div>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-zinc-900 text-white p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-white/60">Example extracted</div>
                <div className="text-sm font-semibold">Notion Pro · $10 · Renews Apr 02</div>
              </div>
              <span className="text-xs rounded-full bg-white text-zinc-900 px-3 py-1 font-medium">Review → Save</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
