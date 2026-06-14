import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { useUser, useClerk } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">
        {value}
      </span>
    </div>
  );
}

export default function MyAccount() {
  const { data: me, isLoading } = useGetCurrentUser();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <SidebarLayout>
      <div className="p-8 max-w-3xl mx-auto">
        <PageHeader
          tag="My Executive Office"
          title="My Account"
          subtitle="Your cockpit profile and access details. Account identity is managed through secure sign-in; role and access are set by an administrator."
        />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading account…</p>
        ) : (
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Profile</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Row label="Name" value={me?.displayName || "—"} />
                <Row label="Email" value={me?.email || "—"} />
                <Row
                  label="Role"
                  value={
                    <Badge
                      variant={me?.role === "admin" ? "default" : "secondary"}
                    >
                      {me?.role || "—"}
                    </Badge>
                  }
                />
                <Row
                  label="Status"
                  value={
                    <Badge variant={me?.active ? "default" : "outline"}>
                      {me?.active ? "Active" : "Inactive"}
                    </Badge>
                  }
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Session</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Row
                  label="Signed in as"
                  value={
                    user?.primaryEmailAddress?.emailAddress ||
                    user?.fullName ||
                    user?.username ||
                    "—"
                  }
                />
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => signOut({ redirectUrl: basePath || "/" })}
                    data-testid="button-account-logout"
                  >
                    <LogOut className="h-4 w-4 mr-1" /> Log out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
