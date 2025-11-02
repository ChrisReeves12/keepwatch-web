/**
 * Server-side authentication utilities
 * This file should only be imported in server-side code (loaders, actions)
 */

import { redirect } from "react-router";

const TOKEN_COOKIE_NAME = "keepwatch_token";

// Cookie settings for production security
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Create a Set-Cookie header for the auth token
 */
export async function setAuthCookie(token: string): Promise<string> {
    const cookieAttributes = [
        `${TOKEN_COOKIE_NAME}=${token}`,
        `Max-Age=${COOKIE_MAX_AGE}`,
        "Path=/",
        "HttpOnly", // Prevents JavaScript access
        "SameSite=Lax", // CSRF protection
        // Add Secure in production (requires HTTPS)
        ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    ];

    return cookieAttributes.join("; ");
}

/**
 * Get auth token from request cookies
 */
export function getAuthToken(request: Request): string | null {
    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const tokenCookie = cookies.find((c) => c.startsWith(`${TOKEN_COOKIE_NAME}=`));

    if (!tokenCookie) return null;

    return tokenCookie.split("=")[1];
}

/**
 * Clear the auth cookie (for logout)
 */
export function clearAuthCookie(): string {
    return `${TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`;
}

/**
 * Require authentication - redirects to login if no token
 * Use this in loaders for protected routes
 */
export function requireAuth(request: Request): string {
    const token = getAuthToken(request);

    if (!token) {
        throw redirect("/login");
    }

    return token;
}

