const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface AuthResponse {
    message?: string;
    token?: string;
    is2FARequired?: boolean;
    user: User;
    inviteId?: string;
    inviteToken?: string;
}

export interface AuthError {
    error: string;
}

export interface User {
    name: string;
    email: string;
    userId: string;
    createdAt: string;
    company: string;
    updatedAt: string;
    emailVerifiedAt?: string | null;
    is2FARequired?: boolean;
    _id: string;
}

export interface Project {
    _id: string;
    name: string;
    description: string;
    projectId: string;
    ownerId: string;
    ownerName?: string | null;
    ownerEmail?: string | null;
    users: Array<{
        id: string;
        role: string;
        name?: string;
        email?: string;
    }>;
    createdAt: string;
    updatedAt: string;
    apiKeys: Array<{
        id: string;
        key: string;
        createdAt: string;
        constraints: Record<string, any>;
    }>;
}

export interface ProjectsResponse {
    projects: Project[];
}

export interface Alarm {
    id: string;
    _id?: string;
    logType: string;
    message: string | null;
    level: string | string[];
    environment: string;
    categories?: string[];
    deliveryMethods: {
        email?: {
            addresses: string[];
        };
        slack?: {
            webhook: string;
        };
        webhook?: {
            url: string;
        };
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface AlarmsResponse {
    alarms: Alarm[];
    count: number;
}

/**
 * Authenticate user with email and password
 */
export async function authenticate(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
    }

    return data as AuthResponse;
}

interface VerifyTwoFactorRequest {
    email: string;
    code: string;
}

/**
 * Verify 2FA code for a user
 */
export async function verifyTwoFactor({ email, code }: VerifyTwoFactorRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/auth/verify-2fa`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (response.status === 400) {
        throw new Error(data.error || 'Invalid code input. Please check your entry.');
    }

    if (response.status === 401 || response.status === 404) {
        throw new Error('Verification code is invalid or has expired.');
    }

    if (!response.ok) {
        throw new Error(data.error || '2FA verification failed');
    }

    return data as AuthResponse;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ForgotPasswordResponse {
    message: string;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset email');
    }

    return data as ForgotPasswordResponse;
}

export interface ResetPasswordRequest {
    email: string;
    code: string;
    newPassword: string;
}

export interface ResetPasswordResponse {
    message: string;
}

export async function resetPassword({ email, code, newPassword }: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, newPassword }),
    });

    const data = await response.json();

    if (response.status === 400) {
        throw new Error(data.error || 'Invalid input. Please check your entry.');
    }

    if (response.status === 401) {
        throw new Error('Invalid or expired recovery code.');
    }

    if (response.status === 404) {
        throw new Error('User not found.');
    }

    if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
    }

    return data as ResetPasswordResponse;
}

export interface RegisterUserRequest {
    name: string;
    email: string;
    password: string;
    company: string;
    inviteId?: string | null;
    inviteToken?: string | null;
}

export interface RegisterUserResponse {
    message: string;
    user: User;
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterUserRequest): Promise<RegisterUserResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
        throw new Error(responseData.error || 'Registration failed');
    }

    return responseData as RegisterUserResponse;
}

/**
 * Make an authenticated API request
 * When called from the server, pass the token from getAuthToken(request)
 * When called from the client, cookies are automatically included
 */
export async function authenticatedFetch(
    url: string,
    options: RequestInit & { token?: string } = {}
): Promise<Response> {
    const { token, ...fetchOptions } = options;

    const headers = new Headers(fetchOptions.headers);
    headers.set('Content-Type', 'application/json');

    // If token is explicitly provided (server-side), use it
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(`${API_BASE_URL}${url}`, {
        ...fetchOptions,
        headers,
        // Ensure cookies are included in client-side requests
        credentials: 'include',
    });
}

/**
 * Fetch all projects for the authenticated user
 */
export async function fetchProjects(token: string): Promise<ProjectsResponse> {
    const response = await authenticatedFetch('/v1/projects', {
        method: 'GET',
        token,
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch projects');
    }

    return response.json();
}

export interface GetProjectResponse {
    project: Project;
}

/**
 * Fetch a single project by projectId
 */
export async function fetchProject(token: string, projectId: string): Promise<Project> {
    const response = await authenticatedFetch(`/v1/projects/${projectId}`, {
        method: 'GET',
        token,
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch project');
    }

    const data: GetProjectResponse = await response.json();
    return data.project;
}

export interface CreateProjectRequest {
    name: string;
    description: string;
}

export interface CreateProjectResponse {
    message: string;
    project: Project;
}

/**
 * Create a new project
 */
export async function createProject(token: string, data: CreateProjectRequest): Promise<CreateProjectResponse> {
    const response = await authenticatedFetch('/v1/projects', {
        method: 'POST',
        token,
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
    }

    return response.json();
}

export interface APIKey {
    id: string;
    key: string;
    createdAt: string;
    constraints: Record<string, any>;
}

export interface CreateAPIKeyResponse {
    message: string;
    apiKey: APIKey;
}

/**
 * Create a new API key for a project
 */
export async function createAPIKey(token: string, projectId: string): Promise<CreateAPIKeyResponse> {
    const response = await authenticatedFetch(`/v1/projects/${projectId}/api-keys`, {
        method: 'POST',
        token,
        body: JSON.stringify({}),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create API key');
    }

    return response.json();
}

export interface UpdateAPIKeyRequest {
    constraints: {
        ipRestrictions?: {
            allowedIps: string[];
        };
        refererRestrictions?: {
            allowedReferers: string[];
        };
        rateLimits?: {
            requestsPerMinute?: number;
            requestsPerHour?: number;
            requestsPerDay?: number;
        };
        expirationDate?: string;
        allowedEnvironments?: string[];
        originRestrictions?: {
            allowedOrigins: string[];
        };
        userAgentRestrictions?: {
            allowedPatterns: string[];
        };
    };
}

export interface UpdateAPIKeyResponse {
    message: string;
    apiKey: APIKey;
}

/**
 * Update an API key's constraints
 */
export async function updateAPIKey(
    token: string,
    projectId: string,
    apiKeyId: string,
    data: UpdateAPIKeyRequest
): Promise<UpdateAPIKeyResponse> {

    const response = await authenticatedFetch(`/v1/projects/${projectId}/api-keys/${apiKeyId}`, {
        method: 'PUT',
        token,
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update API key');
    }

    return response.json();
}

/**
 * Delete/revoke an API key
 */
export async function deleteAPIKey(token: string, projectId: string, apiKeyId: string): Promise<void> {
    const response = await authenticatedFetch(`/v1/projects/${projectId}/api-keys/${apiKeyId}`, {
        method: 'DELETE',
        token,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete API key');
    }
}

/**
 * Delete a project
 */
export async function deleteProject(token: string, projectId: string): Promise<void> {
    const response = await authenticatedFetch(`/v1/projects/${projectId}`, {
        method: 'DELETE',
        token,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
    }
}

export interface GetCurrentUserResponse {
    user: User;
}

/**
 * Get current user info
 */
export async function getCurrentUser(token: string): Promise<User> {
    const response = await authenticatedFetch('/v1/users/me', {
        method: 'GET',
        token,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get current user');
    }

    const data: GetCurrentUserResponse = await response.json();
    return data.user;
}

/**
 * Remove a user from a project
 */
export async function removeUserFromProject(token: string, projectId: string, userId: string): Promise<void> {
    const response = await authenticatedFetch(`/v1/projects/${projectId}/users/${userId}`, {
        method: 'DELETE',
        token,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove user from project');
    }
}

export interface UpdateProjectRequest {
    name?: string;
    description?: string;
}

export interface UpdateProjectResponse {
    message: string;
    project: Project;
}

/**
 * Update a project's details
 */
export async function updateProject(token: string, projectId: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await authenticatedFetch(`/v1/projects/${projectId}`, {
        method: 'PUT',
        token,
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
    }

    const result: UpdateProjectResponse = await response.json();
    return result.project;
}

export interface SendProjectInviteRequest {
    email: string;
    role: string;
}

export interface SendProjectInviteResponse {
    message?: string;
    success?: boolean;
}

/**
 * Send a project invitation to an email with a role
 */
export async function sendProjectInvite(
    token: string,
    projectId: string,
    data: SendProjectInviteRequest
): Promise<SendProjectInviteResponse> {
    const response = await authenticatedFetch(`/v1/projects/${projectId}/invite/send`, {
        method: 'POST',
        token,
        body: JSON.stringify(data),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error((responseData as any).error || 'Failed to send invite');
    }

    return (responseData as SendProjectInviteResponse) || { success: true };
}

/**
 * Log Types and Interfaces
 */
export interface Log {
    _id?: string;
    level: string;
    environment: string;
    hostname?: string;
    category?: string;
    projectId: string;
    projectObjectId: string;
    message: string;
    logType?: string;
    stackTrace: Array<Record<string, any>>;
    rawStackTrace?: string;
    details: Record<string, any>;
    detailString: string | null;
    timestampMS: number;
    createdAt: Date;
    request?: {
        url?: string;
        os?: string;
        userAgent?: string;
    };
}

export interface MessageCondition {
    field: string;
    value: string;
}

export interface MessageFilter {
    operator: 'AND' | 'OR';
    conditions: MessageCondition[];
}

export interface DocFilter {
    phrase: string;
    matchType: 'contains';
}

export interface SearchLogsRequest {
    page?: number;
    pageSize?: number;
    level?: string | string[];
    environment?: string | string[];
    hostname?: string | string[];
    category?: string[];
    message?: MessageFilter;
    stackTrace?: MessageFilter;
    details?: MessageFilter;
    docFilter?: DocFilter;
    startTime?: number;
    endTime?: number;
    logType?: string;
    sortOrder?: 'desc' | 'asc';
}

export interface SearchLogsResponse {
    logs: Log[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Search application logs for a project
 */
export async function searchLogs(projectId: string, filters: SearchLogsRequest = {}, token?: string): Promise<SearchLogsResponse> {
    const response = await authenticatedFetch(`/v1/logs/${projectId}/search`, {
        method: 'POST',
        token,
        body: JSON.stringify(filters),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search logs');
    }

    return response.json();
}

/**
 * Fetch a single log by ID
 */
export async function fetchLog(projectId: string, logId: string, token?: string): Promise<Log> {
    const response = await authenticatedFetch(`/v1/logs/${projectId}/${logId}`, {
        method: 'GET',
        token,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch log');
    }

    return response.json();
}

/**
 * Delete logs by IDs
 */
export async function deleteLogs(projectId: string, logIds: string[], token?: string): Promise<void> {
    const response = await authenticatedFetch(`/v1/logs/${projectId}`, {
        method: 'DELETE',
        token,
        body: JSON.stringify({ logIds }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete logs');
    }
}

/**
 * Fetch alarms for a project
 */
export async function fetchProjectAlarms(token: string, projectId: string): Promise<AlarmsResponse> {
    const response = await authenticatedFetch(`/v1/projects/${projectId}/alarms`, {
        method: 'GET',
        token,
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch alarms: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Create a new alarm for a project
 */
export async function createAlarm(token: string, projectId: string, alarmData: Omit<Alarm, 'id' | '_id' | 'createdAt' | 'updatedAt'>): Promise<Alarm> {
    const response = await authenticatedFetch(`/v1/projects/${projectId}/alarms`, {
        method: 'POST',
        token,
        body: JSON.stringify(alarmData),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create alarm' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to create alarm`);
    }

    return response.json();
}

/**
 * Delete an alarm from a project
 * If no alarmId is provided, deletes all alarms for the project
 */
export async function deleteProjectAlarm(token: string, projectId: string, alarmId?: string): Promise<void> {
    const endpoint = alarmId
        ? `/v1/projects/${projectId}/alarms/${alarmId}`
        : `/v1/projects/${projectId}/alarms`;

    const response = await authenticatedFetch(endpoint, {
        method: 'DELETE',
        token,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete alarm' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to delete alarm`);
    }
}

/**
 * Update an alarm in a project
 */
export async function updateProjectAlarm(token: string, projectId: string, alarmId: string, alarmData: Omit<Alarm, 'id' | '_id' | 'createdAt' | 'updatedAt'>): Promise<Alarm> {
    const response = await authenticatedFetch(`/v1/projects/${projectId}/alarms/${alarmId}`, {
        method: 'PUT',
        token,
        body: JSON.stringify(alarmData),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update alarm' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to update alarm`);
    }

    return response.json();
}

export interface EnvironmentOption {
    value: string;
    count: number;
}

export interface FetchEnvironmentsResponse {
    environments: EnvironmentOption[];
}

/**
 * Category types
 */
export interface CategoryOption {
    value: string;
    count: number;
}

export interface FetchCategoriesResponse {
    categories: CategoryOption[];
}

/**
 * Fetch available environments for a project and log type
 */
export async function fetchEnvironments(token: string, projectId: string, logType: 'application' | 'system'): Promise<FetchEnvironmentsResponse> {
    const response = await authenticatedFetch(`/v1/logs/${projectId}/${logType}/environments`, {
        method: 'GET',
        token,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch environments' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch environments`);
    }

    return response.json();
}

/**
 * Fetch available categories for a project and log type
 */
export async function fetchCategories(token: string, projectId: string, logType: 'application' | 'system'): Promise<FetchCategoriesResponse> {
    const response = await authenticatedFetch(`/v1/logs/${projectId}/${logType}/categories`, {
        method: 'GET',
        token,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch categories' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch categories`);
    }

    return response.json();
}

/**
 * Account Management API Functions
 */

export interface UpdateUserRequest {
    name?: string;
    company?: string;
    is2FARequired?: boolean;
}

export interface UpdateUserResponse {
    message: string;
    user: User;
}

/**
 * Update current user's information
 */
export async function updateUser(token: string, data: UpdateUserRequest): Promise<User> {
    const response = await authenticatedFetch('/v1/users/me', {
        method: 'PUT',
        token,
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user information');
    }

    const result: UpdateUserResponse = await response.json();
    return result.user;
}

export interface RequestPasswordResetResponse {
    message: string;
}

/**
 * Request a password reset - sends a verification code to the user's email
 * Code expires after 15 minutes
 */
export async function requestPasswordReset(email: string): Promise<RequestPasswordResetResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request password reset');
    }

    return response.json();
}

export interface VerifyPasswordResetRequest {
    email: string;
    code: string;
    newPassword: string;
}

export interface VerifyPasswordResetResponse {
    message: string;
}

/**
 * Verify the code and update the password
 */
export async function verifyPasswordReset(data: VerifyPasswordResetRequest): Promise<VerifyPasswordResetResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
    }

    return response.json();
}

export interface RequestAccountDeletionResponse {
    message: string;
    verificationCodeSent: boolean;
}

/**
 * Request account deletion - sends a verification code to the user's email
 */
export async function requestAccountDeletion(token: string): Promise<RequestAccountDeletionResponse> {
    const response = await authenticatedFetch('/v1/users/me/delete/request', {
        method: 'POST',
        token,
        body: JSON.stringify({}),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request account deletion');
    }

    return response.json();
}

export interface VerifyAccountDeletionRequest {
    code: string;
}

export interface VerifyAccountDeletionResponse {
    message: string;
}

/**
 * Verify the code and delete the account
 */
export async function verifyAccountDeletion(token: string, data: VerifyAccountDeletionRequest): Promise<VerifyAccountDeletionResponse> {
    const response = await authenticatedFetch('/v1/users/me', {
        method: 'DELETE',
        token,
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
    }

    return response.json();
}

export interface VerifyEmailResponse {
    message: string;
    user: User;
}

/**
 * Verify email address with OTP code
 */
export async function verifyEmail(code: string): Promise<VerifyEmailResponse> {
    const response = await authenticatedFetch('/v1/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ code }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify email');
    }

    return response.json();
}

export interface ResendVerificationResponse {
    message: string;
}

/**
 * Resend email verification code
 */
export async function resendVerificationEmail(email: string): Promise<ResendVerificationResponse> {
    const response = await authenticatedFetch('/v1/auth/verify-email/resend', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend verification email');
    }

    return response.json();
}

export interface Invite {
    inviteId: string;
    projectId: string;
    recipientEmail: string;
    recipientRole: string;
    recipientUserId: string;
    expiresAt: string;
}

export interface VerifyInviteResponse {
    invite: Invite;
}

export interface InviteProjectDetails {
    name: string;
    description: string;
    ownerName: string;
    ownerEmail: string;
}

export interface AcceptInviteRequest {
    isAccepted: boolean;
}

export interface AcceptInviteResponse {
    message: string;
    projectId: string;
}

/**
 * Verify an invite by inviteId and token
 */
export async function verifyInvite(inviteId: string, token: string): Promise<VerifyInviteResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/projects/invite/${inviteId}?token=${token}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('This invitation is invalid or has expired');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify invite');
    }

    return response.json();
}

/**
 * Get project details for an invite
 */
export async function getInviteProjectDetails(inviteId: string, token: string): Promise<InviteProjectDetails> {
    const response = await fetch(`${API_BASE_URL}/v1/projects/invite/${inviteId}/project-details?token=${token}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch project details');
    }

    return response.json();
}

/**
 * Accept or reject an invite
 */
export async function respondToInvite(
    inviteId: string,
    inviteToken: string,
    authToken: string,
    isAccepted: boolean
): Promise<AcceptInviteResponse> {
    const response = await authenticatedFetch(`/v1/projects/invite/${inviteId}?token=${inviteToken}`, {
        method: 'PUT',
        token: authToken,
        body: JSON.stringify({ isAccepted }),
    });

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('This invitation is invalid or has expired');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to respond to invite');
    }

    return response.json();
}

/**
 * Usage and Subscription types
 */
export interface UsageQuotaResponse {
    logUsage: {
        current: number;
        limit: number;
        remaining: number;
        percentUsed: number;
        isUnlimited: boolean;
    };
    billingPeriod: {
        start: string;
        end: string;
        daysRemaining: number;
    };
}

export interface SubscriptionPlanDetails {
    _id: string;
    name: string;
    machineName: string;
    listPrice: number;
    logLimit: number;
    projectLimit: number | null;
    billingInterval: string;
    createdAt: string;
    updatedAt: string;
}

export interface SubscriptionPlanEnrollment {
    _id: string;
    userId: string;
    subscriptionPlan: string;
    price: number;
    createdAt: string;
    updatedAt: string;
    subscriptionPlanDetails: SubscriptionPlanDetails;
}

export interface UserSubscriptionResponse {
    subscriptionPlanEnrollment: SubscriptionPlanEnrollment | null;
}

/**
 * Fetch usage quota information for the current user
 */
export async function fetchUsageQuota(token: string): Promise<UsageQuotaResponse> {
    const response = await authenticatedFetch('/v1/usage/quota', {
        method: 'GET',
        token,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch usage quota');
    }

    return response.json();
}

/**
 * Fetch current user's subscription plan information
 */
export async function fetchUserSubscription(token: string): Promise<UserSubscriptionResponse> {
    const response = await authenticatedFetch('/v1/users/me/subscription', {
        method: 'GET',
        token,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch subscription');
    }

    return response.json();
}
