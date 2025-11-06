import { useState } from "react";
import { ChevronDown, ChevronRight, Bell } from "lucide-react";
import moment from "moment";
import { Button } from "~/components/ui/button";
import { getLogLevelStyle } from "../utils";
import type { Log } from "~/lib/api";

export function LogCard({ log, onAddAlarm, canCreateAlarm }: { log: Log; onAddAlarm: (log: Log) => void; canCreateAlarm: boolean }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const levelStyle = getLogLevelStyle(log.level);
    const LevelIcon = levelStyle.icon;

    return (
        <div
            className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Main log row */}
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

                {/* Log Level Icon */}
                <div className={`shrink-0 h-8 w-8 ${levelStyle.bgColor} rounded-full flex items-center justify-center`}>
                    <LevelIcon className={`h-4 w-4 ${levelStyle.color}`} />
                </div>

                {/* Log Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${levelStyle.bgColor} ${levelStyle.color}`}>
                            {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                            {log.environment}
                        </span>
                        {log.hostname && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                {log.hostname}
                            </span>
                        )}
                        <span className="text-xs text-neutral">
                            {moment(log.timestampMS).format("MMM D, YYYY h:mm:ss A")}
                        </span>
                        <span className="text-xs text-neutral">
                            ({moment(log.timestampMS).fromNow()})
                        </span>
                    </div>
                    <p className="text-sm text-primary-dark font-medium">{log.message}</p>
                </div>
            </button>

            {/* Add Alarm Button - appears on hover */}
            {isHovered && canCreateAlarm && (
                <div className="absolute top-2 right-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent expanding the log
                            onAddAlarm(log);
                        }}
                        className="flex items-center gap-1 bg-white shadow-sm hover:bg-gray-50"
                    >
                        <Bell className="h-3 w-3" />
                        Add Alarm
                    </Button>
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                    {/* Details */}
                    {log.details && Object.keys(log.details).length > 0 && (
                        <div>
                            <h4 className="text-xs font-medium text-neutral mb-2">Details</h4>
                            <div className="bg-gray-50 rounded p-3">
                                <pre className="text-xs font-mono text-primary-dark overflow-x-auto whitespace-pre-wrap wrap-break-word">
                                    {JSON.stringify(log.details, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Stack Trace */}
                    {log.rawStackTrace && (
                        <div>
                            <h4 className="text-xs font-medium text-neutral mb-2">Stack Trace</h4>
                            <div className="bg-gray-50 rounded p-3">
                                <pre className="text-xs font-mono text-red-600 overflow-x-auto whitespace-pre-wrap wrap-break-word">
                                    {log.rawStackTrace}
                                </pre>
                            </div>
                        </div>
                    )}

                    {!log.rawStackTrace && log.stackTrace && log.stackTrace.length > 0 && (
                        <div>
                            <h4 className="text-xs font-medium text-neutral mb-2">Stack Trace</h4>
                            <div className="bg-gray-50 rounded p-3">
                                <pre className="text-xs font-mono text-red-600 overflow-x-auto whitespace-pre-wrap wrap-break-word">
                                    {JSON.stringify(log.stackTrace, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

