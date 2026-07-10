const genericAuthMessage =
  "We could not send that code right now. Please try again in a moment.";

export function getFriendlyAuthError(error: unknown) {
  const rawMessage = getRawErrorMessage(error);
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("user not found") || normalized.includes("signup")) {
    return "We could not find that email on file yet.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "That email and password did not match. Please check them and try again.";
  }

  if (
    normalized.includes("le chateau client profile") ||
    normalized.includes("found this email on file") ||
    normalized.includes("matching client record")
  ) {
    return rawMessage;
  }

  if (
    normalized.includes("unexpected_failure") ||
    normalized.includes("status\":500") ||
    normalized.includes("status:500") ||
    normalized.includes("smtp") ||
    normalized.includes("email")
  ) {
    return genericAuthMessage;
  }

  if (normalized.includes("token") || normalized.includes("otp") || normalized.includes("code")) {
    return "That code did not work. Please check it and try again.";
  }

  if (rawMessage.length > 180 || rawMessage.startsWith("{") || rawMessage.startsWith("[")) {
    return genericAuthMessage;
  }

  return rawMessage || genericAuthMessage;
}

function getRawErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
}
