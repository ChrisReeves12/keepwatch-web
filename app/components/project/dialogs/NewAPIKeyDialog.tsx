import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "~/components/ui/dialog";
import { AlertCircle, CheckCircle, Copy } from "lucide-react";

export function NewAPIKeyDialog({
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

