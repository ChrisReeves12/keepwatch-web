/**
 * Server-side authentication utilities
 * This file should only be imported in server-side code (loaders, actions)
 */

import { redirect } from "react-router";

const TOKEN_COOKIE_NAME = "keepwatch_token";
const USER_ID_COOKIE_NAME = "keepwatch_user_id";

// Cookie settings for production security
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Create Set-Cookie headers for auth token and user ID
 */
export async function setAuthCookies(token: string, userId: string): Promise<string[]> {
    const tokenCookie = [
        `${TOKEN_COOKIE_NAME}=${token}`,
        `Max-Age=${COOKIE_MAX_AGE}`,
        "Path=/",
        "HttpOnly", // Prevents JavaScript access
        "SameSite=Lax", // CSRF protection
        // Add Secure in production (requires HTTPS)
        ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    ].join("; ");

    const userIdCookie = [
        `${USER_ID_COOKIE_NAME}=${userId}`,
        `Max-Age=${COOKIE_MAX_AGE}`,
        "Path=/",
        "SameSite=Lax",
        ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    ].join("; ");

    return [tokenCookie, userIdCookie];
}

/**
 * Legacy function for backwards compatibility
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
 * Get user ID from request cookies
 */
export function getUserId(request: Request): string | null {
    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const userIdCookie = cookies.find((c) => c.startsWith(`${USER_ID_COOKIE_NAME}=`));

    if (!userIdCookie) return null;

    return userIdCookie.split("=")[1];
}

/**
 * Clear the auth cookies (for logout)
 */
export function clearAuthCookies(): string[] {
    return [
        `${TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`,
        `${USER_ID_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`,
    ];
}

/**
 * Legacy function for backwards compatibility
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

