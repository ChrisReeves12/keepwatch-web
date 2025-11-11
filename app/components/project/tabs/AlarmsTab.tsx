import { useState, useEffect } from "react";
import { useLoaderData } from "react-router";
import { Activity, Bell, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "~/components/ui/dialog";
import { AddAlarmForm } from "~/components/project/dialogs/AddAlarmForm";
import { AlarmCard } from "../cards/AlarmCard";
import { fetchProjectAlarms, deleteProjectAlarm, type Project, type Alarm } from "~/lib/api";
import type { loader } from "~/routes/project.$projectId";

export function AlarmsTab({ project, canCreateAlarm, canDeleteAlarm, canUpdateAlarm, userEmail }: { project: Project; canCreateAlarm: boolean; canDeleteAlarm: boolean; canUpdateAlarm: boolean; userEmail?: string }) {
    const { token } = useLoaderData<typeof loader>();
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingAlarmId, setDeletingAlarmId] = useState<string | null>(null);
    const [isClearingAll, setIsClearingAll] = useState(false);
    const [showUpdateAlarmModal, setShowUpdateAlarmModal] = useState(false);
    const [showAddAlarmModal, setShowAddAlarmModal] = useState(false);
    const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);

    // Fetch alarms when component mounts
    useEffect(() => {
        const loadAlarms = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetchProjectAlarms(token, project.projectId);
                setAlarms(response.alarms);
            } catch (err) {
                console.error('Error fetching alarms:', err);
                setError(err instanceof Error ? err.message : 'Failed to load alarms');
            } finally {
                setIsLoading(false);
            }
        };

        loadAlarms();
    }, [token, project.projectId]);

    // Delete alarm function
    const handleDeleteAlarm = async (alarmId: string) => {
        if (!canDeleteAlarm) return;

        try {
            setDeletingAlarmId(alarmId);
            await deleteProjectAlarm(token, project.projectId, alarmId);

            // Remove the deleted alarm from the state
            setAlarms(prevAlarms => prevAlarms.filter(alarm => alarm.id !== alarmId));
        } catch (err) {
            console.error('Error deleting alarm:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete alarm');
        } finally {
            setDeletingAlarmId(null);
        }
    };

    // Clear all alarms function
    const handleClearAllAlarms = async () => {
        if (!canDeleteAlarm || alarms.length === 0) return;

        if (!confirm(`Are you sure you want to delete all ${alarms.length} alarm${alarms.length !== 1 ? 's' : ''}? This action cannot be undone.`)) {
            return;
        }

        try {
            setIsClearingAll(true);
            await deleteProjectAlarm(token, project.projectId); // No alarmId = delete all

            // Clear all alarms from the state
            setAlarms([]);
        } catch (err) {
            console.error('Error clearing all alarms:', err);
            setError(err instanceof Error ? err.message : 'Failed to clear all alarms');
        } finally {
            setIsClearingAll(false);
        }
    };

    // Update alarm function
    const handleUpdateAlarm = (alarm: Alarm) => {
        if (!canUpdateAlarm) return;
        setEditingAlarm(alarm);
        setShowUpdateAlarmModal(true);
    };

    // Handle alarm update submission
    const handleAlarmUpdateSubmit = async (updatedAlarm: Alarm) => {
        setShowUpdateAlarmModal(false);
        setEditingAlarm(null);

        // Refetch all alarms to ensure we have the latest data
        try {
            const response = await fetchProjectAlarms(token, project.projectId);
            setAlarms(response.alarms);
        } catch (err) {
            console.error('Error refetching alarms after update:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh alarms');
        }
    };

    // Handle alarm creation submission
    const handleAlarmCreateSubmit = async (newAlarm: Alarm) => {
        setShowAddAlarmModal(false);

        // Refetch all alarms to ensure we have the latest data
        try {
            const response = await fetchProjectAlarms(token, project.projectId);
            setAlarms(response.alarms);
        } catch (err) {
            console.error('Error refetching alarms after creation:', err);
            setError(err instanceof Error ? err.message : 'Failed to refresh alarms');
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-neutral mx-auto mb-4 animate-spin" />
                        <p className="text-neutral">Loading alarms...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        {error}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Project Alarms</CardTitle>
                            <CardDescription>
                                Monitor and manage your project alarms. {alarms.length} alarm{alarms.length !== 1 ? 's' : ''} configured.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {canCreateAlarm && (
                                <Button
                                    onClick={() => setShowAddAlarmModal(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Bell className="h-4 w-4" />
                                    Add Alarm
                                </Button>
                            )}
                            {canDeleteAlarm && alarms.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearAllAlarms}
                                    disabled={isClearingAll}
                                    className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                                >
                                    {isClearingAll ? (
                                        <>
                                            <Activity className="h-4 w-4 animate-spin" />
                                            Clearing...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            Clear All Alarms
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {alarms.length === 0 ? (
                        <div className="text-center py-8">
                            <Bell className="h-12 w-12 text-neutral mx-auto mb-4" />
                            <p className="text-neutral">No alarms configured</p>
                            <p className="text-sm text-neutral mt-2">
                                Click "Add Alarm" to create an alarm and get notified when specific events occur
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {alarms.map((alarm, index) => (
                                <AlarmCard
                                    key={alarm.id || alarm._id || index}
                                    alarm={alarm}
                                    canDelete={canDeleteAlarm}
                                    canUpdate={canUpdateAlarm}
                                    onDelete={handleDeleteAlarm}
                                    onUpdate={handleUpdateAlarm}
                                    isDeleting={deletingAlarmId === alarm.id}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Alarm Modal */}
            <Dialog open={showAddAlarmModal} onOpenChange={setShowAddAlarmModal}>
                <DialogContent onClose={() => setShowAddAlarmModal(false)}>
                    <DialogHeader>
                        <DialogTitle>Create New Alarm</DialogTitle>
                        <DialogDescription>
                            Set up a new alarm to monitor your logs.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <AddAlarmForm
                            projectId={project.projectId}
                            token={token}
                            initialMessage=""
                            initialLevel="ERROR"
                            initialEnvironment=""
                            userEmail={userEmail}
                            onSubmit={handleAlarmCreateSubmit}
                            onCancel={() => setShowAddAlarmModal(false)}
                        />
                    </DialogBody>
                </DialogContent>
            </Dialog>

            {/* Update Alarm Modal */}
            <Dialog open={showUpdateAlarmModal} onOpenChange={setShowUpdateAlarmModal}>
                <DialogContent onClose={() => setShowUpdateAlarmModal(false)}>
                    <DialogHeader>
                        <DialogTitle>Update Alarm</DialogTitle>
                        <DialogDescription>
                            Modify the alarm configuration.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        {editingAlarm && (
                            <AddAlarmForm
                                projectId={project.projectId}
                                token={token}
                                initialMessage={editingAlarm?.message || ''}
                                initialLevel={editingAlarm?.level || 'INFO'}
                                initialEnvironment={editingAlarm?.environment || ''}
                                userEmail={userEmail}
                                editingAlarm={editingAlarm}
                                onSubmit={handleAlarmUpdateSubmit}
                                onCancel={() => {
                                    setShowUpdateAlarmModal(false);
                                    setEditingAlarm(null);
                                }}
                            />
                        )}
                    </DialogBody>
                </DialogContent>
            </Dialog>
        </>
    );
}

