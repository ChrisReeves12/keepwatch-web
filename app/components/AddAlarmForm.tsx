import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { createAlarm, updateProjectAlarm, type Alarm } from "~/lib/api";
import validator from "validator";

interface AddAlarmFormProps {
    projectId: string;
    token: string;
    initialMessage: string;
    initialLevel: string;
    initialEnvironment: string;
    userEmail?: string;
    editingAlarm?: Alarm | null; // If provided, we're in edit mode
    onSubmit: (data: Alarm) => void;
    onCancel: () => void;
}

export function AddAlarmForm({
    projectId,
    token,
    initialMessage,
    initialLevel,
    initialEnvironment,
    userEmail,
    editingAlarm,
    onSubmit,
    onCancel,
}: AddAlarmFormProps) {
    // Determine if we're in edit mode
    const isEditMode = !!editingAlarm;

    // Initialize form state based on edit mode or defaults
    const [logType, setLogType] = useState(isEditMode ? editingAlarm.logType : 'Application Log');
    const [message, setMessage] = useState(isEditMode ? editingAlarm.message : initialMessage);
    const [level, setLevel] = useState(isEditMode ? editingAlarm.level.toUpperCase() : initialLevel.toUpperCase());
    const [environment, setEnvironment] = useState(isEditMode ? editingAlarm.environment : initialEnvironment);

    // Delivery method states - initialize based on edit mode
    const [enableEmail, setEnableEmail] = useState(
        isEditMode ? !!editingAlarm.deliveryMethods?.email : true
    );
    const [emailAddresses, setEmailAddresses] = useState<string[]>(
        isEditMode
            ? (editingAlarm.deliveryMethods?.email?.addresses || [''])
            : [userEmail || '']
    );
    const [enableSlack, setEnableSlack] = useState(
        isEditMode ? !!editingAlarm.deliveryMethods?.slack : false
    );
    const [slackWebhook, setSlackWebhook] = useState(
        isEditMode ? (editingAlarm.deliveryMethods?.slack?.webhook || '') : ''
    );
    const [enableWebhook, setEnableWebhook] = useState(
        isEditMode ? !!editingAlarm.deliveryMethods?.webhook : false
    );
    const [webhookUrl, setWebhookUrl] = useState(
        isEditMode ? (editingAlarm.deliveryMethods?.webhook?.url || '') : ''
    );

    // Error and loading states
    const [errors, setErrors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        setIsSubmitting(true);

        try {
            // Trim all input values
            const trimmedMessage = message.trim();
            const trimmedEnvironment = environment.trim();
            const trimmedSlackWebhook = slackWebhook.trim();
            const trimmedWebhookUrl = webhookUrl.trim();

            // Validation
            const validationErrors: string[] = [];

            if (!trimmedMessage) {
                validationErrors.push("Message pattern is required");
            }

            if (!trimmedEnvironment) {
                validationErrors.push("Environment is required");
            }

            // Validate email addresses if email is enabled
            if (enableEmail) {
                const trimmedEmails = emailAddresses.map(email => email.trim()).filter(email => email);
                if (trimmedEmails.length === 0) {
                    validationErrors.push("At least one email address is required when email delivery is enabled");
                } else {
                    const invalidEmails = trimmedEmails.filter(email => !validator.isEmail(email));
                    if (invalidEmails.length > 0) {
                        validationErrors.push(`Invalid email address(es): ${invalidEmails.join(', ')}`);
                    }
                }
            }

            // Validate Slack webhook URL if Slack is enabled
            if (enableSlack) {
                if (!trimmedSlackWebhook) {
                    validationErrors.push("Slack webhook URL is required when Slack delivery is enabled");
                } else if (!validator.isURL(trimmedSlackWebhook, { require_protocol: true })) {
                    validationErrors.push("Slack webhook must be a valid URL with protocol (https://)");
                }
            }

            // Validate webhook URL if webhook is enabled
            if (enableWebhook) {
                if (!trimmedWebhookUrl) {
                    validationErrors.push("Webhook URL is required when webhook delivery is enabled");
                } else if (!validator.isURL(trimmedWebhookUrl, { require_protocol: true })) {
                    validationErrors.push("Webhook URL must be a valid URL with protocol (http:// or https://)");
                }
            }

            // Check that at least one delivery method is enabled and configured
            const hasValidDeliveryMethod =
                (enableEmail && emailAddresses.some(email => email.trim() && validator.isEmail(email.trim()))) ||
                (enableSlack && trimmedSlackWebhook && validator.isURL(trimmedSlackWebhook, { require_protocol: true })) ||
                (enableWebhook && trimmedWebhookUrl && validator.isURL(trimmedWebhookUrl, { require_protocol: true }));

            if (!hasValidDeliveryMethod) {
                validationErrors.push("At least one valid delivery method must be configured");
            }

            if (validationErrors.length > 0) {
                setErrors(validationErrors);
                return;
            }

            // Build the alarm data payload
            const alarmPayload = {
                logType,
                message: trimmedMessage,
                level,
                environment: trimmedEnvironment,
                deliveryMethods: {} as any
            };

            // Add configured delivery methods
            if (enableEmail) {
                alarmPayload.deliveryMethods.email = {
                    addresses: emailAddresses.map(email => email.trim()).filter(email => email)
                };
            }

            if (enableSlack) {
                alarmPayload.deliveryMethods.slack = {
                    webhook: trimmedSlackWebhook
                };
            }

            if (enableWebhook) {
                alarmPayload.deliveryMethods.webhook = {
                    url: trimmedWebhookUrl
                };
            }

            // Make API call - either create or update
            const resultAlarm = isEditMode
                ? await updateProjectAlarm(token, projectId, editingAlarm.id, alarmPayload)
                : await createAlarm(token, projectId, alarmPayload);

            // Call the onSubmit callback with the alarm data
            onSubmit(resultAlarm);

        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} alarm:`, error);
            setErrors([error instanceof Error ? error.message : 'An unexpected error occurred']);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper functions for email management
    const addEmailField = () => {
        if (emailAddresses.length < 5) {
            setEmailAddresses([...emailAddresses, '']);
        }
    };

    const removeEmailField = (index: number) => {
        setEmailAddresses(emailAddresses.filter((_, i) => i !== index));
    };

    const updateEmailField = (index: number, value: string) => {
        const newEmails = [...emailAddresses];
        newEmails[index] = value;
        setEmailAddresses(newEmails);
    };

    // Validation - at least one delivery method must be enabled and configured
    const hasValidDeliveryMethod =
        (enableEmail && emailAddresses.some(email => email.trim() && validator.isEmail(email.trim()))) ||
        (enableSlack && slackWebhook.trim() && validator.isURL(slackWebhook.trim(), { require_protocol: true })) ||
        (enableWebhook && webhookUrl.trim() && validator.isURL(webhookUrl.trim(), { require_protocol: true }));

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Display */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                    <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}
            <div>
                <Label htmlFor="alarm-log-type" className="mb-2 block">Log Type *</Label>
                <select
                    id="alarm-log-type"
                    value={logType}
                    onChange={(e) => setLogType(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm bg-white"
                >
                    <option value="Application Log">Application Log</option>
                    <option value="System Log">System Log</option>
                </select>
                <p className="text-xs text-neutral mt-1">
                    Choose which type of logs this alarm should monitor.
                </p>
            </div>

            <div>
                <Label htmlFor="alarm-message" className="mb-2 block">Message Pattern *</Label>
                <Input
                    id="alarm-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter message pattern..."
                    required
                />
                <p className="text-xs text-neutral mt-1">
                    The alarm will trigger when logs contain this message pattern.
                </p>
            </div>

            <div>
                <Label htmlFor="alarm-level" className="mb-2 block">Log Level *</Label>
                <select
                    id="alarm-level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm bg-white"
                >
                    <option value="INFO">INFO</option>
                    <option value="DEBUG">DEBUG</option>
                    <option value="WARNING">WARNING</option>
                    <option value="ERROR">ERROR</option>
                    <option value="CRITICAL">CRITICAL</option>
                </select>
                <p className="text-xs text-neutral mt-1">
                    The alarm will trigger for logs at this level or higher.
                </p>
            </div>

            <div>
                <Label htmlFor="alarm-environment" className="mb-2 block">Environment *</Label>
                <Input
                    id="alarm-environment"
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    placeholder="Enter environment name..."
                    required
                />
                <p className="text-xs text-neutral mt-1">
                    The alarm will only apply to this specific environment.
                </p>
            </div>

            {/* Delivery Methods */}
            <div className="border-t border-gray-200 pt-4">
                <Label className="font-medium text-primary-dark mb-2 block">Delivery Methods *</Label>
                <p className="text-xs text-neutral mt-1 mb-4">
                    Choose at least one way to receive alarm notifications.
                </p>

                <div className="space-y-4">
                    {/* Email */}
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                                id="enable-email"
                                checked={enableEmail}
                                onCheckedChange={(checked) => setEnableEmail(checked === true)}
                            />
                            <Label htmlFor="enable-email" className="cursor-pointer">Email (up to 5 addresses)</Label>
                        </div>
                        {enableEmail && (
                            <div className="ml-6 space-y-2">
                                {emailAddresses.map((email, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => updateEmailField(index, e.target.value)}
                                            placeholder="Enter email address..."
                                            className="flex-1"
                                        />
                                        {emailAddresses.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeEmailField(index)}
                                            >
                                                ×
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {emailAddresses.length < 5 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addEmailField}
                                        className="text-xs"
                                    >
                                        + Add Email
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Slack */}
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                                id="enable-slack"
                                checked={enableSlack}
                                onCheckedChange={(checked) => setEnableSlack(checked === true)}
                            />
                            <Label htmlFor="enable-slack" className="cursor-pointer">Slack</Label>
                        </div>
                        {enableSlack && (
                            <div className="ml-6">
                                <Input
                                    type="url"
                                    value={slackWebhook}
                                    onChange={(e) => setSlackWebhook(e.target.value)}
                                    placeholder="https://hooks.slack.com/services/..."
                                />
                                <p className="text-xs text-neutral mt-1">
                                    Enter your Slack webhook URL
                                </p>
                            </div>
                        )}
                    </div>


                    {/* Webhook */}
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                                id="enable-webhook"
                                checked={enableWebhook}
                                onCheckedChange={(checked) => setEnableWebhook(checked === true)}
                            />
                            <Label htmlFor="enable-webhook" className="cursor-pointer">Webhook</Label>
                        </div>
                        {enableWebhook && (
                            <div className="ml-6">
                                <Input
                                    type="url"
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    placeholder="https://your-api.com/webhook"
                                />
                                <p className="text-xs text-neutral mt-1">
                                    Enter webhook URL for POST notifications
                                </p>
                            </div>
                        )}
                    </div>

                    {!hasValidDeliveryMethod && (enableEmail || enableSlack || enableWebhook) && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-md text-xs">
                            Please fill in the required information for your selected delivery methods.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={!message.trim() || !environment.trim() || !hasValidDeliveryMethod || isSubmitting}
                >
                    {isSubmitting
                        ? (isEditMode ? "Updating Alarm..." : "Creating Alarm...")
                        : (isEditMode ? "Update Alarm" : "Create Alarm")
                    }
                </Button>
            </div>
        </form>
    );
}
