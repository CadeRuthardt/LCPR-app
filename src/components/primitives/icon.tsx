import type { ColorValue } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faBell,
  faCalendarDays,
  faChevronLeft,
  faCheck,
  faChevronRight,
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
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type IconName =
  | "bell"
  | "calendar"
  | "check"
  | "chevron-left"
  | "chevron-right"
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
  | "x";

type IconProps = {
  color: ColorValue;
  name: IconName;
  size?: number;
};

const icons: Record<IconName, IconDefinition> = {
  bell: faBell,
  calendar: faCalendarDays,
  check: faCheck,
  "chevron-left": faChevronLeft,
  "chevron-right": faChevronRight,
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
  x: faXmark,
};

export function Icon({ color, name, size = 22 }: IconProps) {
  return <FontAwesomeIcon color={String(color)} icon={icons[name]} size={size} />;
}
