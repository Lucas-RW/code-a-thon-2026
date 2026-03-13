import React, { createContext, useContext, useState } from 'react';

export interface ProfileData {
  name: string;
  year: string;
  major: string;
  is_first_gen: boolean;
  is_transfer: boolean;
  goals: string[];
  goal_preferences: {
    career?: {
      target_roles: string[];
      target_industries: string[];
      favorite_companies: string[];
      priority: string;
    };
    research?: {
      fields: string[];
      math_comfort: string;
    };
    academic_aid?: {
      courses_of_concern: string[];
      help_style: string;
    };
    social_support?: {
      seeks: string[];
      comfort_factors: string[];
    };
  };
}

interface ProfileBuilderContextType {
  profileData: ProfileData;
  updateProfileData: (data: Partial<ProfileData>) => void;
  updateGoalPreferences: (goal: string, prefs: any) => void;
}

const ProfileBuilderContext = createContext<ProfileBuilderContextType | undefined>(undefined);

export function ProfileBuilderProvider({ children }: { children: React.ReactNode }) {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    year: '',
    major: '',
    is_first_gen: false,
    is_transfer: false,
    goals: [],
    goal_preferences: {},
  });

  const updateProfileData = (data: Partial<ProfileData>) => {
    setProfileData((prev) => ({ ...prev, ...data }));
  };

  const updateGoalPreferences = (goal: string, prefs: any) => {
    setProfileData((prev) => ({
      ...prev,
      goal_preferences: {
        ...prev.goal_preferences,
        [goal]: prefs,
      },
    }));
  };

  return (
    <ProfileBuilderContext.Provider value={{ profileData, updateProfileData, updateGoalPreferences }}>
      {children}
    </ProfileBuilderContext.Provider>
  );
}

export function useProfileBuilder() {
  const context = useContext(ProfileBuilderContext);
  if (context === undefined) {
    throw new Error('useProfileBuilder must be used within a ProfileBuilderProvider');
  }
  return context;
}
