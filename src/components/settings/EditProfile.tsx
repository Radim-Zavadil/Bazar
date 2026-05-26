"use client";

import { Avatar, Box, Button, Divider, Group, Stack, Text, TextInput, Transition, UnstyledButton } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteUser, updateUser, useSession } from "@/lib/auth-client";

export function EditProfile() {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDirty, setIsDirty] = useState(false);

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
    },
    validate: {
      name: (v) => (v.trim().length === 0 ? "Jméno je povinné" : null),
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Neplatný e-mail"),
    },
  });

  useEffect(() => {
    if (session?.user) {
      form.setValues({
        name: session.user.name || "",
        email: session.user.email || "",
      });
      setPreviewUrl(session.user.image || null);
      form.resetDirty();
      setIsDirty(false);
    }
  }, [session]);

  // Track dirtiness including image
  useEffect(() => {
    const nameChanged = form.values.name !== (session?.user?.name || "");
    const emailChanged = form.values.email !== (session?.user?.email || "");
    const imageChanged = previewUrl !== (session?.user?.image || null);
    setIsDirty(nameChanged || emailChanged || imageChanged);
  }, [form.values, previewUrl, session]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setPreviewUrl(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      const updateData: { name?: string; email?: string; image?: string } = {};

      if (form.values.name !== (session?.user?.name || "")) {
        updateData.name = form.values.name;
      }

      if (form.values.email !== (session?.user?.email || "")) {
        updateData.email = form.values.email;
      }

      if (previewUrl !== (session?.user?.image || null)) {
        updateData.image = previewUrl || "";
      }

      if (Object.keys(updateData).length === 0) return;

      const { error } = await updateUser(updateData);

      if (!error) {
        setIsDirty(false);
        form.resetDirty();
        // Force refresh to update session and UI components
        window.location.reload();
      } else {
        console.error("Update failed:", error);
      }
    });
  };

  const handleDeleteAccount = async () => {
    if (confirm("Opravdu chcete odstranit svůj účet? Tato akce je nevratná.")) {
      await deleteUser();
      window.location.href = "/";
    }
  };

  return (
    <Stack gap={40} pb={80} style={{ position: "relative" }}>
      <Box style={{ position: "relative", marginBottom: 40 }}>
        {/* Banner placeholder */}
        <Box h={180} bg="#F2F2F2" style={{ borderRadius: "12px" }} />

        {/* Avatar overlapping banner */}
        <Box
          style={{
            position: "absolute",
            bottom: -50,
            left: 40,
            zIndex: 2,
          }}
        >
          <Box
            style={{
              position: "relative",
              padding: 4,
              borderRadius: "50%",
              background: "white",
              boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar src={previewUrl} size={110} radius="xl" style={{ border: "4px solid white" }}>
              {session?.user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </Box>
      </Box>

      <Stack gap="xl" maw={600} mt={20}>
        <Box>
          <Text fw={600} size="sm" mb={8} c="#333">
            Jméno
          </Text>
          <TextInput
            placeholder="Your name"
            {...form.getInputProps("name")}
            radius="md"
            styles={{
              input: { height: 48, borderColor: "#E5E5E5" },
            }}
          />
          <Text size="xs" c="dimmed" ta="right" mt={4}>
            {form.values.name.length}/100
          </Text>
        </Box>

        <Box>
          <Text fw={600} size="sm" mb={8} c="#333">
            Email
          </Text>
          <TextInput
            placeholder="Your email"
            {...form.getInputProps("email")}
            radius="md"
            styles={{
              input: { height: 48, borderColor: "#E5E5E5" },
            }}
          />
        </Box>

        <Divider my={20} />

        <Box>
          <Text fw={600} mb="xs" c="#333">
            Odstranit účet
          </Text>
          <Text size="sm" c="dimmed" mb="lg">
            Jakmile odstraníte svůj účet, není cesty zpět. Všechny vaše inzeráty a data budou trvale smazána.
          </Text>
          <Button
            variant="outline"
            color="red"
            radius={15}
            h={45}
            onClick={handleDeleteAccount}
            styles={{
              root: {
                borderColor: "#D5D5D5",
                backgroundColor: "white",
                color: "#FF4D4F",
                fontWeight: 600,
              },
            }}
          >
            Odstranit účet
          </Button>
        </Box>
      </Stack>

      {/* Floating Save Bar */}
      <Transition mounted={isDirty} transition="slide-up" duration={400} timingFunction="ease">
        {(styles) => (
          <Box
            style={{
              ...styles,
              position: "fixed",
              bottom: 40,
              left: "50%",
              transform: "translateX(-50%)",
              width: "fit-content",
              minWidth: 500,
              zIndex: 100,
            }}
          >
            <Paper
              shadow="lg"
              p="md"
              style={{
                borderRadius: "18px",
                border: "1px solid #E5E5E5",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 40,
              }}
            >
              <Text c="#6C6C6C" fw={500}>
                Něco jste změnili!
              </Text>
              <Button onClick={handleSubmit} loading={isPending} radius="md" bg="#1754D8" px="xl" fw={600}>
                Uložit změny
              </Button>
            </Paper>
          </Box>
        )}
      </Transition>
    </Stack>
  );
}

// Helper to keep the Paper import clean
import { Paper } from "@mantine/core";
