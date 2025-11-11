import { useState } from "react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "~/components/ui/dialog";
import type { Project } from "~/lib/api";
import { X } from "lucide-react";

function ArrayInput({ 
    label, 
    items, 
    setItems, 
    newValue, 
    setNewValue, 
    placeholder 
}: { 
    label: string; 
    items: string[]; 
    setItems: (items: string[]) => void; 
    newValue: string; 
    setNewValue: (value: string) => void; 
    placeholder: string;
}) {
    const addItem = (value: string) => {
        if (value.trim() && !items.includes(value.trim())) {
            setItems([...items, value.trim()]);
            setNewValue("");
        }
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex gap-2">
                <Input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={placeholder}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addItem(newValue);
                        }
                    }}
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => addItem(newValue)}
                >
                    Add
                </Button>
            </div>
            {items.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="bg-gray-100 px-3 py-1 rounded-md flex items-center gap-2 text-sm"
                        >
                            <span className="text-primary-dark">{item}</span>
                            <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-gray-500 hover:text-red-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function ConfigureAPIKeyDialog({
    open,
    onOpenChange,
    apiKey,
    error,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    apiKey: Project["apiKeys"][0];
    error?: string;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const constraints = apiKey.constraints || {};
    
    const [allowedIps, setAllowedIps] = useState<string[]>(
        constraints.ipRestrictions?.allowedIps || []
    );
    const [allowedReferers, setAllowedReferers] = useState<string[]>(
        constraints.refererRestrictions?.allowedReferers || []
    );
    const [allowedOrigins, setAllowedOrigins] = useState<string[]>(
        constraints.originRestrictions?.allowedOrigins || []
    );
    const [allowedPatterns, setAllowedPatterns] = useState<string[]>(
        constraints.userAgentRestrictions?.allowedPatterns || []
    );
    const [allowedEnvironments, setAllowedEnvironments] = useState<string[]>(
        constraints.allowedEnvironments || []
    );

    const [newIp, setNewIp] = useState("");
    const [newReferer, setNewReferer] = useState("");
    const [newOrigin, setNewOrigin] = useState("");
    const [newPattern, setNewPattern] = useState("");
    const [newEnvironment, setNewEnvironment] = useState("");

    const handleSubmit = () => {
        setIsSubmitting(true);
    };

    const buildConstraintsJSON = () => {
        const constraints = {
            ipRestrictions: allowedIps.length > 0 ? { allowedIps } : undefined,
            refererRestrictions: allowedReferers.length > 0 ? { allowedReferers } : undefined,
            originRestrictions: allowedOrigins.length > 0 ? { allowedOrigins } : undefined,
            userAgentRestrictions: allowedPatterns.length > 0 ? { allowedPatterns } : undefined,
            allowedEnvironments: allowedEnvironments.length > 0 ? allowedEnvironments : undefined,
        };

        const cleanedConstraints = Object.fromEntries(
            Object.entries(constraints).filter(([_, v]) => v !== undefined)
        );

        return JSON.stringify(cleanedConstraints);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onClose={() => onOpenChange(false)}>
                <Form method="post" onSubmit={handleSubmit}>
                    <input type="hidden" name="_action" value="updateAPIKey" />
                    <input type="hidden" name="apiKeyId" value={apiKey.id} />
                    <input type="hidden" name="constraints" value={buildConstraintsJSON()} />
                    
                    <DialogHeader>
                        <DialogTitle>Configure API Key Constraints</DialogTitle>
                        <DialogDescription>
                            Set restrictions and limits to protect your API key from unauthorized use.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogBody>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                            <ArrayInput
                                label="IP Restrictions"
                                items={allowedIps}
                                setItems={setAllowedIps}
                                newValue={newIp}
                                setNewValue={setNewIp}
                                placeholder="192.168.1.100 or 10.0.0.0/24"
                            />

                            <ArrayInput
                                label="Referer Restrictions"
                                items={allowedReferers}
                                setItems={setAllowedReferers}
                                newValue={newReferer}
                                setNewValue={setNewReferer}
                                placeholder="https://myapp.com/*"
                            />

                            <ArrayInput
                                label="Origin Restrictions"
                                items={allowedOrigins}
                                setItems={setAllowedOrigins}
                                newValue={newOrigin}
                                setNewValue={setNewOrigin}
                                placeholder="https://app.example.com"
                            />

                            <ArrayInput
                                label="User Agent Patterns"
                                items={allowedPatterns}
                                setItems={setAllowedPatterns}
                                newValue={newPattern}
                                setNewValue={setNewPattern}
                                placeholder="^MyApp\\/.*"
                            />

                            <ArrayInput
                                label="Allowed Environments"
                                items={allowedEnvironments}
                                setItems={setAllowedEnvironments}
                                newValue={newEnvironment}
                                setNewValue={setNewEnvironment}
                                placeholder="production, staging, etc."
                            />

                            <div className="space-y-4 pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-medium text-primary-dark">Rate Limits</h3>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="requestsPerMinute">Per Minute</Label>
                                        <Input
                                            id="requestsPerMinute"
                                            name="requestsPerMinute"
                                            type="number"
                                            min="0"
                                            defaultValue={constraints.rateLimits?.requestsPerMinute || ""}
                                            placeholder="100"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="requestsPerHour">Per Hour</Label>
                                        <Input
                                            id="requestsPerHour"
                                            name="requestsPerHour"
                                            type="number"
                                            min="0"
                                            defaultValue={constraints.rateLimits?.requestsPerHour || ""}
                                            placeholder="5000"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="requestsPerDay">Per Day</Label>
                                        <Input
                                            id="requestsPerDay"
                                            name="requestsPerDay"
                                            type="number"
                                            min="0"
                                            defaultValue={constraints.rateLimits?.requestsPerDay || ""}
                                            placeholder="100000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-gray-200">
                                <Label htmlFor="expirationDate">Expiration Date</Label>
                                <Input
                                    id="expirationDate"
                                    name="expirationDate"
                                    type="datetime-local"
                                    defaultValue={
                                        constraints.expirationDate 
                                            ? new Date(constraints.expirationDate).toISOString().slice(0, 16)
                                            : ""
                                    }
                                />
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
                            className="bg-brand hover:bg-brand/90 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : "Save Constraints"}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
