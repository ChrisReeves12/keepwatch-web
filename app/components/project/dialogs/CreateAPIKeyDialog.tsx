import { useState } from "react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "~/components/ui/dialog";
import { AlertCircle } from "lucide-react";

export function CreateAPIKeyDialog({
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

