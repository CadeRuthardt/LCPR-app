import * as React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Card, Icon, Text } from "@/components/primitives";
import { colors, radius, spacing } from "@/theme";

type DeveloperDataPanelProps = {
  records: Array<{
    data: Record<string, unknown>;
    title: string;
  }>;
  subtitle?: string;
  title?: string;
};

export function DeveloperDataPanel({
  records,
  subtitle = "Temporary raw Gingr fields for choosing what to keep.",
  title = "Developer Data",
}: DeveloperDataPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const fieldCount = records.reduce((total, record) => total + Object.keys(record.data).length, 0);

  if (records.length === 0) {
    return null;
  }

  return (
    <Card variant="elevated" style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((current) => !current)}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <View style={styles.headerCopy}>
          <Text variant="title">{title}</Text>
          <Text variant="caption" tone="muted">
            {fieldCount} fields
          </Text>
          {subtitle ? (
            <Text variant="caption" tone="muted">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Icon
          color={colors.blackCherry}
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
        />
      </Pressable>

      {isOpen ? (
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator
          style={styles.scrollBox}
          contentContainerStyle={styles.scrollContent}
        >
          {records.map((record, index) => (
            <View key={`${record.title}-${index}`} style={styles.record}>
              <Text variant="label" tone="accent" style={styles.recordTitle}>
                {record.title}
              </Text>
              {Object.entries(record.data)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => (
                  <RawFieldRow key={`${record.title}-${key}`} label={key} value={value} />
                ))}
            </View>
          ))}
        </ScrollView>
      ) : null}
    </Card>
  );
}

function RawFieldRow({ label, value }: { label: string; value: unknown }) {
  const formattedValue = formatRawValue(value);

  return (
    <View style={styles.row}>
      <Text variant="caption" tone="muted" style={styles.label}>
        {label}
      </Text>
      <Text
        selectable
        variant="caption"
        tone={formattedValue ? "secondary" : "muted"}
        style={styles.value}
      >
        {formattedValue || "Empty"}
      </Text>
    </View>
  );
}

function formatRawValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: 0,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    flex: 0.42,
  },
  pressed: {
    backgroundColor: colors.parchment,
  },
  record: {
    gap: spacing.xs,
  },
  recordTitle: {
    marginBottom: spacing.xs,
  },
  row: {
    borderBottomColor: colors.creamBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  scrollBox: {
    borderTopColor: colors.creamBorder,
    borderTopWidth: 1,
    maxHeight: 260,
  },
  scrollContent: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  value: {
    backgroundColor: colors.ivory,
    borderRadius: radius.sm,
    flex: 0.58,
    padding: spacing.xs,
  },
});
