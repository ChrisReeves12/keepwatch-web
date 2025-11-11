import type { Route } from "./+types/account.billing";
import {
  getCurrentUser,
  fetchUsageQuota,
  fetchUserSubscription,
  fetchProjects,
  type User,
  type UsageQuotaResponse,
  type UserSubscriptionResponse
} from "~/lib/api";
import { useLoaderData } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { DashboardHeader } from "~/components/DashboardHeader";
import { CreditCard, TrendingUp, Calendar, AlertCircle, CheckCircle, FolderOpen } from "lucide-react";
import { useState } from "react";
import { redirect } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Billing & Usage - KeepWatch" },
    { name: "description", content: "View your subscription plan and usage statistics" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import("~/lib/auth.server");
  const token = requireAuth(request);

  try {
    const [user, usageQuota, subscription, projectsResponse] = await Promise.all([
      getCurrentUser(token),
      fetchUsageQuota(token),
      fetchUserSubscription(token),
      fetchProjects(token)
    ]);

    return { user, usageQuota, subscription, projects: projectsResponse.projects, token };
  } catch (error) {
    console.error("Failed to fetch billing data:", error);
    throw redirect("/login");
  }
}

type TabType = "usage" | "billing";

export default function BillingAndUsage() {
  const { user, usageQuota, subscription, projects } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<TabType>("usage");

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-dark">Billing & Usage</h1>
          <p className="text-neutral mt-2">Manage your subscription and monitor usage</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab("usage")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "usage"
                  ? "border-brand text-brand"
                  : "border-transparent text-neutral hover:text-primary-dark hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Usage
              </div>
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "billing"
                  ? "border-brand text-brand"
                  : "border-transparent text-neutral hover:text-primary-dark hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Billing
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "usage" && (
          <UsageTab usageQuota={usageQuota} subscription={subscription} projectCount={projects.length} />
        )}

        {activeTab === "billing" && (
          <BillingTab subscription={subscription} />
        )}
      </main>
    </div>
  );
}

function UsageTab({ usageQuota, subscription, projectCount }: { usageQuota: UsageQuotaResponse; subscription: UserSubscriptionResponse; projectCount: number }) {
  const { logUsage, billingPeriod } = usageQuota;
  const planName = subscription.subscriptionPlanEnrollment?.subscriptionPlanDetails.name || "Free Plan";

  // Safely handle potentially null values for log usage
  const current = logUsage?.current ?? 0;
  const limit = logUsage?.limit ?? 0;
  const remaining = logUsage?.remaining ?? 0;
  const percentUsed = logUsage?.percentUsed ?? 0;
  const isUnlimited = logUsage?.isUnlimited ?? false;

  // Project limit from subscription plan (null means unlimited)
  const projectLimit = subscription.subscriptionPlanEnrollment?.subscriptionPlanDetails.projectLimit ?? null;
  const isProjectsUnlimited = projectLimit === null;
  const projectsRemaining = isProjectsUnlimited ? null : Math.max(0, projectLimit - projectCount);
  const projectPercentUsed = isProjectsUnlimited ? 0 : (projectCount / projectLimit) * 100;

  // Calculate days elapsed in billing period
  const startDate = new Date(billingPeriod.start);
  const endDate = new Date(billingPeriod.end);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = billingPeriod?.daysRemaining ?? 0;
  const daysElapsed = totalDays - daysRemaining;

  // Format numbers with commas
  const formatNumber = (num: number | null | undefined) => {
    return (num ?? 0).toLocaleString();
  };

  // Get progress bar color based on usage percentage
  const getUsageColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 75) return "bg-amber-500";
    return "bg-brand";
  };

  const getUsageStatus = (percent: number) => {
    if (percent >= 90) return { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
    if (percent >= 75) return { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    return { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" };
  };

  const usageStatus = getUsageStatus(percentUsed);
  const StatusIcon = usageStatus.icon;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand" />
            <CardTitle>Current Plan</CardTitle>
          </div>
          <CardDescription>Your active subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-primary-dark">{planName}</h3>
              {subscription.subscriptionPlanEnrollment && (
                <p className="text-neutral mt-1">
                  ${subscription.subscriptionPlanEnrollment.price.toFixed(2)}/{subscription.subscriptionPlanEnrollment.subscriptionPlanDetails.billingInterval}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral">Billing Period</p>
              <p className="text-sm font-medium text-primary-dark">
                {new Date(billingPeriod.start).toLocaleDateString()} - {new Date(billingPeriod.end).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand" />
            <CardTitle>Log Usage</CardTitle>
          </div>
          <CardDescription>Your logging usage for the current billing period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Usage Status Alert */}
            <div className={`flex items-start gap-3 p-4 ${usageStatus.bg} border ${usageStatus.border} rounded-md`}>
              <StatusIcon className={`h-5 w-5 ${usageStatus.color} mt-0.5 shrink-0`} />
              <div className="flex-1">
                <p className={`text-sm font-semibold ${usageStatus.color}`}>
                  {percentUsed >= 90
                    ? "Critical: Approaching Usage Limit"
                    : percentUsed >= 75
                    ? "Warning: High Usage"
                    : "Healthy Usage"}
                </p>
                <p className={`text-sm ${usageStatus.color} mt-1`}>
                  {percentUsed >= 90
                    ? `You've used ${percentUsed.toFixed(1)}% of your log quota. Consider upgrading your plan.`
                    : percentUsed >= 75
                    ? `You've used ${percentUsed.toFixed(1)}% of your log quota. Monitor your usage carefully.`
                    : `You have ${formatNumber(remaining)} logs remaining in your current billing period.`}
                </p>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-neutral mb-1">Current Usage</p>
                <p className="text-3xl font-bold text-primary-dark">{formatNumber(current)}</p>
                <p className="text-sm text-neutral mt-1">logs</p>
              </div>
              <div>
                <p className="text-sm text-neutral mb-1">Plan Limit</p>
                <p className="text-3xl font-bold text-primary-dark">
                  {isUnlimited ? "Unlimited" : formatNumber(limit)}
                </p>
                <p className="text-sm text-neutral mt-1">logs</p>
              </div>
              <div>
                <p className="text-sm text-neutral mb-1">Remaining</p>
                <p className="text-3xl font-bold text-primary-dark">
                  {isUnlimited ? "∞" : formatNumber(remaining)}
                </p>
                <p className="text-sm text-neutral mt-1">logs</p>
              </div>
            </div>

            {/* Progress Bar */}
            {!isUnlimited && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral">Usage Progress</span>
                  <span className="text-sm font-semibold text-primary-dark">{percentUsed.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getUsageColor(percentUsed)}`}
                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Usage Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-brand" />
            <CardTitle>Project Usage</CardTitle>
          </div>
          <CardDescription>Number of projects in your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Project Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-neutral mb-1">Current Projects</p>
                <p className="text-3xl font-bold text-primary-dark">{formatNumber(projectCount)}</p>
                <p className="text-sm text-neutral mt-1">projects</p>
              </div>
              <div>
                <p className="text-sm text-neutral mb-1">Plan Limit</p>
                <p className="text-3xl font-bold text-primary-dark">
                  {isProjectsUnlimited ? "Unlimited" : formatNumber(projectLimit)}
                </p>
                <p className="text-sm text-neutral mt-1">projects</p>
              </div>
              <div>
                <p className="text-sm text-neutral mb-1">Remaining</p>
                <p className="text-3xl font-bold text-primary-dark">
                  {isProjectsUnlimited ? "∞" : formatNumber(projectsRemaining)}
                </p>
                <p className="text-sm text-neutral mt-1">projects</p>
              </div>
            </div>

            {/* Progress Bar */}
            {!isProjectsUnlimited && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral">Usage Progress</span>
                  <span className="text-sm font-semibold text-primary-dark">{projectPercentUsed.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getUsageColor(projectPercentUsed)}`}
                    style={{ width: `${Math.min(projectPercentUsed, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Period Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand" />
            <CardTitle>Billing Period</CardTitle>
          </div>
          <CardDescription>Current billing cycle information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-neutral mb-1">Period Start</p>
              <p className="text-lg font-semibold text-primary-dark">
                {new Date(billingPeriod.start).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral mb-1">Period End</p>
              <p className="text-lg font-semibold text-primary-dark">
                {new Date(billingPeriod.end).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral mb-1">Days Elapsed</p>
              <p className="text-lg font-semibold text-primary-dark">{daysElapsed} days</p>
            </div>
            <div>
              <p className="text-sm text-neutral mb-1">Days Remaining</p>
              <p className="text-lg font-semibold text-primary-dark">{daysRemaining} days</p>
            </div>
          </div>

          {/* Billing Period Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral">Period Progress</span>
              <span className="text-sm font-semibold text-primary-dark">
                {((daysElapsed / totalDays) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-brand transition-all duration-500"
                style={{ width: `${(daysElapsed / totalDays) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BillingTab({ subscription }: { subscription: UserSubscriptionResponse }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand" />
            <CardTitle>Billing Information</CardTitle>
          </div>
          <CardDescription>Manage your payment methods and billing details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-neutral">Billing management coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
