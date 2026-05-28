"use client";

import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Divider,
  Flex,
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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { MdClose, MdDeleteOutline, MdEdit, MdUpload } from "react-icons/md";
import { deleteListing, updateListing } from "@/actions/listing.actions";
import { useOpenChat } from "@/components/layout/PageLayout";
import { useSession } from "@/lib/auth-client";
import { StartChatButton } from "./chat/StartChatButton";
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
  const { openChat } = useOpenChat();

  const isOwner = session?.user && listing.userId === session.user.id;
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "Admin";
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

  const inputVariant = isEditing ? "default" : "unstyled";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      styles={{
        content: { background: "#000" },
        body: { height: "100%", padding: 0 },
      }}
    >
      {/* Top-left controls */}
      <Group
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 100,
        }}
        gap={12}
      >
        <ActionIcon
          onClick={onClose}
          variant="filled"
          color="white"
          radius="xl"
          size="lg"
          styles={{
            root: {
              backgroundColor: "#fff",
              color: "#000",
              "&:hover": {
                backgroundColor: "#fff",
                color: "#000",
              },
            },
          }}
          style={{
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          }}
        >
          <MdClose size={20} color="#000" />
        </ActionIcon>
        <Image src="/logo.png" alt="Logo" h={36} w="auto" fit="contain" />
      </Group>

      <Flex h="100vh" wrap="nowrap">
        {/* Left Column - Product Image */}
        <Flex
          flex={1}
          bg="#000"
          align="center"
          justify="center"
          direction="column"
          style={{
            position: "relative",
            height: "100%",
            paddingBottom: "5%", // Slightly above center
            overflow: "hidden",
          }}
        >
          {!isEditing ? (
            previewUrl || listing.imageUrl ? (
              <>
                <Box
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${previewUrl || listing.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "blur(30px) brightness(0.6)",
                    transform: "scale(1.1)",
                    zIndex: 0,
                  }}
                />
                <Image
                  src={previewUrl || listing.imageUrl || undefined}
                  alt={listing.title}
                  fit="contain"
                  style={{
                    maxWidth: "90%",
                    maxHeight: "85%",
                    zIndex: 1,
                  }}
                />
              </>
            ) : (
              <Flex
                w="100%"
                h="100%"
                align="center"
                justify="center"
                bg="#f2f2f2"
                style={{ zIndex: 1, position: "absolute", top: 0, left: 0 }}
              >
                <Text c="#888" fw={500} size="lg">
                  Bez obrázku
                </Text>
              </Flex>
            )
          ) : (
            <Box
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#1753D7" : "#444"}`,
                borderRadius: 12,
                background: dragOver ? "#111" : "#080808",
                width: "80%",
                height: "70%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.18s ease",
                overflow: "hidden",
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
                <Image src={previewUrl} alt="Náhled" fit="contain" style={{ width: "100%", height: "100%" }} />
              ) : (
                <Stack align="center" gap={12} c="#888">
                  <MdUpload size={40} />
                  <Text fw={500}>Přetáhněte obrázek nebo klikněte</Text>
                </Stack>
              )}
            </Box>
          )}
        </Flex>

        {/* Right Column - Product Details */}
        <Box
          w={480}
          bg="#fff"
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
            zIndex: 10,
          }}
        >
          {/* Scrollable Content */}
          <Box style={{ flex: 1, overflowY: "auto" }}>
            <form onSubmit={handleSubmit}>
              <Stack gap={0} p={32}>
                {/* Top Buttons (Edit/Delete) */}
                <Group justify="flex-end" mb={16}>
                  {isOwner && (
                    <ActionIcon
                      onClick={() => setIsEditing((prev) => !prev)}
                      variant="subtle"
                      color={isEditing ? "orange" : "gray"}
                      size="lg"
                      radius="md"
                      styles={{
                        root: {
                          "&:hover": {
                            color: "#f76707",
                            backgroundColor: "#fff4e6",
                          },
                        },
                      }}
                    >
                      <MdEdit size={20} />
                    </ActionIcon>
                  )}
                  {canDelete && (
                    <ActionIcon
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="subtle"
                      color="gray"
                      size="lg"
                      radius="md"
                    >
                      <MdDeleteOutline size={20} />
                    </ActionIcon>
                  )}
                </Group>

                {/* Title */}
                <TextInput
                  variant={inputVariant}
                  readOnly={!isEditing}
                  placeholder="Název inzerátu"
                  styles={{
                    input: {
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#000",
                      padding: isEditing ? undefined : 0,
                      marginBottom: 4,
                    },
                  }}
                  {...form.getInputProps("title")}
                />

                {/* Price */}
                {!isEditing ? (
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: "#000",
                      marginBottom: 8,
                    }}
                  >
                    {form.values.price === 0 || form.values.price === null ? "Zadarmo" : `${form.values.price} Kč`}
                  </Text>
                ) : (
                  <NumberInput
                    variant="default"
                    label="Cena"
                    suffix=" Kč"
                    min={0}
                    styles={{
                      input: {
                        fontSize: 16,
                        fontWeight: 500,
                        color: "#000",
                        marginBottom: 8,
                      },
                    }}
                    {...form.getInputProps("price")}
                  />
                )}

                {/* Info Tags */}
                <Stack gap={4} mb={24}>
                  <Text size="sm" c="#65676B">
                    {listing.category} • {listing.itemCondition} • {listing.status}
                  </Text>
                </Stack>

                {/* Edit mode for Category, Condition, Status */}
                {isEditing && (
                  <Stack gap={16} mb={24}>
                    <NativeSelect label="Kategorie" data={CATEGORIES} radius="md" {...form.getInputProps("category")} />
                    <NativeSelect
                      label="Stav produktu"
                      data={CONDITIONS}
                      radius="md"
                      {...form.getInputProps("itemCondition")}
                    />
                    {isOwner && (
                      <NativeSelect
                        label="Stav inzerátu"
                        data={["Dostupné", "Rezervováno", "Prodáno / předáno"]}
                        radius="md"
                        {...form.getInputProps("status")}
                      />
                    )}
                  </Stack>
                )}

                {/* Description */}
                <Box mb={24}>
                  <Text fw={600} size="lg" mb={8} c="#000">
                    Popis prodejce
                  </Text>
                  <Textarea
                    variant={inputVariant}
                    readOnly={!isEditing}
                    autosize
                    minRows={3}
                    styles={{
                      input: {
                        fontSize: 15,
                        color: "#1C1E21",
                        padding: isEditing ? undefined : 0,
                        lineHeight: 1.5,
                      },
                    }}
                    {...form.getInputProps("description")}
                  />
                </Box>

                {/* Map & Address */}
                <Box mb={32}>
                  <TextInput
                    variant={inputVariant}
                    readOnly={!isEditing}
                    placeholder="Adresa..."
                    styles={{
                      input: {
                        fontSize: 14,
                        color: "#65676B",
                        padding: isEditing ? undefined : 0,
                        marginBottom: 12,
                      },
                    }}
                    {...form.getInputProps("address")}
                  />
                  {listing.lat !== null && listing.lng !== null && (
                    <Box style={{ borderRadius: 12, overflow: "hidden" }}>
                      <ListingMap lat={listing.lat} lng={listing.lng} />
                    </Box>
                  )}
                </Box>

                <Divider mb={24} />

                {/* Seller Info */}
                <Box mb={24}>
                  <Text fw={600} size="lg" mb={16} c="#000">
                    Informace o prodejci
                  </Text>
                  <Group gap={12}>
                    <Avatar src={listing.sellerAvatar || null} radius="xl" size={48} color="blue">
                      {form.values.contactName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Text fw={600} size="md">
                      {form.values.contactName}
                    </Text>
                  </Group>
                </Box>

                {/* Save button in edit mode */}
                {isEditing && (
                  <Button type="submit" fullWidth radius="md" h={44} loading={isPending} bg="#1753D7" mt={20}>
                    Uložit změny
                  </Button>
                )}
              </Stack>
            </form>
          </Box>

          {/* Bottom Actions */}
          {!isOwner && (
            <Box p={24} style={{ borderTop: "1px solid #EFEFEF" }}>
              <StartChatButton
                listingId={listing.id}
                listingTitle={listing.title}
                listingImage={listing.imageUrl}
                listingPrice={listing.price}
                sellerName={listing.sellerName}
                currentUser={session?.user?.name ?? ""}
                onSuccess={(chatId) => {
                  onClose(); // Close modal and open chat
                  openChat(chatId);
                }}
              />
            </Box>
          )}
          {/* Delete Confirmation */}
          <Transition mounted={showDeleteConfirm} transition="slide-up" duration={400}>
            {(styles) => (
              <Box
                style={{
                  ...styles,
                  position: "fixed",
                  bottom: 40,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 3000,
                }}
              >
                <Paper shadow="lg" p="md" radius="lg" withBorder bg="white">
                  <Group gap={40}>
                    <Text fw={500}>Opravdu chcete smazat tento inzerát?</Text>
                    <Group gap="sm">
                      <Button variant="subtle" color="gray" onClick={() => setShowDeleteConfirm(false)}>
                        Zrušit
                      </Button>
                      <Button onClick={handleDelete} loading={isPending} bg="#FF4D4F">
                        Smazat
                      </Button>
                    </Group>
                  </Group>
                </Paper>
              </Box>
            )}
          </Transition>
        </Box>
      </Flex>
    </Modal>
  );
}
