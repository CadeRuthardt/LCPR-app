import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as MailComposer from "expo-mail-composer";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as React from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  ImageBackground,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  BackChevronButton,
  Button,
  Card,
  Icon,
  Screen,
  Text,
} from "@/components/primitives";
import {
  getReceptionContactForLocation,
  getReceptionLocationOptions,
} from "@/data/reception-contacts";
import { resortImages } from "@/data/mock-data";
import {
  getCurrentClientOwnerProfileForApp,
  getCurrentClientPetsForApp,
} from "@/services/client-data";
import { colors, radius, spacing } from "@/theme";
import type { Pet } from "@/types/app";
import { goBackOrReplace } from "@/utils/navigation";
import { useSession } from "@/utils/session";

type SelectedDocument = {
  mimeType?: string | null;
  name: string;
  size?: number | null;
  uri: string;
};

export function DocumentUploadScreen() {
  const params = useLocalSearchParams<{ location?: string; petIds?: string }>();
  const { client, user } = useSession();
  const initialLocation = normalizeParam(params.location) ?? "";
  const isReservationFlowUpload = Boolean(initialLocation);
  const [documents, setDocuments] = React.useState<SelectedDocument[]>([]);
  const [isSending, setIsSending] = React.useState(false);
  const [location, setLocation] = React.useState(initialLocation);
  const [ownerProfile, setOwnerProfile] = React.useState<Awaited<
    ReturnType<typeof getCurrentClientOwnerProfileForApp>
  > | null>(null);
  const [pets, setPets] = React.useState<Pet[]>([]);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const selectedPetIds = React.useMemo(
    () => new Set((params.petIds ?? "").split(",").filter(Boolean)),
    [params.petIds],
  );
  const selectedPets = pets.filter((pet) => selectedPetIds.has(pet.id));
  const petNames = selectedPets.map((pet) => pet.name).join(", ");
  const receptionContact = getReceptionContactForLocation(location);
  const locationOptions = getReceptionLocationOptions();
  const hasSelectedLocation = locationOptions.includes(receptionContact.location);
  const heroImageUrl = getLocationHeroImage(receptionContact.location);
  const isMultiPetUpload = selectedPets.length > 1;

  React.useEffect(() => {
    let isMounted = true;

    Promise.all([getCurrentClientPetsForApp(), getCurrentClientOwnerProfileForApp()])
      .then(([loadedPets, loadedOwnerProfile]) => {
        if (isMounted) {
          setPets(loadedPets);
          setOwnerProfile(loadedOwnerProfile);
        }
      })
      .catch((error: unknown) => {
        console.warn("Unable to load vaccination upload context.", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!isReservationFlowUpload) {
        setLocation("");
      }
    }, [isReservationFlowUpload]),
  );

  function showAttachmentOptions() {
    const options = ["Upload File", "Take Picture", "Upload Photo", "Cancel"];
    const cancelButtonIndex = 3;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          cancelButtonIndex,
          options,
          title: "Add vaccination records",
        },
        (selectedIndex) => {
          if (selectedIndex === 0) {
            pickDocuments();
          } else if (selectedIndex === 1) {
            takePicture();
          } else if (selectedIndex === 2) {
            pickPhotos();
          }
        },
      );
      return;
    }

    Alert.alert("Add vaccination records", undefined, [
      { onPress: pickDocuments, text: "Upload File" },
      { onPress: takePicture, text: "Take Picture" },
      { onPress: pickPhotos, text: "Upload Photo" },
      { style: "cancel", text: "Cancel" },
    ]);
  }

  async function pickDocuments() {
    setStatusMessage(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: ["application/pdf", "image/*"],
      });

      if (result.canceled) {
        return;
      }

      const nextDocuments = result.assets.map((asset) => ({
        mimeType: asset.mimeType,
        name: asset.name,
        size: asset.size,
        uri: asset.uri,
      }));

      setDocuments((currentDocuments) => dedupeDocuments([...currentDocuments, ...nextDocuments]));
    } catch (error) {
      console.warn("Unable to pick vaccination document.", error);
      setStatusMessage(
        "That file could not be opened from its current location. Download it to your phone, then try again.",
      );
    }
  }

  async function takePicture() {
    setStatusMessage(null);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        setStatusMessage("Camera access is needed to take a photo of vaccination records.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        mediaTypes: ["images"],
        quality: 0.9,
      });

      if (result.canceled) {
        return;
      }

      setDocuments((currentDocuments) =>
        dedupeDocuments([...currentDocuments, ...result.assets.map(imageAssetToDocument)]),
      );
    } catch (error) {
      console.warn("Unable to take vaccination record photo.", error);
      setStatusMessage("We could not open the camera. Please try again.");
    }
  }

  async function pickPhotos() {
    setStatusMessage(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setStatusMessage("Photo access is needed to attach vaccination records.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        allowsMultipleSelection: true,
        mediaTypes: ["images"],
        quality: 0.9,
      });

      if (result.canceled) {
        return;
      }

      setDocuments((currentDocuments) =>
        dedupeDocuments([...currentDocuments, ...result.assets.map(imageAssetToDocument)]),
      );
    } catch (error) {
      console.warn("Unable to pick vaccination record photo.", error);
      setStatusMessage("We could not open your photos. Please try again.");
    }
  }

  function removeDocument(uri: string) {
    setDocuments((currentDocuments) =>
      currentDocuments.filter((document) => document.uri !== uri),
    );
  }

  async function sendToReception() {
    if (documents.length === 0 || !hasSelectedLocation || isSending) {
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    const subject = `${petNames || "Pet"} Vaccination Records`;
    const body = buildEmailBody({
      clientEmail: ownerProfile?.email ?? client?.email ?? user?.email ?? "Not listed",
      clientName: client?.display_name ?? user?.email ?? "Client",
      clientPhone: getOwnerPhone(ownerProfile?.rawOwner),
      documents,
      isMultiPetUpload,
      petNames: petNames || "Not specified",
    });

    try {
      const mailAvailable = await MailComposer.isAvailableAsync();

      if (!mailAvailable) {
        setStatusMessage(
          `Mail is not configured on this device. Please email the selected records to ${receptionContact.email}.`,
        );
        await Linking.openURL(
          `mailto:${receptionContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
            body,
          )}`,
        );
        return;
      }

      await MailComposer.composeAsync({
        attachments: documents.map((document) => document.uri),
        body,
        recipients: [receptionContact.email],
        subject,
      });

      setStatusMessage("Your email is ready in Mail. Tap Send there to complete the upload.");
    } catch (error) {
      console.warn("Unable to prepare vaccination upload email.", error);
      setStatusMessage(
        "We could not prepare the email. Please try again, or contact reception for help.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Screen contentStyle={styles.content} onRefresh={undefined}>
      <View style={styles.header}>
        <BackChevronButton
          onPress={() => {
            setLocation(isReservationFlowUpload ? initialLocation : "");
            goBackOrReplace("/reservations");
          }}
        />
        <Text numberOfLines={2} style={styles.headerTitle} variant="title">
          Upload Vaccination Records
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ImageBackground
        imageStyle={styles.heroImage}
        source={{ uri: heroImageUrl }}
        style={styles.hero}
      >
        <View style={styles.heroOverlay} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow} tone="inverse" variant="caption">
            {hasSelectedLocation ? receptionContact.location : "Choose Location"}
          </Text>
          <Text tone="inverse" variant="heading">
            Vaccination Records
          </Text>
          <Text style={styles.heroSubtitle} tone="inverse" variant="body">
            Choose PDF or image files and send them to reception for review.
          </Text>
        </View>
      </ImageBackground>

      {!hasSelectedLocation ? (
        <View style={styles.section}>
          <Text variant="title">Location</Text>
          <Text tone="secondary" variant="body">
            Choose the resort location so your records go to the right reception team.
          </Text>
          <View style={styles.locationGrid}>
            {locationOptions.map((option) => (
              <Button
                key={option}
                onPress={() => {
                  setLocation(option);
                  setStatusMessage(null);
                }}
                title={option}
                variant="secondary"
                style={styles.locationButton}
              />
            ))}
          </View>
        </View>
      ) : null}

      {selectedPets.length > 0 ? (
        <Card style={styles.petContextCard}>
          {selectedPets.map((pet) => (
            <View key={pet.id} style={styles.petContextRow}>
              <Image source={{ uri: pet.imageUrl }} style={styles.petAvatar} />
              <View style={styles.petContextCopy}>
                <Text variant="title">{pet.name}</Text>
                <Text tone="secondary" variant="caption">
                  {pet.breed}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {hasSelectedLocation ? (
        <View style={styles.section}>
          <Text variant="title">Documents</Text>
          <Button
            icon="plus"
            onPress={showAttachmentOptions}
            title="Add records"
            variant="secondary"
          />
        </View>
      ) : null}

      {hasSelectedLocation && documents.length > 0 ? (
        <Card style={styles.fileList}>
          {documents.map((document) => (
            <View key={document.uri} style={styles.fileRow}>
              <View style={styles.fileIcon}>
                <Icon color={colors.blackCherry} name="mail" size={16} />
              </View>
              <View style={styles.fileCopy}>
                <Text numberOfLines={1} variant="body">
                  {document.name}
                </Text>
                <Text tone="muted" variant="caption">
                  {formatFileSize(document.size)}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={`Remove ${document.name}`}
                accessibilityRole="button"
                onPress={() => removeDocument(document.uri)}
                style={styles.removeButton}
              >
                <Icon color={colors.blackCherry} name="x" size={14} />
              </Pressable>
            </View>
          ))}
        </Card>
      ) : hasSelectedLocation ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle} variant="title">
            No files selected yet
          </Text>
          <Text style={styles.emptyCopy} tone="secondary" variant="body">
            Vaccination records can be uploaded as a PDF or image.
          </Text>
        </Card>
      ) : null}

      {statusMessage ? (
        <Card style={styles.statusCard}>
          <Text tone="secondary" variant="body">
            {statusMessage}
          </Text>
        </Card>
      ) : null}

      <Button
        disabled={documents.length === 0 || !hasSelectedLocation || isSending}
        icon="chevron-right"
        onPress={sendToReception}
        title={isSending ? "Preparing email" : "Send to reception"}
      />
    </Screen>
  );
}

function buildEmailBody({
  clientEmail,
  clientName,
  clientPhone,
  documents,
  isMultiPetUpload,
  petNames,
}: {
  clientEmail: string;
  clientName: string;
  clientPhone: string;
  documents: SelectedDocument[];
  isMultiPetUpload: boolean;
  petNames: string;
}) {
  const fileList = documents.map((document) => `- ${document.name}`).join("\n");
  const possessivePetLabel = isMultiPetUpload ? "pets'" : "pet's";

  return [
    "Hello,",
    "",
    `I have attached my ${possessivePetLabel} vaccination records for your review.`,
    "",
    `Client Name: ${clientName}`,
    `Client Email: ${clientEmail}`,
    `Client Phone: ${clientPhone}`,
    `Pet Name${isMultiPetUpload ? "s" : ""}: ${petNames}`,
    "",
    "Attached Files:",
    fileList,
    "",
    "Please let me know if you need any additional information.",
    "",
    "Thank you!",
  ].join("\n");
}

function getOwnerPhone(rawOwner: Record<string, unknown> | undefined) {
  if (!rawOwner) {
    return "Not listed";
  }

  return (
    readRawString(rawOwner, [
      "phone",
      "cell_phone",
      "cellphone",
      "cell",
      "primary_phone",
      "home_phone",
      "phone_number",
      "mobile_phone",
      "mobile",
    ]) ?? "Not listed"
  );
}

function readRawString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
}

function normalizeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getLocationHeroImage(location: string) {
  const normalizedLocation = location.trim().toLowerCase();

  if (normalizedLocation.includes("wichita falls")) {
    return resortImages.wichitaFallsHero;
  }

  if (normalizedLocation.includes("new braunfels")) {
    return resortImages.homeHero;
  }

  return resortImages.loginHero;
}

function dedupeDocuments(documents: SelectedDocument[]) {
  const seenUris = new Set<string>();

  return documents.filter((document) => {
    if (seenUris.has(document.uri)) {
      return false;
    }

    seenUris.add(document.uri);
    return true;
  });
}

function imageAssetToDocument(asset: ImagePicker.ImagePickerAsset): SelectedDocument {
  const fallbackName = `vaccination-record-${Date.now()}.jpg`;

  return {
    mimeType: asset.mimeType ?? "image/jpeg",
    name: asset.fileName ?? fallbackName,
    size: asset.fileSize,
    uri: asset.uri,
  };
}

function formatFileSize(size: number | null | undefined) {
  if (!size) {
    return "Ready to attach";
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  emptyCard: {
    borderStyle: "dashed",
    gap: spacing.xs,
  },
  emptyCopy: {
    textAlign: "center",
  },
  emptyTitle: {
    textAlign: "center",
  },
  fileCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  fileIcon: {
    alignItems: "center",
    backgroundColor: colors.champagne,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  fileList: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  fileRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  hero: {
    borderRadius: radius.xxl,
    justifyContent: "flex-end",
    minHeight: 184,
    overflow: "hidden",
  },
  heroCopy: {
    gap: spacing.xxs,
    padding: spacing.xl,
  },
  heroEyebrow: {
    textTransform: "uppercase",
  },
  heroImage: {
    borderRadius: radius.xxl,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.42)",
  },
  heroSubtitle: {
    maxWidth: 280,
    opacity: 0.92,
  },
  locationButton: {
    flex: 1,
    minWidth: "48%",
  },
  locationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  removeButton: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  petAvatar: {
    borderRadius: radius.pill,
    height: 56,
    width: 56,
  },
  petContextCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  petContextCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  petContextRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  statusCard: {
    backgroundColor: colors.champagne,
    padding: spacing.lg,
  },
});
