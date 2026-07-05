import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { useUser, useClerk } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { LogOut, Radar, Volume2, VolumeX, PartyPopper } from "lucide-react";
import { LoadingState } from "@/components/layout/FishingSpinner";
import { useEffect, useState } from "react";
import {
  isSonarEnabled,
  setSonarEnabled,
  playSonarPing,
  playCelebrationChime,
  primeAudio,
  getSonarVolume,
  setSonarVolume,
} from "@/lib/sonar";

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

  const [sonarOn, setSonarOn] = useState(true);
  const [volume, setVolume] = useState(0.7);
  useEffect(() => {
    setSonarOn(isSonarEnabled());
    setVolume(getSonarVolume());
    primeAudio();
  }, []);
  const toggleSonar = (on: boolean) => {
    setSonarOn(on);
    setSonarEnabled(on);
    if (on) playSonarPing("info"); // instant confirmation ping
  };
  const onVolumeChange = (vals: number[]) => {
    const v = (vals[0] ?? 70) / 100;
    setVolume(v);
    setSonarVolume(v);
  };
  // play a preview ping when the user releases the slider
  const onVolumeCommit = () => {
    if (sonarOn) playSonarPing("alert");
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-3xl mx-auto">
        <PageHeader
          tag="Captain's Quarters"
          title="My Account"
          subtitle="Your cockpit profile and access details. Account identity is managed through secure sign-in; role and access are set by an administrator."
        />

        {isLoading ? (
          <LoadingState message="Reeling in your account…" />
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
                <CardTitle className="text-base">Cockpit Preferences</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-start justify-between gap-4 py-2.5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4e9c8] text-[#8a6a1a]">
                      <Radar className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Sonar alert ping</p>
                      <p className="text-sm text-muted-foreground">
                        Play a subtle sonar ping when an alert card slides in on The Logbook,
                        The Net, Today's Catch, and Storm Watch.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={sonarOn}
                    onCheckedChange={toggleSonar}
                    aria-label="Toggle sonar alert ping"
                    data-testid="switch-sonar"
                  />
                </div>
                {sonarOn && (
                  <>
                    {/* Volume */}
                    <div className="flex items-center gap-3 border-t border-border/60 pt-4">
                      {volume === 0 ? (
                        <VolumeX className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <Volume2 className="h-4 w-4 shrink-0 text-[#8a6a1a]" />
                      )}
                      <Slider
                        value={[Math.round(volume * 100)]}
                        onValueChange={onVolumeChange}
                        onValueCommit={onVolumeCommit}
                        min={0}
                        max={100}
                        step={5}
                        className="flex-1"
                        aria-label="Sonar volume"
                        data-testid="slider-sonar-volume"
                      />
                      <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-muted-foreground">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>

                    {/* Preview buttons */}
                    <div className="flex flex-wrap gap-2 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playSonarPing("alert")}
                        data-testid="button-test-sonar"
                      >
                        <Radar className="mr-1 h-4 w-4" /> Alert ping
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playCelebrationChime()}
                        data-testid="button-test-chime"
                      >
                        <PartyPopper className="mr-1 h-4 w-4" /> Celebration chime
                      </Button>
                    </div>
                  </>
                )}
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
