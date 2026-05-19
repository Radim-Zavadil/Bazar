"use client";

import {
  Box,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Upload, X } from "lucide-react";
import { useCallback, useRef, useState, useTransition } from "react";
import { createListing } from "@/actions/listing.actions";

const CATEGORIES = ["Elektronika", "Oblečení", "Nábytek", "Dětské věci", "Knihy", "Sport", "Ostatní"];

const CONDITIONS = ["Nové", "Použité"] as const;

type Condition = (typeof CONDITIONS)[number];

type Props = {
  opened: boolean;
  onClose: () => void;
};

export function CreateListingModal({ opened, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    initialValues: {
      title: "",
      price: 0,
      category: "Ostatní",
      itemCondition: "Nové" as Condition,
      description: "",
    },
    validate: {
      title: (v) => (v.trim().length === 0 ? "Název je povinný" : null),
      category: (v) => (v.trim().length === 0 ? "Kategorie je povinná" : null),
      description: (v) => (v.trim().length === 0 ? "Popis je povinný" : null),
    },
  });

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setPreviewUrl(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  const handleClose = () => {
    form.reset();
    setPreviewUrl(null);
    onClose();
  };

  const handleSubmit = form.onSubmit((values) => {
    startTransition(async () => {
      const result = await createListing({
        title: values.title,
        description: values.description,
        price: values.price,
        category: values.category,
        itemCondition: values.itemCondition,
        status: "Dostupné",
        imageUrl: previewUrl,
      });

      if (result.success) {
        handleClose();
      } else {
        form.setErrors({ title: result.error });
      }
    });
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      withCloseButton={false}
      centered
      size={540}
      radius={15}
      overlayProps={{ blur: 4, backgroundOpacity: 0.45 }}
      styles={{
        content: {
          background: "#fff",
          border: "1px solid #D5D5D5",
          borderRadius: 15,
          padding: 0,
        },
        body: { padding: 0 },
      }}
    >
      {/* Header */}
      <Group justify="space-between" align="center" px={24} py={20} style={{ borderBottom: "1px solid #EFEFEF" }}>
        <Text fw={600} size="lg" c="#202020">
          Vytvořit inzerát
        </Text>
        <UnstyledButton onClick={handleClose} style={{ lineHeight: 0 }}>
          <X size={20} color="#6C6C6C" />
        </UnstyledButton>
      </Group>

      {/* Body */}
      <form onSubmit={handleSubmit}>
        <Stack gap={20} px={24} py={20}>
          {/* Image upload */}
          <Stack gap={6}>
            <Text size="sm" fw={500} c="#3A3A3A">
              Fotografie
            </Text>
            <Box
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#1754D8" : "#D0D0D0"}`,
                borderRadius: 10,
                background: dragOver ? "#F0F4FF" : "#FAFAFA",
                minHeight: 130,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.18s ease",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {previewUrl ? (
                // biome-ignore lint: img element inside dropzone is fine
                <img
                  src={previewUrl}
                  alt="Náhled"
                  style={{
                    width: "100%",
                    height: 130,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              ) : (
                <Stack align="center" gap={8}>
                  <Box
                    style={{
                      background: "#EFEFEF",
                      borderRadius: 8,
                      padding: 10,
                      lineHeight: 0,
                    }}
                  >
                    <Upload size={22} color="#6C6C6C" />
                  </Box>
                  <Text size="sm" fw={500} c="#555">
                    Přetáhněte obrázek nebo klikněte pro nahrání
                  </Text>
                  <Text size="xs" c="#9A9A9A">
                    PNG, JPG, WEBP – max. 5 MB
                  </Text>
                </Stack>
              )}
            </Box>
            {previewUrl && (
              <Group justify="flex-end">
                <UnstyledButton onClick={() => setPreviewUrl(null)} style={{ fontSize: 12, color: "#9A9A9A" }}>
                  Odebrat obrázek
                </UnstyledButton>
              </Group>
            )}
          </Stack>

          {/* Title & Price */}
          <TextInput
            label="Název"
            placeholder="Zadejte název inzerátu"
            radius={8}
            styles={{
              label: { fontWeight: 500, fontSize: 14, color: "#3A3A3A", marginBottom: 4 },
              input: { borderColor: "#D5D5D5", fontSize: 14 },
            }}
            {...form.getInputProps("title")}
          />
          <NumberInput
            label="Cena (Kč)"
            placeholder="0"
            min={0}
            radius={8}
            description={form.values.price === 0 ? "Zadarmo" : undefined}
            styles={{
              label: { fontWeight: 500, fontSize: 14, color: "#3A3A3A", marginBottom: 4 },
              input: { borderColor: "#D5D5D5", fontSize: 14 },
              description: { color: "#1754D8", fontWeight: 500 },
            }}
            {...form.getInputProps("price")}
          />

          {/* Category */}
          <Select
            label="Kategorie"
            data={CATEGORIES}
            radius={8}
            styles={{
              label: { fontWeight: 500, fontSize: 14, color: "#3A3A3A", marginBottom: 4 },
              input: { borderColor: "#D5D5D5", fontSize: 14 },
            }}
            {...form.getInputProps("category")}
          />

          {/* Condition */}
          <Stack gap={8}>
            <Text size="sm" fw={500} c="#3A3A3A">
              Stav produktu
            </Text>
            <Group gap={12}>
              {CONDITIONS.map((cond) => {
                const isActive = form.values.itemCondition === cond;
                return (
                  <UnstyledButton
                    key={cond}
                    onClick={() => form.setFieldValue("itemCondition", cond)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    {/* Custom radio */}
                    <Box
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: isActive ? "#202020" : "transparent",
                        border: `2px solid ${isActive ? "#202020" : "#BBBBBB"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                        flexShrink: 0,
                      }}
                    >
                      {isActive && (
                        <Box
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "white",
                          }}
                        />
                      )}
                    </Box>
                    <Text size="sm" fw={500} c={isActive ? "#202020" : "#6C6C6C"}>
                      {cond}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </Group>
          </Stack>

          {/* Description */}
          <Textarea
            label="Popis"
            placeholder="Napište popis inzerátu..."
            minRows={4}
            autosize
            radius={8}
            styles={{
              label: { fontWeight: 500, fontSize: 14, color: "#3A3A3A", marginBottom: 4 },
              input: { borderColor: "#D5D5D5", fontSize: 14, resize: "vertical" },
            }}
            {...form.getInputProps("description")}
          />

          {/* Submit */}
          <Button
            type="submit"
            fullWidth
            radius={9}
            h={42}
            loading={isPending}
            style={{
              background: "#1754D8",
              color: "white",
              fontWeight: 500,
              fontSize: 15,
            }}
          >
            Přidat
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
