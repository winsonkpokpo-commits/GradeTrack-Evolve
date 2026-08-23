import { DashboardShell } from "@/components/dashboard-shell";

export default function AdminPage() {
  return (
    <DashboardShell
      title="Administration système"
      roleLabel="Admin système"
      description="La supervision globale du système apparaîtra ici."
    />
  );
}