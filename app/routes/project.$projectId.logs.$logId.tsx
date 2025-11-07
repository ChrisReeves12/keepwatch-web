import type { Route } from "./+types/project.$projectId.logs.$logId";
import { getAuthToken } from "~/lib/auth.server";
import { fetchLog, fetchProject, getCurrentUser, deleteLogs, type Log } from "~/lib/api";
import { useLoaderData, Link, useNavigate } from "react-router";
import { DashboardHeader } from "~/components/DashboardHeader";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "~/components/ui/dialog";
import { ArrowLeft, AlertCircle, Info, AlertTriangle, Bug, Zap, Globe, Server, Clock, Calendar, FileText, Code, Hash, Trash2, Activity } from "lucide-react";
import { redirect } from "react-router";
import { getUserRole, hasPermission } from "~/components/project/utils";
import { getLogLevelStyle } from "~/components/project/utils";
import moment from "moment";
import { useState } from "react";

export function meta({ data }: Route.MetaArgs) {
    const log = data?.log as Log | undefined;
    return [
        { title: log ? `Log ${log._id} - KeepWatch` : "Log Details - KeepWatch" },
        { name: "description", content: "View detailed log information" },
    ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
    const token = getAuthToken(request);

    if (!token) {
        throw redirect("/login");
    }

    const { projectId, logId } = params;

    try {
        // Fetch current user, project, and log
        const [currentUser, project, log] = await Promise.all([
            getCurrentUser(token),
            fetchProject(token, projectId),
            fetchLog(projectId, logId, token),
        ]);

        const userId = currentUser._id;
        const userRole = getUserRole(project, userId);

        // Verify user has access to this project
        const hasAccess = project.users.some(user => user.id === userId);
        if (!hasAccess) {
            throw new Response("Unauthorized", { status: 403 });
        }

        return { project, log, token, userId, userRole };
    } catch (error) {
        console.error("Failed to fetch log:", error);
        if (error instanceof Response && error.status === 403) {
            throw error;
        }
        throw new Response("Failed to load log details", { status: 500 });
    }
}

export default function LogDetail() {
    const { project, log, token, userRole } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const levelStyle = getLogLevelStyle(log.level);
    const LevelIcon = levelStyle.icon;
    
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    
    const canDeleteLogs = hasPermission(userRole, 'delete_logs');
    
    const handleDelete = async () => {
        if (!log._id) return;
        
        setIsDeleting(true);
        setDeleteError(null);
        
        try {
            await deleteLogs(project.projectId, [log._id], token);
            // Redirect back to logs list after successful deletion
            navigate(`/project/${project.projectId}?tab=logs&logsTab=application`);
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete log');
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button & Header */}
                <div className="mb-6">
                    <Link to={`/project/${project.projectId}?tab=logs&logsTab=application`}>
                        <Button variant="outline" className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Logs
                        </Button>
                    </Link>
                    <div className="flex items-start gap-4">
                        <div className={`h-12 w-12 ${levelStyle.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <LevelIcon className={`h-6 w-6 ${levelStyle.color}`} />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-primary-dark mb-2">Log Details</h1>
                            <p className="text-lg text-neutral">{log.message}</p>
                        </div>
                        {canDeleteLogs && (
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteConfirmation(true)}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Log
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Left Column (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Overview Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="h-5 w-5" />
                                    Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${levelStyle.color}`} />
                                        <div>
                                            <p className="text-sm font-medium text-neutral">Log Level</p>
                                            <p className={`text-lg font-semibold ${levelStyle.color}`}>
                                                {log.level.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Globe className="h-5 w-5 mt-0.5 text-gray-600 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-neutral">Environment</p>
                                            <p className="text-lg font-semibold text-primary-dark">
                                                {log.environment}
                                            </p>
                                        </div>
                                    </div>

                                    {log.hostname && (
                                        <div className="flex items-start gap-3">
                                            <Server className="h-5 w-5 mt-0.5 text-purple-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-neutral">Hostname</p>
                                                <p className="text-lg font-semibold text-primary-dark">
                                                    {log.hostname}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {log.logType && (
                                        <div className="flex items-start gap-3">
                                            <FileText className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-neutral">Log Type</p>
                                                <p className="text-lg font-semibold text-primary-dark capitalize">
                                                    {log.logType}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-start gap-3">
                                        <Hash className="h-5 w-5 mt-0.5 text-gray-600 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-neutral">Log ID</p>
                                            <p className="text-sm font-mono text-primary-dark break-all">
                                                {log._id}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Request Information */}
                        {log.request && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5" />
                                        Request Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {log.request.url && (
                                        <div>
                                            <p className="text-sm font-medium text-neutral mb-1">URL</p>
                                            <p className="text-sm text-primary-dark font-mono break-all">
                                                {log.request.url}
                                            </p>
                                        </div>
                                    )}
                                    {log.request.userAgent && (
                                        <div>
                                            <p className="text-sm font-medium text-neutral mb-1">User Agent</p>
                                            <p className="text-sm text-primary-dark break-words">
                                                {log.request.userAgent}
                                            </p>
                                        </div>
                                    )}
                                    {log.request.os && (
                                        <div>
                                            <p className="text-sm font-medium text-neutral mb-1">Operating System</p>
                                            <p className="text-sm text-primary-dark">
                                                {log.request.os}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Details Card */}
                        {log.details && Object.keys(log.details).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Code className="h-5 w-5" />
                                        Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                                        <pre className="text-sm font-mono text-primary-dark whitespace-pre-wrap break-words">
                                            {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Stack Trace Card */}
                        {(log.rawStackTrace || (log.stackTrace && log.stackTrace.length > 0)) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bug className="h-5 w-5 text-red-600" />
                                        Stack Trace
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {log.rawStackTrace ? (
                                        <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                                            <pre className="text-sm font-mono text-red-600 whitespace-pre-wrap break-words">
                                                {log.rawStackTrace}
                                            </pre>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {log.stackTrace.map((frame: any, index: number) => (
                                                <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                                                        {frame.timestamp && (
                                                            <span className="text-xs text-gray-500">
                                                                {moment(frame.timestamp).format("HH:mm:ss.SSS")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {frame.function && (
                                                        <div className="text-sm font-mono text-blue-600 mb-1">
                                                            {frame.function}()
                                                        </div>
                                                    )}
                                                    {frame.file && (
                                                        <div className="text-sm font-mono text-gray-700">
                                                            {frame.file}
                                                            {frame.line && `:${frame.line}`}
                                                            {frame.column && `:${frame.column}`}
                                                        </div>
                                                    )}
                                                    {frame.message && (
                                                        <div className="text-sm text-red-600 mt-2">
                                                            {frame.message}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Sidebar - Metadata */}
                    <div className="space-y-6">
                        {/* Timestamp Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Timestamp
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-neutral mb-1">Date & Time</p>
                                    <p className="text-sm text-primary-dark">
                                        {moment(log.timestampMS).format("MMMM D, YYYY")}
                                    </p>
                                    <p className="text-lg font-semibold text-primary-dark">
                                        {moment(log.timestampMS).format("h:mm:ss A")}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral mb-1">Relative Time</p>
                                    <p className="text-sm text-primary-dark">
                                        {moment(log.timestampMS).fromNow()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral mb-1">Unix Timestamp</p>
                                    <p className="text-sm font-mono text-primary-dark">
                                        {log.timestampMS}
                                    </p>
                                </div>
                                {log.createdAt && (
                                    <div>
                                        <p className="text-sm font-medium text-neutral mb-1">Created At</p>
                                        <p className="text-sm text-primary-dark">
                                            {moment(log.createdAt).format("MMM D, YYYY h:mm:ss A")}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Project Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Project Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-neutral mb-1">Project Name</p>
                                    <p className="text-sm text-primary-dark font-semibold">
                                        {project.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral mb-1">Project ID</p>
                                    <p className="text-sm font-mono text-primary-dark break-all">
                                        {log.projectId}
                                    </p>
                                </div>
                                {log.projectObjectId && (
                                    <div>
                                        <p className="text-sm font-medium text-neutral mb-1">Project Object ID</p>
                                        <p className="text-sm font-mono text-primary-dark break-all">
                                            {log.projectObjectId}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Raw Data Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Code className="h-5 w-5" />
                                    Raw Log Data
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <details className="cursor-pointer">
                                    <summary className="text-sm font-medium text-brand hover:text-brand/80">
                                        View JSON
                                    </summary>
                                    <div className="mt-3 bg-gray-50 rounded-lg p-3 overflow-x-auto max-h-96">
                                        <pre className="text-xs font-mono text-primary-dark whitespace-pre-wrap break-words">
                                            {JSON.stringify(log, null, 2)}
                                        </pre>
                                    </div>
                                </details>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
                <DialogContent onClose={() => {
                    setShowDeleteConfirmation(false);
                    setDeleteError(null);
                }}>
                    <DialogHeader>
                        <DialogTitle>Delete Log</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this log? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        {deleteError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                                {deleteError}
                            </div>
                        )}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div className="flex gap-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    <p className="font-medium mb-1">Warning</p>
                                    <p>Deleting this log is permanent and cannot be undone. Make sure you have backed up any important data before proceeding.</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Show log details for confirmation */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Log to be deleted:</p>
                            <div className="space-y-1 text-sm">
                                <p className="text-gray-600">
                                    <span className="font-medium">Level:</span> <span className={levelStyle.color}>{log.level}</span>
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Message:</span> {log.message}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Time:</span> {moment(log.timestampMS).format("MMM D, YYYY h:mm:ss A")}
                                </p>
                            </div>
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setShowDeleteConfirmation(false);
                                setDeleteError(null);
                            }}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? (
                                <>
                                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Log
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

