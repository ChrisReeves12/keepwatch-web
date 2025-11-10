import { useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Trash2, Activity } from "lucide-react";
import moment from "moment";
import { Button } from "~/components/ui/button";
import { getLogLevelStyle } from "../utils";
import type { Alarm } from "~/lib/api";

export function AlarmCard({ alarm, canDelete, canUpdate, onDelete, onUpdate, isDeleting }: {
    alarm: Alarm;
    canDelete: boolean;
    canUpdate: boolean;
    onDelete: (alarmId: string) => void;
    onUpdate: (alarm: Alarm) => void;
    isDeleting: boolean;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const levelStyle = getLogLevelStyle(alarm.level);
    const LevelIcon = levelStyle.icon;

    return (
        <div
            className="border border-gray-200 rounded-lg relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50"
            >
                {/* Expand/Collapse Icon */}
                <div className="shrink-0 mt-0.5">
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-neutral" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-neutral" />
                    )}
                </div>

                {/* Alarm Level Icon */}
                <div className={`shrink-0 h-8 w-8 ${levelStyle.bgColor} rounded-full flex items-center justify-center`}>
                    <LevelIcon className={`h-4 w-4 ${levelStyle.color}`} />
                </div>

                {/* Alarm Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${levelStyle.bgColor} ${levelStyle.color}`}>
                            {Array.isArray(alarm.level) ? alarm.level.join(', ').toUpperCase() : alarm.level.toUpperCase()}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                            {alarm.environment}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {alarm.logType}
                        </span>
                    </div>
                    <p className="text-sm text-primary-dark font-medium">
                        {!alarm.message ? <span className="italic text-neutral">Match all messages</span> : alarm.message}
                    </p>
                    {Array.isArray(alarm.categories) && alarm.categories.length > 0 && (
                        <div className="flex gap-2 items-center mt-2">
                            <div className="text-xs">Categories: </div>
                            <div className="flex flex-wrap gap-1">
                                {alarm.categories.map((category) => (
                                    <span
                                        key={category}
                                        className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
                                    >
                                    {category}
                                </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </button>

            {/* Action Buttons - appear on hover */}
            {isHovered && (canUpdate || canDelete) && (
                <div className="absolute top-2 right-2 flex gap-2">
                    {canUpdate && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdate(alarm);
                            }}
                            className="flex items-center gap-1 bg-white shadow-sm hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                        >
                            <Pencil className="h-3 w-3" />
                            Edit
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(alarm.id);
                            }}
                            disabled={isDeleting}
                            className="flex items-center gap-1 bg-white shadow-sm hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                        >
                            {isDeleting ? (
                                <Activity className="h-3 w-3 animate-spin" />
                            ) : (
                                <Trash2 className="h-3 w-3" />
                            )}
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    )}
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                    <div>
                        <h4 className="text-xs font-medium text-neutral mb-2">Delivery Methods</h4>
                        <div className="space-y-2">
                            {alarm.deliveryMethods.email && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">📧 Email</span>
                                    <span className="text-gray-600">{alarm.deliveryMethods.email.addresses.join(', ')}</span>
                                </div>
                            )}
                            {alarm.deliveryMethods.slack && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">💬 Slack</span>
                                    <span className="text-gray-600">Webhook configured</span>
                                </div>
                            )}
                            {alarm.deliveryMethods.webhook && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">🔗 Webhook</span>
                                    <span className="text-gray-600">{alarm.deliveryMethods.webhook.url}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {alarm.createdAt && (
                        <div className="text-xs text-neutral">
                            <span className="font-medium">Created:</span> {moment(alarm.createdAt).format("MMM D, YYYY h:mm A")} ({moment(alarm.createdAt).fromNow()})
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

