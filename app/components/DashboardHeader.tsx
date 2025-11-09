import { Form, Link } from "react-router";
import {
  User as UserIcon,
  Settings,
  LogOut,
  ChevronDown,
  CreditCard,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useState, useRef, useEffect, type FormEvent } from "react";
import type { User } from "~/lib/api";
import { verifyEmail, resendVerificationEmail } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "~/components/ui/dialog";

type DashboardHeaderProps = {
  user?: User;
  onEmailVerified?: (user: User) => void;
};

export function DashboardHeader({ user, onEmailVerified }: DashboardHeaderProps) {
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleVerifyEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsVerifying(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await verifyEmail(verificationCode);
      const updatedUser = response.user || (user ? { ...user, emailVerifiedAt: new Date().toISOString() } : undefined);

      if (updatedUser) {
        onEmailVerified?.(updatedUser);
      }

      setSuccessMessage(response.message || "Email verified successfully!");
      setVerificationCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify email");
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timeout = setTimeout(() => {
        setShowVerifyDialog(false);
        setSuccessMessage(null);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [successMessage]);

  const handleDialogOpenChange = (open: boolean) => {
    setShowVerifyDialog(open);
    if (!open) {
      setVerificationCode("");
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleResendCode = async () => {
    if (!user?.email) {
      return;
    }

    setIsResending(true);
    setResendError(null);
    setResendMessage(null);

    try {
      const response = await resendVerificationEmail(user.email);
      setResendMessage(response.message || "Verification email sent!");
    } catch (err) {
      setResendError(err instanceof Error ? err.message : "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      {user && !user.emailVerifiedAt && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900">Verify your email address</p>
                  <p className="text-sm text-amber-800">
                    We sent a 6-digit verification code to <span className="font-medium">{user.email}</span>. Enter the code to unlock all features.
                  </p>
                  {resendMessage && (
                    <p className="mt-2 text-sm text-amber-700 font-medium">
                      {resendMessage}
                    </p>
                  )}
                  {resendError && (
                    <p className="mt-2 text-sm text-red-600 font-medium">
                      {resendError}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="border-amber-600 text-amber-700 hover:bg-amber-100"
                  onClick={() => setShowVerifyDialog(true)}
                >
                  Verify Email
                </Button>
                <Button
                  variant="ghost"
                  className="text-amber-700 hover:bg-amber-100"
                  onClick={handleResendCode}
                  disabled={isResending || !user?.email}
                >
                  {isResending ? "Sending..." : "Resend Code"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-dark">KeepWatch</h1>
              <p className="text-sm text-neutral mt-1">Application Monitoring Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <Dialog open={showVerifyDialog} onOpenChange={handleDialogOpenChange}>
        <DialogContent onClose={() => handleDialogOpenChange(false)}>
          <form onSubmit={handleVerifyEmail}>
            <DialogHeader>
              <DialogTitle>Verify Your Email</DialogTitle>
              <DialogDescription>
                Enter the 6-digit code sent to {user?.email}. If you don&apos;t see the email, check your spam folder.
              </DialogDescription>
            </DialogHeader>

            <DialogBody>
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {successMessage}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="verificationCode" className="text-sm font-medium text-neutral">
                    Verification Code
                  </label>
                  <Input
                    id="verificationCode"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value)}
                    disabled={isVerifying || !!successMessage}
                    className="text-center text-lg tracking-widest"
                  />
                </div>

                <p className="text-xs text-neutral">
                  Your verification code expires after 15 minutes. If it&apos;s expired, request a new email.
                </p>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
                disabled={isVerifying}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand hover:bg-brand/90 text-white"
                disabled={isVerifying || !!successMessage}
              >
                {isVerifying ? "Verifying..." : "Verify Email"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// User Menu Dropdown Component
function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* User Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <div className="h-8 w-8 bg-brand rounded-full flex items-center justify-center">
          <UserIcon className="h-5 w-5 text-white" />
        </div>
        <ChevronDown className={`h-4 w-4 text-neutral transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-primary-dark">My Account</p>
          </div>

          <div className="py-1">
            <Link
              to="/account/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-4 w-4 text-neutral" />
              Account Settings
            </Link>

            <Link
              to="/account/billing"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <CreditCard className="h-4 w-4 text-neutral" />
              Billing Settings
            </Link>
          </div>

          <div className="border-t border-gray-200 pt-1">
            <Form method="post" action="/logout">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

