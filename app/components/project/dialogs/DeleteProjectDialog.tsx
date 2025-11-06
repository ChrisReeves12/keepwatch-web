import { useState } from "react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "~/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import type { Project } from "~/lib/api";

export function DeleteProjectDialog({
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

