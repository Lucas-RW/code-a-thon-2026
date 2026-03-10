import * as React from 'react';
import { useUser } from '@clerk/clerk-expo';

interface OnboardingContextValue {
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: () => void;
}

const OnboardingContext = React.createContext<OnboardingContextValue>({
  hasCompletedOnboarding: false,
  setOnboardingComplete: () => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  // Derive initial value from Clerk unsafeMetadata, updated when user changes.
  const [hasCompletedOnboarding, setHasCompleted] = React.useState<boolean>(
    () => !!(user?.unsafeMetadata?.onboardingComplete),
  );

  // Keep in sync if user object refreshes (e.g., on re-mount after sign-in).
  React.useEffect(() => {
    setHasCompleted(!!(user?.unsafeMetadata?.onboardingComplete));
  }, [user]);

  const setOnboardingComplete = React.useCallback(() => {
    setHasCompleted(true);
  }, []);

  return (
    <OnboardingContext.Provider value={{ hasCompletedOnboarding, setOnboardingComplete }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return React.useContext(OnboardingContext);
}
