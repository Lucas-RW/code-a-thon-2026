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
