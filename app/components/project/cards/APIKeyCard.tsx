import { useState } from "react";
import { CheckCircle, Copy, Key, Trash2 } from "lucide-react";
import moment from "moment";
import type { Project } from "~/lib/api";

export function APIKeyCard({
    apiKey,
    onDelete,
    canDelete,
}: {
    apiKey: Project["apiKeys"][0];
    onDelete: () => void;
    canDelete: boolean;
}) {
    const [copied, setCopied] = useState(false);
    const [showKey, setShowKey] = useState(false);

    const copyKey = () => {
        navigator.clipboard.writeText(apiKey.key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Key className="h-4 w-4 text-neutral" />
                        <span className="text-sm font-medium text-primary-dark">API Key</span>
                    </div>
                    <code className="text-sm bg-gray-100 px-3 py-2 rounded font-mono text-primary-dark block mb-2 break-all">
                        {showKey ? apiKey.key : `${apiKey.key.substring(0, 20)}...`}
                    </code>
                    <p className="text-xs text-neutral">Created {moment(apiKey.createdAt).fromNow()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={() => setShowKey(!showKey)}
                        className="text-sm text-brand hover:text-[#FFB30D]"
                    >
                        {showKey ? "Hide" : "Show"}
                    </button>
                    <button
                        onClick={copyKey}
                        className="text-brand hover:text-[#FFB30D] transition-colors"
                        title="Copy to clipboard"
                    >
                        {copied ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </button>
                    {canDelete && (
                        <button
                            onClick={onDelete}
                            className="text-red-600 hover:text-red-700 transition-colors"
                            title="Revoke API key"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

