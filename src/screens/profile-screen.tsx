import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Icon, Screen, Section, Text } from "@/components/primitives";
import type { IconName } from "@/components/primitives";
import { getCurrentClientOwnerProfileForApp } from "@/services/client-data";
import { runGingrDiscovery } from "@/services/gingr";
import type { GingrDiscoveryAction } from "@/services/gingr";
import { colors, radius, spacing } from "@/theme";
import { useSession } from "@/utils/session";

const accountRows: Array<{ icon: IconName; label: string }> = [
  { icon: "user", label: "Personal Information" },
  { icon: "credit-card", label: "Payment Methods" },
  { icon: "bell", label: "Notifications" },
  { icon: "lock", label: "Privacy & Security" },
];

const supportRows: Array<{ icon: IconName; label: string }> = [
  { icon: "help", label: "Help Center" },
  { icon: "mail", label: "Contact Us" },
  { icon: "info", label: "About Le Chateau" },
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
  { action: "current-owner", label: "Test Current Owner" },
  { action: "current-owner-profile", label: "Test Owner Profile" },
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
            <ProfileRow key={item.label} icon={item.icon} label={item.label} />
          ))}
        </Section>
      </View>

      <View style={styles.sectionWrap}>
        <Section title="Support" headerStyle={styles.sectionHeader}>
          {supportRows.map((item) => (
            <ProfileRow key={item.label} icon={item.icon} label={item.label} />
          ))}
        </Section>
      </View>

      {rawOwner ? (
        <View style={styles.sectionWrap}>
          <Section
            title="Developer Data"
            subtitle="Temporary raw Gingr owner fields for choosing what to keep."
            headerStyle={styles.sectionHeader}
          >
            <View style={styles.rawPanel}>
              <View style={styles.rawHeader}>
                <Text variant="title">Raw Owner</Text>
                <Text variant="caption" tone="muted">
                  {Object.keys(rawOwner).length} fields
                </Text>
              </View>
              {Object.entries(rawOwner)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => (
                  <RawRow key={key} label={key} value={formatRawValue(value)} />
                ))}
            </View>
          </Section>
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

function formatRawValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function RawRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.rawRow}>
      <Text variant="caption" tone="muted" style={styles.rawLabel}>
        {label}
      </Text>
      <Text selectable variant="caption" tone={value ? "secondary" : "muted"} style={styles.rawValue}>
        {value || "Empty"}
      </Text>
    </View>
  );
}

function ProfileRow({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.profileRow}>
      <View style={styles.profileRowCopy}>
        <Icon color={colors.graphite} name={icon} size={21} />
        <Text variant="body" tone="secondary">
          {label}
        </Text>
      </View>
      <Icon color={colors.warmGray} name="chevron-right" size={20} />
    </View>
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
});
