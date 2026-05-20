"use client";

import { Button, Image, Modal, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { FiChevronLeft } from "react-icons/fi";
import { signIn, signUp } from "@/lib/auth-client";

type Mode = "login" | "register";
type Step = "email" | "password";

interface AuthModalProps {
  opened: boolean;
  mode: Mode;
  onClose: () => void;
}

export function AuthModal({ opened, mode, onClose }: AuthModalProps) {
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailForm = useForm({
    initialValues: { email: "" },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Zadej platný email"),
    },
  });

  const passwordForm = useForm({
    initialValues: { password: "" },
    validate: {
      password: (v) => (v.length >= 8 ? null : "Heslo musí mít alespoň 8 znaků"),
    },
  });

  function handleClose() {
    setStep("email");
    setError(null);
    emailForm.reset();
    passwordForm.reset();
    onClose();
  }

  function handleEmailSubmit(values: { email: string }) {
    emailForm.validate();
    if (!emailForm.isValid()) return;
    setError(null);
    setStep("password");
  }

  async function handlePasswordSubmit(values: { password: string }) {
    setLoading(true);
    setError(null);

    const email = emailForm.values.email;
    const password = values.password;

    const result =
      mode === "login"
        ? await signIn.email({ email, password })
        : await signUp.email({ email, password, name: email.split("@")[0] });

    setLoading(false);

    if (result.error) {
      setError(mode === "login" ? "Nesprávný email nebo heslo." : "Registrace selhala. Zkus jiný email.");
      return;
    }

    handleClose();
  }

  const inputStyles = {
    input: {
      border: "1px solid #969696",
      borderRadius: "10px",
      padding: "10px 14px",
    },
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      centered
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.55, blur: 6 }}
      styles={{
        content: {
          borderRadius: "15px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          padding: "32px 28px 28px",
          maxWidth: 380,
        },
        body: { padding: 0 },
      }}
      size={380}
    >
      <Stack gap="md" align="center">
        {/* Logo */}
        <Image src="/logo.png" alt="Logo" w={56} h={56} fit="contain" />

        {step === "email" ? (
          <form onSubmit={emailForm.onSubmit(handleEmailSubmit)} style={{ width: "100%" }}>
            <Stack gap="sm">
              <Text fw={500} size="lg" c="#000" ta="center">
                Zadej email
              </Text>

              <Stack gap={4}>
                <Text size="sm" c="#969696">
                  Email
                </Text>
                <TextInput
                  placeholder="johnappleseed@gmail.com"
                  {...emailForm.getInputProps("email")}
                  styles={inputStyles}
                />
              </Stack>

              <Button
                type="submit"
                fullWidth
                style={{
                  background: "#1754D8",
                  borderRadius: "10px",
                  fontWeight: 500,
                  marginTop: 4,
                }}
              >
                Pokračovat
              </Button>
            </Stack>
          </form>
        ) : (
          <form onSubmit={passwordForm.onSubmit(handlePasswordSubmit)} style={{ width: "100%" }}>
            <Stack gap="sm">
              <Text fw={500} size="lg" c="#000" ta="center">
                {mode === "login" ? "Zadej heslo" : "Vytvoř heslo"}
              </Text>

              <Stack gap={4}>
                <Text size="sm" c="#969696">
                  Heslo
                </Text>
                <PasswordInput
                  placeholder="••••••••"
                  {...passwordForm.getInputProps("password")}
                  styles={inputStyles}
                />
              </Stack>

              {error && (
                <Text size="sm" c="red" ta="center">
                  {error}
                </Text>
              )}

              <Button
                type="submit"
                fullWidth
                loading={loading}
                style={{
                  background: "#1754D8",
                  borderRadius: "8px",
                  fontWeight: 500,
                  marginTop: 4,
                }}
              >
                {mode === "login" ? "Přihlásit se" : "Registrovat se"}
              </Button>

              <Button
                variant="filled"
                size="xs"
                leftSection={<FiChevronLeft size={13} />}
                onClick={() => {
                  setError(null);
                  setStep("email");
                }}
                style={{
                  background: "#F0F0F0",
                  color: "#000",
                  borderRadius: "7px",
                  fontWeight: 500,
                  alignSelf: "center",
                }}
              >
                Zpět
              </Button>
            </Stack>
          </form>
        )}
      </Stack>
    </Modal>
  );
}
