import { useEffect, useState } from "react";
import { Copy, CheckCircle, Users, Key, Activity, Pencil, UserPlus } from "lucide-react";
import moment from "moment";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Form } from "react-router";
import type { Project } from "~/lib/api";
import validator from "validator";

export function OverviewTab({
    project,
    onEditProject,
    canEdit,
    actionError,
    inviteSent,
}: {
    project: Project;
    onEditProject: () => void;
    canEdit: boolean;
    actionError?: string;
    inviteSent?: boolean;
}) {
    const [copiedProjectId, setCopiedProjectId] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("viewer");
    const [errors, setErrors] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showInviteSuccess, setShowInviteSuccess] = useState(false);
    const [lastInvited, setLastInvited] = useState<{ email: string; role: string } | null>(null);

    const copyProjectId = () => {
        navigator.clipboard.writeText(project.projectId);
        setCopiedProjectId(true);
        setTimeout(() => setCopiedProjectId(false), 2000);
    };

    useEffect(() => {
        if (inviteSent) {
            // Close form and show success confirmation
            setInviteOpen(false);
            setErrors(null);
            setSubmitting(false);
            setShowInviteSuccess(true);
            // Reset fields for next invite
            setEmail("");
            setRole("viewer");
        }
    }, [inviteSent]);

    const validate = () => {
        const value = email.trim();
        if (!value) return "Email is required";
        if (!validator.isEmail(value)) return "Enter a valid email";
        if (!role) return "Role is required";
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral">Team Members</p>
                                <p className="text-3xl font-bold text-primary-dark mt-1">{project.users.length}</p>
                            </div>
                            <div className="h-12 w-12 bg-brand/10 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-brand" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral">API Keys</p>
                                <p className="text-3xl font-bold text-primary-dark mt-1">{project.apiKeys.length}</p>
                            </div>
                            <div className="h-12 w-12 bg-[#FFB30D]/10 rounded-full flex items-center justify-center">
                                <Key className="h-6 w-6 text-[#FFB30D]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral">Status</p>
                                <p className="text-xl font-semibold text-green-600 mt-1">Active</p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Activity className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Project Information */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <CardTitle>Project Information</CardTitle>
                            <CardDescription>Basic details about this project</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {canEdit && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={onEditProject}
                                        className="flex items-center gap-2"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Edit Details
                                    </Button>
                                    <Button
                                        type="button"
                                        className="bg-[#FFB30D] hover:bg-[#FFB30D]/90 text-white flex items-center gap-2"
                                        onClick={() => setInviteOpen(true)}
                                        title="Invite a new member to this project"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Invite Member
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-neutral">Project Name</label>
                        <p className="text-primary-dark mt-1">{project.name}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-neutral">Description</label>
                        <p className="text-primary-dark mt-1">{project.description}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-neutral">Owner</label>
                        <div className="mt-1">
                            {project.ownerName && (
                                <p className="text-primary-dark font-medium">{project.ownerName}</p>
                            )}
                            {project.ownerEmail && (
                                <p className="text-sm text-neutral">{project.ownerEmail}</p>
                            )}
                            {!project.ownerName && !project.ownerEmail && (
                                <p className="text-neutral text-sm">Owner information unavailable</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-neutral">Project ID</label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded font-mono text-primary-dark">
                                {project.projectId}
                            </code>
                            <button
                                onClick={copyProjectId}
                                className="text-brand hover:text-[#FFB30D] transition-colors"
                                title="Copy to clipboard"
                            >
                                {copiedProjectId ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <Copy className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-neutral">Created</label>
                            <p className="text-primary-dark mt-1">{moment(project.createdAt).format("MMM D, YYYY")}</p>
                            <p className="text-xs text-neutral">{moment(project.createdAt).fromNow()}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral">Last Updated</label>
                            <p className="text-primary-dark mt-1">{moment(project.updatedAt).format("MMM D, YYYY")}</p>
                            <p className="text-xs text-neutral">{moment(project.updatedAt).fromNow()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Invite Member Dialog */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent onClose={() => setInviteOpen(false)}>
                    <Form
                        method="post"
                        onSubmit={(e) => {
                            const error = validate();
                            if (error) {
                                e.preventDefault();
                                setErrors(error);
                                return;
                            }
                            // Capture the values being submitted for success display
                            const value = email.trim();
                            setLastInvited({ email: value, role });
                            setSubmitting(true);
                        }}
                    >
                        <input type="hidden" name="_action" value="inviteUser" />
                        <DialogHeader>
                            <DialogTitle>Invite a Member</DialogTitle>
                            <DialogDescription>
                                Send an invitation to join this project. Choose their role and enter their email address.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogBody>
                            {(errors || actionError) && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-md text-sm mb-3">
                                    {errors || actionError}
                                </div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="invite-email">Email</Label>
                                    <Input
                                        id="invite-email"
                                        name="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="invite-role">Role</Label>
                                    <select
                                        id="invite-role"
                                        name="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm bg-background text-foreground"
                                        required
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </div>
                            </div>
                        </DialogBody>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-[#FFB30D] hover:bg-[#FFB30D]/90 text-white" disabled={submitting}>
                                {submitting ? "Sending..." : "Send Invite"}
                            </Button>
                        </DialogFooter>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Invite Sent Success Dialog */}
            <Dialog open={showInviteSuccess} onOpenChange={setShowInviteSuccess}>
                <DialogContent onClose={() => setShowInviteSuccess(false)}>
                    <DialogHeader>
                        {/* @ts-ignore */}
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Invite Sent
                        </DialogTitle>
                        <DialogDescription>
                            {lastInvited?.email ? (
                                <>
                                    We sent an invitation to <span className="font-medium text-primary-dark">{lastInvited.email}</span>
                                    {lastInvited?.role && (
                                        <>
                                            {' '}with the role <span className="font-medium capitalize">{lastInvited.role}</span>.
                                        </>
                                    )}
                                    {" "}They'll receive an email with instructions to join the project.
                                </>
                            ) : (
                                <>Your invitation has been sent. The user will receive an email shortly.</>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        {/* Optional extra context */}
                        <p className="text-sm text-neutral">
                            If the recipient doesn’t see the email in a few minutes, ask them to check their spam folder.
                        </p>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowInviteSuccess(false);
                            }}
                        >
                            Close
                        </Button>
                        <Button
                            className="bg-[#FFB30D] hover:bg-[#FFB30D]/90 text-white"
                            onClick={() => {
                                setShowInviteSuccess(false);
                                setInviteOpen(true);
                            }}
                        >
                            Invite Another
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

