import { getItem, setItem, deleteItem } from './storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const TOKEN_KEY = 'campuslens_access_token';

async function getAuthHeader() {
  const token = await getItem(TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Custom fetch wrapper that automatically attaches the JWT token.
 */
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const authHeader = await getAuthHeader();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (authHeader.Authorization) {
    headers['Authorization'] = authHeader.Authorization;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Handle unauthorized (token expired/invalid)
    await deleteItem(TOKEN_KEY);
    // You might want to trigger a logout/redirect here via a global event or context
  }

  return response;
}

export interface ApiResult<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export type GoalType = "career" | "research" | "academic_aid" | "social_support";

export const GOAL_OPTIONS: { id: GoalType; label: string }[] = [
  { id: "career", label: "Career" },
  { id: "research", label: "Research" },
  { id: "academic_aid", label: "Academic" },
  { id: "social_support", label: "Social" }
];

export interface UserProfile {
  id: string;
  name: string;
  year: string | null;
  major: string;
  is_first_gen: boolean;
  is_transfer: boolean;
  goals: GoalType[];
  goal_preferences: any;
  interested_opportunities: string[];
  skill_graph?: any;
  network_graph?: any;
}

export async function login(email: string, password: string): Promise<ApiResult<{ access_token: string }>> {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true'
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: text || `HTTP ${response.status}` };
    }

    const data = await response.json();
    await setItem(TOKEN_KEY, data.access_token);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: 'Network error' };
  }
}

export async function register(email: string, password: string): Promise<ApiResult<{ access_token: string }>> {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true'
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: text || `HTTP ${response.status}` };
    }

    const data = await response.json();
    await setItem(TOKEN_KEY, data.access_token);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: 'Network error' };
  }
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const response = await fetchWithAuth('/users/me');
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return await response.json();
}

export async function updateUserProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
  const response = await fetchWithAuth('/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to update user profile');
  }
  return await response.json();
}

export interface BuildingSummary {
  id: string;
  name: string;
  short_name?: string;
  description?: string;
  lat: number;
  lng: number;
}

export async function fetchBuildings(): Promise<BuildingSummary[]> {
  const response = await fetchWithAuth('/buildings');
  if (!response.ok) throw new Error('Failed to fetch buildings');
  return await response.json();
}

export async function fetchBuilding(buildingId: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/buildings/${buildingId}`);
  if (!response.ok) throw new Error('Failed to fetch building details');
  return await response.json();
}

export interface Opportunity {
  id: string;
  building_id: string;
  type: string;
  title: string;
  description?: string;
  professor?: string;
  tags: string[];
  contact?: string;
  url?: string;
  deadline?: string;
  goal_tags?: GoalType[];
}

export async function fetchBuildingOpportunities(buildingId: string): Promise<Opportunity[]> {
  const response = await fetch(`${BASE_URL}/buildings/${buildingId}/opportunities`);
  if (!response.ok) throw new Error('Failed to fetch building opportunities');
  return await response.json();
}

export async function setOpportunityInterest(opportunityId: string, interested: boolean): Promise<any> {
  const response = await fetchWithAuth('/interest', {
    method: 'POST',
    body: JSON.stringify({ opportunity_id: opportunityId, interested }),
  });
  if (!response.ok) throw new Error('Failed to update interest');
  return await response.json();
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
  goal_tags?: GoalType[];
}

export async function fetchInterestedOpportunities(): Promise<InterestedOpportunity[]> {
  const response = await fetchWithAuth('/users/me/interested-opportunities');
  if (!response.ok) throw new Error('Failed to fetch interested opportunities');
  return await response.json();
}

export async function logout() {
  await deleteItem(TOKEN_KEY);
}

export interface PathStep {
  order: number;
  goal_type: GoalType;
  building_id: string;
  building_name: string;
  opportunity_id: string;
  opportunity_title: string;
  short_reason?: string | null;
  skills: string[];
  skill_node_ids?: string[];
  network_node_ids?: string[];
  cta_label?: string | null;
  cta_url?: string | null;
}

export interface PathfindResponse {
  steps: PathStep[];
}

export async function fetchPathfind(params: { goal_type: GoalType; goal_text?: string }): Promise<PathfindResponse> {
  const response = await fetchWithAuth('/pathfind', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error('Failed to generate path');
  return await response.json();
}

export interface AIBootstrapBuildingRequest {
  campus_name: string;
  building_name: string;
  building_url?: string;
}

export interface AIBootstrapOpportunity {
  title: string;
  description: string;
  type: string;
  goal_tags: GoalType[];
  contact?: string | null;
  url?: string | null;
}

export interface AIBootstrapBuildingResponse {
  building: {
    name: string;
    short_name: string;
    description: string;
    departments: string[];
    image_url: string | null;
    lat: number;
    lng: number;
    source: string;
    confidence: number;
  };
  opportunities: AIBootstrapOpportunity[];
  source: string;
  confidence: number;
}

export interface SaveAIBootstrapRequest {
  building: any; // Using any to be flexible with the Building type
  opportunities: AIBootstrapOpportunity[];
}

export async function aiBootstrapBuilding(
  payload: AIBootstrapBuildingRequest
): Promise<AIBootstrapBuildingResponse> {
  const res = await fetchWithAuth("/buildings/ai-bootstrap", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Failed to bootstrap building");
  }
  return res.json();
}

export async function saveAIBootstrap(
  payload: SaveAIBootstrapRequest
): Promise<{ status: string; building_id: string; inserted_opportunities: number }>
{
  const res = await fetchWithAuth("/buildings/ai-bootstrap/save", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Failed to save AI bootstrap");
  }
  return res.json();
}
