"use client";

import {
  Box,
  Button,
  Group,
  Image,
  Modal,
  NativeSelect,
  NumberInput,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Transition,
  UnstyledButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Pencil, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { SlTrash } from "react-icons/sl";
import { deleteListing, updateListing } from "@/actions/listing.actions";
import { useSession } from "@/lib/auth-client";
import type { Listing } from "./ListingCard";
import { ListingMap } from "./ListingMap";

const CATEGORIES = ["Elektronika", "Oblečení", "Nábytek", "Dětské věci", "Knihy", "Sport", "Ostatní"];

const CONDITIONS = ["Nové", "Použité"] as const;

type Props = {
  opened: boolean;
  onClose: () => void;
  listing: Listing;
};

export function ViewListingModal({ opened, onClose, listing }: Props) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = session?.user && listing.userId === session.user.id;
  const isAdmin = (session?.user as any)?.role === "Admin";
  const canDelete = isOwner || isAdmin;

  const form = useForm({
    initialValues: {
      title: "",
      price: 0,
      category: "",
      itemCondition: "Nové" as "Nové" | "Použité",
      status: "Dostupné",
      description: "",
      address: "",
      contactName: "",
      contactEmail: "",
    },
    validate: {
      title: (v) => (v.trim().length === 0 ? "Název je povinný" : null),
      category: (v) => (v.trim().length === 0 ? "Kategorie je povinná" : null),
      description: (v) => (v.trim().length === 0 ? "Popis je povinný" : null),
      contactName: (v) => (v.trim().length === 0 ? "Jméno kontaktu je povinné" : null),
      contactEmail: (v) => (v && !/^\S+@\S+\.\S+$/.test(v) ? "Neplatný e-mail" : null),
    },
  });

  useEffect(() => {
    if (opened) {
      form.setValues({
        title: listing.title,
        price: listing.price ?? 0,
        category: listing.category,
        itemCondition: (listing.itemCondition ?? "Nové") as "Nové" | "Použité",
        status: listing.status || "Dostupné",
        description: listing.description,
        address: listing.address || "",
        contactName: listing.sellerName,
        contactEmail: listing.contactEmail || "",
      });
      setPreviewUrl(listing.imageUrl);
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [opened, listing, form.setValues]);

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

  const handleSubmit = form.onSubmit((values) => {
    startTransition(async () => {
      const result = await updateListing(listing.id, {
        title: values.title,
        description: values.description,
        price: values.price,
        category: values.category,
        itemCondition: values.itemCondition,
        status: values.status,
        imageUrl: previewUrl,
        address: values.address,
        contactName: values.contactName,
        contactEmail: values.contactEmail,
      });

      if (result.success) {
        setIsEditing(false);
        onClose();
      } else {
        form.setErrors({ title: result.error });
      }
    });
  });

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteListing(listing.id);
      if (result.success) {
        onClose();
      } else {
        console.error(result.error);
      }
    });
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
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
            Detail inzerátu
          </Text>
          <Group gap={16}>
            {isOwner && (
              <UnstyledButton
                onClick={() => setIsEditing((prev) => !prev)}
                style={{ lineHeight: 0 }}
                aria-label="Upravit inzerát"
              >
                <Pencil size={18} color={isEditing ? "#1753D7" : "#6C6C6C"} />
              </UnstyledButton>
            )}
            {canDelete && (
              <UnstyledButton
                onClick={() => setShowDeleteConfirm(true)}
                style={{ lineHeight: 0 }}
                aria-label="Smazat inzerát"
              >
                <SlTrash size={18} color="#6C6C6C" />
              </UnstyledButton>
            )}
            <UnstyledButton onClick={onClose} style={{ lineHeight: 0 }}>
              <X size={20} color="#6C6C6C" />
            </UnstyledButton>
          </Group>
        </Group>

        {/* Body with opacity to indicate read-only (unless owner/creator) */}
        <Box style={isOwner ? undefined : { opacity: 0.65, pointerEvents: "none" }}>
          <form onSubmit={handleSubmit}>
            <Stack gap={20} px={24} py={20}>
              {/* Image display / upload */}
              <Stack gap={6}>
                <Group gap={4} wrap="nowrap">
                  <Text size="sm" fw={500} c="#3A3A3A">
                    Fotografie
                  </Text>
                  {isEditing && <Pencil size={12} color="#8A8A8A" />}
                </Group>

                {!isEditing ? (
                  listing.imageUrl || previewUrl ? (
                    <Box
                      style={{
                        border: "1px solid #D5D5D5",
                        borderRadius: 10,
                        height: 130,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <Image
                        src={previewUrl || listing.imageUrl || ""}
                        alt={listing.title}
                        style={{
                          width: "100%",
                          height: 130,
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      style={{
                        border: "2px dashed #D0D0D0",
                        borderRadius: 10,
                        background: "#FAFAFA",
                        minHeight: 130,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
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
                          Bez obrázku
                        </Text>
                      </Stack>
                    </Box>
                  )
                ) : (
                  <Stack gap={6}>
                    <Box
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${dragOver ? "#1753D7" : "#D0D0D0"}`,
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
                        <Image
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
                )}
              </Stack>

              {/* Title & Price */}
              <TextInput
                label={
                  <Group gap={4} wrap="nowrap">
                    <Text size="sm" fw={500} c="#3A3A3A">
                      Název
                    </Text>
                    {isEditing && <Pencil size={12} color="#8A8A8A" />}
                  </Group>
                }
                readOnly={!isEditing}
                radius={8}
                styles={{
                  label: { marginBottom: 4 },
                  input: {
                    borderColor: "#D5D5D5",
                    fontSize: 14,
                    background: !isEditing ? "#FFF" : undefined,
                  },
                }}
                {...form.getInputProps("title")}
              />
              <NumberInput
                label={
                  <Group gap={4} wrap="nowrap">
                    <Text size="sm" fw={500} c="#3A3A3A">
                      Cena (Kč)
                    </Text>
                    {isEditing && <Pencil size={12} color="#8A8A8A" />}
                  </Group>
                }
                readOnly={!isEditing}
                radius={8}
                description={form.values.price === 0 ? "Zadarmo" : undefined}
                styles={{
                  label: { marginBottom: 4 },
                  input: {
                    borderColor: "#D5D5D5",
                    fontSize: 14,
                    background: !isEditing ? "#FFF" : undefined,
                  },
                  description: { color: "#1754D8", fontWeight: 500 },
                }}
                {...form.getInputProps("price")}
              />

              {/* Category */}
              <NativeSelect
                label={
                  <Group gap={4} wrap="nowrap">
                    <Text size="sm" fw={500} c="#3A3A3A">
                      Kategorie
                    </Text>
                    {isEditing && <Pencil size={12} color="#8A8A8A" />}
                  </Group>
                }
                disabled={!isEditing}
                data={CATEGORIES}
                radius={8}
                styles={{
                  label: { marginBottom: 4 },
                  input: {
                    borderColor: "#D5D5D5",
                    fontSize: 14,
                    background: !isEditing ? "#FFF" : undefined,
                  },
                }}
                {...form.getInputProps("category")}
              />

              {/* Condition */}
              <Stack gap={8}>
                <Group gap={4} wrap="nowrap">
                  <Text size="sm" fw={500} c="#3A3A3A">
                    Stav produktu
                  </Text>
                  {isEditing && <Pencil size={12} color="#8A8A8A" />}
                </Group>
                <Group gap={12}>
                  {CONDITIONS.map((cond) => {
                    const isActive = form.values.itemCondition === cond;
                    return (
                      <UnstyledButton
                        key={cond}
                        onClick={isEditing ? () => form.setFieldValue("itemCondition", cond) : undefined}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: isEditing ? "pointer" : "default",
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

              {/* Status (Editable only for owner/creator) */}
              {isOwner && (
                <NativeSelect
                  label={
                    <Group gap={4} wrap="nowrap">
                      <Text size="sm" fw={500} c="#3A3A3A">
                        Stav inzerátu
                      </Text>
                      {isEditing && <Pencil size={12} color="#8A8A8A" />}
                    </Group>
                  }
                  disabled={!isEditing}
                  data={["Dostupné", "Rezervováno", "Prodáno / předáno"]}
                  radius={8}
                  styles={{
                    label: { marginBottom: 4 },
                    input: {
                      borderColor: "#D5D5D5",
                      fontSize: 14,
                      background: !isEditing ? "#FFF" : undefined,
                    },
                  }}
                  {...form.getInputProps("status")}
                />
              )}

              {/* Description */}
              <Textarea
                label={
                  <Group gap={4} wrap="nowrap">
                    <Text size="sm" fw={500} c="#3A3A3A">
                      Popis
                    </Text>
                    {isEditing && <Pencil size={12} color="#8A8A8A" />}
                  </Group>
                }
                readOnly={!isEditing}
                minRows={4}
                autosize
                radius={8}
                styles={{
                  label: { marginBottom: 4 },
                  input: {
                    borderColor: "#D5D5D5",
                    fontSize: 14,
                    resize: "none",
                    background: !isEditing ? "#FFF" : undefined,
                  },
                }}
                {...form.getInputProps("description")}
              />

              {/* Address */}
              <TextInput
                label={
                  <Group gap={4} wrap="nowrap">
                    <Text size="sm" fw={500} c="#3A3A3A">
                      Adresa
                    </Text>
                    {isEditing && <Pencil size={12} color="#8A8A8A" />}
                  </Group>
                }
                readOnly={!isEditing}
                radius={8}
                placeholder="Zadejte adresu..."
                styles={{
                  label: { marginBottom: 4 },
                  input: {
                    borderColor: "#D5D5D5",
                    fontSize: 14,
                    background: !isEditing ? "#FFF" : undefined,
                  },
                }}
                {...form.getInputProps("address")}
              />

              {/* Contact Details */}
              <Group grow wrap="nowrap" align="flex-start">
                <TextInput
                  label={
                    <Group gap={4} wrap="nowrap">
                      <Text size="sm" fw={500} c="#3A3A3A">
                        Jméno kontaktu
                      </Text>
                      {isEditing && <Pencil size={12} color="#8A8A8A" />}
                    </Group>
                  }
                  readOnly={!isEditing}
                  radius={8}
                  styles={{
                    label: { marginBottom: 4 },
                    input: {
                      borderColor: "#D5D5D5",
                      fontSize: 14,
                      background: !isEditing ? "#FFF" : undefined,
                    },
                  }}
                  {...form.getInputProps("contactName")}
                />
                <TextInput
                  label={
                    <Group gap={4} wrap="nowrap">
                      <Text size="sm" fw={500} c="#3A3A3A">
                        E-mail
                      </Text>
                      {isEditing && <Pencil size={12} color="#8A8A8A" />}
                    </Group>
                  }
                  readOnly={!isEditing}
                  radius={8}
                  styles={{
                    label: { marginBottom: 4 },
                    input: {
                      borderColor: "#D5D5D5",
                      fontSize: 14,
                      background: !isEditing ? "#FFF" : undefined,
                    },
                  }}
                  {...form.getInputProps("contactEmail")}
                />
              </Group>

              {/* Map */}
              {listing.lat !== null && listing.lng !== null && (
                <Stack gap={8}>
                  <Text size="sm" fw={500} c="#3A3A3A">
                    Poloha na mapě
                  </Text>
                  <ListingMap lat={listing.lat} lng={listing.lng} />
                </Stack>
              )}

              {/* Submit changes button */}
              {isEditing && (
                <Button
                  type="submit"
                  fullWidth
                  radius={9}
                  h={42}
                  loading={isPending}
                  style={{
                    background: "#1753D7",
                    color: "white",
                    fontWeight: 500,
                    fontSize: 15,
                    marginTop: 10,
                  }}
                >
                  Uložit změny
                </Button>
              )}
            </Stack>
          </form>
        </Box>
      </Modal>

      {/* Delete Confirmation Floating Bar */}
      <Transition mounted={showDeleteConfirm} transition="slide-up" duration={400} timingFunction="ease">
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
              zIndex: 3000,
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
                Opravdu chcete smazat tento inzerát?
              </Text>
              <Group gap="sm">
                <Button variant="subtle" color="gray" onClick={() => setShowDeleteConfirm(false)} radius="md">
                  Zrušit
                </Button>
                <Button onClick={handleDelete} loading={isPending} radius="md" bg="#FF4D4F" px="xl" fw={600}>
                  Smazat
                </Button>
              </Group>
            </Paper>
          </Box>
        )}
      </Transition>
    </>
  );
}
