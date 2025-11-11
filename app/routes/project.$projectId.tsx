import type { Route } from "./+types/project.$projectId";
import { getAuthToken } from "~/lib/auth.server";
import { fetchProject, createAPIKey, deleteAPIKey, deleteProject, getCurrentUser, removeUserFromProject, updateProject, sendProjectInvite, type Project } from "~/lib/api";
import { useLoaderData, Link, useActionData, useNavigate, useSearchParams } from "react-router";
import { DashboardHeader } from "~/components/DashboardHeader";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { redirect } from "react-router";
import { getUserRole, hasPermission } from "~/components/project/utils";
import { OverviewTab } from "~/components/project/tabs/OverviewTab";
import { APIKeysTab } from "~/components/project/tabs/APIKeysTab";
import { TeamTab } from "~/components/project/tabs/TeamTab";
import { SettingsTab } from "~/components/project/tabs/SettingsTab";
import { LogsTab } from "~/components/project/tabs/LogsTab";
import { CreateAPIKeyDialog } from "~/components/project/dialogs/CreateAPIKeyDialog";
import { NewAPIKeyDialog } from "~/components/project/dialogs/NewAPIKeyDialog";
import { DeleteAPIKeyDialog } from "~/components/project/dialogs/DeleteAPIKeyDialog";
import { EditProjectDialog } from "~/components/project/dialogs/EditProjectDialog";
import { RemoveUserDialog } from "~/components/project/dialogs/RemoveUserDialog";
import { DeleteProjectDialog } from "~/components/project/dialogs/DeleteProjectDialog";

export function meta({ params }: Route.MetaArgs) {
    return [
        { title: `Project ${params.projectId} - KeepWatch` },
        { name: "description", content: "Project details and management" },
    ];
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

    if (action === "inviteUser") {
        const email = (formData.get("email") as string) || "";
        const role = (formData.get("role") as string) || "";
        try {
            await sendProjectInvite(token, projectId, { email, role });
            return { success: true, inviteSent: true };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : "Failed to send invite",
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

    // Get current user's email from project users
    const currentUser = project.users.find(user => user.id === userId);
    const userEmail = currentUser?.email;

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
    const canCreateAlarm = hasPermission(userRole, 'create_alarm');
    const canDeleteAlarm = hasPermission(userRole, 'delete_alarm');
    const canUpdateAlarm = hasPermission(userRole, 'update_alarm');
    const canDeleteLogs = hasPermission(userRole, 'delete_logs');
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
                        {isAdmin && (
                            <Link
                                to="?tab=settings"
                                className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "settings"
                                    ? "border-brand text-brand"
                                    : "border-transparent text-neutral hover:text-primary-dark"
                                    }`}
                            >
                                Settings
                            </Link>
                        )}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === "overview" && (
                    <OverviewTab
                        project={project}
                        onEditProject={() => setShowEditProjectDialog(true)}
                        canEdit={canUpdateProject}
                        actionError={actionData?.error}
                        inviteSent={actionData?.inviteSent}
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
                        canCreateAlarm={canCreateAlarm}
                        canDeleteAlarm={canDeleteAlarm}
                        canUpdateAlarm={canUpdateAlarm}
                        canDeleteLogs={canDeleteLogs}
                        userEmail={userEmail}
                    />
                )}
                {activeTab === "settings" && isAdmin && (
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
