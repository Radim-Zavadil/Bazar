import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStats } from "@/lib/stats";
import { StatsDashboard } from "@/components/admin/StatsDashboard";

export default async function StatisticsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || (session.user as any).role !== "Admin") {
    redirect("/");
  }

  const stats = await getStats();

  return <StatsDashboard stats={stats} />;
}
