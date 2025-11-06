import { Key } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { APIKeyCard } from "../cards/APIKeyCard";
import type { Project } from "~/lib/api";

export function APIKeysTab({
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

