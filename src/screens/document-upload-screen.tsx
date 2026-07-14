import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as MailComposer from "expo-mail-composer";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as React from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { BrandHeader } from "@/components/app";
import { Button, Card, Icon, Screen, Text } from "@/components/primitives";
import {
  getReceptionContactForLocation,
  getReceptionLocationOptions,
} from "@/data/reception-contacts";
import { resortImages } from "@/data/mock-data";
import {
  getCachedClientDashboardData,
  getCachedCurrentClientOwnerProfileForApp,
  getCurrentClientOwnerProfileForApp,
  getCurrentClientPetsForApp,
} from "@/services/client-data";
import { colors, layout, radius, radii, spacing, typography } from "@/theme";
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
  > | null>(getCachedCurrentClientOwnerProfileForApp() ?? null);
  const [pets, setPets] = React.useState<Pet[]>(getCachedClientDashboardData()?.pets ?? []);
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

    if (process.env.EXPO_OS === "ios") {
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

  function handleBack() {
    setLocation(isReservationFlowUpload ? initialLocation : "");
    goBackOrReplace("/reservations");
  }

  return (
    <View style={styles.root}>
      <BrandHeader
        compact
        leftAction={
          <Pressable accessibilityLabel="Back" accessibilityRole="button" hitSlop={8} onPress={handleBack} style={styles.backButton}>
            <Icon color={colors.burgundy} name="chevron-left" size={18} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        }
      />
      <Screen contentStyle={styles.content} onRefresh={undefined} topSafeArea={false}>
        <View style={styles.pageHeading}>
          <Text style={typography.sectionTitle}>Upload vaccination records</Text>
          <Text style={typography.bodySecondary}>
            Add a PDF or photo. We’ll send it to {hasSelectedLocation ? `${receptionContact.location} reception` : "the right reception team"} for review.
          </Text>
        </View>

        {!hasSelectedLocation ? (
          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <Text style={typography.cardTitle}>Choose a location</Text>
              <Text style={typography.bodySecondary}>Select the resort that should receive these records.</Text>
            </View>
            {locationOptions.map((option) => (
              <Pressable
                accessibilityLabel={`Send records to ${option}`}
                accessibilityRole="button"
                key={option}
                onPress={() => {
                  setLocation(option);
                  setStatusMessage(null);
                }}
                style={({ pressed }) => [styles.locationOption, pressed && styles.pressed]}
              >
                <Image source={{ uri: getLocationHeroImage(option) }} style={styles.locationImage} />
                <View style={styles.locationCopy}>
                  <Text style={typography.rowTitle}>{option}</Text>
                  <Text style={typography.caption}>Le Chateau Pet Resort</Text>
                </View>
                <Icon color={colors.burgundy} name="chevron-right" size={18} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {selectedPets.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.eyebrow}>FOR</Text>
            <Card style={styles.petContextCard}>
              {selectedPets.map((pet) => (
                <View key={pet.id} style={styles.petContextRow}>
                  <Image source={{ uri: pet.imageUrl }} style={styles.petAvatar} />
                  <View style={styles.petContextCopy}>
                    <Text style={typography.cardTitle}>{pet.name}</Text>
                    <Text style={typography.bodySecondary}>{pet.breed}</Text>
                  </View>
                  <View style={styles.selectedMark}>
                    <Icon color={colors.success} name="check" size={16} strokeWidth={2.2} />
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        {hasSelectedLocation ? (
          <View style={styles.section}>
            <View style={styles.documentsHeading}>
              <View style={styles.headingIcon}><Icon color={colors.burgundy} name="file" size={19} /></View>
              <View style={styles.headingCopy}>
                <Text style={typography.cardTitle}>Documents</Text>
                <Text style={typography.caption}>PDF, JPG, or PNG</Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel={documents.length > 0 ? "Add more records" : "Add vaccination records"}
              accessibilityRole="button"
              onPress={showAttachmentOptions}
              style={({ pressed }) => [styles.uploadZone, pressed && styles.pressed]}
            >
              <View style={styles.uploadIcon}><Icon color={colors.burgundy} name="plus" size={22} /></View>
              <View style={styles.uploadCopy}>
                <Text style={typography.rowTitle}>{documents.length > 0 ? "Add more records" : "Add vaccination records"}</Text>
                <Text style={typography.caption}>Choose a file, take a photo, or select from Photos</Text>
              </View>
              <Icon color={colors.burgundy} name="chevron-right" size={18} />
            </Pressable>
          </View>
        ) : null}

        {hasSelectedLocation && documents.length > 0 ? (
          <Card style={styles.fileList}>
            {documents.map((document) => (
              <View key={document.uri} style={styles.fileRow}>
                <View style={styles.fileIcon}><Icon color={colors.burgundy} name="file" size={17} /></View>
                <View style={styles.fileCopy}>
                  <Text numberOfLines={1} style={typography.body}>{document.name}</Text>
                  <Text style={typography.caption}>{formatFileSize(document.size)}</Text>
                </View>
                <Pressable accessibilityLabel={`Remove ${document.name}`} accessibilityRole="button" onPress={() => removeDocument(document.uri)} style={styles.removeButton}>
                  <Icon color={colors.burgundy} name="x" size={15} />
                </Pressable>
              </View>
            ))}
          </Card>
        ) : null}

        {statusMessage ? (
          <Card style={styles.statusCard}>
            <Icon color={colors.burgundy} name="info" size={18} />
            <Text style={styles.statusCopy}>{statusMessage}</Text>
          </Card>
        ) : null}
      </Screen>
      <View style={styles.footer}>
        <Button disabled={documents.length === 0 || !hasSelectedLocation || isSending} icon="mail" onPress={sendToReception} style={styles.footerButton} title={isSending ? "Preparing email" : "Send to reception"} />
      </View>
    </View>
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
  backButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxs,
    minHeight: 36,
  },
  backText: {
    ...typography.label,
    color: colors.burgundy,
  },
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xl,
  },
  documentsHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.label,
    color: colors.burgundy,
    letterSpacing: 0.8,
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
    gap: spacing.sm,
    padding: spacing.md,
  },
  fileRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.sm,
  },
  footerButton: {
    width: "100%",
  },
  headingCopy: {
    flex: 1,
  },
  headingIcon: {
    alignItems: "center",
    backgroundColor: colors.goldSoft,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  locationCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  locationImage: {
    borderRadius: radius.md,
    height: 58,
    width: 72,
  },
  locationOption: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.sm,
  },
  pageHeading: {
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.72,
  },
  removeButton: {
    alignItems: "center",
    backgroundColor: colors.burgundySoft,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  petAvatar: {
    borderRadius: radius.pill,
    height: 52,
    width: 52,
  },
  petContextCard: {
    gap: spacing.sm,
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
  sectionHeading: {
    gap: spacing.xxs,
  },
  selectedMark: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  statusCard: {
    alignItems: "flex-start",
    backgroundColor: colors.goldSoft,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  statusCopy: {
    ...typography.bodySecondary,
    flex: 1,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
    paddingBottom: layout.tabBarHeight,
  },
  uploadCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  uploadIcon: {
    alignItems: "center",
    backgroundColor: colors.burgundySoft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  uploadZone: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.card,
    borderStyle: "dashed",
    borderWidth: 1.25,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 88,
    padding: spacing.md,
  },
});
