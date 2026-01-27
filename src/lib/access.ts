/**
 * Access Gate Utilities
 * Helper functions for checking login status and managing access grants
 */

export interface AccessGrant {
  name: string;
  grantedAt: number;
  expiresAt: number;
}

/**
 * Check if user has valid access grant
 */
export function isAccessGranted(): boolean {
  try {
    const grant = localStorage.getItem("access_grant");
    if (!grant) return false;
    const { expiresAt } = JSON.parse(grant);
    return Date.now() < expiresAt;
  } catch {
    return false;
  }
}

/**
 * Get logged-in user's name
 */
export function getAccessName(): string | null {
  try {
    const grant = localStorage.getItem("access_grant");
    if (!grant) return null;
    const { expiresAt, name } = JSON.parse(grant);
    return Date.now() < expiresAt ? name : null;
  } catch {
    return null;
  }
}

/**
 * Get time remaining in hours
 */
export function getAccessTimeRemaining(): number {
  try {
    const grant = localStorage.getItem("access_grant");
    if (!grant) return 0;
    const { expiresAt } = JSON.parse(grant);
    const remaining = Math.max(0, expiresAt - Date.now());
    return Math.round((remaining / (60 * 60 * 1000)) * 10) / 10; // Round to 1 decimal
  } catch {
    return 0;
  }
}

/**
 * Clear access grant (logout)
 */
export function clearAccessGrant(): void {
  localStorage.removeItem("access_grant");
}
