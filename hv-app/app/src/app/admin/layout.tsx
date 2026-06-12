// Admin-only layout — role check will be enforced here via middleware
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-red-400">Admin</span>
        <span className="font-semibold text-white">HV App</span>
      </nav>
      <main>{children}</main>
    </div>
  )
}
