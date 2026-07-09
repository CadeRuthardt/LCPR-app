import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Icon, Screen, Section, Text } from "@/components/primitives";
import type { IconName } from "@/components/primitives";
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

export function ProfileScreen() {
  const { client, signOut, user } = useSession();
  const insets = useSafeAreaInsets();
  const displayName = client?.display_name ?? "Le Chateau Guest";
  const email = client?.email ?? user?.email ?? "";
  const initials = getInitials(displayName);

  return (
    <Screen contentStyle={styles.content} topSafeArea={false}>
      <View style={[styles.profileHero, { paddingTop: insets.top + spacing.xxl }]}>
        <Text variant="display" tone="accent" style={styles.profileMonogram}>
          {initials}
        </Text>
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
  profileMonogram: {
    borderColor: colors.goldenrod,
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 104,
    lineHeight: 98,
    overflow: "hidden",
    textAlign: "center",
    width: 104,
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
  logoutButton: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
});
