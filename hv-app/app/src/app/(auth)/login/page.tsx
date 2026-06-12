import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Horse Racing Visualizer</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
