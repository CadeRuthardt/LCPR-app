const defaultReceptionContact = {
  email: "support@lechateaupetresort.com",
  location: "Le Chateau",
};

const receptionContacts = [
  {
    aliases: ["amarillo", "ama"],
    email: "info@lechateaupetresort.com",
    location: "Amarillo",
  },
  {
    aliases: ["wichita falls", "wf"],
    email: "info.wf@lechateaupetresort.com",
    location: "Wichita Falls",
  },
  {
    aliases: ["new braunfels", "nb"],
    email: "info.nb@lechateaupetresort.com",
    location: "New Braunfels",
  },
];

export function getReceptionContactForLocation(location: string | null | undefined) {
  const normalizedLocation = location?.trim().toLowerCase() ?? "";

  return (
    receptionContacts.find((contact) =>
      contact.aliases.some((alias) => normalizedLocation.includes(alias)),
    ) ?? defaultReceptionContact
  );
}

export function getReceptionLocationOptions() {
  return receptionContacts.map((contact) => contact.location);
}
