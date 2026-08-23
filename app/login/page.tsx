import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-md px-6 py-24">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">GradeTrack-Evolve</h1>
        <p className="mt-2 text-sm text-slate-500">
          Connectez-vous pour accéder à votre espace.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Connexion</h2>
        <LoginForm />
      </div>
    </main>
  );
}