import { Users, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { Project } from "~/lib/api";

export function TeamTab({
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
                            const isOwner = user.id === project.ownerId;
                            const canRemove = canRemoveUsers && !isCurrentUser && !isOwner;

                            return (
                                <div key={user.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="h-10 w-10 bg-brand rounded-full flex items-center justify-center shrink-0">
                                            <Users className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-primary-dark flex items-center gap-2 flex-wrap">
                                                {user.name || `User ${user.id}`}
                                                {isOwner && (
                                                    <span className="text-xs px-2 py-0.5 bg-[#FFB30D]/10 text-[#FFB30D] rounded font-semibold">Owner</span>
                                                )}
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
                                        {isOwner && !canRemoveUsers && (
                                            <div className="px-2 py-2 text-xs text-neutral" title="Project owner cannot be removed">
                                                {/* Spacer to maintain alignment */}
                                            </div>
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

