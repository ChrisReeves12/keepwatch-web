import type { Route } from "./+types/project.$projectId";
import { getAuthToken } from "~/lib/auth.server";
import { fetchProject, createAPIKey, deleteAPIKey, deleteProject, getCurrentUser, removeUserFromProject, updateProject, searchLogs, type Project, type Log, type SearchLogsRequest, type SearchLogsResponse } from "~/lib/api";
import { useLoaderData, Link, Form, useActionData, useNavigate, useSearchParams } from "react-router";
import { DashboardHeader } from "~/components/DashboardHeader";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "~/components/ui/dialog";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "~/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Checkbox } from "~/components/ui/checkbox";
import { ArrowLeft, Copy, Users, Key, Settings, Activity, CheckCircle, AlertCircle, Trash2, Pencil, FileText, Info, Bug, AlertTriangle, XCircle, AlertOctagon, ChevronDown, ChevronRight, Filter } from "lucide-react";
import moment from "moment";
import { useState, useEffect } from "react";
import { redirect } from "react-router";

export function meta({ params }: Route.MetaArgs) {
    return [
        { title: `Project ${params.projectId} - KeepWatch` },
        { name: "description", content: "Project details and management" },
    ];
}

// Utility to get user's role on a project
function getUserRole(project: Project, userId: string | null): string | null {
    if (!userId) return null;
    const projectUser = project.users.find((u) => u.id === userId);
    return projectUser?.role || null;
}

// Check if user has permission for an action
function hasPermission(role: string | null, action: 'delete_project' | 'create_api_key' | 'delete_api_key' | 'update_project'): boolean {
    if (!role) return false;

    switch (action) {
        case 'delete_project':
            return role === 'admin';
        case 'create_api_key':
        case 'delete_api_key':
        case 'update_project':
            return role === 'admin' || role === 'editor';
        default:
            return false;
    }
}

export async function loader({ request, params }: Route.LoaderArgs) {
    const token = getAuthToken(request);

    if (!token) {
        throw redirect("/login");
    }

    const { projectId } = params;

    try {
        // Fetch current user and project
        const [currentUser, project] = await Promise.all([
            getCurrentUser(token),
            fetchProject(token, projectId),
        ]);

        const userId = currentUser._id;
        const userRole = getUserRole(project, userId);

        return { project, token, userId, userRole };
    } catch (error) {
        console.error("Failed to fetch project:", error);
        throw new Response("Failed to load project", { status: 500 });
    }
}

export async function action({ request, params }: Route.ActionArgs) {
    const token = getAuthToken(request);

    if (!token) {
        return { error: "Unauthorized" };
    }

    const { projectId } = params;
    const formData = await request.formData();
    const action = formData.get("_action") as string;

    if (action === "createAPIKey") {
        try {
            const result = await createAPIKey(token, projectId);
            return { success: true, apiKey: result.apiKey };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : "Failed to create API key",
            };
        }
    }

    if (action === "deleteAPIKey") {
        const apiKeyId = formData.get("apiKeyId") as string;
        try {
            await deleteAPIKey(token, projectId, apiKeyId);
            return { success: true, deleted: true };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : "Failed to delete API key",
            };
        }
    }

    if (action === "deleteProject") {
        try {
            await deleteProject(token, projectId);
            return redirect("/");
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : "Failed to delete project",
            };
        }
    }

    if (action === "removeUser") {
        const userId = formData.get("userId") as string;
        try {
            await removeUserFromProject(token, projectId, userId);
            return { success: true, userRemoved: true };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : "Failed to remove user",
            };
        }
    }

    if (action === "updateProject") {
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        try {
            await updateProject(token, projectId, { name, description });
            return { success: true, projectUpdated: true };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : "Failed to update project",
            };
        }
    }

    return { error: "Unknown action" };
}

export default function ProjectDetail() {
    const { project, userId, userRole } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Get active tab from URL, default to "overview"
    const activeTab = (searchParams.get("tab") as "overview" | "apikeys" | "team" | "logs" | "settings") || "overview";

    const [showCreateAPIKeyDialog, setShowCreateAPIKeyDialog] = useState(false);
    const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
    const [newAPIKey, setNewAPIKey] = useState<string | null>(null);
    const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
    const [showDeleteProjectDialog, setShowDeleteProjectDialog] = useState(false);
    const [removeUserId, setRemoveUserId] = useState<string | null>(null);
    const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);

    // Permission checks
    const canCreateAPIKey = hasPermission(userRole, 'create_api_key');
    const canDeleteAPIKey = hasPermission(userRole, 'delete_api_key');
    const canDeleteProject = hasPermission(userRole, 'delete_project');
    const canUpdateProject = hasPermission(userRole, 'update_project');
    const isAdmin = userRole === 'admin';

    // Handle successful API key creation
    useEffect(() => {
        if (actionData?.success && actionData?.apiKey) {
            setShowCreateAPIKeyDialog(false);
            setNewAPIKey(actionData.apiKey.key);
            setShowNewKeyDialog(true);
            // Refresh to show new key in the list
            setTimeout(() => {
                navigate(".", { replace: true });
            }, 100);
        }
    }, [actionData, navigate]);

    // Handle successful API key deletion
    useEffect(() => {
        if (actionData?.success && actionData?.deleted) {
            setDeleteKeyId(null);
            // Refresh to update the list
            navigate(".", { replace: true });
        }
    }, [actionData, navigate]);

    // Handle successful user removal
    useEffect(() => {
        if (actionData?.success && actionData?.userRemoved) {
            setRemoveUserId(null);
            // Refresh to update the list
            navigate(".", { replace: true });
        }
    }, [actionData, navigate]);

    // Handle successful project update
    useEffect(() => {
        if (actionData?.success && actionData?.projectUpdated) {
            setShowEditProjectDialog(false);
            // Refresh to show updated details
            navigate(".", { replace: true });
        }
    }, [actionData, navigate]);

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button & Header */}
                <div className="mb-6">
                    <Link to="/">
                        <Button variant="outline" className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Projects
                        </Button>
                    </Link>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-primary-dark">{project.name}</h1>
                            <p className="text-neutral mt-2">{project.description}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex gap-8">
                        <Link
                            to="?tab=overview"
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "overview"
                                ? "border-brand text-brand"
                                : "border-transparent text-neutral hover:text-primary-dark"
                                }`}
                        >
                            Overview
                        </Link>
                        <Link
                            to="?tab=apikeys"
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "apikeys"
                                ? "border-brand text-brand"
                                : "border-transparent text-neutral hover:text-primary-dark"
                                }`}
                        >
                            API Keys
                        </Link>
                        <Link
                            to="?tab=team"
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "team"
                                ? "border-brand text-brand"
                                : "border-transparent text-neutral hover:text-primary-dark"
                                }`}
                        >
                            Team
                        </Link>
                        <Link
                            to="?tab=logs"
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "logs"
                                ? "border-brand text-brand"
                                : "border-transparent text-neutral hover:text-primary-dark"
                                }`}
                        >
                            Logs
                        </Link>
                        <Link
                            to="?tab=settings"
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "settings"
                                ? "border-brand text-brand"
                                : "border-transparent text-neutral hover:text-primary-dark"
                                }`}
                        >
                            Settings
                        </Link>
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === "overview" && (
                    <OverviewTab
                        project={project}
                        onEditProject={() => setShowEditProjectDialog(true)}
                        canEdit={canUpdateProject}
                    />
                )}
                {activeTab === "apikeys" && (
                    <APIKeysTab
                        project={project}
                        onCreateAPIKey={() => setShowCreateAPIKeyDialog(true)}
                        onDeleteAPIKey={(keyId) => setDeleteKeyId(keyId)}
                        canCreate={canCreateAPIKey}
                        canDelete={canDeleteAPIKey}
                    />
                )}
                {activeTab === "team" && (
                    <TeamTab
                        project={project}
                        userId={userId}
                        onRemoveUser={(id) => setRemoveUserId(id)}
                        canRemoveUsers={isAdmin}
                    />
                )}
                {activeTab === "logs" && (
                    <LogsTab
                        project={project}
                    />
                )}
                {activeTab === "settings" && (
                    <SettingsTab
                        project={project}
                        onDeleteProject={() => setShowDeleteProjectDialog(true)}
                        canDelete={canDeleteProject}
                    />
                )}
            </main>

            {/* Create API Key Confirmation Dialog */}
            <CreateAPIKeyDialog
                open={showCreateAPIKeyDialog}
                onOpenChange={setShowCreateAPIKeyDialog}
                error={actionData?.error}
            />

            {/* New API Key Display Dialog */}
            <NewAPIKeyDialog
                open={showNewKeyDialog}
                onOpenChange={setShowNewKeyDialog}
                apiKey={newAPIKey}
            />

            {/* Delete API Key Confirmation Dialog */}
            <DeleteAPIKeyDialog
                open={deleteKeyId !== null}
                onOpenChange={(open) => !open && setDeleteKeyId(null)}
                apiKeyId={deleteKeyId}
                error={actionData?.error}
            />

            {/* Delete Project Confirmation Dialog */}
            <DeleteProjectDialog
                open={showDeleteProjectDialog}
                onOpenChange={setShowDeleteProjectDialog}
                project={project}
                error={actionData?.error}
            />

            {/* Remove User Confirmation Dialog */}
            <RemoveUserDialog
                open={removeUserId !== null}
                onOpenChange={(open) => !open && setRemoveUserId(null)}
                userId={removeUserId}
                userName={project.users.find(u => u.id === removeUserId)?.name}
                error={actionData?.error}
            />

            {/* Edit Project Dialog */}
            <EditProjectDialog
                open={showEditProjectDialog}
                onOpenChange={setShowEditProjectDialog}
                project={project}
                error={actionData?.error}
            />
        </div>
    );
}

// Overview Tab
function OverviewTab({
    project,
    onEditProject,
    canEdit
}: {
    project: Project;
    onEditProject: () => void;
    canEdit: boolean;
}) {
    const [copiedProjectId, setCopiedProjectId] = useState(false);

    const copyProjectId = () => {
        navigator.clipboard.writeText(project.projectId);
        setCopiedProjectId(true);
        setTimeout(() => setCopiedProjectId(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral">Team Members</p>
                                <p className="text-3xl font-bold text-primary-dark mt-1">{project.users.length}</p>
                            </div>
                            <div className="h-12 w-12 bg-brand/10 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-brand" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral">API Keys</p>
                                <p className="text-3xl font-bold text-primary-dark mt-1">{project.apiKeys.length}</p>
                            </div>
                            <div className="h-12 w-12 bg-[#FFB30D]/10 rounded-full flex items-center justify-center">
                                <Key className="h-6 w-6 text-[#FFB30D]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral">Status</p>
                                <p className="text-xl font-semibold text-green-600 mt-1">Active</p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Activity className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Project Information */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Project Information</CardTitle>
                            <CardDescription>Basic details about this project</CardDescription>
                        </div>
                        {canEdit && (
                            <Button
                                variant="outline"
                                onClick={onEditProject}
                                className="flex items-center gap-2"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit Details
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-neutral">Project Name</label>
                        <p className="text-primary-dark mt-1">{project.name}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-neutral">Description</label>
                        <p className="text-primary-dark mt-1">{project.description}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-neutral">Project ID</label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded font-mono text-primary-dark">
                                {project.projectId}
                            </code>
                            <button
                                onClick={copyProjectId}
                                className="text-brand hover:text-[#FFB30D] transition-colors"
                                title="Copy to clipboard"
                            >
                                {copiedProjectId ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <Copy className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-neutral">Created</label>
                            <p className="text-primary-dark mt-1">{moment(project.createdAt).format("MMM D, YYYY")}</p>
                            <p className="text-xs text-neutral">{moment(project.createdAt).fromNow()}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral">Last Updated</label>
                            <p className="text-primary-dark mt-1">{moment(project.updatedAt).format("MMM D, YYYY")}</p>
                            <p className="text-xs text-neutral">{moment(project.updatedAt).fromNow()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Create API Key Confirmation Dialog
function CreateAPIKeyDialog({
    open,
    onOpenChange,
    error,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    error?: string;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onClose={() => onOpenChange(false)}>
                <Form method="post" onSubmit={() => setIsSubmitting(true)}>
                    <input type="hidden" name="_action" value="createAPIKey" />
                    <DialogHeader>
                        <DialogTitle>Create API Key</DialogTitle>
                        <DialogDescription>
                            Generate a new API key for this project. This key will only be shown once.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogBody>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">Important</p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Make sure to copy your API key now. You won't be able to see it again!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DialogBody>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#FFB30D] hover:bg-[#FFB30D]/90 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Creating..." : "Create API Key"}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// New API Key Display Dialog
function NewAPIKeyDialog({
    open,
    onOpenChange,
    apiKey,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    apiKey: string | null;
}) {
    const [copied, setCopied] = useState(false);

    const copyKey = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onClose={() => onOpenChange(false)}>
                <DialogHeader>
                    <DialogTitle>API Key Created Successfully!</DialogTitle>
                    <DialogDescription>
                        Save this key somewhere safe. You won't be able to see it again.
                    </DialogDescription>
                </DialogHeader>

                <DialogBody>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-yellow-800">This is your only chance!</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Copy this API key now. For security reasons, we can't show it to you again.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary-dark">Your API Key</label>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded font-mono text-primary-dark break-all">
                                {apiKey}
                            </code>
                            <button
                                onClick={copyKey}
                                className="text-brand hover:text-[#FFB30D] transition-colors shrink-0"
                                title="Copy to clipboard"
                            >
                                {copied ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <Copy className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </DialogBody>

                <DialogFooter>
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="bg-brand hover:bg-brand/90 text-white"
                    >
                        {copied ? "Done" : "I've Saved My Key"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Delete API Key Confirmation Dialog
function DeleteAPIKeyDialog({
    open,
    onOpenChange,
    apiKeyId,
    error,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    apiKeyId: string | null;
    error?: string;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onClose={() => onOpenChange(false)}>
                <Form method="post" onSubmit={() => setIsSubmitting(true)}>
                    <input type="hidden" name="_action" value="deleteAPIKey" />
                    <input type="hidden" name="apiKeyId" value={apiKeyId || ""} />
                    <DialogHeader>
                        <DialogTitle>Revoke API Key</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revoke this API key?
                        </DialogDescription>
                    </DialogHeader>

                    <DialogBody>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">This action cannot be undone</p>
                                    <p className="text-sm text-red-700 mt-1">
                                        Any applications using this API key will immediately lose access to this project.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DialogBody>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Revoking..." : "Revoke API Key"}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// API Keys Tab
function APIKeysTab({
    project,
    onCreateAPIKey,
    onDeleteAPIKey,
    canCreate,
    canDelete,
}: {
    project: Project;
    onCreateAPIKey: () => void;
    onDeleteAPIKey: (keyId: string) => void;
    canCreate: boolean;
    canDelete: boolean;
}) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>API Keys</CardTitle>
                            <CardDescription>Manage API keys for this project</CardDescription>
                        </div>
                        {canCreate && (
                            <Button
                                onClick={onCreateAPIKey}
                                className="bg-[#FFB30D] hover:bg-[#FFB30D]/90 text-white"
                            >
                                Create API Key
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {project.apiKeys.length === 0 ? (
                        <div className="text-center py-8">
                            <Key className="h-12 w-12 text-neutral mx-auto mb-4" />
                            <p className="text-neutral">No API keys yet</p>
                            <p className="text-sm text-neutral mt-2">Create an API key to start sending data to this project</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {project.apiKeys.map((apiKey) => (
                                <APIKeyCard
                                    key={apiKey.id}
                                    apiKey={apiKey}
                                    onDelete={() => onDeleteAPIKey(apiKey.id)}
                                    canDelete={canDelete}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function APIKeyCard({
    apiKey,
    onDelete,
    canDelete,
}: {
    apiKey: Project["apiKeys"][0];
    onDelete: () => void;
    canDelete: boolean;
}) {
    const [copied, setCopied] = useState(false);
    const [showKey, setShowKey] = useState(false);

    const copyKey = () => {
        navigator.clipboard.writeText(apiKey.key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Key className="h-4 w-4 text-neutral" />
                        <span className="text-sm font-medium text-primary-dark">API Key</span>
                    </div>
                    <code className="text-sm bg-gray-100 px-3 py-2 rounded font-mono text-primary-dark block mb-2 break-all">
                        {showKey ? apiKey.key : `${apiKey.key.substring(0, 20)}...`}
                    </code>
                    <p className="text-xs text-neutral">Created {moment(apiKey.createdAt).fromNow()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={() => setShowKey(!showKey)}
                        className="text-sm text-brand hover:text-[#FFB30D]"
                    >
                        {showKey ? "Hide" : "Show"}
                    </button>
                    <button
                        onClick={copyKey}
                        className="text-brand hover:text-[#FFB30D] transition-colors"
                        title="Copy to clipboard"
                    >
                        {copied ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </button>
                    {canDelete && (
                        <button
                            onClick={onDelete}
                            className="text-red-600 hover:text-red-700 transition-colors"
                            title="Revoke API key"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Edit Project Dialog
function EditProjectDialog({
    open,
    onOpenChange,
    project,
    error,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project;
    error?: string;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onClose={() => onOpenChange(false)}>
                <Form method="post" onSubmit={() => setIsSubmitting(true)}>
                    <input type="hidden" name="_action" value="updateProject" />
                    <DialogHeader>
                        <DialogTitle>Edit Project Details</DialogTitle>
                        <DialogDescription>
                            Update the name and description for this project.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogBody>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Project Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    defaultValue={project.name}
                                    placeholder="My Project"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    defaultValue={project.description}
                                    placeholder="Describe this project..."
                                    required
                                    disabled={isSubmitting}
                                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-y text-black"
                                />
                            </div>
                        </div>
                    </DialogBody>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-brand hover:bg-brand/90 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// Remove User Confirmation Dialog
function RemoveUserDialog({
    open,
    onOpenChange,
    userId,
    userName,
    error,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string | null;
    userName?: string;
    error?: string;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onClose={() => onOpenChange(false)}>
                <Form method="post" onSubmit={() => setIsSubmitting(true)}>
                    <input type="hidden" name="_action" value="removeUser" />
                    <input type="hidden" name="userId" value={userId || ""} />
                    <DialogHeader>
                        <DialogTitle>Remove User from Project</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this user from the project?
                        </DialogDescription>
                    </DialogHeader>

                    <DialogBody>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                                {error}
                            </div>
                        )}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">
                                        Removing {userName || 'this user'}
                                    </p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        This user will lose all access to this project, including viewing data and managing settings.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DialogBody>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Removing..." : "Remove User"}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// Team Tab
function TeamTab({
    project,
    userId,
    onRemoveUser,
    canRemoveUsers,
}: {
    project: Project;
    userId: string | null;
    onRemoveUser: (userId: string) => void;
    canRemoveUsers: boolean;
}) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>People who have access to this project</CardDescription>
                        </div>
                        <Button className="bg-[#FFB30D] hover:bg-[#FFB30D]/90 text-white">
                            Invite Member
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {project.users.map((user) => {
                            const isCurrentUser = user.id === userId;
                            const canRemove = canRemoveUsers && !isCurrentUser;

                            return (
                                <div key={user.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="h-10 w-10 bg-brand rounded-full flex items-center justify-center shrink-0">
                                            <Users className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-primary-dark flex items-center gap-2">
                                                {user.name || `User ${user.id}`}
                                                {isCurrentUser && (
                                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">You</span>
                                                )}
                                            </p>
                                            {user.email && (
                                                <p className="text-sm text-neutral truncate">{user.email}</p>
                                            )}
                                            <p className="text-xs text-neutral capitalize mt-1">{user.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-sm px-3 py-1 bg-brand/10 text-brand rounded-full capitalize">
                                            {user.role}
                                        </span>
                                        {canRemove && (
                                            <button
                                                onClick={() => onRemoveUser(user.id)}
                                                className="text-red-600 hover:text-red-700 transition-colors p-2"
                                                title="Remove user from project"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Delete Project Confirmation Dialog
function DeleteProjectDialog({
    open,
    onOpenChange,
    project,
    error,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project;
    error?: string;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const isConfirmed = confirmText === project.projectId;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onClose={() => onOpenChange(false)}>
                <Form method="post" onSubmit={() => setIsSubmitting(true)}>
                    <input type="hidden" name="_action" value="deleteProject" />
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the project.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogBody>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                                {error}
                            </div>
                        )}
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                            <div className="flex gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">Warning: This is permanent!</p>
                                    <p className="text-sm text-red-700 mt-1">
                                        Deleting this project will permanently remove:
                                    </p>
                                    <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                                        <li>All API keys and access credentials</li>
                                        <li>All telemetry data and logs</li>
                                        <li>All team member access</li>
                                        <li>All project configuration</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-primary-dark">
                                Type <code className="bg-gray-100 px-2 py-0.5 rounded text-red-600 font-mono">{project.projectId}</code> to confirm
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Enter project ID"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                                disabled={isSubmitting}
                            />
                        </div>
                    </DialogBody>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isSubmitting || !isConfirmed}
                        >
                            {isSubmitting ? "Deleting..." : "Delete Project"}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// Settings Tab
function SettingsTab({
    project,
    onDeleteProject,
    canDelete,
}: {
    project: Project;
    onDeleteProject: () => void;
    canDelete: boolean;
}) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Project Settings</CardTitle>
                    <CardDescription>Manage project configuration and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-sm font-medium text-primary-dark mb-2">General Settings</h3>
                        <div className="space-y-4">
                            <Button variant="outline">
                                <Settings className="h-4 w-4 mr-2" />
                                Edit Project Details
                            </Button>
                        </div>
                    </div>

                    {canDelete && (
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>
                            <p className="text-sm text-neutral mb-4">
                                Irreversible actions that affect this project
                            </p>
                            <Button
                                onClick={onDeleteProject}
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                                Delete Project
                            </Button>
                        </div>
                    )}
                    {!canDelete && (
                        <div className="border-t border-gray-200 pt-6">
                            <p className="text-sm text-neutral">
                                Only project admins can delete this project.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Helper function to get log level styling
function getLogLevelStyle(level: string): { icon: any; color: string; bgColor: string } {
    const levelUpper = level.toUpperCase();

    switch (levelUpper) {
        case 'INFO':
            return {
                icon: Info,
                color: 'text-blue-600',
                bgColor: 'bg-blue-100'
            };
        case 'DEBUG':
            return {
                icon: Bug,
                color: 'text-gray-600',
                bgColor: 'bg-gray-100'
            };
        case 'WARNING':
            return {
                icon: AlertTriangle,
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-100'
            };
        case 'ERROR':
            return {
                icon: XCircle,
                color: 'text-red-600',
                bgColor: 'bg-red-100'
            };
        case 'CRITICAL':
            return {
                icon: AlertOctagon,
                color: 'text-red-800',
                bgColor: 'bg-red-200'
            };
        default:
            return {
                icon: Info,
                color: 'text-gray-600',
                bgColor: 'bg-gray-100'
            };
    }
}

// Helper function to format large numbers
function formatNumber(num: number): string {
    if (num < 1000) {
        return num.toString();
    } else if (num < 100000) {
        // Use commas for thousands up to 99,999
        return num.toLocaleString();
    } else if (num < 1000000) {
        // Use 'k' for hundreds of thousands
        const thousands = num / 1000;
        return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(1)}k`;
    } else if (num < 1000000000) {
        // Use 'm' for millions
        const millions = num / 1000000;
        return millions % 1 === 0 ? `${millions}m` : `${millions.toFixed(1)}m`;
    } else {
        // Use 'b' for billions
        const billions = num / 1000000000;
        return billions % 1 === 0 ? `${billions}b` : `${billions.toFixed(1)}b`;
    }
}

// Helper function to generate pagination page numbers with ellipsis
function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5; // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
        // Show all pages if total is less than max
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        // Always show first page
        pages.push(1);

        if (currentPage > 3) {
            pages.push("ellipsis");
        }

        // Show pages around current page
        const startPage = Math.max(2, currentPage - 1);
        const endPage = Math.min(totalPages - 1, currentPage + 1);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - 2) {
            pages.push("ellipsis");
        }

        // Always show last page
        pages.push(totalPages);
    }

    return pages;
}

// Logs Tab
function LogsTab({
    project,
}: {
    project: Project;
}) {
    const [searchParams] = useSearchParams();

    // Get logs sub-tab from URL, default to "application"
    const logsSubTab = (searchParams.get("logsTab") as "console" | "application" | "system") || "application";

    return (
        <div className="space-y-6">
            {/* Sub-tabs for log types */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-6">
                    <Link
                        to="?tab=logs&logsTab=console&page=1"
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${logsSubTab === "console"
                            ? "border-brand text-brand"
                            : "border-transparent text-neutral hover:text-primary-dark"
                            }`}
                    >
                        Console Logs
                    </Link>
                    <Link
                        to="?tab=logs&logsTab=application&page=1"
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${logsSubTab === "application"
                            ? "border-brand text-brand"
                            : "border-transparent text-neutral hover:text-primary-dark"
                            }`}
                    >
                        Application Logs
                    </Link>
                    <Link
                        to="?tab=logs&logsTab=system&page=1"
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${logsSubTab === "system"
                            ? "border-brand text-brand"
                            : "border-transparent text-neutral hover:text-primary-dark"
                            }`}
                    >
                        System Logs
                    </Link>
                </nav>
            </div>

            {/* Content for each log type */}
            {logsSubTab === "console" && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-neutral mx-auto mb-4" />
                            <p className="text-neutral">Console Logs - Coming Soon</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {logsSubTab === "application" && (
                <ApplicationLogsTab project={project} />
            )}

            {logsSubTab === "system" && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-neutral mx-auto mb-4" />
                            <p className="text-neutral">System Logs - Coming Soon</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Application Logs Tab
function ApplicationLogsTab({ project }: { project: Project }) {
    const { token } = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();

    const [logs, setLogs] = useState<Log[]>([]);
    const [searchInput, setSearchInput] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 50,
        total: 0,
        totalPages: 0,
    });
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCustomRange, setShowCustomRange] = useState(false);

    // Get filters from URL params (support arrays)
    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const levelFilters = searchParams.getAll("level");
    const environmentFilters = searchParams.getAll("environment");
    const searchQuery = searchParams.get("search") || "";
    const timeRange = searchParams.get("timeRange") || "";
    const customStartTime = searchParams.get("startTime") || "";
    const customEndTime = searchParams.get("endTime") || "";

    // Sync search input with URL param on mount
    useEffect(() => {
        setSearchInput(searchQuery);
    }, [searchQuery]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== searchQuery) {
                const newParams = new URLSearchParams(searchParams);
                if (searchInput) {
                    newParams.set("search", searchInput);
                } else {
                    newParams.delete("search");
                }
                newParams.set("page", "1");
                setSearchParams(newParams);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchInput, searchQuery, searchParams, setSearchParams]);

    // Fetch logs (client-side with Bearer token)
    useEffect(() => {
        const fetchLogs = async () => {
            const hasExistingLogs = logs.length > 0;
            let refreshTimer: NodeJS.Timeout | null = null;

            // Only show initial loader if no logs exist
            if (!hasExistingLogs) {
                setIsInitialLoad(true);
            } else {
                // Delay showing refresh indicator to avoid flicker on fast requests
                refreshTimer = setTimeout(() => {
                    setIsRefreshing(true);
                }, 300); // Only show if request takes longer than 300ms
            }

            setError(null);

            try {
                // Build filters object
                const filters: SearchLogsRequest = {
                    page: currentPage,
                    pageSize: 50,
                };

                // Add level filters if selected (send as array if multiple, string if single)
                if (levelFilters.length > 0) {
                    filters.level = levelFilters.length === 1 ? levelFilters[0] : levelFilters;
                }

                // Add environment filters if provided (send as array if multiple, string if single)
                if (environmentFilters.length > 0) {
                    filters.environment = environmentFilters.length === 1 ? environmentFilters[0] : environmentFilters;
                }

                // Add document search filter if provided
                if (searchQuery) {
                    filters.docFilter = {
                        phrase: searchQuery,
                        matchType: 'contains'
                    };
                }

                // Add time range filters
                if (timeRange) {
                    const now = Date.now();
                    let startTime: number | undefined;

                    switch (timeRange) {
                        case '5m':
                            startTime = now - (5 * 60 * 1000);
                            break;
                        case '30m':
                            startTime = now - (30 * 60 * 1000);
                            break;
                        case '1h':
                            startTime = now - (60 * 60 * 1000);
                            break;
                        case '6h':
                            startTime = now - (6 * 60 * 60 * 1000);
                            break;
                        case '12h':
                            startTime = now - (12 * 60 * 60 * 1000);
                            break;
                        case '1d':
                            startTime = now - (24 * 60 * 60 * 1000);
                            break;
                        case 'custom':
                            // Use custom range from URL params
                            if (customStartTime) {
                                filters.startTime = parseInt(customStartTime, 10);
                            }
                            if (customEndTime) {
                                filters.endTime = parseInt(customEndTime, 10);
                            }
                            break;
                    }

                    // For non-custom ranges, set startTime and endTime to now
                    if (timeRange !== 'custom' && startTime) {
                        filters.startTime = startTime;
                        filters.endTime = now;
                    }
                }

                // Pass token for Authorization header
                const response = await searchLogs(project.projectId, filters, token);

                // Clear the refresh timer if request completed quickly
                if (refreshTimer) {
                    clearTimeout(refreshTimer);
                }

                setLogs(response.logs);
                setPagination(response.pagination);

                // Scroll to top when new logs are loaded (only on initial load)
                if (!hasExistingLogs) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } catch (err) {
                // Clear the refresh timer on error too
                if (refreshTimer) {
                    clearTimeout(refreshTimer);
                }
                setError(err instanceof Error ? err.message : 'Failed to fetch logs');
            } finally {
                setIsInitialLoad(false);
                setIsRefreshing(false);
            }
        };

        fetchLogs();
    }, [project.projectId, currentPage, levelFilters.join(','), environmentFilters.join(','), searchQuery, timeRange, customStartTime, customEndTime, token]);

    // Handle filter changes for multi-select
    const toggleLevelFilter = (level: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("level"); // Clear all level params

        const currentLevels = levelFilters;
        let newLevels: string[];

        if (currentLevels.includes(level)) {
            // Remove the level
            newLevels = currentLevels.filter(l => l !== level);
        } else {
            // Add the level
            newLevels = [...currentLevels, level];
        }

        // Add back all selected levels
        newLevels.forEach(l => newParams.append("level", l));

        newParams.set("page", "1"); // Reset to page 1 when filter changes
        setSearchParams(newParams);
    };

    const toggleEnvironmentFilter = (environment: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("environment"); // Clear all environment params

        const currentEnvironments = environmentFilters;
        let newEnvironments: string[];

        if (currentEnvironments.includes(environment)) {
            // Remove the environment
            newEnvironments = currentEnvironments.filter(e => e !== environment);
        } else {
            // Add the environment
            newEnvironments = [...currentEnvironments, environment];
        }

        // Add back all selected environments
        newEnvironments.forEach(e => newParams.append("environment", e));

        newParams.set("page", "1"); // Reset to page 1 when filter changes
        setSearchParams(newParams);
    };

    const handleTimeRangeChange = (range: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (range === 'all') {
            newParams.delete("timeRange");
            newParams.delete("startTime");
            newParams.delete("endTime");
        } else {
            newParams.set("timeRange", range);
            // Clear custom times when selecting quick option
            if (range !== 'custom') {
                newParams.delete("startTime");
                newParams.delete("endTime");
            }
        }
        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    const handleCustomTimeRange = (start: string, end: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("timeRange", "custom");

        if (start) {
            const startMs = new Date(start).getTime();
            newParams.set("startTime", startMs.toString());
        } else {
            newParams.delete("startTime");
        }

        if (end) {
            const endMs = new Date(end).getTime();
            newParams.set("endTime", endMs.toString());
        } else {
            newParams.delete("endTime");
        }

        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("level");
        newParams.delete("environment");
        newParams.delete("search");
        newParams.delete("timeRange");
        newParams.delete("startTime");
        newParams.delete("endTime");
        newParams.set("page", "1");
        setSearchParams(newParams);
        setShowCustomRange(false);
    };

    // Helper to build pagination URL with all current filters
    const buildPaginationUrl = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", page.toString());
        return `?${params.toString()}`;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Application Logs</CardTitle>
                        <CardDescription>
                            View and search application logs from your project
                        </CardDescription>
                    </div>
                    {pagination.total > 0 && (
                        <span className="text-sm text-neutral">
                            {formatNumber(pagination.total)} total logs
                        </span>
                    )}
                </div>

                {/* Filters */}
                <div className="mt-6 space-y-4">
                    {/* Search Bar */}
                    <div className="w-full">
                        <Label htmlFor="search-logs" className="mb-2 block">Search Logs</Label>
                        <div className="relative">
                            <Input
                                id="search-logs"
                                type="text"
                                placeholder="Search across message, stack trace, and details..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pr-10"
                            />
                            {searchInput && (
                                <button
                                    onClick={() => setSearchInput("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral hover:text-primary-dark"
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                        {searchQuery && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-brand/10 text-brand rounded">
                                    Searching: "{searchQuery}"
                                    <button
                                        onClick={() => setSearchInput("")}
                                        className="hover:text-brand/70"
                                    >
                                        ×
                                    </button>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Time Range Filter */}
                    <div className="flex flex-wrap items-start gap-4">
                        <div className="w-[200px]">
                            <Label htmlFor="time-range" className="mb-2 block">Time Range</Label>
                            <select
                                id="time-range"
                                value={timeRange || "all"}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === 'custom') {
                                        setShowCustomRange(true);
                                        handleTimeRangeChange('custom');
                                    } else {
                                        setShowCustomRange(false);
                                        handleTimeRangeChange(value);
                                    }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm bg-white"
                            >
                                <option value="all">All Time</option>
                                <option value="5m">Last 5 minutes</option>
                                <option value="30m">Last 30 minutes</option>
                                <option value="1h">Last hour</option>
                                <option value="6h">Last 6 hours</option>
                                <option value="12h">Last 12 hours</option>
                                <option value="1d">Last 24 hours</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        {/* Custom Date Range Inputs */}
                        {(showCustomRange || timeRange === 'custom') && (
                            <>
                                <div className="flex-1 min-w-[200px]">
                                    <Label htmlFor="start-time" className="mb-2 block">Start Time</Label>
                                    <Input
                                        id="start-time"
                                        type="datetime-local"
                                        defaultValue={customStartTime ? moment(parseInt(customStartTime)).format('YYYY-MM-DDTHH:mm') : ''}
                                        onChange={(e) => {
                                            const endValue = customEndTime ? moment(parseInt(customEndTime)).format('YYYY-MM-DDTHH:mm') : '';
                                            handleCustomTimeRange(e.target.value, endValue);
                                        }}
                                    />
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <Label htmlFor="end-time" className="mb-2 block">End Time</Label>
                                    <Input
                                        id="end-time"
                                        type="datetime-local"
                                        defaultValue={customEndTime ? moment(parseInt(customEndTime)).format('YYYY-MM-DDTHH:mm') : ''}
                                        onChange={(e) => {
                                            const startValue = customStartTime ? moment(parseInt(customStartTime)).format('YYYY-MM-DDTHH:mm') : '';
                                            handleCustomTimeRange(startValue, e.target.value);
                                        }}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Filter Row */}
                    <div className="flex flex-wrap items-start gap-4">
                        {/* Environment Multi-Select */}
                        <div className="flex-1 min-w-[200px] md:max-w-[15vw]">
                            <Label className="mb-2 block">Environment</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        <span className="truncate">
                                            {environmentFilters.length === 0
                                                ? "All Environments"
                                                : `${environmentFilters.length} selected`}
                                        </span>
                                        <Filter className="ml-2 h-4 w-4 shrink-0" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-3">
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Add environment..."
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.currentTarget.value) {
                                                    toggleEnvironmentFilter(e.currentTarget.value);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                            className="mb-2"
                                        />
                                        {environmentFilters.length > 0 && (
                                            <>
                                                <div className="text-xs font-medium text-neutral mb-1">Selected:</div>
                                                {environmentFilters.map((env) => (
                                                    <div key={env} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`env-${env}`}
                                                            checked={true}
                                                            onCheckedChange={() => toggleEnvironmentFilter(env)}
                                                        />
                                                        <label
                                                            htmlFor={`env-${env}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                        >
                                                            {env}
                                                        </label>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            {environmentFilters.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {environmentFilters.map((env) => (
                                        <span
                                            key={env}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-brand/10 text-brand rounded"
                                        >
                                            {env}
                                            <button
                                                onClick={() => toggleEnvironmentFilter(env)}
                                                className="hover:text-brand/70"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Log Level Multi-Select */}
                        <div className="w-[200px]">
                            <Label className="mb-2 block">Log Level</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        <span className="truncate">
                                            {levelFilters.length === 0
                                                ? "All Levels"
                                                : `${levelFilters.length} selected`}
                                        </span>
                                        <Filter className="ml-2 h-4 w-4 shrink-0" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-3">
                                    <div className="space-y-2">
                                        {['INFO', 'DEBUG', 'WARNING', 'ERROR', 'CRITICAL'].map((level) => (
                                            <div key={level} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`level-${level}`}
                                                    checked={levelFilters.includes(level)}
                                                    onCheckedChange={() => toggleLevelFilter(level)}
                                                />
                                                <label
                                                    htmlFor={`level-${level}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {level}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            {levelFilters.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {levelFilters.map((level) => {
                                        const style = getLogLevelStyle(level);
                                        return (
                                            <span
                                                key={level}
                                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${style.bgColor} ${style.color}`}
                                            >
                                                {level}
                                                <button
                                                    onClick={() => toggleLevelFilter(level)}
                                                    className="hover:opacity-70"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {(levelFilters.length > 0 || environmentFilters.length > 0 || searchQuery || timeRange) && (
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="mt-6"
                            >
                                Clear All Filters
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="relative">
                {/* Soft overlay loader */}
                {isRefreshing && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
                            <Activity className="h-4 w-4 text-brand animate-spin" />
                            <span className="text-sm text-neutral">Updating...</span>
                        </div>
                    </div>
                )}

                {isInitialLoad ? (
                    <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-neutral mx-auto mb-4 animate-spin" />
                        <p className="text-neutral">Loading logs...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        {error}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-neutral mx-auto mb-4" />
                        <p className="text-neutral">No application logs found</p>
                        <p className="text-sm text-neutral mt-2">
                            Logs will appear here once your application starts sending data
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Top Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                to={pagination.page > 1 ? buildPaginationUrl(pagination.page - 1) : "#"}
                                                aria-disabled={pagination.page === 1}
                                                className={pagination.page === 1 ? "pointer-events-none opacity-50" : ""}
                                            />
                                        </PaginationItem>

                                        {/* Generate page numbers */}
                                        {getPageNumbers(pagination.page, pagination.totalPages).map((pageNum, idx) => (
                                            pageNum === "ellipsis" ? (
                                                <PaginationItem key={`ellipsis-${idx}`}>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            ) : (
                                                <PaginationItem key={pageNum}>
                                                    <PaginationLink
                                                        to={buildPaginationUrl(pageNum as number)}
                                                        isActive={pageNum === pagination.page}
                                                    >
                                                        {pageNum}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            )
                                        ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                to={pagination.page < pagination.totalPages ? buildPaginationUrl(pagination.page + 1) : "#"}
                                                aria-disabled={pagination.page === pagination.totalPages}
                                                className={pagination.page === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}

                        <div className="space-y-2">
                            {logs.map((log) => (
                                <LogCard key={log._id} log={log} />
                            ))}
                        </div>

                        {/* Bottom Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                to={pagination.page > 1 ? buildPaginationUrl(pagination.page - 1) : "#"}
                                                aria-disabled={pagination.page === 1}
                                                className={pagination.page === 1 ? "pointer-events-none opacity-50" : ""}
                                            />
                                        </PaginationItem>

                                        {/* Generate page numbers */}
                                        {getPageNumbers(pagination.page, pagination.totalPages).map((pageNum, idx) => (
                                            pageNum === "ellipsis" ? (
                                                <PaginationItem key={`ellipsis-${idx}`}>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            ) : (
                                                <PaginationItem key={pageNum}>
                                                    <PaginationLink
                                                        to={buildPaginationUrl(pageNum as number)}
                                                        isActive={pageNum === pagination.page}
                                                    >
                                                        {pageNum}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            )
                                        ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                to={pagination.page < pagination.totalPages ? buildPaginationUrl(pagination.page + 1) : "#"}
                                                aria-disabled={pagination.page === pagination.totalPages}
                                                className={pagination.page === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// Log Card Component
function LogCard({ log }: { log: Log }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const levelStyle = getLogLevelStyle(log.level);
    const LevelIcon = levelStyle.icon;

    return (
        <div className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            {/* Main log row */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50"
            >
                {/* Expand/Collapse Icon */}
                <div className="shrink-0 mt-0.5">
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-neutral" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-neutral" />
                    )}
                </div>

                {/* Log Level Icon */}
                <div className={`shrink-0 h-8 w-8 ${levelStyle.bgColor} rounded-full flex items-center justify-center`}>
                    <LevelIcon className={`h-4 w-4 ${levelStyle.color}`} />
                </div>

                {/* Log Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${levelStyle.bgColor} ${levelStyle.color}`}>
                            {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                            {log.environment}
                        </span>
                        <span className="text-xs text-neutral">
                            {moment(log.timestampMS).format("MMM D, YYYY h:mm:ss A")}
                        </span>
                        <span className="text-xs text-neutral">
                            ({moment(log.timestampMS).fromNow()})
                        </span>
                    </div>
                    <p className="text-sm text-primary-dark font-medium">{log.message}</p>
                </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                    {/* Details */}
                    {log.details && Object.keys(log.details).length > 0 && (
                        <div>
                            <h4 className="text-xs font-medium text-neutral mb-2">Details</h4>
                            <div className="bg-gray-50 rounded p-3">
                                <pre className="text-xs font-mono text-primary-dark overflow-x-auto whitespace-pre-wrap wrap-break-word">
                                    {JSON.stringify(log.details, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Stack Trace */}
                    {log.rawStackTrace && (
                        <div>
                            <h4 className="text-xs font-medium text-neutral mb-2">Stack Trace</h4>
                            <div className="bg-gray-50 rounded p-3">
                                <pre className="text-xs font-mono text-red-600 overflow-x-auto whitespace-pre-wrap wrap-break-word">
                                    {log.rawStackTrace}
                                </pre>
                            </div>
                        </div>
                    )}

                    {!log.rawStackTrace && log.stackTrace && log.stackTrace.length > 0 && (
                        <div>
                            <h4 className="text-xs font-medium text-neutral mb-2">Stack Trace</h4>
                            <div className="bg-gray-50 rounded p-3">
                                <pre className="text-xs font-mono text-red-600 overflow-x-auto whitespace-pre-wrap wrap-break-word">
                                    {JSON.stringify(log.stackTrace, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="text-neutral">Log ID:</span>
                            <p className="text-primary-dark font-mono mt-1">{log._id}</p>
                        </div>
                        <div>
                            <span className="text-neutral">Project ID:</span>
                            <p className="text-primary-dark font-mono mt-1">{log.projectId}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

