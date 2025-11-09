import type { Route } from "./+types/account.settings";
import { getAuthToken, requireAuth, clearAuthCookies } from "~/lib/auth.server";
import {
  getCurrentUser,
  updateUser,
  requestPasswordReset,
  verifyPasswordReset,
  requestAccountDeletion,
  verifyAccountDeletion,
  type User
} from "~/lib/api";
import { useLoaderData, useActionData, Form, redirect } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "~/components/ui/dialog";
import { DashboardHeader } from "~/components/DashboardHeader";
import { AlertTriangle, CheckCircle, User as UserIcon, Lock, Trash2, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Account Settings - KeepWatch" },
    { name: "description", content: "Manage your account settings and preferences" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = requireAuth(request);

  try {
    const user = await getCurrentUser(token);
    return { user, token };
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw redirect("/login");
  }
}

export async function action({ request }: Route.ActionArgs) {
  const token = getAuthToken(request);

  if (!token) {
    return { error: "Unauthorized" };
  }

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  try {
    switch (actionType) {
      case "updateName": {
        const name = formData.get("name") as string;
        const company = formData.get("company") as string;
        const updatedUser = await updateUser(token, { name, company });
        return { success: true, message: "Profile updated successfully!", type: "updateName", user: updatedUser };
      }

      case "updateTwoFactor": {
        const is2FARequired = formData.get("is2FARequired") === "true";
        const updatedUser = await updateUser(token, { is2FARequired });
        return {
          success: true,
          message: `Two-factor authentication ${is2FARequired ? "enabled" : "disabled"} successfully!`,
          type: "updateTwoFactor",
          user: updatedUser,
        };
      }

      case "requestPasswordReset": {
        const email = formData.get("email") as string;
        await requestPasswordReset(email);
        return { success: true, message: "Verification code sent to your email! Code expires in 15 minutes.", type: "requestPasswordReset" };
      }

      case "verifyPasswordReset": {
        const email = formData.get("email") as string;
        const code = formData.get("code") as string;
        const newPassword = formData.get("newPassword") as string;
        await verifyPasswordReset({ email, code, newPassword });
        return { success: true, message: "Password reset successfully!", type: "verifyPasswordReset" };
      }

      case "requestAccountDeletion": {
        await requestAccountDeletion(token);
        return { success: true, message: "Verification code sent to your email!", type: "requestAccountDeletion" };
      }

      case "verifyAccountDeletion": {
        const code = formData.get("code") as string;
        await verifyAccountDeletion(token, { code });

        // Clear cookies and redirect to login
        const cookies = clearAuthCookies();
        return redirect("/login", {
          headers: [
            ["Set-Cookie", cookies[0]],
            ["Set-Cookie", cookies[1]],
          ],
        });
      }

      default:
        return { error: "Invalid action type" };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "An error occurred",
      type: actionType,
    };
  }
}

export default function AccountSettings() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  // Dialog states
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  // Password reset state
  const [passwordResetStep, setPasswordResetStep] = useState<"request" | "verify">("request");

  // Delete account state
  const [deleteAccountStep, setDeleteAccountStep] = useState<"request" | "verify">("request");

  // Handle successful password reset request
  useEffect(() => {
    if (actionData?.success && actionData?.type === "requestPasswordReset") {
      setPasswordResetStep("verify");
    }
  }, [actionData]);

  // Handle successful password reset verification
  useEffect(() => {
    if (actionData?.success && actionData?.type === "verifyPasswordReset") {
      setShowPasswordResetDialog(false);
      setPasswordResetStep("request");
    }
  }, [actionData]);

  // Handle successful delete account request
  useEffect(() => {
    if (actionData?.success && actionData?.type === "requestAccountDeletion") {
      setDeleteAccountStep("verify");
    }
  }, [actionData]);

  // Close dialogs when clicking outside
  const handlePasswordResetDialogChange = (open: boolean) => {
    setShowPasswordResetDialog(open);
    if (!open) {
      setPasswordResetStep("request");
    }
  };

  const handleDeleteAccountDialogChange = (open: boolean) => {
    setShowDeleteAccountDialog(open);
    if (!open) {
      setDeleteAccountStep("request");
    }
  };

  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(!!user.is2FARequired);
  const [isUpdating2FA, setIsUpdating2FA] = useState(false);

  useEffect(() => {
    setIs2FAEnabled(!!user.is2FARequired);
  }, [user.is2FARequired]);

  useEffect(() => {
    if (isUpdating2FA && actionData?.type === "updateTwoFactor") {
      setIsUpdating2FA(false);
    }
  }, [actionData, isUpdating2FA]);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={user} />

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary-dark">Account Settings</h1>
            <p className="text-neutral mt-2">Manage your personal information and account preferences</p>
          </div>

          {/* Success/Error Messages */}
          {actionData?.success && actionData?.message && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>{actionData.message}</span>
            </div>
          )}
          {actionData?.error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>{actionData.error}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-brand" />
                  <CardTitle>Profile Information</CardTitle>
                </div>
                <CardDescription>Update your name, company, and view your email address</CardDescription>
              </CardHeader>
              <CardContent>
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="actionType" value="updateName" />

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      defaultValue={user.name}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                      className="bg-gray-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-neutral">Email address cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      defaultValue={user.company || ""}
                      placeholder="Enter your company name"
                    />
                  </div>

                  <Button type="submit" className="bg-brand hover:bg-brand/90 text-white">
                    Save Changes
                  </Button>
                </Form>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-brand" />
                  <CardTitle>Security</CardTitle>
                </div>
                <CardDescription>Manage your password and security settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label>Password</Label>
                    <p className="text-sm text-neutral mt-1 mb-3">
                      Reset your password to keep your account secure
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPasswordResetDialog(true)}
                      className="border-brand text-brand hover:bg-brand/10"
                    >
                      Reset Password
                    </Button>
                  </div>

                  <Form
                    method="post"
                    onSubmit={() => setIsUpdating2FA(true)}
                    className="border border-gray-200 rounded-lg p-4 space-y-4"
                  >
                    <input type="hidden" name="actionType" value="updateTwoFactor" />
                    <input type="hidden" name="is2FARequired" value={is2FAEnabled ? "true" : "false"} />

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Label htmlFor="is2FARequired" className="text-black">
                          Require 2-factor Authentication
                        </Label>
                        <p className="text-sm text-neutral mt-1">
                          When enabled, users must enter a 6-digit code emailed to them at sign in.
                        </p>
                      </div>
                      <Checkbox
                        id="is2FARequired"
                        checked={is2FAEnabled}
                        onCheckedChange={(checked) => setIs2FAEnabled(!!checked)}
                        className="h-5 w-5"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="bg-brand hover:bg-brand/90 text-white"
                        disabled={isUpdating2FA}
                      >
                        {isUpdating2FA ? "Saving..." : "Save Security Settings"}
                      </Button>
                    </div>
                  </Form>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                </div>
                <CardDescription>Irreversible actions for your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start gap-3">
                      <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900 mb-1">Delete Account</h3>
                        <p className="text-sm text-red-700 mb-3">
                          Permanently delete your account and all associated data. This action cannot be undone.
                          All of your projects, logs, and telemetry data will be permanently deleted.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowDeleteAccountDialog(true)}
                          className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                        >
                          Delete My Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Password Reset Dialog */}
      <PasswordResetDialog
        open={showPasswordResetDialog}
        onOpenChange={handlePasswordResetDialogChange}
        step={passwordResetStep}
        email={user.email}
        error={actionData?.type === "requestPasswordReset" || actionData?.type === "verifyPasswordReset" ? actionData?.error : undefined}
      />

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={showDeleteAccountDialog}
        onOpenChange={handleDeleteAccountDialogChange}
        step={deleteAccountStep}
        email={user.email}
        error={actionData?.type === "requestAccountDeletion" || actionData?.type === "verifyAccountDeletion" ? actionData?.error : undefined}
      />
    </>
  );
}

// Password Reset Dialog Component
function PasswordResetDialog({
  open,
  onOpenChange,
  step,
  email,
  error
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: "request" | "verify";
  email: string;
  error?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset submitting state when step changes or when there's an error/success
  useEffect(() => {
    setIsSubmitting(false);
  }, [step, error]);

  // Reset submitting state when dialog is closed
  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        {step === "request" ? (
          <Form method="post" onSubmit={() => setIsSubmitting(true)}>
            <input type="hidden" name="actionType" value="requestPasswordReset" />
            <input type="hidden" name="email" value={email} />

            <DialogHeader>
              <DialogTitle>Reset Your Password</DialogTitle>
              <DialogDescription>
                We'll send a verification code to your email address (expires in 15 minutes)
              </DialogDescription>
            </DialogHeader>

            <DialogBody>
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Verification email will be sent to:</p>
                    <p className="text-sm text-blue-700">{email}</p>
                  </div>
                </div>

                <p className="text-sm text-neutral">
                  Click the button below to receive a 6-digit verification code via email.
                </p>
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
                {isSubmitting ? "Sending..." : "Send Verification Code"}
              </Button>
            </DialogFooter>
          </Form>
        ) : (
          <Form method="post" onSubmit={() => setIsSubmitting(true)}>
            <input type="hidden" name="actionType" value="verifyPasswordReset" />
            <input type="hidden" name="email" value={email} />

            <DialogHeader>
              <DialogTitle>Enter Verification Code</DialogTitle>
              <DialogDescription>
                We've sent a 6-digit code to {email}. Code expires in 15 minutes.
              </DialogDescription>
            </DialogHeader>

            <DialogBody>
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    disabled={isSubmitting}
                    className="text-center text-lg tracking-widest"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      required
                      disabled={isSubmitting}
                      className="pr-10"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral hover:text-brand transition-colors"
                    >
                      {showPassword ? (
                        <AiOutlineEyeInvisible className="h-4 w-4" />
                      ) : (
                        <AiOutlineEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      required
                      disabled={isSubmitting}
                      className="pr-10"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral hover:text-brand transition-colors"
                    >
                      {showConfirmPassword ? (
                        <AiOutlineEyeInvisible className="h-4 w-4" />
                      ) : (
                        <AiOutlineEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
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
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Delete Account Dialog Component
function DeleteAccountDialog({
  open,
  onOpenChange,
  step,
  email,
  error
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: "request" | "verify";
  email: string;
  error?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset submitting state when step changes or when there's an error/success
  useEffect(() => {
    setIsSubmitting(false);
  }, [step, error]);

  // Reset submitting state when dialog is closed
  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        {step === "request" ? (
          <Form method="post" onSubmit={() => setIsSubmitting(true)}>
            <input type="hidden" name="actionType" value="requestAccountDeletion" />

            <DialogHeader>
              <DialogTitle>
                <span className="text-red-600">Delete Your Account</span>
              </DialogTitle>
              <DialogDescription>
                This action is permanent and cannot be undone
              </DialogDescription>
            </DialogHeader>

            <DialogBody>
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-2">
                      Warning: This will permanently delete:
                    </p>
                    <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                      <li>Your account and profile</li>
                      <li>All of your projects</li>
                      <li>All application logs and telemetry data</li>
                      <li>All API keys and access credentials</li>
                      <li>All team memberships and permissions</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Verification email will be sent to:</p>
                    <p className="text-sm text-blue-700">{email}</p>
                  </div>
                </div>

                <p className="text-sm text-neutral">
                  To confirm account deletion, we'll send a 6-digit verification code to your email address.
                </p>
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
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Verification Code"}
              </Button>
            </DialogFooter>
          </Form>
        ) : (
          <Form method="post" onSubmit={() => setIsSubmitting(true)}>
            <input type="hidden" name="actionType" value="verifyAccountDeletion" />

            <DialogHeader>
              <DialogTitle>
                <span className="text-red-600">Confirm Account Deletion</span>
              </DialogTitle>
              <DialogDescription>
                Enter the verification code sent to {email}
              </DialogDescription>
            </DialogHeader>

            <DialogBody>
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-900">
                    <strong>Final Warning:</strong> Once you enter the verification code and confirm,
                    your account and all associated data will be permanently deleted. This action cannot be reversed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    disabled={isSubmitting}
                    className="text-center text-lg tracking-widest"
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
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete My Account"}
              </Button>
            </DialogFooter>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

