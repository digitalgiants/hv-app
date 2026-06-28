import Link from "next/link"
import { CsvUpload } from "@/components/import/csv-upload"

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Import race cards or browse your past performance data.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/races/sample"
          className="block bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-sky-700 transition-colors group"
        >
          <p className="text-xs uppercase tracking-widest text-sky-400 mb-1">Demo</p>
          <h2 className="text-white font-semibold group-hover:text-sky-300 transition-colors">
            Sample Race Card
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            AP · June 14, 2014 · Race 1 · Maiden Special Weight
          </p>
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs uppercase tracking-widest text-sky-400 mb-1">Import</p>
          <h2 className="text-white font-semibold mb-3">Upload Brisnet CSV</h2>
          <CsvUpload />
        </div>
      </div>
    </div>
  )
}
