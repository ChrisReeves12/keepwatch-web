import { useEffect, useState } from "react";
import { Users, Trash2, UserPlus, CheckCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Form } from "react-router";
import type { Project } from "~/lib/api";
import validator from "validator";

export function TeamTab({
    project,
    userId,
    onRemoveUser,
    canRemoveUsers,
    actionError,
    inviteSent,
}: {
    project: Project;
    userId: string | null;
    onRemoveUser: (userId: string) => void;
    canRemoveUsers: boolean;
    actionError?: string;
    inviteSent?: boolean;
}) {
    const [inviteOpen, setInviteOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("viewer");
    const [errors, setErrors] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showInviteSuccess, setShowInviteSuccess] = useState(false);
    const [lastInvited, setLastInvited] = useState<{ email: string; role: string } | null>(null);

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
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>People who have access to this project</CardDescription>
                        </div>
                        <Button
                            type="button"
                            className="bg-[#FFB30D] hover:bg-[#FFB30D]/90 text-white flex items-center gap-2"
                            onClick={() => setInviteOpen(true)}
                            title="Invite a new member to this project"
                        >
                            <UserPlus className="h-4 w-4" />
                            Invite Member
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {project.users.map((user) => {
                            const isCurrentUser = user.id === userId;
                            const isOwner = user.id === project.ownerId;
                            const canRemove = canRemoveUsers && !isCurrentUser && !isOwner;

                            return (
                                <div key={user.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="h-10 w-10 bg-brand rounded-full flex items-center justify-center shrink-0">
                                            <Users className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-primary-dark flex items-center gap-2 flex-wrap">
                                                {user.name || `User ${user.id}`}
                                                {isOwner && (
                                                    <span className="text-xs px-2 py-0.5 bg-[#FFB30D]/10 text-[#FFB30D] rounded font-semibold">Owner</span>
                                                )}
                                                {isCurrentUser && (
                                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">You</span>
                                                )}
                                            </p>
                                            {user.email && (
                                                <p className="text-sm text-neutral truncate">{user.email}</p>
                                            )}
                                            <p className="text-xs text-neutral capitalize mt-1">{user.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-sm px-3 py-1 bg-brand/10 text-brand rounded-full capitalize">
                                            {user.role}
                                        </span>
                                        {canRemove && (
                                            <button
                                                onClick={() => onRemoveUser(user.id)}
                                                className="text-red-600 hover:text-red-700 transition-colors p-2"
                                                title="Remove user from project"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                        {isOwner && !canRemoveUsers && (
                                            <div className="px-2 py-2 text-xs text-neutral" title="Project owner cannot be removed">
                                                {/* Spacer to maintain alignment */}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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
                            If the recipient doesn't see the email in a few minutes, ask them to check their spam folder.
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

