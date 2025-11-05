const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface AuthResponse {
    message: string;
    token: string;
    user: User;
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
    _id: string;
}

export interface Project {
    _id: string;
    name: string;
    description: string;
    projectId: string;
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
    message: string;
    level: string;
    environment: string;
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

/**
 * Log Types and Interfaces
 */
export interface Log {
    _id?: string;
    level: string;
    environment: string;
    projectId: string;
    projectObjectId: string;
    message: string;
    stackTrace: Array<Record<string, any>>;
    rawStackTrace?: string;
    details: Record<string, any>;
    detailString: string | null;
    timestampMS: number;
    createdAt: Date;
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
    message?: MessageFilter;
    stackTrace?: MessageFilter;
    details?: MessageFilter;
    docFilter?: DocFilter;
    startTime?: number;
    endTime?: number;
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

