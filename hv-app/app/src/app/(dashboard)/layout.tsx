// Protected layout — auth check will be added here
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-sky-400">HV App</span>
      </nav>
      <main>{children}</main>
    </div>
  )
}
