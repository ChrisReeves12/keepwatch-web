import { useState } from "react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "~/components/ui/dialog";
import { AlertCircle } from "lucide-react";

export function RemoveUserDialog({
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

