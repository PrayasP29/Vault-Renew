import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-white/[0.02]">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row gap-8 justify-between">
          <div className="max-w-[360px]">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-full bg-white grid place-items-center"><span className="h-2.5 w-2.5 rounded-full bg-zinc-900" /></span>
              <span className="font-semibold tracking-tight text-white">Vault-Renew</span>
            </div>
            <p className="mt-3 text-[13px] leading-5 text-white/60">Subscription renewal reminders — upload once, remember forever. Built for real invoices, real reminders.</p>
          </div>
          <div className="flex gap-10 text-sm">
            <div>
              <div className="text-[12px] font-semibold tracking-widest text-white/40">PRODUCT</div>
              <div className="mt-3 flex flex-col gap-2 text-white/60">
                <a href="#how-it-works" className="hover:text-white">How it works</a>
                <Link to="/upload" className="hover:text-white">Upload</Link>
                <Link to="/notification-test" className="hover:text-white">Notification test</Link>
              </div>
            </div>
            <div>
              <div className="text-[12px] font-semibold tracking-widest text-white/40">ACCOUNT</div>
              <div className="mt-3 flex flex-col gap-2 text-white/60">
                <Link to="/login" className="hover:text-white">Login</Link>
                <Link to="/signup" className="hover:text-white">Signup</Link>
                <Link to="/verify-email" className="hover:text-white">Verify email</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center border-t border-white/10 pt-6 text-xs text-white/40">
          <span>© {new Date().getFullYear()} Vault-Renew. College project — no tracking, no ads.</span>
          <span className="font-mono">10MB · PUSH T-2 · T-1</span>
        </div>
      </div>
    </footer>
  );
}
