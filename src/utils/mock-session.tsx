import * as React from "react";

type MockClientSession = {
  contact: string;
  displayName: string;
};

type MockSessionContextValue = {
  client: MockClientSession | null;
  isSignedIn: boolean;
  signIn: (contact: string) => void;
  signOut: () => void;
};

const bypassLoginForPrototype = true;
const prototypeClient: MockClientSession = {
  contact: "prototype@lechateaupetresort.com",
  displayName: "Cade Ruthardt",
};

const MockSessionContext = React.createContext<MockSessionContextValue | null>(null);

type MockSessionProviderProps = React.PropsWithChildren;

export function MockSessionProvider({ children }: MockSessionProviderProps) {
  const [client, setClient] = React.useState<MockClientSession | null>(
    bypassLoginForPrototype ? prototypeClient : null,
  );

  const value = React.useMemo<MockSessionContextValue>(
    () => ({
      client,
      isSignedIn: Boolean(client),
      signIn: (contact: string) => {
        setClient({
          contact,
          displayName: "Cade Ruthardt",
        });
      },
      signOut: () => setClient(bypassLoginForPrototype ? prototypeClient : null),
    }),
    [client],
  );

  return <MockSessionContext.Provider value={value}>{children}</MockSessionContext.Provider>;
}

export function useMockSession() {
  const context = React.use(MockSessionContext);

  if (!context) {
    throw new Error("useMockSession must be used within MockSessionProvider");
  }

  return context;
}
