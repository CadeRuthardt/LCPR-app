import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ImageBackground, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { WebView } from "react-native-webview";

import { BackChevronButton, Button, Card, Icon, Screen, Section, Text } from "@/components/primitives";
import { resortImages } from "@/data/mock-data";
import { colors, radius, spacing } from "@/theme";
import { router, useLocalSearchParams } from "expo-router";

type CameraPreview = {
  availability: string;
  description: string;
  id: string;
  imageUrl: string;
  label: string;
  title: string;
  url?: string;
};

type CameraLocation = {
  cameras: CameraPreview[];
  description: string;
  heroImageUrl: string;
  id: string;
  name: string;
  vipCameras: CameraPreview[];
};

type VipCameraAccessCode = {
  cameraId: string;
  locationId: string;
};

const vipCameraAccessCodes: Record<string, VipCameraAccessCode> = {
  "E110-CASTLE": {
    cameraId: "amarillo-e110-vip",
    locationId: "amarillo",
  },
  "E210-PAW": {
    cameraId: "amarillo-e210-vip",
    locationId: "amarillo",
  },
  "E301-CHATEAU": {
    cameraId: "amarillo-e301-vip",
    locationId: "amarillo",
  },
};

function getVipAccessStorageKey(locationId: string) {
  return `lcpr.vip-camera-access.${locationId}`;
}

const cameraLocations: CameraLocation[] = [
  {
    cameras: [
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Indoor play for smaller guests.",
        id: "amarillo-small-gym",
        imageUrl: resortImages.playYard,
        label: "Public",
        title: "Small Gym",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=14960",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Outdoor yard for small gym play groups.",
        id: "amarillo-small-gym-yard",
        imageUrl: resortImages.playYard,
        label: "Public",
        title: "Small Gym Yard",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=1576",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Indoor play for larger guests.",
        id: "amarillo-big-gym",
        imageUrl: resortImages.playYard,
        label: "Public",
        title: "Big Gym",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=1577",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Outdoor yard for big gym play groups.",
        id: "amarillo-big-gym-yard",
        imageUrl: resortImages.playYard,
        label: "Public",
        title: "Big Gym Yard",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=1578",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "A calm lounge view for feline guests.",
        id: "amarillo-cat-lounge",
        imageUrl:
          "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80",
        label: "Public",
        title: "Cat Lounge",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=14959",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Outdoor enrichment for feline guests.",
        id: "amarillo-cat-yard",
        imageUrl:
          "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80",
        label: "Public",
        title: "Cat Yard",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=1581",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Outdoor yard view for P100.",
        id: "amarillo-p100-yard",
        imageUrl: resortImages.loginHero,
        label: "Public",
        title: "P100 Yard",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=1582",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Outdoor yard view for P300.",
        id: "amarillo-p300-yard",
        imageUrl: resortImages.loginHero,
        label: "Public",
        title: "P300 Yard",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=1584",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Outdoor yard view for C100.",
        id: "amarillo-c100-yard",
        imageUrl: resortImages.loginHero,
        label: "Public",
        title: "C100 Yard",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=1585",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Outdoor yard view for C200.",
        id: "amarillo-c200-yard",
        imageUrl: resortImages.loginHero,
        label: "Public",
        title: "C200 Yard",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=1586",
      },
    ],
    description: "Outdoor yards, pool views, and resort activity.",
    heroImageUrl: resortImages.loginHero,
    id: "amarillo",
    name: "Amarillo",
    vipCameras: [
      {
        availability: "VIP in-suite camera | 24/7 during eligible reservations",
        description: "Private VIP suite access for eligible reservations.",
        id: "amarillo-e110-vip",
        imageUrl: resortImages.loginHero,
        label: "VIP",
        title: "E110 VIP",
        url: "https://idogcam.com/idogcamviewer.php?id=14230",
      },
      {
        availability: "VIP in-suite camera | 24/7 during eligible reservations",
        description: "Private VIP suite access for eligible reservations.",
        id: "amarillo-e210-vip",
        imageUrl: resortImages.loginHero,
        label: "VIP",
        title: "E210 VIP",
        url: "https://idogcam.com/idogcamviewer.php?id=1575",
      },
      {
        availability: "VIP in-suite camera | 24/7 during eligible reservations",
        description: "Private VIP suite access for eligible reservations.",
        id: "amarillo-e301-vip",
        imageUrl: resortImages.loginHero,
        label: "VIP",
        title: "E301 VIP",
        url: "https://idogcam.com/idogcamviewer.php?id=1580",
      },
    ],
  },
  {
    cameras: [
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "A calm lounge view for feline guests.",
        id: "wf-cat-lounge",
        imageUrl:
          "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80",
        label: "Public",
        title: "Cat Lounge",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=2856",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Outdoor enrichment for feline guests.",
        id: "wf-cat-yard",
        imageUrl:
          "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80",
        label: "Public",
        title: "Cat Yard",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=2857",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Indoor play for south-side guests.",
        id: "wf-south-gym",
        imageUrl: resortImages.playYard,
        label: "Public",
        title: "South Gym",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=2858",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Outdoor yard for south-side play groups.",
        id: "wf-south-play-yard",
        imageUrl: resortImages.playYard,
        label: "Public",
        title: "South Play Yard",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=2859",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Indoor play for center gym guests.",
        id: "wf-center-gym",
        imageUrl: resortImages.playYard,
        label: "Public",
        title: "Center Gym",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=2860",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Outdoor yard for center play groups.",
        id: "wf-center-play-yard",
        imageUrl: resortImages.playYard,
        label: "Public",
        title: "Center Play Yard",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=2861",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Indoor play for north-side guests.",
        id: "wf-north-gym",
        imageUrl: resortImages.playYard,
        label: "Public",
        title: "North Gym",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=2862",
      },
      {
        availability: "Public camera | 8:00 AM - 5:00 PM",
        description: "Outdoor yard for north-side play groups.",
        id: "wf-north-play-yard",
        imageUrl: resortImages.playYard,
        label: "Public",
        title: "North Play Yard",
        url: "https://idogcam.com/idogcamgingrviewv2.php?id=2863",
      },
    ],
    description: "Play yards and supervised resort spaces.",
    heroImageUrl: resortImages.wichitaFallsHero,
    id: "wichita-falls",
    name: "Wichita Falls",
    vipCameras: [],
  },
  {
    cameras: [
      {
        availability: "Available during resort camera hours",
        description: "Resort views will appear here as cameras come online.",
        id: "nb-resort",
        imageUrl: resortImages.playYard,
        label: "Resort",
        title: "Resort Camera",
      },
    ],
    description: "Camera access for New Braunfels guests.",
    heroImageUrl: resortImages.homeHero,
    id: "new-braunfels",
    name: "New Braunfels",
    vipCameras: [],
  },
];

export function LiveCamerasScreen() {
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const [selectedLocationId, setSelectedLocationId] = React.useState<string | null>(null);
  const [selectedCamera, setSelectedCamera] = React.useState<CameraPreview | null>(null);
  const selectedLocation =
    cameraLocations.find((location) => location.id === selectedLocationId) ?? null;

  React.useEffect(() => {
    setSelectedCamera(null);
    setSelectedLocationId(null);
  }, [reset]);

  if (selectedLocation) {
    return (
      <CameraPlayer
        camera={selectedCamera}
        location={selectedLocation}
        onBack={() => {
          setSelectedCamera(null);
          setSelectedLocationId(null);
        }}
        onSelectCamera={setSelectedCamera}
      />
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <BackChevronButton
          onPress={() => {
            if (selectedLocation) {
              setSelectedLocationId(null);
              return;
            }

            router.replace("/");
          }}
          style={styles.backButton}
        />
        <View style={styles.headerCopy}>
          <Text variant="heading">Choose Location</Text>
          <Text variant="body" tone="secondary">
            Choose your resort location.
          </Text>
        </View>
      </View>

      <View style={styles.locationList}>
        {cameraLocations.map((location) => (
          <LocationCard
            key={location.id}
            location={location}
            onPress={() => {
              setSelectedCamera(null);
              setSelectedLocationId(location.id);
            }}
          />
        ))}
      </View>
    </Screen>
  );
}

function CameraPlayer({
  camera,
  location,
  onBack,
  onSelectCamera,
}: {
  camera: CameraPreview | null;
  location: CameraLocation;
  onBack: () => void;
  onSelectCamera: (camera: CameraPreview | null) => void;
}) {
  const isVipCamera = camera?.label === "VIP";
  const publicCameras = location.cameras;
  const vipCameras = location.vipCameras;
  const [accessCode, setAccessCode] = React.useState("");
  const [accessError, setAccessError] = React.useState<string | null>(null);
  const [unlockedVipCameraId, setUnlockedVipCameraId] = React.useState<string | null>(null);
  const unlockedVipCamera =
    vipCameras.find((vipCamera) => vipCamera.id === unlockedVipCameraId) ?? null;

  React.useEffect(() => {
    let isMounted = true;

    async function loadSavedVipCamera() {
      try {
        const savedCameraId = await AsyncStorage.getItem(getVipAccessStorageKey(location.id));

        if (isMounted) {
          setUnlockedVipCameraId(savedCameraId);
        }
      } catch {
        if (isMounted) {
          setUnlockedVipCameraId(null);
        }
      }
    }

    void loadSavedVipCamera();

    return () => {
      isMounted = false;
    };
  }, [location.id]);

  async function unlockVipCamera() {
    const normalizedCode = accessCode.trim().toUpperCase();
    const access = vipCameraAccessCodes[normalizedCode];

    if (!access || access.locationId !== location.id) {
      setAccessError("That VIP camera code could not be matched to this resort.");
      return;
    }

    const matchedCamera = vipCameras.find((vipCamera) => vipCamera.id === access.cameraId);

    if (!matchedCamera) {
      setAccessError("That VIP camera is not available for this resort yet.");
      return;
    }

    setAccessError(null);
    setAccessCode("");
    setUnlockedVipCameraId(matchedCamera.id);
    onSelectCamera(matchedCamera);

    try {
      await AsyncStorage.setItem(getVipAccessStorageKey(location.id), matchedCamera.id);
    } catch {
      // Local persistence is a convenience only; keep access unlocked for this session.
    }
  }

  async function removeVipAccess() {
    setUnlockedVipCameraId(null);
    setAccessCode("");
    setAccessError(null);

    if (camera?.id === unlockedVipCamera?.id) {
      onSelectCamera(null);
    }

    try {
      await AsyncStorage.removeItem(getVipAccessStorageKey(location.id));
    } catch {
      // Nothing else to do if local cleanup fails.
    }
  }

  return (
    <Screen contentStyle={styles.viewerContent}>
      <View style={styles.viewerHeader}>
        <BackChevronButton onPress={onBack} style={styles.backButton} />
        <View style={styles.viewerHeaderCopy}>
          <Text variant="heading" style={styles.viewerTitle}>
            {location.name} Cameras
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.cameraTabsContent}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {publicCameras.map((option) => {
          const isActive = option.id === camera?.id;

          return (
            <Pressable
              accessibilityRole="button"
              key={option.id}
              onPress={() => onSelectCamera(option)}
              style={({ pressed }) => [
                styles.cameraTab,
                isActive && styles.cameraTabActive,
                pressed && styles.pressed,
              ]}
            >
              <Text variant="caption" tone={isActive ? "inverse" : "primary"}>
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {publicCameras.length > 3 ? (
        <View style={styles.cameraScrollHint}>
          <Text variant="caption" tone="muted">
            Swipe for more cameras
          </Text>
          <Icon color={colors.mutedGold} name="chevron-right" size={12} />
        </View>
      ) : null}

      <View style={styles.playerFrame}>
        {camera ? (
          camera.url ? (
            <WebView
              key={camera.id}
              allowsAirPlayForMediaPlayback
              allowsBackForwardNavigationGestures
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              allowsProtectedMedia
              bounces={false}
              domStorageEnabled
              javaScriptEnabled
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={["*"]}
              pullToRefreshEnabled={false}
              setSupportMultipleWindows={false}
              source={{ uri: getCameraEmbedUrl(camera.url) }}
              style={styles.webView}
              thirdPartyCookiesEnabled
              userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            />
          ) : (
            <View style={styles.playerUnavailable}>
              <Icon color={colors.goldenrod} name="camera" size={28} />
              <Text variant="body" tone="inverse">
                This camera is not available yet.
              </Text>
            </View>
          )
        ) : (
          <ImageBackground
            source={{ uri: location.heroImageUrl }}
            imageStyle={styles.locationHeroImage}
            resizeMode="cover"
            style={styles.locationHeroPreview}
          >
            <View style={styles.locationHeroOverlay}>
              <View style={styles.liveBadge}>
                <Icon color={colors.goldenrod} name="video" size={14} />
                <Text variant="label" tone="inverse">
                  Resort Cameras
                </Text>
              </View>
              <View style={styles.heroCopy}>
                <Text variant="title" tone="inverse">
                  {location.name} camera access
                </Text>
                <Text variant="caption" tone="inverse">
                  Choose a camera above to begin viewing.
                </Text>
              </View>
            </View>
          </ImageBackground>
        )}
      </View>

      <InfoCard
        body={
          isVipCamera
            ? "VIP in-suite cameras are available 24/7 during eligible reservations."
            : "Public resort cameras are available daily from 8:00 AM - 5:00 PM."
        }
        icon="clock"
        title="Camera Schedule"
      />

      {vipCameras.length ? (
        <VipCameraAccessCard
          accessCode={accessCode}
          accessError={accessError}
          camera={camera}
          onChangeAccessCode={(value) => {
            setAccessCode(value);
            setAccessError(null);
          }}
          onRemoveAccess={() => {
            void removeVipAccess();
          }}
          onSelectCamera={onSelectCamera}
          onSubmitAccessCode={() => {
            void unlockVipCamera();
          }}
          unlockedCamera={unlockedVipCamera}
        />
      ) : null}

    </Screen>
  );
}

function getCameraEmbedUrl(url: string) {
  return url.replace("idogcamgingrviewv2.php", "idogcamviewer.php");
}

function VipCameraAccessCard({
  accessCode,
  accessError,
  camera,
  onChangeAccessCode,
  onRemoveAccess,
  onSelectCamera,
  onSubmitAccessCode,
  unlockedCamera,
}: {
  accessCode: string;
  accessError: string | null;
  camera: CameraPreview | null;
  onChangeAccessCode: (value: string) => void;
  onRemoveAccess: () => void;
  onSelectCamera: (camera: CameraPreview) => void;
  onSubmitAccessCode: () => void;
  unlockedCamera: CameraPreview | null;
}) {
  const isActive = unlockedCamera?.id === camera?.id;

  return (
    <Card style={styles.vipAccessCard}>
      <View style={styles.vipAccessHeader}>
        <View style={styles.vipAccessIcon}>
          <Icon color={colors.goldenrod} name="camera" size={20} />
        </View>
        <View style={styles.vipAccessCopy}>
          <Text variant="title">VIP Camera Access</Text>
          <Text variant="caption" tone="muted">
            Enter the access code provided by reception for your suite camera.
          </Text>
        </View>
      </View>

      {unlockedCamera ? (
        <View style={styles.vipUnlockedWrap}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onSelectCamera(unlockedCamera)}
            style={({ pressed }) => [
              styles.vipUnlockedRow,
              isActive && styles.vipUnlockedRowActive,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.vipUnlockedCopy}>
              <Text variant="body" tone={isActive ? "inverse" : "primary"}>
                {unlockedCamera.title}
              </Text>
              <Text variant="caption" tone={isActive ? "inverse" : "muted"}>
                VIP in-suite camera unlocked
              </Text>
            </View>
            <Icon
              color={isActive ? colors.ivory : colors.blackCherry}
              name="chevron-right"
              size={16}
            />
          </Pressable>
          <Button
            onPress={onRemoveAccess}
            title="Remove VIP Access"
            variant="ghost"
            style={styles.removeVipButton}
          />
        </View>
      ) : (
        <View style={styles.vipAccessForm}>
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            onChangeText={onChangeAccessCode}
            onSubmitEditing={onSubmitAccessCode}
            placeholder="Enter access code"
            placeholderTextColor={colors.warmGray}
            returnKeyType="done"
            style={styles.vipAccessInput}
            value={accessCode}
          />
          {accessError ? (
            <Text variant="caption" tone="brand">
              {accessError}
            </Text>
          ) : null}
          <Button
            disabled={!accessCode.trim()}
            icon="chevron-right"
            onPress={onSubmitAccessCode}
            title="Unlock Camera"
          />
        </View>
      )}
    </Card>
  );
}

function InfoCard({
  body,
  icon,
  title,
}: {
  body: string;
  icon: "clock";
  title: string;
}) {
  return (
    <Card style={styles.infoCard}>
      <View style={styles.infoCopy}>
        <Text variant="title">{title}</Text>
        <Text variant="body" tone="secondary">
          {body}
        </Text>
      </View>
      <View style={styles.infoIcon}>
        <Icon color={colors.blackCherry} name={icon} size={34} />
      </View>
    </Card>
  );
}

function LocationCard({
  location,
  onPress,
}: {
  location: CameraLocation;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <Card style={styles.locationCard}>
        <ImageBackground
          source={{ uri: location.heroImageUrl }}
          imageStyle={styles.locationImage}
          resizeMode="cover"
          style={styles.locationPreview}
        >
          <View style={styles.locationOverlay}>
            <Text variant="title" tone="inverse">
              {location.name}
            </Text>
          </View>
        </ImageBackground>
        <View style={styles.locationBody}>
          <View style={styles.cameraTitleRow}>
            <View style={styles.locationCopy}>
              <Text variant="body" tone="secondary">
                {location.description}
              </Text>
            </View>
            <Icon color={colors.blackCherry} name="chevron-right" size={16} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function CameraCard({
  camera,
  onPress,
}: {
  camera: CameraPreview;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card style={styles.cameraCard}>
        <View style={styles.cameraRowIcon}>
          <Icon color={colors.goldenrod} name="camera" size={19} />
        </View>
        <View style={styles.cameraBody}>
          <View style={styles.cameraTitleRow}>
            <Text variant="title">{camera.title}</Text>
          </View>
          <Text variant="caption" tone="muted">
            {camera.label} | {camera.availability}
          </Text>
        </View>
        <Icon color={colors.blackCherry} name="chevron-right" size={16} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
  },
  cameraBody: {
    flex: 1,
    gap: 2,
  },
  cameraCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cameraLabel: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.overlayBurgundy,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  cameraRowIcon: {
    alignItems: "center",
    backgroundColor: colors.champagne,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  cameraScrollHint: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: -spacing.xs,
  },
  cameraSelectorCard: {
    gap: 0,
    overflow: "hidden",
    padding: 0,
  },
  cameraSelectorCopy: {
    flex: 1,
    gap: 2,
  },
  cameraSelectorList: {
    borderTopColor: colors.creamBorder,
    borderTopWidth: 1,
    maxHeight: 220,
  },
  cameraSelectorOption: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cameraSelectorOptionActive: {
    backgroundColor: colors.blackCherry,
  },
  cameraSelectorOptionCopy: {
    flex: 1,
    gap: 2,
  },
  cameraSelectorOptionIcon: {
    alignItems: "center",
    backgroundColor: colors.champagne,
    borderRadius: radius.pill,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  cameraSelectorTrigger: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cameraDot: {
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    height: 10,
    width: 10,
  },
  cameraDotActive: {
    backgroundColor: colors.blackCherry,
  },
  cameraDots: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  cameraTab: {
    backgroundColor: colors.porcelain,
    borderColor: colors.creamBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cameraTabActive: {
    backgroundColor: colors.blackCherry,
    borderColor: colors.blackCherry,
  },
  cameraTabsContent: {
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  cameraTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  content: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  headerCopy: {
    gap: spacing.xs,
  },
  hero: {
    borderRadius: radius.xl,
    minHeight: 260,
    overflow: "hidden",
  },
  heroCopy: {
    gap: spacing.sm,
  },
  heroImage: {
    borderRadius: radius.xl,
  },
  heroOverlay: {
    backgroundColor: colors.overlayHero,
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  liveBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.overlayBurgundy,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  locationBody: {
    padding: spacing.lg,
  },
  locationCard: {
    gap: 0,
    overflow: "hidden",
    padding: 0,
  },
  locationCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  locationImage: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  locationHeroImage: {
    borderRadius: radius.lg,
  },
  locationHeroOverlay: {
    backgroundColor: colors.overlayHero,
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  locationHeroPreview: {
    flex: 1,
  },
  locationList: {
    gap: spacing.lg,
  },
  locationOverlay: {
    backgroundColor: colors.overlayDeep,
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  locationPreview: {
    height: 150,
  },
  infoCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  infoCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  infoIcon: {
    alignItems: "center",
    justifyContent: "center",
    width: 56,
  },
  pressed: {
    opacity: 0.86,
  },
  playerCopy: {
    gap: spacing.xs,
  },
  playerCard: {
    overflow: "hidden",
    padding: 0,
  },
  playerFrame: {
    backgroundColor: colors.onyx,
    borderRadius: radius.lg,
    height: 330,
    overflow: "hidden",
  },
  playerUnavailable: {
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.lg,
  },
  viewerContent: {
    gap: spacing.md,
  },
  viewerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  viewerHeaderCopy: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
    paddingRight: 36,
  },
  viewerSubtitle: {
    textAlign: "center",
  },
  viewerTitle: {
    textAlign: "center",
  },
  vipCard: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  vipCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  vipIcon: {
    alignItems: "center",
    backgroundColor: colors.champagne,
    borderRadius: radius.pill,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  vipAccessCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  vipAccessCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  vipAccessForm: {
    gap: spacing.md,
  },
  vipAccessHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  vipAccessIcon: {
    alignItems: "center",
    backgroundColor: colors.champagne,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  vipAccessInput: {
    borderColor: colors.creamBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    color: colors.blackCherry,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  vipSelector: {
    backgroundColor: colors.porcelain,
    borderColor: colors.creamBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  vipSelectorCopy: {
    flex: 1,
    gap: 2,
  },
  vipSelectorHeader: {
    gap: spacing.xs,
    padding: spacing.lg,
  },
  vipSelectorIcon: {
    alignItems: "center",
    backgroundColor: colors.champagne,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  vipSelectorRow: {
    alignItems: "center",
    borderTopColor: colors.creamBorder,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  vipSelectorRowActive: {
    backgroundColor: colors.blackCherry,
  },
  vipSelectorRows: {
    borderTopColor: colors.creamBorder,
    borderTopWidth: 1,
  },
  vipUnlockedCopy: {
    flex: 1,
    gap: 2,
  },
  vipUnlockedRow: {
    alignItems: "center",
    backgroundColor: colors.linen,
    borderColor: colors.creamBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  vipUnlockedRowActive: {
    backgroundColor: colors.blackCherry,
    borderColor: colors.blackCherry,
  },
  vipUnlockedWrap: {
    gap: spacing.sm,
  },
  removeVipButton: {
    minHeight: 36,
  },
  webView: {
    backgroundColor: colors.onyx,
    flex: 1,
  },
});
