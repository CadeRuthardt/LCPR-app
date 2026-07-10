import type { ColorValue } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faBell,
  faCalendarDays,
  faCamera,
  faChevronDown,
  faChevronLeft,
  faCheck,
  faChevronRight,
  faChevronUp,
  faCircleInfo,
  faCircleQuestion,
  faClock,
  faCompass,
  faCreditCard,
  faEllipsis,
  faEnvelope,
  faHeart,
  faHouse,
  faLock,
  faPaw,
  faPlus,
  faRightFromBracket,
  faRotateRight,
  faShieldHalved,
  faStar,
  faUser,
  faUtensils,
  faVideo,
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type IconName =
  | "bell"
  | "calendar"
  | "camera"
  | "check"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "clock"
  | "ellipsis"
  | "compass"
  | "credit-card"
  | "heart"
  | "help"
  | "home"
  | "info"
  | "lock"
  | "log-out"
  | "mail"
  | "paw"
  | "plus"
  | "refresh"
  | "shield"
  | "sparkles"
  | "star"
  | "user"
  | "utensils"
  | "video"
  | "x";

type IconProps = {
  color: ColorValue;
  name: IconName;
  size?: number;
};

const icons: Record<IconName, IconDefinition> = {
  bell: faBell,
  calendar: faCalendarDays,
  camera: faCamera,
  check: faCheck,
  "chevron-down": faChevronDown,
  "chevron-left": faChevronLeft,
  "chevron-right": faChevronRight,
  "chevron-up": faChevronUp,
  clock: faClock,
  ellipsis: faEllipsis,
  compass: faCompass,
  "credit-card": faCreditCard,
  heart: faHeart,
  help: faCircleQuestion,
  home: faHouse,
  info: faCircleInfo,
  lock: faLock,
  "log-out": faRightFromBracket,
  mail: faEnvelope,
  paw: faPaw,
  plus: faPlus,
  refresh: faRotateRight,
  shield: faShieldHalved,
  sparkles: faWandMagicSparkles,
  star: faStar,
  user: faUser,
  utensils: faUtensils,
  video: faVideo,
  x: faXmark,
};

export function Icon({ color, name, size = 22 }: IconProps) {
  return <FontAwesomeIcon color={String(color)} icon={icons[name]} size={size} />;
}
