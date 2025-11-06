import { Link, useSearchParams } from "react-router";
import { FileText } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { ApplicationLogsTab } from "./ApplicationLogsTab";
import { AlarmsTab } from "./AlarmsTab";
import type { Project } from "~/lib/api";

export function LogsTab({
    project,
    canCreateAlarm,
    canDeleteAlarm,
    canUpdateAlarm,
    userEmail,
}: {
    project: Project;
    canCreateAlarm: boolean;
    canDeleteAlarm: boolean;
    canUpdateAlarm: boolean;
    userEmail?: string;
}) {
    const [searchParams] = useSearchParams();

    // Get logs sub-tab from URL, default to "application"
    const logsSubTab = (searchParams.get("logsTab") as "console" | "application" | "system" | "alarms") || "application";

    return (
        <div className="space-y-6">
            {/* Sub-tabs for log types */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-6">
                    <Link
                        to="?tab=logs&logsTab=console&page=1"
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${logsSubTab === "console"
                            ? "border-brand text-brand"
                            : "border-transparent text-neutral hover:text-primary-dark"
                            }`}
                    >
                        Console Logs
                    </Link>
                    <Link
                        to="?tab=logs&logsTab=application&page=1"
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${logsSubTab === "application"
                            ? "border-brand text-brand"
                            : "border-transparent text-neutral hover:text-primary-dark"
                            }`}
                    >
                        Application Logs
                    </Link>
                    <Link
                        to="?tab=logs&logsTab=system&page=1"
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${logsSubTab === "system"
                            ? "border-brand text-brand"
                            : "border-transparent text-neutral hover:text-primary-dark"
                            }`}
                    >
                        System Logs
                    </Link>
                    <Link
                        to="?tab=logs&logsTab=alarms"
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${logsSubTab === "alarms"
                            ? "border-brand text-brand"
                            : "border-transparent text-neutral hover:text-primary-dark"
                            }`}
                    >
                        Alarms
                    </Link>
                </nav>
            </div>

            {/* Content for each log type */}
            {logsSubTab === "console" && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-neutral mx-auto mb-4" />
                            <p className="text-neutral">Console Logs - Coming Soon</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {logsSubTab === "application" && (
                <ApplicationLogsTab project={project} canCreateAlarm={canCreateAlarm} userEmail={userEmail} />
            )}

            {logsSubTab === "system" && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-neutral mx-auto mb-4" />
                            <p className="text-neutral">System Logs - Coming Soon</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {logsSubTab === "alarms" && (
                <AlarmsTab project={project} canCreateAlarm={canCreateAlarm} canDeleteAlarm={canDeleteAlarm} canUpdateAlarm={canUpdateAlarm} userEmail={userEmail} />
            )}
        </div>
    );
}

