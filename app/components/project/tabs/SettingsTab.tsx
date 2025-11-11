import { Settings } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { Project } from "~/lib/api";

export function SettingsTab({
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

