import { useEffect, useRef } from "react";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import GreggToday from "@/pages/gregg-today";
import WelcomeCenter from "@/pages/welcome";
import Oversight from "@/pages/oversight";
import Expansion from "@/pages/expansion";
import Relationships from "@/pages/relationships";
import Reporting from "@/pages/reporting";
import Communications from "@/pages/communications";
import TravelPlanner from "@/pages/travel-planner";
import ExpensesPage from "@/pages/expenses";
import Training from "@/pages/training";
import PromptLibrary from "@/pages/prompt-library";
import Motivation from "@/pages/motivation";
import FeedbackCenter from "@/pages/feedback";
import BonusTracker from "@/pages/bonus-tracker";
import ProfitSharing from "@/pages/profit-sharing";
import PlacementNetwork from "@/pages/placement";
import SuccessPlan from "@/pages/success-plan";
import MyAccount from "@/pages/my-account";
import MyBenefits from "@/pages/my-benefits";
import ExecutiveProfile from "@/pages/executive-profile";
import Clients from "@/pages/clients";
import ClientDetail from "@/pages/client-detail";
import AuditRisk from "@/pages/audit-risk";
import Processor from "@/pages/processor";
import WeeklyReview from "@/pages/weekly-review";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

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
      subtitle: "Optional sign-in — the cockpit is open without an account",
    },
  },
  signUp: {
    start: {
      title: "Create an account",
      subtitle: "Optional — the cockpit is open without an account",
    },
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
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
            <Route path="/" component={GreggToday} />
            <Route path="/welcome" component={WelcomeCenter} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/oversight" component={Oversight} />
            <Route path="/expansion" component={Expansion} />
            <Route path="/relationships" component={Relationships} />
            <Route path="/reporting" component={Reporting} />
            <Route path="/communications" component={Communications} />
            <Route path="/travel" component={TravelPlanner} />
            <Route path="/expenses" component={ExpensesPage} />
            <Route path="/training" component={Training} />
            <Route path="/prompt-library" component={PromptLibrary} />
            <Route path="/motivation" component={Motivation} />
            <Route path="/feedback" component={FeedbackCenter} />
            <Route path="/placement" component={PlacementNetwork} />
            <Route path="/bonus-tracker" component={BonusTracker} />
            <Route path="/profit-sharing" component={ProfitSharing} />
            <Route path="/success-plan" component={SuccessPlan} />
            <Route path="/my-account" component={MyAccount} />
            <Route path="/my-benefits" component={MyBenefits} />
            <Route path="/executive-profile" component={ExecutiveProfile} />
            <Route path="/clients" component={Clients} />
            <Route path="/clients/:id" component={ClientDetail} />
            <Route path="/audit-risk" component={AuditRisk} />
            <Route path="/processor" component={Processor} />
            <Route path="/weekly-review" component={WeeklyReview} />
            <Route path="/admin" component={Admin} />
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
