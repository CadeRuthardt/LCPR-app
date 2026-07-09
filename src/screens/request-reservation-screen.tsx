import { router, useLocalSearchParams } from "expo-router";
import * as React from "react";
import {
  type DimensionValue,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { Button, Card, Icon, Screen, Text, TextField } from "@/components/primitives";
import { createReservationRequest, getCurrentClientPetsForApp } from "@/services/client-data";
import { colors, radius, spacing } from "@/theme";
import type { Pet } from "@/types/app";
import type { ReservationRequest } from "@/types/database";

const steps = ["Pets", "Location", "Type", "Dates", "Experience", "Details"] as const;
const locationOptions = ["Amarillo", "Wichita Falls", "New Braunfels"];
const reservationTypeOptions = ["Boarding", "Daycare", "Spa"];
const amenityPackages = ["Classic", "Premium", "Platinum VIP"];
const suiteSizes = ["Champion (4x8)", "Olympian (6x8)", "Royal (8x8)", "Chateau (10x8)"];
const enrichmentFrequencies = ["Daily", "Every other day"];
const spaServices = ["Rapid Bath", "BBB", "PPP"];
const timeOptions = buildTimeOptions();
const spaUpgrades = [
  "Royal Treatment",
  "Soft Claws",
  "Plaque Clnz",
  "Teeth Brushing",
  "Featured Scent",
  "Nail Smoothing",
  "Nail Trim",
  "Pad & Nose Protector",
  "Flea & Tick",
  "Deshed",
  "Blueberry Facial",
];

type RequestStep = (typeof steps)[number];

export function RequestReservationScreen() {
  const params = useLocalSearchParams<{ petIds?: string }>();
  const initialPetIds = React.useMemo(
    () => new Set((params.petIds ?? "").split(",").filter(Boolean)),
    [params.petIds],
  );
  const [activeStepIndex, setActiveStepIndex] = React.useState(0);
  const [activeLocationDropdown, setActiveLocationDropdown] = React.useState(false);
  const [activeTimeField, setActiveTimeField] = React.useState<"start" | "end" | null>(null);
  const [authorizedPickup, setAuthorizedPickup] = React.useState("");
  const [calendarMonth, setCalendarMonth] = React.useState(startOfMonth(new Date()));
  const [createdRequest, setCreatedRequest] = React.useState<ReservationRequest | null>(null);
  const [endDate, setEndDate] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [enrichmentEnabled, setEnrichmentEnabled] = React.useState(false);
  const [enrichmentFrequency, setEnrichmentFrequency] = React.useState(enrichmentFrequencies[0]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [exitConfirmVisible, setExitConfirmVisible] = React.useState(false);
  const [location, setLocation] = React.useState(locationOptions[0]);
  const [amenityPackage, setAmenityPackage] = React.useState(amenityPackages[0]);
  const [isLoadingPets, setIsLoadingPets] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [pets, setPets] = React.useState<Pet[]>([]);
  const [reservationType, setReservationType] = React.useState(reservationTypeOptions[0]);
  const [selectedSpaService, setSelectedSpaService] = React.useState("");
  const [selectedSpaUpgrades, setSelectedSpaUpgrades] = React.useState<Set<string>>(new Set());
  const [selectedPetIds, setSelectedPetIds] = React.useState<Set<string>>(initialPetIds);
  const [suiteSize, setSuiteSize] = React.useState(suiteSizes[0]);
  const [startDate, setStartDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const stepScrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    let isMounted = true;

    getCurrentClientPetsForApp()
      .then((clientPets) => {
        if (isMounted) {
          setPets(clientPets);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load pets.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingPets(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const canSubmit =
    selectedPetIds.size > 0 &&
    Boolean(location) &&
    Boolean(reservationType) &&
    isIsoDate(startDate) &&
    isIsoDate(endDate) &&
    isTimeValue(startTime) &&
    isTimeValue(endTime) &&
    Boolean(amenityPackage) &&
    Boolean(suiteSize) &&
    !isSubmitting;
  const activeStep = steps[activeStepIndex];
  const availableSuiteSizes = React.useMemo(
    () => suiteSizesForPackage(amenityPackage),
    [amenityPackage],
  );
  const canSelectTimes = isIsoDate(startDate) && isIsoDate(endDate);
  const currentStepNumber = activeStepIndex + 1;
  const progressPercent = `${(currentStepNumber / steps.length) * 100}%` as DimensionValue;
  const selectedPets = pets.filter((pet) => selectedPetIds.has(pet.id));

  React.useEffect(() => {
    if (!availableSuiteSizes.includes(suiteSize)) {
      setSuiteSize(availableSuiteSizes[0]);
    }
  }, [availableSuiteSizes, suiteSize]);

  React.useEffect(() => {
    stepScrollRef.current?.scrollTo({ animated: false, y: 0 });
  }, [activeStepIndex]);

  function canAdvanceFromStep(step: RequestStep) {
    if (step === "Pets") {
      return selectedPetIds.size > 0;
    }

    if (step === "Location") {
      return Boolean(location);
    }

    if (step === "Type") {
      return Boolean(reservationType);
    }

    if (step === "Dates") {
      return (
        isIsoDate(startDate) && isIsoDate(endDate) && isTimeValue(startTime) && isTimeValue(endTime)
      );
    }

    if (step === "Experience") {
      return Boolean(amenityPackage) && Boolean(suiteSize);
    }

    return canSubmit;
  }

  function canNavigateToStep(stepIndex: number) {
    if (stepIndex <= activeStepIndex) {
      return true;
    }

    return steps.slice(0, stepIndex).every(canAdvanceFromStep);
  }

  function togglePet(petId: string) {
    setSelectedPetIds((current) => toggleSetValue(current, petId));
  }

  function toggleSpaService(service: string) {
    setSelectedSpaService((current) => (current === service ? "" : service));
  }

  function toggleSpaUpgrade(upgrade: string) {
    setSelectedSpaUpgrades((current) => toggleSetValue(current, upgrade));
  }

  function handleRangeDatePress(value: string) {
    if (!startDate || (startDate && endDate)) {
      setStartDate(value);
      setEndDate("");
      return;
    }

    if (parseIsoDate(value) < parseIsoDate(startDate)) {
      setStartDate(value);
      setEndDate(startDate);
      return;
    }

    setEndDate(value);
  }

  function handleTimeSelect(field: "start" | "end", value: string) {
    if (field === "start") {
      setStartTime(value);
    } else {
      setEndTime(value);
    }

    setActiveTimeField(null);
  }

  function goToNextStep() {
    if (!canAdvanceFromStep(activeStep)) {
      return;
    }

    setActiveTimeField(null);
    setActiveLocationDropdown(false);
    setActiveStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function goToPreviousStep() {
    setActiveTimeField(null);
    setActiveLocationDropdown(false);
    setActiveStepIndex((current) => Math.max(current - 1, 0));
  }

  function navigateToStep(stepIndex: number) {
    if (!canNavigateToStep(stepIndex)) {
      return;
    }

    setActiveTimeField(null);
    setActiveLocationDropdown(false);
    setActiveStepIndex(stepIndex);
  }

  function resetReservationFlow() {
    setActiveStepIndex(0);
    setActiveLocationDropdown(false);
    setActiveTimeField(null);
    setAuthorizedPickup("");
    setCalendarMonth(startOfMonth(new Date()));
    setCreatedRequest(null);
    setEndDate("");
    setEndTime("");
    setEnrichmentEnabled(false);
    setEnrichmentFrequency(enrichmentFrequencies[0]);
    setErrorMessage(null);
    setLocation(locationOptions[0]);
    setAmenityPackage(amenityPackages[0]);
    setIsSubmitting(false);
    setNotes("");
    setReservationType(reservationTypeOptions[0]);
    setSelectedSpaService("");
    setSelectedSpaUpgrades(new Set());
    setSelectedPetIds(new Set(initialPetIds));
    setSuiteSize(suiteSizes[0]);
    setStartDate("");
    setStartTime("");
  }

  function exitReservationFlow() {
    setExitConfirmVisible(false);
    window.setTimeout(() => {
      resetReservationFlow();
      router.back();
    }, 0);
  }

  function handleExitPress() {
    setExitConfirmVisible(true);
  }

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const request = await createReservationRequest({
        amenity_package: amenityPackage,
        authorized_pickup: authorizedPickup.trim() || null,
        end_date: endDate,
        end_time: endTime,
        enrichment_enabled: enrichmentEnabled,
        enrichment_frequency: enrichmentEnabled ? enrichmentFrequency : null,
        experience: `${reservationType} - ${amenityPackage}`,
        location,
        notes: notes.trim() || null,
        optional_services: [],
        reservation_type: reservationType,
        selected_pet_ids: Array.from(selectedPetIds),
        spa_service: selectedSpaService || null,
        spa_upgrades: Array.from(selectedSpaUpgrades),
        start_date: startDate,
        start_time: startTime,
        suite_size: suiteSize,
      });
      setCreatedRequest(request);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdRequest) {
    return (
      <Screen contentStyle={styles.content}>
        <View style={styles.header}>
          <Button title="Back" variant="ghost" onPress={() => router.back()} />
          <Text variant="title" style={styles.headerTitle}>
            Request Submitted
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <Card variant="elevated" style={styles.confirmationCard}>
          <View style={styles.confirmationIcon}>
            <Icon color={colors.goldenrod} name="check" size={28} />
          </View>
          <Text variant="heading">We received your request.</Text>
          <Text variant="body" tone="secondary">
            Your reservation request is submitted. Reception will review the details before creating
            the confirmed reservation in Gingr.
          </Text>
          <Text variant="caption" tone="muted">
            Status: {createdRequest.status.replace("_", " ")}
          </Text>
          <Button
            title="Return Home"
            onPress={() => {
              resetReservationFlow();
              router.replace("/");
            }}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} contentStyle={styles.flowRoot}>
      <View style={styles.stickyHeader}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Exit reservation request"
            accessibilityRole="button"
            onPress={handleExitPress}
            style={({ pressed }) => [styles.exitButton, pressed && styles.dateFieldPressed]}
          >
            <Icon color={colors.blackCherry} name="x" size={18} />
          </Pressable>
          <Text variant="title" style={styles.headerTitle}>
            New Reservation Request
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressSummary}>
          <View style={styles.progressCopy}>
            <Text variant="caption" tone="muted">
              Step {currentStepNumber} of {steps.length}
            </Text>
            <Text variant="title">{activeStep}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressPercent }]} />
          </View>
        </View>

        <View style={styles.divider} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flowBody}
      >
        <ScrollView
          ref={stepScrollRef}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.flowContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {activeStep === "Pets" ? (
        <>
          <View style={styles.sectionHeader}>
            <Text variant="title">Which pet(s) is this for?</Text>
            <Text variant="caption" tone="secondary">
              Select all that apply.
            </Text>
          </View>

          <View style={styles.petList}>
            {isLoadingPets ? <Text tone="secondary">Preparing your pet profiles...</Text> : null}
            {pets.map((pet) => {
              const isSelected = selectedPetIds.has(pet.id);

              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  key={pet.id}
                  onPress={() => togglePet(pet.id)}
                >
                  <Card variant="elevated" style={styles.petOption}>
                    <Image source={{ uri: pet.imageUrl }} style={styles.petAvatar} />
                    <View style={styles.petCopy}>
                      <Text variant="title">{pet.name}</Text>
                      <Text variant="caption" tone="secondary">
                        {pet.breed}
                      </Text>
                      <Text variant="caption" tone="secondary">
                        {pet.age} old | {pet.weight}
                      </Text>
                    </View>
                    <View style={[styles.selectCircle, isSelected && styles.selectCircleActive]}>
                      {isSelected ? <Icon color={colors.ivory} name="check" size={14} /> : null}
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {activeStep === "Location" ? (
        <View style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <Text variant="title">Which location?</Text>
            <Text variant="caption" tone="secondary">
              Choose where this reservation should be requested.
            </Text>
          </View>
          <DropdownField
            active={activeLocationDropdown}
            label="Location"
            onPress={() => setActiveLocationDropdown((current) => !current)}
            onSelect={(option) => {
              setLocation(option);
              setActiveLocationDropdown(false);
            }}
            options={locationOptions}
            value={location}
          />
        </View>
      ) : null}

      {activeStep === "Type" ? (
        <View style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <Text variant="title">What type of visit?</Text>
            <Text variant="caption" tone="secondary">
              Select the primary service for this request.
            </Text>
          </View>
          <View style={styles.optionGrid}>
            {reservationTypeOptions.map((option) => (
              <Button
                key={option}
                onPress={() => setReservationType(option)}
                title={option}
                variant={reservationType === option ? "primary" : "secondary"}
                style={styles.optionButton}
              />
            ))}
          </View>
        </View>
      ) : null}

      {activeStep === "Dates" ? (
        <View style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <Text variant="title">Choose dates and times</Text>
            <Text variant="caption" tone="secondary">
              Tap the arrival date, then the pickup date.
            </Text>
          </View>
          <ReservationCalendar
            month={calendarMonth}
            endDate={endDate}
            onMonthChange={setCalendarMonth}
            onSelectDate={handleRangeDatePress}
            startDate={startDate}
          />
          <TimeField
            active={activeTimeField === "start"}
            disabled={!canSelectTimes}
            label="Drop-off time"
            onSelect={(value) => handleTimeSelect("start", value)}
            onPress={() => {
              if (canSelectTimes) {
                setActiveTimeField(activeTimeField === "start" ? null : "start");
              }
            }}
            value={startTime}
          />
          <TimeField
            active={activeTimeField === "end"}
            disabled={!canSelectTimes}
            label="Pickup time"
            onSelect={(value) => handleTimeSelect("end", value)}
            onPress={() => {
              if (canSelectTimes) {
                setActiveTimeField(activeTimeField === "end" ? null : "end");
              }
            }}
            value={endTime}
          />
        </View>
      ) : null}

      {activeStep === "Experience" ? (
        <>
          <View style={styles.formGroup}>
            <View style={styles.sectionHeader}>
              <Text variant="title">Amenity package</Text>
              <Text variant="caption" tone="secondary">
                Select the package and suite preferences.
              </Text>
            </View>
            <View style={styles.optionGrid}>
              {amenityPackages.map((option) => (
                <Button
                  key={option}
                  onPress={() => setAmenityPackage(option)}
                  title={option}
                  variant={amenityPackage === option ? "primary" : "secondary"}
                  style={styles.optionButton}
                />
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text variant="title">Preferred suite size</Text>
            <View style={styles.optionGrid}>
              {availableSuiteSizes.map((option) => (
                <Button
                  key={option}
                  onPress={() => setSuiteSize(option)}
                  title={option}
                  variant={suiteSize === option ? "primary" : "secondary"}
                  style={styles.optionButton}
                />
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text variant="title">Enrichment</Text>
            <View style={styles.optionGrid}>
              <Button
                onPress={() => setEnrichmentEnabled(true)}
                title="Yes"
                variant={enrichmentEnabled ? "primary" : "secondary"}
                style={styles.optionButton}
              />
              <Button
                onPress={() => setEnrichmentEnabled(false)}
                title="No"
                variant={!enrichmentEnabled ? "primary" : "secondary"}
                style={styles.optionButton}
              />
            </View>
            {enrichmentEnabled ? (
              <View style={styles.optionGrid}>
                {enrichmentFrequencies.map((option) => (
                  <Button
                    key={option}
                    onPress={() => setEnrichmentFrequency(option)}
                    title={option}
                    variant={enrichmentFrequency === option ? "primary" : "secondary"}
                    style={styles.optionButton}
                  />
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.formGroup}>
            <Text variant="title">Spa services</Text>
            <View style={styles.optionGrid}>
              {spaServices.map((service) => (
                <Button
                  key={service}
                  onPress={() => toggleSpaService(service)}
                  title={service}
                  variant={selectedSpaService === service ? "primary" : "secondary"}
                  style={styles.optionButton}
                />
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text variant="title">Spa upgrades</Text>
            <View style={styles.optionGrid}>
              {spaUpgrades.map((upgrade) => (
                <Button
                  key={upgrade}
                  onPress={() => toggleSpaUpgrade(upgrade)}
                  title={upgrade}
                  variant={selectedSpaUpgrades.has(upgrade) ? "primary" : "secondary"}
                  style={styles.optionButton}
                />
              ))}
            </View>
          </View>
        </>
      ) : null}

      {activeStep === "Details" ? (
        <>
          <View style={styles.formGroup}>
            <View style={styles.sectionHeader}>
              <Text variant="title">Any final details?</Text>
              <Text variant="caption" tone="secondary">
                Add notes for reception before submitting.
              </Text>
            </View>
            <Card style={styles.reviewCard}>
              <Text variant="caption" tone="muted">
                Summary
              </Text>
              <Text variant="body">
                {selectedPets.map((pet) => pet.name).join(", ")} | {formatDisplayDate(startDate)}{" "}
                at {formatDisplayTime(startTime)} to {formatDisplayDate(endDate)} at{" "}
                {formatDisplayTime(endTime)}
              </Text>
              <Text variant="caption" tone="secondary">
                {location} | {reservationType} | {amenityPackage} | {suiteSize}
              </Text>
            </Card>
            <TextField
              onChangeText={setAuthorizedPickup}
              placeholder="People authorized to pick up"
              value={authorizedPickup}
            />
            <TextField
              multiline
              onChangeText={setNotes}
              placeholder="Notes"
              style={styles.notesField}
              value={notes}
            />
          </View>
        </>
      ) : null}

      {errorMessage ? <Text tone="secondary">{errorMessage}</Text> : null}

      <View style={styles.footerActions}>
        {activeStepIndex > 0 ? (
          <Button title="Back" variant="ghost" onPress={goToPreviousStep} />
        ) : null}
        {activeStep === "Details" ? (
          <Button
            disabled={!canSubmit}
            icon="calendar"
            onPress={handleSubmit}
            title={isSubmitting ? "Submitting..." : "Submit Request"}
          />
        ) : (
          <Button
            disabled={!canAdvanceFromStep(activeStep)}
            icon="chevron-right"
            onPress={goToNextStep}
            title="Next"
          />
        )}
      </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ReservationExitModal
        visible={exitConfirmVisible}
        onCancel={() => setExitConfirmVisible(false)}
        onConfirm={exitReservationFlow}
      />
    </Screen>
  );
}

type TimeFieldProps = {
  active: boolean;
  disabled?: boolean;
  label: string;
  onSelect: (value: string) => void;
  onPress: () => void;
  value: string;
};

type DropdownFieldProps = {
  active: boolean;
  label: string;
  onPress: () => void;
  onSelect: (value: string) => void;
  options: readonly string[];
  value: string;
};

type ReservationCalendarProps = {
  endDate: string;
  month: Date;
  onMonthChange: (date: Date) => void;
  onSelectDate: (value: string) => void;
  startDate: string;
};

type ReservationExitModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
  visible: boolean;
};

function ReservationCalendar({
  endDate,
  month,
  onMonthChange,
  onSelectDate,
  startDate,
}: ReservationCalendarProps) {
  const days = getCalendarDays(month);

  return (
    <Card style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <Pressable
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          onPress={() => onMonthChange(addMonths(month, -1))}
          style={({ pressed }) => [styles.monthButton, pressed && styles.dateFieldPressed]}
        >
          <Text variant="body" tone="brand">
            ‹
          </Text>
        </Pressable>
        <Text variant="title">{formatMonthLabel(month)}</Text>
        <Pressable
          accessibilityLabel="Next month"
          accessibilityRole="button"
          onPress={() => onMonthChange(addMonths(month, 1))}
          style={({ pressed }) => [styles.monthButton, pressed && styles.dateFieldPressed]}
        >
          <Text variant="body" tone="brand">
            ›
          </Text>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <Text key={`${day}-${index}`} variant="caption" tone="muted" style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {days.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.calendarDay} />;
          }

          const value = formatIsoDate(day);
          const disabled = isBeforeToday(day);
          const selected = value === startDate || value === endDate;
          const inRange = isDateInRange(value, startDate, endDate);

          return (
            <Pressable
              accessibilityLabel={`Select ${formatDisplayDate(value)}`}
              accessibilityRole="button"
              disabled={disabled}
              key={value}
              onPress={() => onSelectDate(value)}
              style={({ pressed }) => [
                styles.calendarDay,
                inRange && styles.calendarDayInRange,
                selected && styles.calendarDaySelected,
                disabled && styles.calendarDayDisabled,
                pressed && styles.dateFieldPressed,
              ]}
            >
              <Text
                variant="caption"
                tone={selected ? "inverse" : disabled ? "muted" : "primary"}
                style={styles.calendarDayText}
              >
                {day.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.dateRangeSummary}>
        <Text variant="caption" tone="secondary">
          {startDate ? `Drop-off: ${formatDisplayDate(startDate)}` : "Choose a drop-off date"}
        </Text>
        <Text variant="caption" tone="secondary">
          {endDate ? `Pickup: ${formatDisplayDate(endDate)}` : "Choose a pickup date"}
        </Text>
      </View>
    </Card>
  );
}

function TimeField({ active, disabled = false, label, onPress, onSelect, value }: TimeFieldProps) {
  return (
    <View style={styles.datePickerWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}: ${formatDisplayTime(value)}` : `Choose ${label}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.dateField,
          active && styles.dateFieldDropdownOpen,
          disabled && styles.dateFieldDisabled,
          pressed && styles.dateFieldPressed,
        ]}
      >
        <View style={styles.dateCopy}>
          <Text variant="caption" tone="muted">
            {label}
          </Text>
          <Text variant="body" tone={value ? "primary" : "muted"}>
            {value ? formatDisplayTime(value) : disabled ? "Select dates first" : "Choose time"}
          </Text>
        </View>
        <Icon color={colors.blackCherry} name="clock" size={20} />
      </Pressable>

      {active ? (
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={styles.timeScroll}
          contentContainerStyle={styles.timeOptions}
        >
          {timeOptions.map((option) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: value === option }}
              key={option}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.timeOption,
                value === option && styles.timeOptionActive,
                pressed && styles.dateFieldPressed,
              ]}
            >
              <Text variant="caption" tone={value === option ? "inverse" : "brand"}>
                {formatDisplayTime(option)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function DropdownField({ active, label, onPress, onSelect, options, value }: DropdownFieldProps) {
  return (
    <View style={styles.datePickerWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.dateField,
          active && styles.dateFieldDropdownOpen,
          pressed && styles.dateFieldPressed,
        ]}
      >
        <View style={styles.dateCopy}>
          <Text variant="caption" tone="muted">
            {label}
          </Text>
          <Text variant="body">{value}</Text>
        </View>
        <Icon color={colors.blackCherry} name="chevron-right" size={16} />
      </Pressable>

      {active ? (
        <View style={styles.dropdownMenu}>
          {options.map((option) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: value === option }}
              key={option}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.dropdownOption,
                value === option && styles.dropdownOptionActive,
                pressed && styles.dateFieldPressed,
              ]}
            >
              <Text variant="caption" tone={value === option ? "inverse" : "brand"}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ReservationExitModal({ onCancel, onConfirm, visible }: ReservationExitModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalIcon}>
            <Icon color={colors.goldenrod} name="calendar" size={24} />
          </View>
          <Text variant="title" style={styles.modalTitle}>
            Leave this request?
          </Text>
          <Text variant="body" tone="secondary" style={styles.modalCopy}>
            Your reservation details have not been saved. If you leave now, this request will begin
            again next time.
          </Text>
          <View style={styles.modalActions}>
            <Button title="Stay Here" variant="secondary" onPress={onCancel} style={styles.modalButton} />
            <Button
              title="Exit Request"
              onPress={onConfirm}
              style={[styles.modalButton, styles.modalDangerButton]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getCalendarDays(month: Date) {
  const firstDay = startOfMonth(month);
  const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
  const leadingEmptyDays = firstDay.getDay();
  const days: Array<Date | null> = Array.from({ length: leadingEmptyDays }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function isBeforeToday(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date < today;
}

function isDateInRange(value: string, startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return false;
  }

  const date = parseIsoDate(value);

  return date >= parseIsoDate(startDate) && date <= parseIsoDate(endDate);
}

function suiteSizesForPackage(packageName: string) {
  if (packageName === "Platinum VIP") {
    return ["Chateau (10x8)"];
  }

  if (packageName === "Premium") {
    return suiteSizes.filter((suite) => suite !== "Chateau (10x8)");
  }

  return suiteSizes;
}

function buildTimeOptions() {
  const options: string[] = [];

  for (let hour = 6; hour <= 20; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      options.push(`${`${hour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}`);
    }
  }

  return options;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTimeValue(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  return parseIsoDate(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDisplayTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toggleSetValue(current: Set<string>, value: string) {
  const next = new Set(current);

  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }

  return next;
}

const styles = StyleSheet.create({
  calendarCard: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  calendarDay: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 42,
    justifyContent: "center",
    width: "14.285%",
  },
  calendarDayDisabled: {
    opacity: 0.34,
  },
  calendarDayInRange: {
    backgroundColor: colors.champagne,
  },
  calendarDaySelected: {
    backgroundColor: colors.blackCherry,
  },
  calendarDayText: {
    fontVariant: ["tabular-nums"],
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmationCard: {
    alignItems: "center",
    gap: spacing.lg,
  },
  confirmationIcon: {
    alignItems: "center",
    borderColor: colors.goldenrod,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  content: {
    gap: spacing.lg,
  },
  dateCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  dateField: {
    alignItems: "center",
    backgroundColor: colors.porcelain,
    borderColor: colors.creamBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
  },
  dateFieldDropdownOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dateFieldDisabled: {
    opacity: 0.54,
  },
  dateFieldPressed: {
    opacity: 0.78,
  },
  datePickerWrap: {
    gap: spacing.sm,
  },
  divider: {
    backgroundColor: colors.creamBorder,
    height: 1,
  },
  dropdownMenu: {
    backgroundColor: colors.porcelain,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    borderColor: colors.creamBorder,
    borderTopWidth: 0,
    borderWidth: 1,
    overflow: "hidden",
  },
  dropdownOption: {
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  dropdownOptionActive: {
    backgroundColor: colors.blackCherry,
  },
  dateRangeSummary: {
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  exitButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 72,
  },
  flowBody: {
    flex: 1,
  },
  flowContent: {
    gap: spacing.lg,
    paddingBottom: 116,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  flowRoot: {
    flex: 1,
  },
  footerActions: {
    gap: spacing.sm,
  },
  formGroup: {
    gap: spacing.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerSpacer: {
    width: 72,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  monthButton: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(17, 17, 17, 0.58)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalButton: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  modalCard: {
    alignItems: "center",
    backgroundColor: colors.porcelain,
    borderColor: colors.goldenrod,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
    width: "100%",
  },
  modalCopy: {
    textAlign: "center",
  },
  modalDangerButton: {
    backgroundColor: colors.blackCherry,
  },
  modalIcon: {
    alignItems: "center",
    backgroundColor: colors.champagne,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  modalTitle: {
    textAlign: "center",
  },
  notesField: {
    minHeight: 120,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  optionButton: {
    flex: 1,
    minWidth: "48%",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
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
  petList: {
    gap: spacing.md,
  },
  petOption: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  progressCopy: {
    gap: spacing.xxs,
  },
  progressFill: {
    backgroundColor: colors.blackCherry,
    borderRadius: radius.pill,
    height: "100%",
  },
  progressSummary: {
    gap: spacing.sm,
  },
  progressTrack: {
    backgroundColor: colors.champagne,
    borderRadius: radius.pill,
    height: 8,
    overflow: "hidden",
  },
  sectionHeader: {
    gap: spacing.xxs,
  },
  reviewCard: {
    gap: spacing.xs,
    padding: spacing.lg,
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
  stickyHeader: {
    backgroundColor: colors.ivory,
    gap: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    zIndex: 2,
  },
  timeOption: {
    alignItems: "center",
    borderRadius: 0,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.md,
    width: "100%",
  },
  timeOptionActive: {
    backgroundColor: colors.blackCherry,
  },
  timeOptions: {
    paddingVertical: 0,
  },
  timeScroll: {
    backgroundColor: colors.porcelain,
    borderColor: colors.creamBorder,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    borderTopWidth: 0,
    borderWidth: 1,
    maxHeight: 184,
  },
  weekday: {
    textAlign: "center",
    width: "14.285%",
  },
  weekdayRow: {
    flexDirection: "row",
  },
});
