import { DashboardShell } from "@/components/dashboard-shell";

export default function ClassePage() {
  return (
    <DashboardShell
      title="Espace professeur"
      roleLabel="Professeur"
      description="Vos classes, élèves et saisies de notes apparaîtront ici."
    />
  );
}