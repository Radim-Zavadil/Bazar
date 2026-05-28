"use client";

import { Box, Button, Center, Image, Loader, Stack, Text } from "@mantine/core";
import confetti from "canvas-confetti";
import { use, useEffect, useState } from "react";
import { FaRegCircleCheck } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";

interface PaymentPageProps {
  params: Promise<{ id: string }>;
}

type PageState = "loading" | "pending" | "already_paid" | "success" | "cancelled" | "error";

export default function ZaplatitPage({ params }: PaymentPageProps) {
  const { id: sessionId } = use(params);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [paying, setPaying] = useState(false);

  // Fire confetti only when the user actually completes the payment in this session
  useEffect(() => {
    if (pageState === "success") {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 10000,
      });
    }
  }, [pageState]);

  useEffect(() => {
    fetch(`/api/payments/${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Payment not found");
        return res.json();
      })
      .then((data) => {
        if (data.status === "completed") {
          setPageState("already_paid");
        } else if (["cancelled", "declined", "expired"].includes(data.status)) {
          setPageState("cancelled");
        } else {
          setPageState("pending");
        }
      })
      .catch(() => {
        setPageState("error");
      });
  }, [sessionId]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch(`/api/payments/${sessionId}/confirm`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.alreadyPaid) {
          // Another person already paid — show already-paid screen without confetti
          setPageState("already_paid");
        } else {
          setPageState("success");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  const handleClose = () => {
    window.close();
    alert("Nyní můžete toto okno zavřít.");
  };

  if (pageState === "loading") {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (pageState === "error") {
    return (
      <Center h="100vh" px="xl">
        <Text ta="center" fw={600}>
          Omlouváme se, tato platba nebyla nalezena nebo již vypršela.
        </Text>
      </Center>
    );
  }

  if (pageState === "cancelled") {
    return (
      <Center h="100vh" px="xl">
        <Stack align="center" gap="md">
          <IoClose size={60} color="#868E96" />
          <Text ta="center" fw={700} size="xl">
            Platba zrušena
          </Text>
          <Text ta="center" c="dimmed" size="sm">
            Tato platební výzva byla zrušena nebo odmítnuta.
          </Text>
          <Button variant="outline" color="gray" mt="md" onClick={handleClose}>
            Zavřít
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Box
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#F8F8F8",
      }}
    >
      <Box style={{ flex: 1, padding: "20px" }}>
        <Stack align="center" gap={40} mt={40}>
          {/* Card Image */}
          <Box
            style={{
              width: "100%",
              maxWidth: 340,
              filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.15))",
            }}
          >
            <Image src="/card.png" alt="Payment Card" radius="lg" />
          </Box>

          {/* Status Section */}
          <Stack align="center" gap={12}>
            {pageState === "success" || pageState === "already_paid" ? (
              <>
                <FaRegCircleCheck size={60} color="#237DC5" />
                <Text size="lg" fw={500} c="#8E8E93">
                  {pageState === "already_paid" ? "Již zaplaceno" : "Hotovo"}
                </Text>
                {pageState === "already_paid" && (
                  <Text size="sm" c="dimmed" ta="center" px="xl">
                    Tato platba již byla uhrazena.
                  </Text>
                )}
              </>
            ) : (
              <Text size="lg" fw={500} c="#8E8E93">
                Klikni na tlačítko zaplatit
              </Text>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Button Section */}
      <Box
        style={{
          padding: "20px 24px 40px",
          background: "#fff",
          borderTop: "1px solid #EFEFEF",
        }}
      >
        {pageState === "success" || pageState === "already_paid" ? (
          <Button
            fullWidth
            radius="lg"
            h={54}
            bg="#8E8E93"
            onClick={handleClose}
            style={{ fontSize: 18, fontWeight: 600 }}
          >
            Zavřít
          </Button>
        ) : (
          <Button
            fullWidth
            radius="lg"
            h={54}
            bg="#007AFF"
            onClick={handlePay}
            loading={paying}
            style={{ fontSize: 18, fontWeight: 600 }}
          >
            Zaplatit
          </Button>
        )}
      </Box>
    </Box>
  );
}
