import { useEffect, useState } from "react";
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DeveloperDataPanel } from "@/components/composites";
import { Button, Icon, Screen, Section, Text } from "@/components/primitives";
import type { IconName } from "@/components/primitives";
import { getCurrentClientOwnerProfileForApp } from "@/services/client-data";
import { runGingrDiscovery } from "@/services/gingr";
import type { GingrDiscoveryAction } from "@/services/gingr";
import { colors, radius, spacing } from "@/theme";
import { useSession } from "@/utils/session";

type ProfileModalId = "personal" | "notifications" | "privacy" | "contact";

const accountRows: Array<{ icon: IconName; id: ProfileModalId; label: string }> = [
  { icon: "user", id: "personal", label: "Personal Information" },
  { icon: "bell", id: "notifications", label: "Notifications" },
  { icon: "lock", id: "privacy", label: "Privacy & Security" },
];

const supportRows: Array<{ icon: IconName; id: ProfileModalId | "about"; label: string }> = [
  { icon: "mail", id: "contact", label: "Contact Us" },
  { icon: "info", id: "about", label: "About Le Chateau" },
];

const gingrDebugActions: Array<{
  action: GingrDiscoveryAction;
  label: string;
}> = [
  { action: "locations", label: "Test Locations" },
  { action: "location-cities", label: "Test Location Cities" },
  { action: "reservation-types", label: "Test Reservation Types" },
  { action: "list-invoices", label: "Test List Invoices" },
  { action: "report-card-files", label: "Test Report Cards" },
  { action: "owner-form", label: "Test Owner Form" },
  { action: "owner-custom-field-search", label: "Test Owner Custom Fields" },
  { action: "current-owner", label: "Test Current Owner" },
  { action: "current-owner-profile", label: "Test Owner Profile" },
  { action: "link-current-client", label: "Test Client Link" },
  { action: "current-pets", label: "Test Current Pets" },
  { action: "current-reservations", label: "Test Current Reservations" },
  { action: "reservation-detail-test", label: "Test Reservation Detail" },
  { action: "current-client-snapshot", label: "Test Current Snapshot" },
];

export function ProfileScreen() {
  const { client, signOut, user } = useSession();
  const insets = useSafeAreaInsets();
  const displayName = client?.display_name ?? "Le Chateau Guest";
  const email = client?.email ?? user?.email ?? "";
  const initials = getInitials(displayName);
  const [debugAction, setDebugAction] = useState<GingrDiscoveryAction | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [debugResponse, setDebugResponse] = useState<string | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [rawOwner, setRawOwner] = useState<Record<string, unknown> | null>(null);
  const [activeModal, setActiveModal] = useState<ProfileModalId | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOwnerProfile() {
      const ownerProfile = await getCurrentClientOwnerProfileForApp();

      if (isMounted) {
        setProfileImageUrl(ownerProfile?.imageUrl ?? null);
        setRawOwner(ownerProfile?.rawOwner ?? null);
      }
    }

    void loadOwnerProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  async function runDebugAction(action: GingrDiscoveryAction) {
    setDebugAction(action);
    setDebugError(null);
    setDebugResponse(null);
    setDebugLoading(true);

    try {
      const response = await runGingrDiscovery({ action });
      setDebugResponse(formatDebugResponse(response));
    } catch (error) {
      setDebugError(formatDebugError(error));
    } finally {
      setDebugLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.content} topSafeArea={false}>
      <View style={[styles.profileHero, { paddingTop: insets.top + spacing.xxl }]}>
        <View style={styles.profileAvatar}>
          {profileImageUrl ? (
            <Image source={{ uri: profileImageUrl }} style={styles.profileAvatarImage} />
          ) : (
            <Text variant="display" tone="accent" style={styles.profileMonogram}>
              {initials}
            </Text>
          )}
        </View>
        <Text variant="heading" tone="inverse">
          {displayName}
        </Text>
        <Text variant="caption" tone="inverse">
          {email}
        </Text>
      </View>

      <View style={styles.sectionWrap}>
        <Section title="Account" headerStyle={styles.sectionHeader}>
          {accountRows.map((item) => (
            <ProfileRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              onPress={() => {
                setActiveModal(item.id);
              }}
            />
          ))}
        </Section>
      </View>

      <View style={styles.sectionWrap}>
        <Section title="Support" headerStyle={styles.sectionHeader}>
          {supportRows.map((item) => (
            <ProfileRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              onPress={() => {
                if (item.id === "about") {
                  void Linking.openURL("https://lechateaupetresort.com/");
                  return;
                }

                setActiveModal(item.id);
              }}
            />
          ))}
        </Section>
      </View>

      {rawOwner ? (
        <View style={styles.sectionWrap}>
          <DeveloperDataPanel
            records={[{ title: "Raw Owner", data: rawOwner }]}
            subtitle="Temporary raw Gingr owner fields for choosing what to keep."
          />
        </View>
      ) : null}

      <View style={styles.debugPanel}>
        <View style={styles.debugHeader}>
          <View>
            <Text variant="heading" tone="primary">
              Gingr Debug
            </Text>
            <Text variant="caption" tone="muted">
              Temporary read-only discovery tools
            </Text>
          </View>
          <Icon color={colors.goldenrod} name="info" size={20} />
        </View>

        <View style={styles.debugButtons}>
          {gingrDebugActions.map((item) => (
            <Button
              key={item.action}
              disabled={debugLoading}
              onPress={() => {
                void runDebugAction(item.action);
              }}
              title={item.label}
              variant={debugAction === item.action ? "primary" : "secondary"}
              style={styles.debugButton}
            />
          ))}
        </View>

        {debugLoading ? (
          <Text variant="caption" tone="muted" style={styles.debugStatus}>
            Calling Gingr discovery...
          </Text>
        ) : null}

        {debugError ? (
          <View style={styles.debugError}>
            <Text variant="caption" tone="brand">
              {debugError}
            </Text>
          </View>
        ) : null}

        {debugResponse ? (
          <ScrollView style={styles.debugOutput} nestedScrollEnabled>
            <Text selectable variant="caption" tone="secondary" style={styles.debugCode}>
              {debugResponse}
            </Text>
          </ScrollView>
        ) : null}
      </View>

      <Button
        icon="log-out"
        onPress={() => {
          void signOut();
        }}
        title="Log Out"
        variant="secondary"
        style={styles.logoutButton}
      />

      <ProfileInfoModal
        activeModal={activeModal}
        clientDisplayName={displayName}
        clientEmail={email}
        clientId={client?.gingr_client_id ?? null}
        onClose={() => {
          setActiveModal(null);
        }}
        rawOwner={rawOwner}
      />
    </Screen>
  );
}

function getInitials(displayName: string) {
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "LC";
}

function formatDebugResponse(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function formatDebugError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Gingr discovery request failed.";
}

function formatFieldLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not listed";
  }

  if (Array.isArray(value)) {
    return value.length ? value.map((item) => formatFieldValue(item)).join(", ") : "Not listed";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function getPersonalInfoRows({
  clientDisplayName,
  clientEmail,
  clientId,
  rawOwner,
}: {
  clientDisplayName: string;
  clientEmail: string;
  clientId: string | null;
  rawOwner: Record<string, unknown> | null;
}) {
  const baseRows = [
    { label: "Name", value: clientDisplayName },
    { label: "Email", value: clientEmail || "Not listed" },
    { label: "Gingr Client ID", value: clientId ?? "Not linked" },
  ];

  if (!rawOwner) {
    return baseRows;
  }

  const rawRows = Object.entries(rawOwner)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({
      label: formatFieldLabel(key),
      value: formatFieldValue(value),
    }));

  return [...baseRows, ...rawRows];
}

function ProfileInfoModal({
  activeModal,
  clientDisplayName,
  clientEmail,
  clientId,
  onClose,
  rawOwner,
}: {
  activeModal: ProfileModalId | null;
  clientDisplayName: string;
  clientEmail: string;
  clientId: string | null;
  onClose: () => void;
  rawOwner: Record<string, unknown> | null;
}) {
  const isVisible = activeModal !== null;
  const modalTitle = getModalTitle(activeModal);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isVisible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text variant="heading" tone="primary" style={styles.modalTitle}>
              {modalTitle}
            </Text>
            <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.modalClose}>
              <Icon color={colors.blackCherry} name="x" size={22} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {activeModal === "personal" ? (
              <PersonalInformationRows
                rows={getPersonalInfoRows({
                  clientDisplayName,
                  clientEmail,
                  clientId,
                  rawOwner,
                })}
              />
            ) : null}

            {activeModal === "notifications" ? <NotificationsContent /> : null}
            {activeModal === "privacy" ? <PrivacyContent /> : null}
            {activeModal === "contact" ? <ContactContent /> : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function getModalTitle(activeModal: ProfileModalId | null) {
  switch (activeModal) {
    case "personal":
      return "Personal Information";
    case "notifications":
      return "Notifications";
    case "privacy":
      return "Privacy & Security";
    case "contact":
      return "Contact Us";
    default:
      return "";
  }
}

function PersonalInformationRows({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <View style={styles.infoRows}>
      {rows.map((row, index) => (
        <View key={`${row.label}-${index}`} style={styles.infoRow}>
          <Text variant="caption" tone="muted" style={styles.infoLabel}>
            {row.label}
          </Text>
          <Text selectable variant="body" tone="secondary" style={styles.infoValue}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function NotificationsContent() {
  return (
    <View style={styles.modalCopy}>
      <Icon color={colors.goldenrod} name="bell" size={28} />
      <Text variant="body" tone="secondary">
        Notifications are read-only in this beta. Reservation confirmations, request updates, and
        stay reminders will appear here as app notifications are enabled.
      </Text>
      <Text variant="caption" tone="muted">
        Device notification preferences will be available in a future release.
      </Text>
    </View>
  );
}

function PrivacyContent() {
  return (
    <View style={styles.modalCopy}>
      <Icon color={colors.goldenrod} name="lock" size={28} />
      <Text variant="body" tone="secondary">
        Le Chateau uses your verified client record to show read-only profile, pet, reservation,
        and camera access information in this beta.
      </Text>
      <Text variant="caption" tone="muted">
        App sign-in is handled separately from Gingr portal access. Reservation changes, invoices,
        deposits, and account updates still flow through the resort team and Gingr portal.
      </Text>
    </View>
  );
}

function ContactContent() {
  return (
    <View style={styles.modalCopy}>
      <Icon color={colors.goldenrod} name="mail" size={28} />
      <Text variant="body" tone="secondary">
        For reservation changes, deposits, invoices, or account updates, please contact the Le
        Chateau team directly.
      </Text>
      <Button
        icon="chevron-right"
        onPress={() => {
          void Linking.openURL("https://lechateaupetresort.com/contact/");
        }}
        title="Visit Contact Page"
        variant="secondary"
      />
    </View>
  );
}

function ProfileRow({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.profileRow, pressed && styles.profileRowPressed]}
    >
      <View style={styles.profileRowCopy}>
        <Icon color={colors.graphite} name={icon} size={21} />
        <Text variant="body" tone="secondary">
          {label}
        </Text>
      </View>
      <Icon color={colors.warmGray} name="chevron-right" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  profileHero: {
    alignItems: "center",
    backgroundColor: colors.burgundyDeep,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  profileAvatar: {
    borderColor: colors.goldenrod,
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 104,
    overflow: "hidden",
    width: 104,
  },
  profileAvatarImage: {
    height: "100%",
    width: "100%",
  },
  profileMonogram: {
    height: "100%",
    lineHeight: 98,
    textAlign: "center",
    width: "100%",
  },
  sectionWrap: {
    paddingTop: spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: spacing.xl,
  },
  profileRow: {
    alignItems: "center",
    borderBottomColor: colors.creamBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  profileRowCopy: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  profileRowPressed: {
    backgroundColor: colors.porcelain,
  },
  rawHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  rawLabel: {
    flex: 0.9,
  },
  rawPanel: {
    backgroundColor: colors.porcelain,
    borderColor: colors.creamBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
  },
  rawRow: {
    alignItems: "flex-start",
    borderBottomColor: colors.creamBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  rawValue: {
    flex: 1.35,
  },
  logoutButton: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  debugPanel: {
    backgroundColor: colors.porcelain,
    borderColor: colors.creamBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  debugHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  debugButtons: {
    gap: spacing.sm,
  },
  debugButton: {
    minHeight: 44,
  },
  debugStatus: {
    textAlign: "center",
  },
  debugError: {
    backgroundColor: colors.blush,
    borderColor: colors.creamBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  debugOutput: {
    backgroundColor: colors.linen,
    borderColor: colors.creamBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    maxHeight: 260,
    padding: spacing.md,
  },
  debugCode: {
    fontFamily: "Courier",
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(20, 14, 13, 0.58)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.ivory,
    borderColor: colors.creamBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    maxHeight: "78%",
    overflow: "hidden",
    width: "100%",
  },
  modalHeader: {
    alignItems: "center",
    borderBottomColor: colors.creamBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  modalTitle: {
    flex: 1,
  },
  modalClose: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  modalBody: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  modalCopy: {
    gap: spacing.md,
  },
  infoRows: {
    gap: spacing.sm,
  },
  infoRow: {
    borderBottomColor: colors.creamBorder,
    borderBottomWidth: 1,
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  infoLabel: {
    textTransform: "uppercase",
  },
  infoValue: {
    lineHeight: 22,
  },
});
