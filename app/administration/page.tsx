import { DashboardShell } from "@/components/dashboard-shell";

export default function AdministrationPage() {
  return (
    <DashboardShell
      title="Administration établissement"
      roleLabel="Admin établissement"
      description="La gestion de votre établissement apparaîtra ici."
    />
  );
}