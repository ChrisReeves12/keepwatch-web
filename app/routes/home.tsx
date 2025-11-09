import type { Route } from "./+types/home";
import { getAuthToken } from "~/lib/auth.server";
import { fetchProjects, createProject, type Project, getCurrentUser, type User } from "~/lib/api";
import { useLoaderData, Link, useNavigate, useActionData, Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "~/components/ui/dialog";
import { Copy, Users, Key, Shield, Activity, BarChart3, Bell, CheckCircle, Plus } from "lucide-react";
import { DashboardHeader } from "~/components/DashboardHeader";
import moment from "moment";
import { useState, useEffect } from "react";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "KeepWatch - Application Monitoring & Telemetry" },
    { name: "description", content: "Monitor your systems with confidence" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = getAuthToken(request);

  // If not authenticated, return guest state
  if (!token) {
    return { authenticated: false as const };
  }

  // If authenticated, fetch projects
  try {
    const [user, { projects }] = await Promise.all([
      getCurrentUser(token),
      fetchProjects(token),
    ]);
    return {
      authenticated: true as const,
      projects,
      token,
      user,
    };
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return {
      authenticated: true as const,
      projects: [],
      token,
      user: null,
      error: error instanceof Error ? error.message : "Failed to load projects",
    };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const token = getAuthToken(request);

  if (!token) {
    return { error: "Unauthorized" };
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  try {
    const result = await createProject(token, { name, description });
    return { success: true, project: result.project };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create project",
    };
  }
}

export default function Home() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const initialUser = data.authenticated ? data.user : undefined;
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(initialUser);

  // Close dialog and refresh on success
  useEffect(() => {
    if (actionData?.success && showCreateDialog) {
      setShowCreateDialog(false);
      // Reload the page to get updated projects
      navigate(".", { replace: true });
    }
  }, [actionData, showCreateDialog, navigate]);

  if (!data.authenticated) {
    return <GuestLandingPage />;
  }

  return (
    <>
      <Dashboard
        user={currentUser ?? undefined}
        projects={data.projects}
        error={data.error}
        onCreateProject={() => setShowCreateDialog(true)}
        onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
      />
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        error={actionData?.error}
      />
    </>
  );
}

// Create Project Dialog Component
function CreateProjectDialog({
  open,
  onOpenChange,
  error
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <Form
          method="post"
          onSubmit={() => setIsSubmitting(true)}
        >
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to start monitoring your application.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="My Awesome App"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Describe what this project monitors..."
                  required
                  disabled={isSubmitting}
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-y text-black"
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
              className="bg-[#FFB30D] hover:bg-[#FFB30D]/90 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Dashboard Component for Authenticated Users
function Dashboard({
  user,
  projects,
  error,
  onCreateProject,
  onUserUpdate,
}: {
  user?: User;
  projects: Project[];
  error?: string;
  onCreateProject: () => void;
  onUserUpdate?: (user: User) => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} onEmailVerified={onUserUpdate} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral">Total Projects</p>
                    <p className="text-3xl font-bold text-primary-dark mt-1">{projects.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-brand/10 rounded-full flex items-center justify-center">
                    <Activity className="h-6 w-6 text-brand" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral">Active API Keys</p>
                    <p className="text-3xl font-bold text-primary-dark mt-1">
                      {projects.reduce((sum, p) => sum + p.apiKeys.length, 0)}
                    </p>
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
                    <p className="text-sm text-neutral">Team Members</p>
                    <p className="text-3xl font-bold text-primary-dark mt-1">
                      {projects.reduce((sum, p) => sum + p.users.length, 0)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-brand/10 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-brand" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Projects Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-semibold text-primary-dark">Your Projects</h2>
            <button
              onClick={onCreateProject}
              className="h-8 w-8 rounded-full bg-[#FFB30D] hover:bg-[#FFB30D]/90 text-white flex items-center justify-center transition-colors shadow-sm hover:shadow-md"
              title="Create new project"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {projects.length === 0 ? (
            <EmptyState onCreateProject={onCreateProject} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Empty State Component
function EmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="h-16 w-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
          <Activity className="h-8 w-8 text-brand" />
        </div>
        <h3 className="text-xl font-semibold text-primary-dark mb-2">Welcome to KeepWatch!</h3>
        <p className="text-neutral text-center mb-6 max-w-md">
          Create your first project to start monitoring your applications. Track uptime, collect logs,
          and get instant alerts when things go wrong.
        </p>
        <Button
          onClick={onCreateProject}
          className="bg-[#FFB30D] hover:bg-[#FFB30D]/90 text-white"
        >
          Create Your First Project
        </Button>
      </CardContent>
    </Card>
  );
}

// Project Card Component
function ProjectCard({ project }: { project: Project }) {
  const [copied, setCopied] = useState(false);

  const copyProjectId = () => {
    navigator.clipboard.writeText(project.projectId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find current user's role (this would ideally come from the loader with actual user info)
  const userRole = project.users[0]?.role || "member";

  return (
    <Card className="hover:shadow-lg transition-shadow border-brand/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-brand">{project.name}</CardTitle>
            <CardDescription className="mt-2">{project.description}</CardDescription>
          </div>
          {userRole === "admin" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#FFB30D]/10 text-[#FFB30D] text-xs font-medium rounded">
              <Shield className="h-3 w-3" />
              Admin
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project ID */}
        <div>
          <p className="text-xs text-neutral mb-1">Project ID</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-gray-100 px-2 py-1 rounded font-mono text-primary-dark">
              {project.projectId}
            </code>
            <button
              onClick={copyProjectId}
              className="text-brand hover:text-accent transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-neutral">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{project.users.length} member{project.users.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Key className="h-4 w-4" />
            <span>{project.apiKeys.length} key{project.apiKeys.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Created Date */}
        <div className="text-xs text-neutral">
          Created {moment(project.createdAt).fromNow()}
        </div>

        {/* Actions */}
        <div className="pt-2">
          <Link to={`/project/${project.projectId}`} className="block">
            <Button className="w-full bg-brand hover:bg-brand/90 text-white">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Guest Landing Page Component
function GuestLandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-primary-dark via-[#002865] to-brand">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-white">KeepWatch</div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-[#FFB30D] hover:bg-[#FFB30D]/90 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Monitor Your Systems
              <br />
              <span className="text-accent">With Confidence</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Real-time telemetry, uptime monitoring, and log management for modern applications.
              Stay ahead of issues before they impact your users.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-[#FFB30D] hover:bg-[#FFB30D]/90 text-white">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Activity className="h-8 w-8" />}
              title="Uptime Monitoring"
              description="Track availability and performance metrics across all your services"
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Application Telemetry"
              description="Deep insights into your application behavior and performance"
            />
            <FeatureCard
              icon={<Activity className="h-8 w-8" />}
              title="Log Management"
              description="Aggregate and analyze application and system logs in real-time"
            />
            <FeatureCard
              icon={<Bell className="h-8 w-8" />}
              title="Instant Alerts"
              description="Get notified immediately when things go wrong"
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of developers who trust KeepWatch to monitor their applications.
                No credit card required.
              </p>
              <Link to="/signup">
                <Button size="lg" className="bg-[#FFB30D] hover:bg-[#FFB30D]/90 text-white">
                  Create Your Free Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-white/60 text-sm">
            © 2025 KeepWatch. Built with ❤️ using React Router.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-colors">
      <CardContent className="pt-6">
        <div className="h-12 w-12 bg-[#FFB30D]/20 rounded-lg flex items-center justify-center mb-4 text-[#FFB30D]">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-white/70 text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
