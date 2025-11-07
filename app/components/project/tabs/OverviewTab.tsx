import { useState } from "react";
import { Copy, CheckCircle, Users, Key, Activity, Pencil } from "lucide-react";
import moment from "moment";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { Project } from "~/lib/api";

export function OverviewTab({
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
                        <label className="text-sm font-medium text-neutral">Owner</label>
                        <div className="mt-1">
                            {project.ownerName && (
                                <p className="text-primary-dark font-medium">{project.ownerName}</p>
                            )}
                            {project.ownerEmail && (
                                <p className="text-sm text-neutral">{project.ownerEmail}</p>
                            )}
                            {!project.ownerName && !project.ownerEmail && (
                                <p className="text-neutral text-sm">Owner information unavailable</p>
                            )}
                        </div>
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

