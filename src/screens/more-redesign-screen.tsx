import { router } from "expo-router";
import { Linking } from "react-native";
import { AppCard, AppScreen, AppSection, MenuRow } from "@/components/app";
import { Button } from "@/components/primitives";
import { useSession } from "@/utils/session";

export function MoreRedesignScreen() { const { signOut } = useSession(); return <AppScreen title="More" subtitle="Everything you need, all in one place.">
  <AppSection title="Account"><AppCard padding="none" variant="flushRows"><MenuRow icon="user" title="Account Profile" subtitle="Manage your information and preferences" onPress={() => router.push("/profile")} /><MenuRow icon="paw" title="My Pets" subtitle="View and manage your pets" onPress={() => router.push("/pets")} /><MenuRow icon="credit-card" title="Payment Methods" subtitle="Manage your saved payment methods" /><MenuRow icon="receipt" title="Payment History" subtitle="View your receipts and transactions" isLast /></AppCard></AppSection>
  <AppSection title="Stay Connected"><AppCard padding="none" variant="flushRows"><MenuRow icon="message" title="Messages" subtitle="View messages from the resort" badge="2" /><MenuRow icon="camera" title="Webcams" subtitle="View live webcams at the resort" onPress={() => router.push("/live-cameras")} /><MenuRow icon="megaphone" title="Resort Updates" subtitle="News, events and important updates" /><MenuRow icon="star" title="Refer a Friend" subtitle="Share LCPR and earn rewards" isLast /></AppCard></AppSection>
  <AppSection title="Help & Support"><AppCard padding="none" variant="flushRows"><MenuRow icon="help" title="Help Center" subtitle="Find answers to common questions" /><MenuRow icon="message" title="Contact Us" subtitle="Get in touch with our team" onPress={() => Linking.openURL("mailto:support@lechateaupetresort.com")} /><MenuRow icon="file" title="Policies & Agreements" subtitle="View our policies and agreements" /><MenuRow icon="info" title="About Le Chateau" subtitle="Learn more about our resort" onPress={() => Linking.openURL("https://lechateaupetresort.com/")} isLast /></AppCard></AppSection>
  <Button icon="log-out" onPress={() => void signOut()} title="Log Out" variant="secondary" />
  </AppScreen>; }
