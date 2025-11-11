import type { Route } from "./+types/projects.invite.$inviteId";
import { useEffect, useState } from "react";
import { useLoaderData, useNavigate, Form, redirect } from "react-router";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { verifyInvite, getInviteProjectDetails, getCurrentUser, respondToInvite, type Invite, type InviteProjectDetails } from "~/lib/api";
import { getAuthToken } from "~/lib/auth.server";
import { AlertCircle, CheckCircle, Mail, User, Building } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Accept Invitation - KeepWatch" },
    { name: "description", content: "Accept your project invitation" },
  ];
}

interface LoaderData {
  invite: Invite | null;
  projectDetails: InviteProjectDetails | null;
  error: string | null;
  isLoggedIn: boolean;
  currentUserEmail?: string;
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const inviteId = params.inviteId;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!inviteId || !token) {
    return {
      invite: null,
      projectDetails: null,
      error: "Invalid invitation link. Missing invite ID or token.",
      isLoggedIn: false,
    };
  }

  try {
    // Verify the invite
    const verifyResponse = await verifyInvite(inviteId, token);
    const invite = verifyResponse.invite;

    // Get project details
    const projectDetails = await getInviteProjectDetails(inviteId, token);

    // Check if user is logged in
    const authToken = getAuthToken(request);
    let isLoggedIn = false;
    let currentUserEmail: string | undefined;

    if (authToken) {
      try {
        const currentUser = await getCurrentUser(authToken);
        isLoggedIn = true;
        currentUserEmail = currentUser.email;
      } catch (error) {
        // User token is invalid or expired
        isLoggedIn = false;
      }
    }

    // Handle different scenarios
    if (invite.recipientUserId) {
      // User is a registered member
      if (!isLoggedIn) {
        // Redirect to login with invite params
        throw redirect(`/login?inviteId=${inviteId}&inviteToken=${token}`);
      }
    } else {
      // User is a guest (not registered)
      // Redirect to signup with invite params
      throw redirect(`/signup?inviteId=${inviteId}&inviteToken=${token}`);
    }

    return {
      invite,
      projectDetails,
      error: null,
      isLoggedIn,
      currentUserEmail,
    };
  } catch (error) {
    // Check if it's a redirect
    if (error instanceof Response && error.status >= 300 && error.status < 400) {
      throw error;
    }

    return {
      invite: null,
      projectDetails: null,
      error: error instanceof Error ? error.message : "Failed to load invitation",
      isLoggedIn: false,
    };
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const inviteId = params.inviteId;
  const url = new URL(request.url);
  const inviteToken = url.searchParams.get("token");
  const authToken = getAuthToken(request);

  if (!inviteId || !inviteToken) {
    return {
      error: "Invalid invitation parameters",
    };
  }

  if (!authToken) {
    return {
      error: "You must be logged in to respond to this invitation",
    };
  }

  const formData = await request.formData();
  const isAccepted = formData.get("isAccepted") === "true";

  try {
    const inviteResponse =  await respondToInvite(inviteId, inviteToken, authToken, isAccepted);

    if (isAccepted) {
      // Redirect to project page
      return redirect(`/project/${inviteResponse.projectId}`);
    } else {
      // Redirect to home if rejected
      return redirect("/");
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to respond to invitation",
    };
  }
}

export default function InviteAccept() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { invite, projectDetails, error, isLoggedIn, currentUserEmail } = loaderData as LoaderData;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark via-[#002865] to-brand p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/")} className="w-full">
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!invite || !projectDetails) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark via-[#002865] to-brand p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">KeepWatch</h1>
          <p className="text-white/80">Project Invitation</p>
        </div>

        <Card className="shadow-xl border-brand/20 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand" />
              You've Been Invited!
            </CardTitle>
            <CardDescription>
              You have been invited to join a project on KeepWatch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Information */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg text-brand mb-1">
                  {projectDetails.name}
                </h3>
                {projectDetails.description && (
                  <p className="text-neutral text-sm">{projectDetails.description}</p>
                )}
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-neutral" />
                  <span className="text-neutral">Project Owner:</span>
                  <span className="font-medium">{projectDetails.ownerName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-neutral" />
                  <span className="text-neutral">Owner Email:</span>
                  <span className="font-medium">{projectDetails.ownerEmail}</span>
                </div>
              </div>
            </div>

            {/* Invitation Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-neutral" />
                <span className="text-neutral">Invited as:</span>
                <span className="font-medium">{invite.recipientEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-neutral" />
                <span className="text-neutral">Role:</span>
                <span className="font-medium capitalize">{invite.recipientRole}</span>
              </div>
            </div>

            {currentUserEmail && currentUserEmail !== invite.recipientEmail && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You are currently logged in as{" "}
                  <span className="font-medium">{currentUserEmail}</span>, but this invitation
                  was sent to <span className="font-medium">{invite.recipientEmail}</span>.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-3">
            <Form method="post" className="flex-1">
              <input type="hidden" name="isAccepted" value="false" />
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={submitting}
              >
                Decline
              </Button>
            </Form>
            <Form method="post" className="flex-1">
              <input type="hidden" name="isAccepted" value="true" />
              <Button
                type="submit"
                className="w-full bg-[#FFB30D] hover:bg-[#FFB30D]/90 text-white"
                disabled={submitting}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Invitation
              </Button>
            </Form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
