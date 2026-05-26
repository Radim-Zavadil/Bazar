"use client";

import { Box, Container, Grid } from "@mantine/core";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { EditProfile } from "@/components/settings/EditProfile";
import { PaymentsHistory } from "@/components/settings/PaymentsHistory";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";

function SettingsContent() {
  const { data: session, isPending } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profil");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
    else setActiveTab("profil");
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/nastaveni?tab=${tab}`);
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/");
    }
  }, [session, isPending, router]);

  if (isPending || !session?.user) return null;

  return (
    <Box
      style={{
        minHeight: "calc(100vh - 90px)",
      }}
    >
      <Grid style={{ minHeight: "calc(100vh - 90px)" }}>
        <Grid.Col
          span={{ base: 12, md: 2 }}
          style={{ borderRight: "1px solid #E5E5E5" }}
        >
          <SettingsSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 10 }}>
          <Box
            p={60}
            style={{ background: "white", minHeight: "100%", maxWidth: 1200 }}
          >
            {activeTab === "profil" && <EditProfile />}
            {activeTab === "platby" && <PaymentsHistory />}
          </Box>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
