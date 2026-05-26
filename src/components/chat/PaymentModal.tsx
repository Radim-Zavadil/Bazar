"use client";

import {
  Anchor,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Image,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import { FaCircleCheck, FaCreditCard, FaQrcode } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";

interface PaymentModalProps {
  opened: boolean;
  onClose: () => void;
  amount: number;
  chatId: number;
  listingId: number;
  buyerName: string;
  sellerName: string;
  onSuccess: () => void;
}

type PaymentMethod = "card" | "qr";

export function PaymentModal({
  opened,
  onClose,
  amount,
  chatId,
  listingId,
  buyerName,
  sellerName,
  onSuccess,
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);

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

  const form = useForm({
    initialValues: {
      cardNumber: "",
      expiry: "",
      cvc: "",
      name: "",
    },
    validate: {
      cardNumber: (v) =>
        method === "card" && !/^\d{16}$/.test(v.replace(/\s/g, "")) ? "Číslo karty musí mít 16 číslic" : null,
      expiry: (v) => (method === "card" && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(v) ? "Formát MM/YY" : null),
      cvc: (v) => (method === "card" && !/^\d{3}$/.test(v) ? "CVC musí mít 3 číslice" : null),
      name: (v) => (method === "card" && v.trim().length === 0 ? "Jméno je povinné" : null),
    },
  });

  // Poll for QR payment status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (method === "qr" && qrSessionId && !success) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments?sessionId=${qrSessionId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "completed") {
              setSuccess(true);
              onSuccess();
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [method, qrSessionId, success, onSuccess]);

  // Generate QR session when switching to QR method
  useEffect(() => {
    if (method === "qr" && !qrSessionId && opened) {
      const createQrSession = async () => {
        try {
          const res = await fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatId,
              listingId,
              buyerName,
              sellerName,
              amount,
              method: "qr",
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setQrSessionId(data.sessionId);
          }
        } catch (err) {
          console.error("Failed to create QR session:", err);
        }
      };
      createQrSession();
    }
  }, [method, qrSessionId, chatId, listingId, buyerName, sellerName, amount, opened]);

  const handleClose = () => {
    form.reset();
    setSuccess(false);
    setQrSessionId(null);
    onClose();
  };

  const handlePayment = async () => {
    if (method === "qr") return;

    const validation = form.validate();
    if (validation.hasErrors) return;

    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          listingId,
          buyerName,
          sellerName,
          amount,
          method,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Modal
        opened={opened}
        onClose={handleClose}
        withCloseButton={false}
        centered
        radius={15}
        overlayProps={{ blur: 4, backgroundOpacity: 0.45 }}
      >
        <Stack align="center" py="xl" gap="md">
          <FaCircleCheck size={60} color="#99E068" />
          <Text fw={700} size="xl" c="#000">
            Platba proběhla úspěšně
          </Text>
          <Button variant="subtle" color="gray" onClick={handleClose} mt="md" fullWidth radius="md">
            Zpět do zpráv
          </Button>
        </Stack>
      </Modal>
    );
  }

  // On localhost, we need the local IP for the phone to reach the computer.
  // Using 172.16.2.127 as found in ipconfig. In production, this would be the real domain.
  const baseUrl = window.location.hostname === "localhost" ? "http://172.16.2.127:3000" : window.location.origin;
  const qrUrl = qrSessionId ? `${baseUrl}/cs/zaplatit/${qrSessionId}` : "";
  const qrImage = qrUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}`
    : "";

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      withCloseButton={false}
      centered
      size={440}
      radius={15}
      overlayProps={{ blur: 4, backgroundOpacity: 0.45 }}
      styles={{
        content: { padding: 0, overflow: "hidden" },
        body: { padding: 0 },
      }}
    >
      {/* Header */}
      <Group justify="space-between" px={24} py={20}>
        <Text fw={600} size="lg">
          Platba
        </Text>
        <UnstyledButton onClick={handleClose}>
          <IoClose size={24} color="#6C6C6C" />
        </UnstyledButton>
      </Group>

      <Box px={24} pb={24}>
        <Stack gap={16}>
          {/* Method Selection Section */}
          <Box
            style={{
              border: "1px solid #EFEFEF",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {/* Debit Card Option */}
            <Box
              onClick={() => setMethod("card")}
              style={{
                padding: "16px 20px",
                cursor: "pointer",
                background: method === "card" ? "#fff" : "transparent",
              }}
            >
              <Group gap={12} wrap="nowrap">
                <Box
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: `2px solid ${method === "card" ? "#1754D8" : "#BBBBBB"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {method === "card" && (
                    <Box
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#1754D8",
                      }}
                    />
                  )}
                </Box>
                <FaCreditCard size={18} color="#6C6C6C" />
                <Text fw={500} size="sm" style={{ flex: 1 }}>
                  Debitní karta
                </Text>
              </Group>

              {method === "card" && (
                <Stack gap={12} mt={20}>
                  <Text size="xs" fw={600} c="#6C6C6C">
                    Informace o kartě
                  </Text>
                  <TextInput placeholder="1234 1234 1234 1234" {...form.getInputProps("cardNumber")} radius="md" />
                  <Group grow gap="sm">
                    <TextInput placeholder="MM / YY" {...form.getInputProps("expiry")} radius="md" />
                    <TextInput placeholder="CVC" {...form.getInputProps("cvc")} radius="md" />
                  </Group>

                  <Text size="xs" fw={600} c="#6C6C6C" mt={8}>
                    Fakturační údaje
                  </Text>
                  <TextInput placeholder="Jméno" {...form.getInputProps("name")} radius="md" />
                </Stack>
              )}
            </Box>

            <Divider color="#F5F5F5" />

            {/* QR Code Option */}
            <Box
              onClick={() => setMethod("qr")}
              style={{
                padding: "16px 20px",
                cursor: "pointer",
                background: method === "qr" ? "#fff" : "transparent",
              }}
            >
              <Group gap={12} wrap="nowrap">
                <Box
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: `2px solid ${method === "qr" ? "#1754D8" : "#BBBBBB"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {method === "qr" && (
                    <Box
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#1754D8",
                      }}
                    />
                  )}
                </Box>
                <FaQrcode size={18} color="#6C6C6C" />
                <Text fw={500} size="sm">
                  QR kód
                </Text>
              </Group>

              {method === "qr" && (
                <Stack align="center" gap="sm" mt={20}>
                  {qrSessionId ? (
                    <>
                      <Box
                        style={{
                          padding: 12,
                          border: "1px solid #EFEFEF",
                          borderRadius: 12,
                        }}
                      >
                        <Image src={qrImage} w={180} h={180} alt="QR Code" />
                      </Box>
                      <Stack gap={4} align="center">
                        <Text size="xs" c="dimmed" ta="center" px="xl">
                          Naskenujte QR kód telefonem nebo pro testování klikněte na odkaz níže:
                        </Text>
                        <Anchor href={`/cs/zaplatit/${qrSessionId}`} target="_blank" size="xs" fw={500}>
                          Otevřít platbu v novém okně
                        </Anchor>
                      </Stack>
                    </>
                  ) : (
                    <Center h={180}>
                      <Loader size="sm" />
                    </Center>
                  )}
                </Stack>
              )}
            </Box>
          </Box>

          {/* Amount Section */}
          <Group justify="space-between" mt={10}>
            <Text fw={500} c="#6C6C6C">
              Celková částka
            </Text>
            <Text fw={700} size="lg">
              {amount} Kč
            </Text>
          </Group>

          <Divider color="#EFEFEF" />

          {/* Pay Button */}
          {method === "card" && (
            <Button
              fullWidth
              radius="md"
              h={48}
              style={{ background: "#1754D8" }}
              onClick={handlePayment}
              loading={loading}
            >
              Zaplatit
            </Button>
          )}
        </Stack>
      </Box>
    </Modal>
  );
}
