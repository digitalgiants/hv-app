import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950 text-white">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Horse Racing Visualizer
        </h1>
        <p className="text-lg text-slate-400">
          Past performance analysis and race visualization for serious handicappers.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-500 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  )
}
