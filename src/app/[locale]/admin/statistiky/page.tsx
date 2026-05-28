import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { StatsDashboard } from "@/components/admin/StatsDashboard";
import { auth } from "@/lib/auth";
import { getStats } from "@/lib/stats";

export default async function StatisticsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || (session.user as { role?: string }).role !== "Admin") {
    redirect("/");
  }

  const stats = await getStats();

  return <StatsDashboard stats={stats} />;
}
