import { router } from "expo-router";
import { Image, StyleSheet, View } from "react-native";

import { Button, Card, Icon, Screen, Text } from "@/components/primitives";
import { pets } from "@/data/mock-data";
import { colors, radius, spacing } from "@/theme";

const steps = ["Pets", "Dates", "Experience", "Details"] as const;

export function RequestStayScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
        <Text variant="title" style={styles.headerTitle}>
          New Reservation Request
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.stepper}>
        {steps.map((step, index) => {
          const isActive = index === 0;

          return (
            <View key={step} style={styles.stepItem}>
              <View style={[styles.stepCircle, isActive && styles.stepCircleActive]}>
                <Text variant="caption" tone={isActive ? "inverse" : "secondary"}>
                  {index + 1}
                </Text>
              </View>
              <Text variant="caption" tone="secondary">
                {step}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionHeader}>
        <Text variant="title">Which pet(s) is this for?</Text>
        <Text variant="caption" tone="secondary">
          Select all that apply.
        </Text>
      </View>

      <View style={styles.petList}>
        {pets.map((pet, index) => (
          <Card key={pet.id} variant="elevated" style={styles.petOption}>
            <Image source={{ uri: pet.imageUrl }} style={styles.petAvatar} />
            <View style={styles.petCopy}>
              <Text variant="title">{pet.name}</Text>
              <Text variant="caption" tone="secondary">
                {pet.breed}
              </Text>
              <Text variant="caption" tone="secondary">
                {pet.age} old
              </Text>
            </View>
            <View style={[styles.selectCircle, index === 0 && styles.selectCircleActive]}>
              {index === 0 ? <Icon color={colors.ivory} name="check" size={14} /> : null}
            </View>
          </Card>
        ))}
      </View>

      <Button icon="plus" title="Add Another Pet" variant="secondary" />

      <View style={styles.footerActions}>
        <Button title="Continue" />
        <Button title="Save and Finish Later" variant="ghost" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 72,
  },
  stepper: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
  },
  stepCircle: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  stepCircleActive: {
    backgroundColor: colors.blackCherry,
  },
  divider: {
    backgroundColor: colors.creamBorder,
    height: 1,
  },
  sectionHeader: {
    gap: spacing.xxs,
  },
  petList: {
    gap: spacing.md,
  },
  petOption: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  petAvatar: {
    borderRadius: radius.pill,
    height: 72,
    width: 72,
  },
  petCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  selectCircle: {
    alignItems: "center",
    borderColor: colors.warmGray,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  selectCircleActive: {
    backgroundColor: colors.blackCherry,
    borderColor: colors.blackCherry,
  },
  footerActions: {
    gap: spacing.sm,
  },
});
