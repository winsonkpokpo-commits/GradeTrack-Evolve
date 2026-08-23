import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Tableau de bord"
      roleLabel="Élève"
      description="Vos notes et votre progression académique apparaîtront ici."
    />
  );
}