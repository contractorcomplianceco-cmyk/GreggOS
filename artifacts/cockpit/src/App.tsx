import { useEffect, useRef } from "react";
import { Switch, Route, Redirect, Link, useLocation, Router as WouterRouter } from "wouter";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import GreggToday from "@/pages/gregg-today";
import Oversight from "@/pages/oversight";
import WorkQueue from "@/pages/work-queue";
import Clients from "@/pages/clients";
import ClientDetail from "@/pages/client-detail";
import AuditRisk from "@/pages/audit-risk";
import Processor from "@/pages/processor";
import WeeklyReview from "@/pages/weekly-review";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import ccaLogo from "@assets/CCA_horizontal_logo_with_transparent_background_1780935000951.png";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#2563eb",
    colorForeground: "#0f1b2d",
    colorMutedForeground: "#64748b",
    colorDanger: "#dc2626",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorInputForeground: "#0f1b2d",
    colorNeutral: "#cbd5e1",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden border border-slate-200 shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-900",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButtonText: "text-slate-700",
    formFieldLabel: "text-slate-700",
    footerActionLink: "text-blue-600 hover:text-blue-700",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-400",
    identityPreviewEditButton: "text-blue-600",
    formFieldSuccessText: "text-emerald-600",
    alertText: "text-slate-700",
    logoBox: "h-10",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border-slate-200 hover:bg-slate-50",
    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
    formFieldInput: "border-slate-300 text-slate-900",
    footerAction: "text-slate-500",
    dividerLine: "bg-slate-200",
    alert: "border-slate-200",
    otpCodeFieldInput: "border-slate-300 text-slate-900",
    formFieldRow: "",
    main: "",
  },
};

const clerkLocalization = {
  signIn: {
    start: {
      title: "Current Client Cockpit",
      subtitle: "Sign in to access the cockpit",
    },
  },
  signUp: {
    start: {
      title: "Request access",
      subtitle: "Create your cockpit account",
    },
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function Landing() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0a1a2f] px-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 px-8 py-10 backdrop-blur">
        <img src={ccaLogo} alt="Contractor Compliance Authority" className="mx-auto h-12 w-auto" />
        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-blue-300/80">
          Current Client Cockpit
        </p>
        <h1 className="mt-3 text-xl font-semibold text-white">
          Internal operations workspace
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Triage priorities, process call notes, and run the weekly review for
          current-client relationships. Authorized staff only.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          data-testid="link-signin"
        >
          Sign In
        </Link>
        <p className="mt-6 text-[10px] leading-tight text-slate-400">
          This cockpit organizes relationship follow-through. It does not approve
          pricing, refunds, legal advice, compliance opinions, qualifier
          placements, or final client commitments.
        </p>
      </div>
    </div>
  );
}

function guarded(Component: React.ComponentType) {
  return function Guarded() {
    return (
      <>
        <Show when="signed-in">
          <Component />
        </Show>
        <Show when="signed-out">
          <Redirect to="/" />
        </Show>
      </>
    );
  };
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <GreggToday />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={clerkLocalization}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/oversight" component={guarded(Oversight)} />
            <Route path="/work-queue" component={guarded(WorkQueue)} />
            <Route path="/clients" component={guarded(Clients)} />
            <Route path="/clients/:id" component={guarded(ClientDetail)} />
            <Route path="/audit-risk" component={guarded(AuditRisk)} />
            <Route path="/processor" component={guarded(Processor)} />
            <Route path="/weekly-review" component={guarded(WeeklyReview)} />
            <Route path="/admin" component={guarded(Admin)} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
