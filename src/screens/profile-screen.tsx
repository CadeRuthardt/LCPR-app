import { StyleSheet, View } from "react-native";

import { Button, Screen, Section, Text } from "@/components/primitives";
import { guest } from "@/data/mock-data";
import { colors, radius, spacing } from "@/theme";

export function ProfileScreen() {
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
        {["Personal Information", "Payment Methods", "Notifications", "Privacy & Security"].map(
          (item) => (
            <ProfileRow key={item} label={item} />
          ),
        )}
      </Section>
      <Section title="Support">
        {["Help Center", "Contact Us", "About Le Chateau"].map((item) => (
          <ProfileRow key={item} label={item} />
        ))}
      </Section>
      <Button title="Log Out" variant="secondary" />
    </Screen>
  );
}

function ProfileRow({ label }: { label: string }) {
  return (
    <View style={styles.profileRow}>
      <Text variant="body" tone="secondary">
        {label}
      </Text>
      <Text variant="title" tone="muted">
        {">"}
      </Text>
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
});
