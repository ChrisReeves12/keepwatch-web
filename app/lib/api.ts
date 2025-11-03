const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface AuthResponse {
    message: string;
    token: string;
    user: {
        name: string;
        email: string;
        userId: string;
        createdAt: string;
        company: string;
        updatedAt: string;
        _id: string;
    };
}

export interface AuthError {
    error: string;
}

export interface Project {
    _id: string;
    name: string;
    description: string;
    projectId: string;
    users: Array<{
        id: string;
        role: string;
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

