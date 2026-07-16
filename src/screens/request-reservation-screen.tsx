import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { AppScreen, BrandHeader } from "@/components/app";
import {
  Button,
  Card,
  Icon,
  Screen,
  Text,
  TextField,
} from "@/components/primitives";
import { resortImages } from "@/data/mock-data";
import {
  createReservationRequest,
  getCachedClientDashboardData,
  getCurrentClientPetsForApp,
  sendReservationRequestNotification,
} from "@/services/client-data";
import {
  getCachedGingrReservationRequestCatalog,
  getGingrReservationRequestCatalog,
  type GingrReservationRequestCatalog,
} from "@/services/gingr";
import { colors, fonts, layout, radii, radius, spacing, typography } from "@/theme";
import type { Pet } from "@/types/app";
import { meetsVaccinationRequirements } from "@/utils/vaccinations";
import type { ReservationRequest } from "@/types/database";
import { goBackOrReplace, resolveFallbackRoute } from "@/utils/navigation";

const steps = ["Pets", "Location", "Type", "Dates", "Experience", "Details"] as const;
const fallbackLocationOptions = ["Amarillo", "Wichita Falls", "New Braunfels"];
const fallbackReservationTypeOptions = ["Boarding", "Daycare", "Spa"];
const dogAmenityPackages = ["Classic", "Premium", "Platinum VIP"];
const dogSuiteSizes = ["Champion (4x8)", "Olympian (6x8)", "Royal (8x8)", "Chateau (10x8)"];
const catAccommodationOptions = ["Condo", "Penthouse", "Villa"];
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
type PetSpeciesKind = "cat" | "dog" | "exotic" | "mixed" | "unknown";
type ReservationTypeOption = (typeof fallbackReservationTypeOptions)[number];

export function RequestReservationScreen() {
  const params = useLocalSearchParams<{ petIds?: string; returnTo?: string }>();
  const { height } = useWindowDimensions();
  const fallbackRoute = resolveFallbackRoute(params.returnTo, "/reservations");
  const isCompactLayout = height < 880;
  const initialPetIds = React.useMemo(
    () => new Set((params.petIds ?? "").split(",").filter(Boolean)),
    [params.petIds],
  );
  const cachedCatalog = getCachedGingrReservationRequestCatalog() ?? null;
  const cachedPets = getCachedClientDashboardData()?.pets ?? [];
  const cachedLocationOptions = cachedCatalog?.locations.map((item) => item.city) ?? [];
  const cachedReservationTypeOptions = cachedCatalog
    ? normalizeReservationTypeOptions(cachedCatalog.reservationTypes)
    : [];
  const [activeStepIndex, setActiveStepIndex] = React.useState(0);
  const [activeTimeField, setActiveTimeField] = React.useState<"start" | "end" | null>(null);
  const [authorizedPickup, setAuthorizedPickup] = React.useState("");
  const [calendarMonth, setCalendarMonth] = React.useState(startOfMonth(new Date()));
  const [createdRequest, setCreatedRequest] = React.useState<ReservationRequest | null>(null);
  const [endDate, setEndDate] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [enrichmentEnabled, setEnrichmentEnabled] = React.useState(false);
  const [enrichmentFrequency, setEnrichmentFrequency] = React.useState(enrichmentFrequencies[0]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [exoticEnclosureConfirmed, setExoticEnclosureConfirmed] = React.useState(false);
  const [exitConfirmVisible, setExitConfirmVisible] = React.useState(false);
  const [requestCatalog, setRequestCatalog] =
    React.useState<GingrReservationRequestCatalog | null>(cachedCatalog);
  const [locationOptions, setLocationOptions] = React.useState(
    cachedLocationOptions.length > 0 ? cachedLocationOptions : fallbackLocationOptions,
  );
  const [location, setLocation] = React.useState("");
  const [amenityPackage, setAmenityPackage] = React.useState(dogAmenityPackages[0]);
  const [isLoadingCatalog, setIsLoadingCatalog] = React.useState(!cachedCatalog);
  const [isLoadingPets, setIsLoadingPets] = React.useState(cachedPets.length === 0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isRetryingNotification, setIsRetryingNotification] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [notificationSent, setNotificationSent] = React.useState<boolean | null>(null);
  const [pets, setPets] = React.useState<Pet[]>(cachedPets);
  const [reservationTypeOptions, setReservationTypeOptions] = React.useState(
    cachedReservationTypeOptions.length > 0
      ? cachedReservationTypeOptions
      : fallbackReservationTypeOptions,
  );
  const [reservationType, setReservationType] = React.useState(
    cachedReservationTypeOptions[0] ?? fallbackReservationTypeOptions[0],
  );
  const [selectedSpaService, setSelectedSpaService] = React.useState("");
  const [selectedSpaUpgrades, setSelectedSpaUpgrades] = React.useState<Set<string>>(new Set());
  const [selectedPetIds, setSelectedPetIds] = React.useState<Set<string>>(initialPetIds);
  const [suiteSize, setSuiteSize] = React.useState(dogSuiteSizes[0]);
  const [startDate, setStartDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const stepScrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    let isMounted = true;

    getGingrReservationRequestCatalog()
      .then((catalog) => {
        if (!isMounted || !catalog) {
          return;
        }

        setRequestCatalog(catalog);

        const cityOptions = catalog.locations.map((gingrLocation) => gingrLocation.city);
        const requestTypeOptions = normalizeReservationTypeOptions(catalog.reservationTypes);

        if (cityOptions.length > 0) {
          setLocationOptions(cityOptions);
          setLocation((current) => (cityOptions.includes(current) ? current : ""));
        }

        if (requestTypeOptions.length > 0) {
          setReservationTypeOptions(requestTypeOptions);
          setReservationType((current) =>
            requestTypeOptions.includes(current) ? current : requestTypeOptions[0],
          );
        }
      })
      .catch((error: unknown) => {
        console.warn("Unable to load Gingr request catalog; using fallback request options.", error);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCatalog(false);
        }
      });

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

  const selectedPets = pets.filter((pet) => selectedPetIds.has(pet.id));
  const petsMissingCurrentVaccinations = selectedPets.filter(
    (pet) => !meetsVaccinationRequirements(pet),
  );
  const selectedSpeciesKind = getSelectedPetSpeciesKind(selectedPets);
  const isMixedSpeciesRequest = selectedSpeciesKind === "mixed";
  const isCatRequest = selectedSpeciesKind === "cat";
  const isDogRequest = selectedSpeciesKind === "dog";
  const isExoticRequest = selectedSpeciesKind === "exotic";
  const isBoardingRequest = reservationType === "Boarding";
  const isDaycareRequest = reservationType === "Daycare";
  const isSpaRequest = reservationType === "Spa";
  const isWichitaFallsLocation = location.toLowerCase().includes("wichita falls");
  const hasSelectedLocation = locationOptions.includes(location);
  const availableReservationTypeOptions = React.useMemo(
    () => reservationTypeOptions.filter(
      (option) => !((isCatRequest || isExoticRequest) && option === "Spa"),
    ),
    [isCatRequest, isExoticRequest, reservationTypeOptions],
  );
  const shouldShowDogBoardingPreferences = isBoardingRequest && isDogRequest;
  const shouldShowCatBoardingPreferences = isBoardingRequest && isCatRequest;
  const shouldShowBoardingPreferences =
    shouldShowDogBoardingPreferences || shouldShowCatBoardingPreferences;
  const shouldShowEnrichment = !isSpaRequest && !isMixedSpeciesRequest;
  const shouldShowSpaOptions = isDogRequest;
  const hasRequiredExoticDetails =
    !isExoticRequest || (notes.trim().length > 0 && exoticEnclosureConfirmed);
  const experienceComplete =
    !isMixedSpeciesRequest &&
    !((isCatRequest || isExoticRequest) && isSpaRequest) &&
    (!shouldShowBoardingPreferences ||
      (shouldShowDogBoardingPreferences ? Boolean(amenityPackage) : true) &&
        Boolean(suiteSize));
  const experienceSummary = formatExperienceSummary({
    amenityPackage,
    enrichmentEnabled,
    enrichmentFrequency,
    isCatRequest,
    isExoticRequest,
    reservationType,
    selectedSpaService,
    selectedSpaUpgrades,
    shouldShowSpaOptions,
    suiteSize,
  });
  const activeStep = steps[activeStepIndex];
  const availableSuiteSizes = React.useMemo(
    () =>
      shouldShowCatBoardingPreferences
        ? catAccommodationOptionsForLocation(location, requestCatalog)
        : suiteSizesForPackage(amenityPackage),
    [amenityPackage, location, requestCatalog, shouldShowCatBoardingPreferences],
  );
  const canSelectTimes = isIsoDate(startDate) && isIsoDate(endDate);
  const startTimeOptions = React.useMemo(
    () => getOperationTimeOptions(startDate, "dropoff"),
    [startDate],
  );
  const endTimeOptions = React.useMemo(
    () => getOperationTimeOptions(endDate, "pickup"),
    [endDate],
  );
  const hasValidDateSelection =
    isIsoDate(startDate) &&
    isIsoDate(endDate) &&
    !isDateUnavailableForRequest(startDate, reservationType, location) &&
    !isDateUnavailableForRequest(endDate, reservationType, location);
  const hasValidTimeSelection =
    isTimeValue(startTime) &&
    isTimeValue(endTime) &&
    startTimeOptions.includes(startTime) &&
    endTimeOptions.includes(endTime);
  const daycareAvailabilityNotice =
    isDaycareRequest && isWichitaFallsLocation
      ? "Wichita Falls daycare requests are available Monday through Thursday. Please call for Friday through Sunday availability."
      : null;
  const canSubmit =
    selectedPetIds.size > 0 &&
    petsMissingCurrentVaccinations.length === 0 &&
    hasSelectedLocation &&
    Boolean(reservationType) &&
    hasValidDateSelection &&
    hasValidTimeSelection &&
    experienceComplete &&
    hasRequiredExoticDetails &&
    !isSubmitting;
  const isSingleDayRequest = !isBoardingRequest;

  React.useEffect(() => {
    if (!availableSuiteSizes.includes(suiteSize)) {
      setSuiteSize(availableSuiteSizes[0]);
    }
  }, [availableSuiteSizes, suiteSize]);

  React.useEffect(() => {
    stepScrollRef.current?.scrollTo({ animated: false, y: 0 });
  }, [activeStepIndex]);

  useFocusEffect(
    React.useCallback(() => {
      stepScrollRef.current?.scrollTo({ animated: false, y: 0 });
    }, []),
  );

  React.useEffect(() => {
    if (!availableReservationTypeOptions.includes(reservationType)) {
      setReservationType(availableReservationTypeOptions[0] ?? fallbackReservationTypeOptions[0]);
      setSelectedSpaService("");
      setSelectedSpaUpgrades(new Set());
    }
  }, [availableReservationTypeOptions, reservationType]);

  React.useEffect(() => {
    if (isSingleDayRequest && startDate && endDate !== startDate) {
      setEndDate(startDate);
    }
  }, [endDate, isSingleDayRequest, startDate]);

  React.useEffect(() => {
    if (
      (startDate && isDateUnavailableForRequest(startDate, reservationType, location)) ||
      (endDate && isDateUnavailableForRequest(endDate, reservationType, location))
    ) {
      setStartDate("");
      setEndDate("");
      setStartTime("");
      setEndTime("");
      setActiveTimeField(null);
    }
  }, [endDate, location, reservationType, startDate]);

  React.useEffect(() => {
    if (startTime && !startTimeOptions.includes(startTime)) {
      setStartTime("");
    }

    if (endTime && !endTimeOptions.includes(endTime)) {
      setEndTime("");
    }
  }, [endTime, endTimeOptions, startTime, startTimeOptions]);

  function canAdvanceFromStep(step: RequestStep) {
    if (step === "Pets") {
      return selectedPetIds.size > 0 && !isMixedSpeciesRequest;
    }

    if (step === "Location") {
      return hasSelectedLocation && petsMissingCurrentVaccinations.length === 0;
    }

    if (step === "Type") {
      return Boolean(reservationType);
    }

    if (step === "Dates") {
      return hasValidDateSelection && hasValidTimeSelection;
    }

    if (step === "Experience") {
      return experienceComplete;
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

  function selectLocation(option: string) {
    setLocation(option);
    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setActiveTimeField(null);
  }

  function toggleSpaService(service: string) {
    setSelectedSpaService((current) => (current === service ? "" : service));
  }

  function toggleSpaUpgrade(upgrade: string) {
    setSelectedSpaUpgrades((current) => toggleSetValue(current, upgrade));
  }

  function handleDatePress(value: string) {
    if (isDateUnavailableForRequest(value, reservationType, location)) {
      return;
    }

    if (isSingleDayRequest) {
      setStartDate(value);
      setEndDate(value);
      return;
    }

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
    setActiveStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function goToPreviousStep() {
    setActiveTimeField(null);
    setActiveStepIndex((current) => Math.max(current - 1, 0));
  }

  function navigateToStep(stepIndex: number) {
    if (!canNavigateToStep(stepIndex)) {
      return;
    }

    setActiveTimeField(null);
    setActiveStepIndex(stepIndex);
  }

  function resetReservationFlow() {
    setActiveStepIndex(0);
    setActiveTimeField(null);
    setAuthorizedPickup("");
    setCalendarMonth(startOfMonth(new Date()));
    setCreatedRequest(null);
    setEndDate("");
    setEndTime("");
    setEnrichmentEnabled(false);
    setEnrichmentFrequency(enrichmentFrequencies[0]);
    setErrorMessage(null);
    setExoticEnclosureConfirmed(false);
    setLocation("");
    setAmenityPackage(dogAmenityPackages[0]);
    setIsSubmitting(false);
    setIsRetryingNotification(false);
    setNotes("");
    setNotificationSent(null);
    setReservationType(reservationTypeOptions[0] ?? fallbackReservationTypeOptions[0]);
    setSelectedSpaService("");
    setSelectedSpaUpgrades(new Set());
    setSelectedPetIds(new Set(initialPetIds));
    setSuiteSize(dogSuiteSizes[0]);
    setStartDate("");
    setStartTime("");
  }

  function exitReservationFlow() {
    setExitConfirmVisible(false);
    window.setTimeout(() => {
      resetReservationFlow();
      goBackOrReplace(fallbackRoute);
    }, 0);
  }

  function handleExitPress() {
    setExitConfirmVisible(true);
  }

  function handleVaccinationUploadPress() {
    if (!hasSelectedLocation) {
      return;
    }

    const petIds = petsMissingCurrentVaccinations.map((pet) => pet.id).join(",");

    router.push({
      pathname: "/document-upload",
      params: {
        location,
        petIds,
      },
    });
  }

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await createReservationRequest({
        amenity_package: shouldShowDogBoardingPreferences ? amenityPackage : null,
        authorized_pickup: authorizedPickup.trim() || null,
        end_date: endDate,
        end_time: endTime,
        enrichment_enabled: shouldShowEnrichment ? enrichmentEnabled : false,
        enrichment_frequency: shouldShowEnrichment && enrichmentEnabled ? enrichmentFrequency : null,
        experience: experienceSummary,
        location,
        notes: isExoticRequest
          ? `${notes.trim()}\n\nOwner confirmed they will provide a secure exotic enclosure.`
          : notes.trim() || null,
        optional_services: [],
        reservation_type: reservationType,
        selected_pet_ids: Array.from(selectedPetIds),
        selected_pet_names: selectedPets.map((pet) => pet.name),
        spa_service: shouldShowSpaOptions ? selectedSpaService || null : null,
        spa_upgrades: shouldShowSpaOptions ? Array.from(selectedSpaUpgrades) : [],
        start_date: startDate,
        start_time: startTime,
        suite_size: shouldShowBoardingPreferences ? suiteSize : null,
      });
      setCreatedRequest(result.request);
      setNotificationSent(result.notificationSent);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdRequest) {
    return (
      <AppScreen
        subtitle="Reception will review your request and confirm availability."
        title="Request Submitted"
      >
        <Card variant="elevated" style={styles.confirmationCard}>
          <View style={styles.confirmationIcon}>
            <Icon color={colors.goldenrod} name="check" size={28} />
          </View>
          <Text variant="heading">We received your request.</Text>
          <Text variant="body" tone="secondary">
            {notificationSent
              ? "Your reservation request was submitted and reception has been notified by email."
              : "Your reservation request was saved, but we couldn't email reception. Please retry before leaving this screen."}
          </Text>
          <Text variant="caption" tone="muted">
            Status: {createdRequest.status.replace("_", " ")}
          </Text>
          {!notificationSent ? (
            <Button
              disabled={isRetryingNotification}
              title={isRetryingNotification ? "Notifying Reception…" : "Retry Reception Email"}
              variant="secondary"
              onPress={() => {
                setIsRetryingNotification(true);
                sendReservationRequestNotification(createdRequest.id)
                  .then(() => setNotificationSent(true))
                  .catch(() => setNotificationSent(false))
                  .finally(() => setIsRetryingNotification(false));
              }}
            />
          ) : null}
          <Button
            title="Return Home"
            onPress={() => {
              resetReservationFlow();
              router.replace("/");
            }}
          />
        </Card>
      </AppScreen>
    );
  }

  return (
    <View style={styles.root}>
      <BrandHeader
        compact
        leftAction={
          <Pressable
            accessibilityLabel={activeStepIndex > 0 ? "Previous reservation step" : "Back to reservations"}
            accessibilityRole="button"
            onPress={activeStepIndex > 0 ? goToPreviousStep : handleExitPress}
            style={({ pressed }) => [styles.flowBackButton, pressed && styles.dateFieldPressed]}
          >
            <Icon color={colors.burgundy} name="chevron-left" size={14} />
            <Text style={styles.flowBackText}>Back</Text>
          </Pressable>
        }
      />
      <Screen scroll={false} contentStyle={styles.flowRoot} topSafeArea={false}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={styles.flowBody}
      >
        <ScrollView
          ref={stepScrollRef}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[
            styles.flowContent,
            isCompactLayout && styles.flowContentCompact,
          ]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {activeStep === "Pets" ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.flowSectionTitle}>Which pets are coming?</Text>
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
                  <Card
                    variant="elevated"
                    style={[
                      styles.petOption,
                      isSelected && styles.petOptionSelected,
                      isCompactLayout && styles.petOptionCompact,
                    ]}
                  >
                    <Image
                      source={{ uri: pet.imageUrl }}
                      style={[styles.petAvatar, isCompactLayout && styles.petAvatarCompact]}
                    />
                    <View style={styles.petCopy}>
                      <Text style={typography.cardTitle}>{pet.name}</Text>
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
            {isMixedSpeciesRequest ? (
              <Card style={styles.guidanceCard}>
                <Text variant="title">Separate requests required</Text>
                <Text variant="body" tone="secondary">
                  Dogs, cats, and exotic pets use different accommodation paths. Select pets from
                  one group to continue, then submit a separate request for the other pets.
                </Text>
              </Card>
            ) : null}
          </View>
        </>
      ) : null}

      {activeStep === "Location" ? (
        <View style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <Text style={styles.flowSectionTitle}>Choose a location</Text>
            <Text variant="caption" tone="secondary">
              {isLoadingCatalog
                ? "Loading Le Chateau request options from Gingr..."
                : "Choose where this reservation should be requested."}
            </Text>
          </View>
          <View style={styles.locationOptionList}>
            {locationOptions.map((option) => {
              const isSelected = location === option;

              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  key={option}
                  onPress={() => selectLocation(option)}
                >
                  <Card style={[styles.locationOption, isSelected && styles.locationOptionSelected]}>
                    <Image source={{ uri: getReservationLocationImage(option) }} style={styles.locationOptionImage} />
                    <View style={styles.locationOptionCopy}>
                      <Text style={styles.locationOptionName}>{option}</Text>
                      <Text style={typography.caption}>Le Chateau Pet Resort</Text>
                    </View>
                    <View style={[styles.locationRadio, isSelected && styles.locationRadioSelected]}>
                      {isSelected ? <Icon color={colors.white} name="check" size={12} /> : null}
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
          {petsMissingCurrentVaccinations.length > 0 ? (
            <Card style={styles.guidanceCard}>
              <Text variant="title">Vaccinations need attention</Text>
              <Text variant="body" tone="secondary">
                {formatPetNameList(petsMissingCurrentVaccinations.map((pet) => pet.name))} must
                have current vaccination records before this reservation request can continue.
              </Text>
              {hasSelectedLocation ? (
                <Button
                  icon="mail"
                  onPress={handleVaccinationUploadPress}
                  title={`Upload records for ${location}`}
                  variant="secondary"
                  style={styles.guidanceAction}
                />
              ) : (
                <Text tone="muted" variant="caption">
                  Choose a location first so the records go to the right reception team.
                </Text>
              )}
            </Card>
          ) : null}
        </View>
      ) : null}

      {activeStep === "Type" ? (
        <View style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <Text style={styles.flowSectionTitle}>What type of stay?</Text>
            <Text variant="caption" tone="secondary">
              Select the primary service for this request.
            </Text>
          </View>
          <View style={styles.optionGrid}>
            {availableReservationTypeOptions.map((option) => (
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
            <Text style={styles.flowSectionTitle}>Select stay dates</Text>
            <Text variant="caption" tone="secondary">
              {isSingleDayRequest
                ? "Choose the visit date, then select drop-off and pickup times."
                : "Tap the arrival date, then the pickup date."}
            </Text>
          </View>
          <ReservationCalendar
            month={calendarMonth}
            endDate={endDate}
            isDateDisabled={(date) =>
              isBeforeToday(date) ||
              isDateUnavailableForRequest(formatIsoDate(date), reservationType, location)
            }
            singleDay={isSingleDayRequest}
            onMonthChange={setCalendarMonth}
            onSelectDate={handleDatePress}
            startDate={startDate}
          />
          {daycareAvailabilityNotice ? (
            <Card style={styles.guidanceCard}>
              <Text variant="title">Weekend daycare availability</Text>
              <Text variant="body" tone="secondary">
                {daycareAvailabilityNotice}
              </Text>
            </Card>
          ) : null}
          <TimeField
            active={activeTimeField === "start"}
            disabled={!canSelectTimes}
            label="Drop-off time"
            onClose={() => setActiveTimeField(null)}
            onSelect={(value) => handleTimeSelect("start", value)}
            onPress={() => {
              if (canSelectTimes) {
                setActiveTimeField(activeTimeField === "start" ? null : "start");
              }
            }}
            options={startTimeOptions}
            value={startTime}
          />
          <TimeField
            active={activeTimeField === "end"}
            disabled={!canSelectTimes}
            label="Pickup time"
            onClose={() => setActiveTimeField(null)}
            onSelect={(value) => handleTimeSelect("end", value)}
            onPress={() => {
              if (canSelectTimes) {
                setActiveTimeField(activeTimeField === "end" ? null : "end");
              }
            }}
            options={endTimeOptions}
            value={endTime}
          />
        </View>
      ) : null}

      {activeStep === "Experience" ? (
        <>
          {isMixedSpeciesRequest ? (
            <Card style={styles.guidanceCard}>
              <Text variant="title">Let’s split this request</Text>
              <Text variant="body" tone="secondary">
                Dogs, cats, and exotic pets have different accommodation paths. Please go back
                and select pets from one group for this request.
              </Text>
            </Card>
          ) : null}

          {isExoticRequest ? (
            <Card style={styles.guidanceCard}>
              <Text variant="title">Exotic lodging</Text>
              <Text variant="body" tone="secondary">
                All exotic pets use our designated exotic lodging area, so there is no room or
                package to select. You must provide a secure enclosure and detailed care
                instructions for the stay.
              </Text>
            </Card>
          ) : null}

          {shouldShowDogBoardingPreferences ? (
            <>
              <View style={styles.formGroup}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.flowSectionTitle}>Amenity package</Text>
                  <Text variant="caption" tone="secondary">
                    Select the boarding package and suite preferences.
                  </Text>
                </View>
                <View style={styles.optionGrid}>
                  {dogAmenityPackages.map((option) => (
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
                <Text style={styles.flowSectionTitle}>Preferred suite size</Text>
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
            </>
          ) : null}

          {shouldShowCatBoardingPreferences ? (
            <View style={styles.formGroup}>
              <View style={styles.sectionHeader}>
                <Text style={styles.flowSectionTitle}>Cat accommodation</Text>
                <Text variant="caption" tone="secondary">
                  Choose the preferred cat accommodation for this location.
                </Text>
              </View>
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
          ) : null}

          {shouldShowEnrichment ? (
            <View style={styles.formGroup}>
              <View style={styles.sectionHeader}>
                <Text style={styles.flowSectionTitle}>Enrichment</Text>
                <Text variant="caption" tone="secondary">
                  Add extra play and activity time if you would like.
                </Text>
              </View>
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
          ) : null}

          {shouldShowSpaOptions ? (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.flowSectionTitle}>Spa services</Text>
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
                <Text style={styles.flowSectionTitle}>Spa upgrades</Text>
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
        </>
      ) : null}

      {activeStep === "Details" ? (
        <>
          <View style={styles.formGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.flowSectionTitle}>Review your request</Text>
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
                {location} | {experienceSummary}
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
              placeholder={
                isExoticRequest
                  ? "Required: feeding, habitat, handling, medication, and other care instructions"
                  : "Notes"
              }
              style={styles.notesField}
              value={notes}
            />
            {isExoticRequest ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: exoticEnclosureConfirmed }}
                onPress={() => setExoticEnclosureConfirmed((current) => !current)}
                style={({ pressed }) => [
                  styles.exoticRequirement,
                  pressed && styles.dateFieldPressed,
                ]}
              >
                <View
                  style={[
                    styles.requirementCheckbox,
                    exoticEnclosureConfirmed && styles.requirementCheckboxChecked,
                  ]}
                >
                  {exoticEnclosureConfirmed ? (
                    <Icon color={colors.textInverse} name="check" size={13} />
                  ) : null}
                </View>
                <View style={styles.requirementCopy}>
                  <Text style={typography.rowTitle}>I will provide a secure enclosure</Text>
                  <Text style={typography.caption}>
                    Exotic enclosures must arrive with the pet and include everything needed for
                    a safe stay.
                  </Text>
                </View>
              </Pressable>
            ) : null}
            {isExoticRequest && !hasRequiredExoticDetails ? (
              <Text variant="caption" tone="secondary">
                Care instructions and enclosure confirmation are required before submitting.
              </Text>
            ) : null}
          </View>
        </>
      ) : null}

      {errorMessage ? <Text tone="secondary">{errorMessage}</Text> : null}

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footerActions, isCompactLayout && styles.footerActionsCompact]}>
        <Button
          onPress={handleExitPress}
          style={styles.cancelFooterButton}
          title="Cancel"
          variant="ghost"
        />
        {activeStep === "Details" ? (
          <Button
            disabled={!canSubmit}
            icon="calendar"
            onPress={handleSubmit}
            style={styles.footerButton}
            title={isSubmitting ? "Submitting..." : "Submit Request"}
          />
        ) : (
          <Button
            disabled={!canAdvanceFromStep(activeStep)}
            onPress={goToNextStep}
            style={styles.footerButton}
            title="Continue"
          />
        )}
      </View>

      <ReservationExitModal
        visible={exitConfirmVisible}
        onCancel={() => setExitConfirmVisible(false)}
        onConfirm={exitReservationFlow}
      />
      </Screen>
    </View>
  );
}

type TimeFieldProps = {
  active: boolean;
  disabled?: boolean;
  label: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  onPress: () => void;
  options: readonly string[];
  value: string;
};

type ReservationCalendarProps = {
  endDate: string;
  isDateDisabled: (date: Date) => boolean;
  month: Date;
  onMonthChange: (date: Date) => void;
  onSelectDate: (value: string) => void;
  singleDay: boolean;
  startDate: string;
};

type ReservationExitModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
  visible: boolean;
};

function ReservationCalendar({
  endDate,
  isDateDisabled,
  month,
  onMonthChange,
  onSelectDate,
  singleDay,
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
          const disabled = isDateDisabled(day);
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
          {startDate
            ? `${singleDay ? "Visit" : "Drop-off"}: ${formatDisplayDate(startDate)}`
            : `Choose a ${singleDay ? "visit" : "drop-off"} date`}
        </Text>
        {!singleDay ? (
          <Text variant="caption" tone="secondary">
            {endDate ? `Pickup: ${formatDisplayDate(endDate)}` : "Choose a pickup date"}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

function TimeField({
  active,
  disabled = false,
  label,
  onClose,
  onPress,
  onSelect,
  options,
  value,
}: TimeFieldProps) {
  const [draftValue, setDraftValue] = React.useState(value || options[0] || "07:00");

  React.useEffect(() => {
    if (active) {
      setDraftValue(value || options[0] || "07:00");
    }
  }, [active, options, value]);

  const minimumTime = timeValueToDate(options[0] || "07:00");
  const maximumTime = timeValueToDate(options[options.length - 1] || "19:00");

  function handlePickerChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (event.type === "dismissed") {
      onClose();
      return;
    }

    if (selectedDate) {
      setDraftValue(dateToTimeValue(selectedDate));
    }
  }

  return (
    <View style={styles.datePickerWrap}>
      <Pressable
        accessibilityLabel={value ? `${label}: ${formatDisplayTime(value)}` : `Choose ${label}`}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.dateField,
          active && styles.dateFieldActive,
          disabled && styles.dateFieldDisabled,
          pressed && styles.dateFieldPressed,
        ]}
      >
        <View style={styles.dateCopy}>
          <Text variant="caption" tone="muted">{label}</Text>
          <Text variant="body" tone={value ? "primary" : "muted"}>
            {value ? formatDisplayTime(value) : disabled ? "Select dates first" : "Choose time"}
          </Text>
        </View>
        <View style={styles.timeFieldAccessory}>
          <Icon color={colors.blackCherry} name="clock" size={19} />
          <Icon color={colors.blackCherry} name="chevron-down" size={17} />
        </View>
      </Pressable>

      {active ? (
        <Modal animationType="slide" transparent visible onRequestClose={onClose}>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.timePickerBackdrop}>
            <Pressable
              accessibilityRole="none"
              onPress={(event) => event.stopPropagation()}
              style={styles.timePickerSheet}
            >
              <View style={styles.timePickerHeader}>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={onClose}>
                  <Text style={styles.timePickerCancel}>Cancel</Text>
                </Pressable>
                <View style={styles.timePickerTitleCopy}>
                  <Text style={styles.timePickerTitle}>{label}</Text>
                  <Text style={typography.caption}>Available in 15-minute increments</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={options.length === 0}
                  hitSlop={8}
                  onPress={() => onSelect(draftValue)}
                >
                  <Text style={styles.timePickerDone}>Done</Text>
                </Pressable>
              </View>
              {options.length > 0 ? (
                <DateTimePicker
                  display="spinner"
                  maximumDate={maximumTime}
                  minimumDate={minimumTime}
                  minuteInterval={15}
                  mode="time"
                  onChange={handlePickerChange}
                  value={timeValueToDate(draftValue)}
                />
              ) : (
                <View style={styles.timePickerEmpty}>
                  <Text style={typography.bodySecondary}>No available times for this date.</Text>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>
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
    return dogSuiteSizes.filter((suite) => suite !== "Chateau (10x8)");
  }

  return dogSuiteSizes;
}

function catAccommodationOptionsForLocation(
  location: string,
  catalog: GingrReservationRequestCatalog | null,
) {
  const fallbackOptions = catAccommodationFallbackForLocation(location);

  if (!catalog) {
    return fallbackOptions;
  }

  const catalogLocation = catalog.locations.find(
    (catalogItem) => catalogItem.city.toLowerCase() === location.toLowerCase(),
  );
  const boardingTypeIds = catalog.reservationTypes
    .filter((catalogItem) => catalogItem.name.toLowerCase().includes("boarding"))
    .map((catalogItem) => catalogItem.id);
  const serviceNames = catalog.serviceGroups
    .filter((group) => {
      const locationMatches = !catalogLocation?.id || group.locationId === catalogLocation.id;
      return locationMatches && boardingTypeIds.includes(group.reservationTypeId);
    })
    .flatMap((group) => group.services)
    .map((service) => service.name.toLowerCase());
  const matchedOptions = fallbackOptions.filter((option) =>
    serviceNames.some((serviceName) => serviceName.includes(option.toLowerCase())),
  );

  return matchedOptions.length > 0 ? matchedOptions : fallbackOptions;
}

function catAccommodationFallbackForLocation(location: string) {
  if (location.toLowerCase().includes("wichita falls")) {
    return catAccommodationOptions.filter((option) => option !== "Villa");
  }

  return catAccommodationOptions;
}

function normalizeReservationTypeOptions(
  reservationTypes: GingrReservationRequestCatalog["reservationTypes"],
) {
  const normalizedOptions = reservationTypes
    .map((reservationType) => normalizeReservationTypeName(reservationType.name))
    .filter((option): option is ReservationTypeOption => Boolean(option));
  const knownOptions = new Set([...normalizedOptions, ...fallbackReservationTypeOptions]);

  return fallbackReservationTypeOptions.filter((option) => knownOptions.has(option));
}

function normalizeReservationTypeName(value: string): ReservationTypeOption | null {
  const normalized = value.toLowerCase();

  if (normalized.includes("boarding") || normalized.includes("lodging")) {
    return "Boarding";
  }

  if (normalized.includes("daycare") || normalized.includes("day care")) {
    return "Daycare";
  }

  if (
    normalized.includes("spa") ||
    normalized.includes("groom") ||
    normalized.includes("bath")
  ) {
    return "Spa";
  }

  return null;
}

function getSelectedPetSpeciesKind(selectedPets: Pet[]): PetSpeciesKind {
  const speciesKinds = new Set(
    selectedPets
      .map(getPetSpeciesKind)
      .filter((kind): kind is Exclude<PetSpeciesKind, "mixed"> => kind !== "unknown"),
  );

  if (speciesKinds.size > 1) {
    return "mixed";
  }

  return speciesKinds.values().next().value ?? "unknown";
}

function getPetSpeciesKind(pet: Pet): PetSpeciesKind {
  const normalized = (pet.species || pet.breed.split("|")[0] || "").trim().toLowerCase();

  if (normalized.includes("cat") || normalized.includes("feline")) {
    return "cat";
  }

  if (normalized.includes("dog") || normalized.includes("canine")) {
    return "dog";
  }

  return normalized ? "exotic" : "unknown";
}

function formatExperienceSummary({
  amenityPackage,
  enrichmentEnabled,
  enrichmentFrequency,
  isCatRequest,
  isExoticRequest,
  reservationType,
  selectedSpaService,
  selectedSpaUpgrades,
  shouldShowSpaOptions,
  suiteSize,
}: {
  amenityPackage: string;
  enrichmentEnabled: boolean;
  enrichmentFrequency: string;
  isCatRequest: boolean;
  isExoticRequest: boolean;
  reservationType: string;
  selectedSpaService: string;
  selectedSpaUpgrades: Set<string>;
  shouldShowSpaOptions: boolean;
  suiteSize: string;
}) {
  const parts = [reservationType];

  if (reservationType === "Boarding") {
    if (isExoticRequest) {
      parts.push("Exotic lodging (owner-provided enclosure)");
    } else if (!isCatRequest) {
      parts.push(amenityPackage);

      parts.push(suiteSize);
    } else {
      parts.push(suiteSize);
    }
  }

  if (reservationType !== "Spa" && enrichmentEnabled) {
    parts.push(`Enrichment ${enrichmentFrequency.toLowerCase()}`);
  }

  if (shouldShowSpaOptions && selectedSpaService) {
    parts.push(selectedSpaService);
  }

  if (shouldShowSpaOptions && selectedSpaUpgrades.size > 0) {
    parts.push(`${selectedSpaUpgrades.size} spa upgrade${selectedSpaUpgrades.size === 1 ? "" : "s"}`);
  }

  return parts.join(" | ");
}

function isDateUnavailableForRequest(dateValue: string, reservationType: string, location: string) {
  if (!isIsoDate(dateValue)) {
    return true;
  }

  return (
    reservationType === "Daycare" &&
    location.toLowerCase().includes("wichita falls") &&
    isFridayThroughSunday(parseIsoDate(dateValue))
  );
}

function isFridayThroughSunday(date: Date) {
  const day = date.getDay();

  return day === 0 || day === 5 || day === 6;
}

function getOperationTimeOptions(dateValue: string, mode: "dropoff" | "pickup") {
  if (!isIsoDate(dateValue)) {
    return [];
  }

  const hours = getOperationHours(parseIsoDate(dateValue));
  const cutoffMinutes = mode === "dropoff" ? 30 : 15;
  const latestMinutes = hours.closeMinutes - cutoffMinutes;

  return timeOptions.filter((option) => {
    const minutes = timeValueToMinutes(option);
    return minutes >= hours.openMinutes && minutes <= latestMinutes;
  });
}

function getOperationHours(date: Date) {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  return {
    closeMinutes: isWeekend ? 18 * 60 : 19 * 60,
    openMinutes: isWeekend ? 8 * 60 : 7 * 60,
  };
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

function timeValueToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeValueToDate(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function dateToTimeValue(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
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

function formatPetNameList(petNames: string[]) {
  const names = petNames.filter(Boolean);

  if (names.length <= 2) {
    return names.join(" & ");
  }

  return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
}

function getReservationLocationImage(location: string) {
  const normalizedLocation = location.toLowerCase();

  if (normalizedLocation.includes("wichita falls")) {
    return resortImages.wichitaFallsHero;
  }

  if (normalizedLocation.includes("new braunfels")) {
    return resortImages.homeHero;
  }

  return resortImages.loginHero;
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
    backgroundColor: colors.burgundySoft,
  },
  calendarDaySelected: {
    backgroundColor: colors.burgundy,
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
    gap: spacing.md,
  },
  confirmationIcon: {
    alignItems: "center",
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  dateCopy: {
    flex: 1,
    gap: spacing[2],
  },
  dateField: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.input,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  dateFieldActive: {
    borderColor: colors.burgundy,
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
    backgroundColor: colors.divider,
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
    backgroundColor: colors.burgundySoft,
    borderRadius: radii.circle,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  flowBody: {
    flex: 1,
  },
  flowContent: {
    gap: layout.sectionGap,
    paddingBottom: spacing.xl,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: layout.screenPaddingTop,
  },
  flowContentCompact: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  flowRoot: {
    flex: 1,
    paddingBottom: layout.tabBarHeight,
  },
  flowBackButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    minHeight: 36,
  },
  flowBackText: {
    color: colors.burgundy,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  flowSectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  footerActions: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.sm,
  },
  footerActionsCompact: {
    gap: spacing.xs,
  },
  formGroup: {
    gap: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
  cancelFooterButton: {
    minWidth: 90,
    paddingHorizontal: spacing.sm,
  },
  guidanceAction: {
    marginTop: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  guidanceCard: {
    backgroundColor: colors.goldSoft,
    borderColor: colors.gold,
    gap: spacing.sm,
  },
  locationOption: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing[10],
  },
  locationOptionCopy: {
    flex: 1,
    gap: spacing[2],
  },
  locationOptionImage: {
    borderRadius: radii.small,
    height: 64,
    width: 84,
  },
  locationOptionList: {
    gap: spacing.sm,
  },
  locationOptionName: {
    ...typography.cardTitle,
    color: colors.burgundy,
  },
  locationOptionSelected: {
    backgroundColor: colors.burgundySoft,
    borderColor: colors.burgundy,
  },
  locationRadio: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: radii.circle,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  locationRadioSelected: {
    backgroundColor: colors.burgundy,
    borderColor: colors.burgundy,
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
    backgroundColor: colors.overlayDeep,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.largeCard,
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
    backgroundColor: colors.goldSoft,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  modalTitle: {
    textAlign: "center",
  },
  exoticRequirement: {
    alignItems: "center",
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
    borderRadius: radii.input,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 78,
    padding: spacing.md,
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
  requirementCheckbox: {
    alignItems: "center",
    borderColor: colors.burgundy,
    borderRadius: 7,
    borderWidth: 1.5,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  requirementCheckboxChecked: {
    backgroundColor: colors.burgundy,
  },
  requirementCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  petAvatar: {
    borderColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 58,
    width: 58,
  },
  petAvatarCompact: {
    height: 54,
    width: 54,
  },
  petCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  petList: {
    gap: spacing.sm,
  },
  petOption: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.sm,
  },
  petOptionSelected: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  petOptionCompact: {
    gap: spacing.sm,
    padding: spacing.sm,
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionHeader: {
    gap: spacing[4],
  },
  reviewCard: {
    backgroundColor: colors.surfaceWarm,
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
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  timeFieldAccessory: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  timePickerBackdrop: {
    backgroundColor: colors.overlayDeep,
    flex: 1,
    justifyContent: "flex-end",
  },
  timePickerCancel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  timePickerDone: {
    ...typography.body,
    color: colors.burgundy,
    fontFamily: fonts.bodySemiBold,
  },
  timePickerEmpty: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
    padding: spacing.xl,
  },
  timePickerHeader: {
    alignItems: "center",
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
  },
  timePickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.largeCard,
    borderTopRightRadius: radii.largeCard,
    paddingBottom: spacing.xxl,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.md,
  },
  timePickerTitle: {
    ...typography.rowTitle,
    textAlign: "center",
  },
  timePickerTitleCopy: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
  },
  weekday: {
    textAlign: "center",
    width: "14.285%",
  },
  weekdayRow: {
    flexDirection: "row",
  },
});
