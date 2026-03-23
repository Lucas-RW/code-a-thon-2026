import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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

function createEmptyProfileData(): ProfileData {
  return {
    name: '',
    year: '',
    major: '',
    is_first_gen: false,
    is_transfer: false,
    goals: [],
    goal_preferences: {},
  };
}

function createProfileDataFromUser(profile: UserProfile | null): ProfileData {
  if (!profile) {
    return createEmptyProfileData();
  }

  return {
    name: profile.name ?? '',
    year: profile.year ?? '',
    major: profile.major ?? '',
    is_first_gen: profile.is_first_gen ?? false,
    is_transfer: profile.is_transfer ?? false,
    goals: profile.goals ?? [],
    goal_preferences: profile.goal_preferences ?? {},
  };
}

export function ProfileBuilderProvider({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>(() => createProfileDataFromUser(userProfile));

  useEffect(() => {
    setProfileData(createProfileDataFromUser(userProfile));
  }, [userProfile]);

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
