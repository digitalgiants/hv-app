import Link from 'next/link'
import { BackButton } from '@/components/back-button'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-3 flex items-center gap-6">
        <Link href="/dashboard" className="font-semibold text-sky-400 hover:text-sky-300 transition-colors">
          HV App
        </Link>
        <Link href="/races" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
          Races
        </Link>
        <Link href="/races/summary" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
          Summary
        </Link>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
          Import
        </Link>
        <div className="ml-auto">
          <BackButton />
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
