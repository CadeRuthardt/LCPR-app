import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import type { KeyboardEvent } from "react-native";
import * as React from "react";

import { Button, Card, Icon, Text, TextField } from "@/components/primitives";
import { resortImages } from "@/data/mock-data";
import { colors, fonts, radius, spacing } from "@/theme";
import { getFriendlyAuthError } from "@/utils/auth-errors";
import { useSession } from "@/utils/session";

const logo = require("../../assets/logo.png");
const otpCodeLength = 8;

export function LoginScreen() {
  const { authError, isConfigured, sendEmailCode, verifyEmailCode } = useSession();
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [codeSent, setCodeSent] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);
  const formBottom = React.useRef(new Animated.Value(spacing.xxl)).current;

  React.useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardVisible(true);
      animateFormBottom(formBottom, event.endCoordinates.height + spacing.xs, event);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, (event) => {
      animateFormBottom(formBottom, spacing.xxl, event);
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [formBottom]);

  const cleanEmail = email.trim().toLowerCase();
  const canSendCode = cleanEmail.includes("@") && cleanEmail.includes(".");
  const canVerifyCode = code.replace(/\D/g, "").length === otpCodeLength;
  const displayedError = localError ?? authError;

  async function handleSendCode() {
    if (!canSendCode || !isConfigured) {
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      await sendEmailCode(cleanEmail);
      setCodeSent(true);
    } catch (error) {
      setLocalError(getFriendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode() {
    if (!canVerifyCode || !isConfigured) {
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      await verifyEmailCode(cleanEmail, code);
    } catch (error) {
      setLocalError(getFriendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ImageBackground
      source={{ uri: resortImages.loginHero }}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.backgroundOverlay}>
        <View pointerEvents="none" style={styles.staticHeroLayer}>
          <View style={styles.heroCopy}>
            <Image source={logo} style={styles.logoImage} />

            <View style={styles.headlineBlock}>
              <Text variant="hero" tone="inverse" style={styles.heroHeadline}>
                Come Sense
              </Text>
              <Text variant="hero" tone="inverse" style={styles.heroHeadline}>
                the{" "}
                <Text variant="hero" tone="accent" style={styles.heroAccent}>
                  Difference.
                </Text>
              </Text>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Icon color={colors.goldenrod} name="paw" size={28} />
              <View style={styles.dividerLine} />
            </View>

            <Text variant="heroBody" tone="inverse" style={styles.heroSubline}>
              Luxury care and exceptional experiences for pets who deserve the very best.
            </Text>
          </View>
        </View>

        {keyboardVisible ? (
          <Pressable
            accessibilityLabel="Dismiss keyboard"
            accessibilityRole="button"
            onPress={Keyboard.dismiss}
            style={styles.dismissLayer}
          />
        ) : null}

        <Animated.View style={[styles.formLayer, { bottom: formBottom }]}>
          <Card variant="elevated" style={styles.loginCard}>
            <View style={styles.cardHeaderCopy}>
              <Text variant="heading">
                {codeSent ? "Enter your email code" : "Continue with email"}
              </Text>
              <Text variant="body" tone="secondary">
                {codeSent
                  ? `We sent a one-time code to ${cleanEmail}.`
                  : "Use the email on file with Le Chateau. We will send a one-time code."}
              </Text>
            </View>

            {!isConfigured ? (
              <Text variant="caption" tone="secondary">
                Supabase is not configured yet. Add EXPO_PUBLIC_SUPABASE_URL and
                EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to continue.
              </Text>
            ) : null}
            {displayedError ? (
              <Text variant="caption" tone="secondary">
                {displayedError}
              </Text>
            ) : null}

            {!codeSent ? (
              <View style={styles.formGroup}>
                <TextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="Email on file"
                  textContentType="username"
                  value={email}
                />
                <Button
                  disabled={!canSendCode || !isConfigured || isSubmitting}
                  icon="chevron-right"
                  onPress={handleSendCode}
                  title={isSubmitting ? "Sending..." : "Send Email Code"}
                />
              </View>
            ) : (
              <View style={styles.formGroup}>
                <TextField
                  keyboardType="number-pad"
                  maxLength={otpCodeLength}
                  onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
                  placeholder={`${otpCodeLength}-digit code`}
                  textContentType="oneTimeCode"
                  value={code}
                />
                <Button
                  disabled={!canVerifyCode || isSubmitting}
                  icon="check"
                  onPress={handleVerifyCode}
                  title={isSubmitting ? "Checking..." : "Continue"}
                />
                <Button
                  onPress={() => {
                    setCode("");
                    setCodeSent(false);
                    setLocalError(null);
                  }}
                  title="Use a different email"
                  variant="ghost"
                />
              </View>
            )}
          </Card>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

function animateFormBottom(
  animatedValue: Animated.Value,
  toValue: number,
  event?: KeyboardEvent,
) {
  Animated.timing(animatedValue, {
    duration: event?.duration ?? 260,
    easing: Easing.out(Easing.cubic),
    toValue,
    useNativeDriver: false,
  }).start();
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundOverlay: {
    backgroundColor: colors.overlayDeep,
    flex: 1,
  },
  staticHeroLayer: {
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: 70,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 0,
  },
  dismissLayer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1,
  },
  formLayer: {
    bottom: spacing.xxl,
    left: spacing.lg,
    position: "absolute",
    right: spacing.lg,
    zIndex: 2,
  },
  logoImage: {
    height: 190,
    resizeMode: "contain",
    width: 286,
  },
  heroCopy: {
    alignItems: "center",
    gap: spacing.xl,
  },
  headlineBlock: {
    alignItems: "center",
  },
  heroHeadline: {
    textAlign: "center",
  },
  heroAccent: {
    fontFamily: fonts.displayItalic,
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    width: "82%",
  },
  dividerLine: {
    backgroundColor: colors.goldenrod,
    flex: 1,
    height: 1,
  },
  heroSubline: {
    maxWidth: 320,
    textAlign: "center",
  },
  loginCard: {
    backgroundColor: colors.porcelain,
    borderRadius: radius.xxl,
    gap: spacing.lg,
    zIndex: 1,
  },
  cardHeaderCopy: {
    gap: spacing.xs,
  },
  formGroup: {
    gap: spacing.md,
  },
});
