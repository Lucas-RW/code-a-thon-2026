const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export interface UserProfilePayload {
  clerk_user_id: string;
  name: string;
  major: string;
  year: string;
  interests: string[];
}

export interface ApiResult {
  ok: boolean;
  error?: string;
}

/**
 * Creates or updates a user profile by calling POST /users on the backend.
 */
export async function createOrUpdateUserProfile(
  payload: UserProfilePayload,
): Promise<ApiResult> {
  try {
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: text || `HTTP ${response.status}` };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { ok: false, error: message };
  }
}

export interface BuildingSummary {
  id: string;
  name: string;
  short_name?: string;
  lat: number;
  lng: number;
  description?: string;
}

/**
 * Fetches all buildings from the backend.
 */
export async function fetchBuildings(): Promise<BuildingSummary[]> {
  try {
    const response = await fetch(`${BASE_URL}/buildings`);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data as BuildingSummary[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    throw new Error(`Failed to fetch buildings: ${message}`);
  }
}

export interface InterestResponse {
  status: string;
  interested: boolean;
  opportunity_id: string;
  skills: string[];
}

/**
 * Adds or removes an opportunity from the user's interested_opportunities list.
 * Throws on non-2xx or network error.
 */
export async function setOpportunityInterest(params: {
  opportunityId: string;
  interested: boolean;
  clerkUserId: string;
}): Promise<InterestResponse> {
  const response = await fetch(`${BASE_URL}/interest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clerk_user_id: params.clerkUserId,
      opportunity_id: params.opportunityId,
      interested: params.interested,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    ...data,
    skills: Array.isArray(data?.skills) ? data.skills : [],
  };
}

export interface BuildingDetail {
  id: string;
  name: string;
  short_name?: string;
  lat: number;
  lng: number;
  departments: string[];
  description?: string;
  image_url?: string;
}

export interface Opportunity {
  id: string;
  building_id: string;
  type: "student_org" | "research" | "job" | "course" | "event" | "professor";
  title: string;
  description?: string;
  professor?: string | null;
  tags: string[];
  contact?: string | null;
  url?: string | null;
  deadline?: string | null;
}

export async function fetchBuilding(buildingId: string): Promise<BuildingDetail> {
  try {
    const response = await fetch(`${BASE_URL}/buildings/${buildingId}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    return await response.json() as BuildingDetail;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    throw new Error(`Failed to fetch building details: ${message}`);
  }
}

export async function fetchBuildingOpportunities(buildingId: string): Promise<Opportunity[]> {
  try {
    const response = await fetch(`${BASE_URL}/buildings/${buildingId}/opportunities`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    return await response.json() as Opportunity[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    throw new Error(`Failed to fetch building opportunities: ${message}`);
  }
}

export interface UserProfile {
  id: string;
  clerk_user_id: string;
  name: string;
  major: string;
  year: string;
  interests: string[];
  interested_opportunities: string[];
  skill_graph?: any;
  network_graph?: any;
}

export async function fetchUserProfile(clerkUserId: string): Promise<UserProfile> {
  const response = await fetch(`${BASE_URL}/users/${clerkUserId}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return await response.json() as UserProfile;
}

export interface InterestedOpportunity {
  id: string;
  building_id: string;
  building_name: string;
  building_short_name?: string;
  type: "student_org" | "research" | "job" | "course" | "event" | "professor";
  title: string;
  description?: string;
  professor?: string | null;
  tags: string[];
  contact?: string | null;
  url?: string | null;
  deadline?: string | null;
}

export async function fetchInterestedOpportunities(clerkUserId: string): Promise<InterestedOpportunity[]> {
  try {
    const response = await fetch(`${BASE_URL}/users/${clerkUserId}/interested-opportunities`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    return await response.json() as InterestedOpportunity[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    throw new Error(`Failed to fetch interested opportunities: ${message}`);
  }
}
