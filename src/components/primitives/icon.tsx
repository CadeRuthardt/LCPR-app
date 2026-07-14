import type { ColorValue } from "react-native";
import {
  Bell,
  CalendarDays,
  Camera,
  Cat,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDollarSign,
  CircleHelp,
  Info,
  Clock,
  Compass,
  CreditCard,
  Dog,
  Ellipsis,
  FileText,
  Heart,
  House,
  Lock,
  LogOut,
  Mail,
  Menu,
  Megaphone,
  MessageCircle,
  PawPrint,
  Plus,
  ReceiptText,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  Stethoscope,
  User,
  Utensils,
  Video,
  WandSparkles,
  X,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

export type IconName =
  | "bell" | "calendar" | "camera" | "cat" | "check" | "chevron-down"
  | "chevron-left" | "chevron-right" | "chevron-up" | "clock" | "compass"
  | "credit-card" | "dog" | "dollar" | "ellipsis" | "file" | "heart" | "help"
  | "home" | "info" | "lock" | "log-out" | "mail" | "menu" | "message"
  | "megaphone" | "paw" | "plus" | "receipt" | "refresh" | "shield"
  | "sparkles" | "star" | "stethoscope" | "user" | "utensils" | "video"
  | "wand" | "x";

type IconProps = { color: ColorValue; name: IconName; size?: number; strokeWidth?: number };

const icons: Record<IconName, LucideIcon> = {
  bell: Bell, calendar: CalendarDays, camera: Camera, cat: Cat, check: Check,
  "chevron-down": ChevronDown, "chevron-left": ChevronLeft, "chevron-right": ChevronRight,
  "chevron-up": ChevronUp, clock: Clock, compass: Compass, "credit-card": CreditCard,
  dog: Dog, dollar: CircleDollarSign, ellipsis: Ellipsis, file: FileText, heart: Heart,
  help: CircleHelp, home: House, info: Info, lock: Lock, "log-out": LogOut,
  mail: Mail, menu: Menu, message: MessageCircle, megaphone: Megaphone, paw: PawPrint,
  plus: Plus, receipt: ReceiptText, refresh: RefreshCw, shield: Shield, sparkles: Sparkles,
  star: Star, stethoscope: Stethoscope, user: User, utensils: Utensils, video: Video,
  wand: WandSparkles, x: X,
};

export function Icon({ color, name, size = 22, strokeWidth = 1.8 }: IconProps) {
  const Glyph = icons[name];
  return <Glyph color={String(color)} size={size} strokeWidth={strokeWidth} />;
}
