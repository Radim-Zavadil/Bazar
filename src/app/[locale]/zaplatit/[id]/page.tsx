"use client";

import { Box, Button, Center, Image, Loader, Stack, Text } from "@mantine/core";
import confetti from "canvas-confetti";
import { use, useEffect, useState } from "react";
import { FaRegCircleCheck } from "react-icons/fa6";

interface PaymentPageProps {
  params: Promise<{ id: string }>;
}

export default function ZaplatitPage({ params }: PaymentPageProps) {
  const { id: sessionId } = use(params);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (success) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 10000,
      });
    }
  }, [success]);

  useEffect(() => {
    fetch(`/api/payments/${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Payment not found");
        return res.json();
      })
      .then((data) => {
        if (data.status === "completed") {
          setSuccess(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [sessionId]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch(`/api/payments/${sessionId}/confirm`, {
        method: "POST",
      });
      if (res.ok) {
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  const handleClose = () => {
    // Attempt to close the window
    window.close();
    // Fallback if window.close() is blocked (which it often is if not opened by script)
    alert("Nyní můžete toto okno zavřít.");
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh" px="xl">
        <Text ta="center" fw={600}>
          Omlouváme se, tato platba nebyla nalezena nebo již vypršela.
        </Text>
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
            {success ? (
              <>
                <FaRegCircleCheck size={60} color="#237DC5" />
                <Text size="lg" fw={500} c="#8E8E93">
                  Hotovo
                </Text>
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
        {success ? (
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
