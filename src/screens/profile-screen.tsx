import { StyleSheet, View } from "react-native";

import { Button, Icon, Screen, Section, Text } from "@/components/primitives";
import type { IconName } from "@/components/primitives";
import { guest } from "@/data/mock-data";
import { colors, radius, spacing } from "@/theme";
import { useMockSession } from "@/utils/mock-session";

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
  const { signOut } = useMockSession();

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.profileHero}>
        <Text variant="display" tone="accent" style={styles.profileMonogram}>
          SC
        </Text>
        <Text variant="heading" tone="inverse">
          {guest.firstName} {guest.lastName}
        </Text>
        <Text variant="caption" tone="inverse">
          {guest.email}
        </Text>
      </View>
      <Section title="Account">
        {accountRows.map((item) => (
          <ProfileRow key={item.label} icon={item.icon} label={item.label} />
        ))}
      </Section>
      <Section title="Support">
        {supportRows.map((item) => (
          <ProfileRow key={item.label} icon={item.icon} label={item.label} />
        ))}
      </Section>
      <Button
        icon="log-out"
        onPress={signOut}
        title="Log Out"
        variant="secondary"
        style={styles.logoutButton}
      />
    </Screen>
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
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  profileHero: {
    alignItems: "center",
    backgroundColor: colors.burgundyDeep,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.display,
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
  },
});
