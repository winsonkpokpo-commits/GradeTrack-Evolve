import { SignupForm } from "@/components/auth/signup-form";

export default function InscriptionPage() {
  return (
    <main className="mx-auto w-full max-w-md px-6 py-24">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Créer un compte</h1>
        <p className="mt-2 text-sm text-slate-500">
          Choisissez un rôle pour créer votre espace.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SignupForm />
      </div>
    </main>
  );
}