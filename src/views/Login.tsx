import { useEffect, useMemo, useState } from "react";
import type { Location } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Scissors } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { apiRequest, clearAuthToken, getAuthToken } from "@/services/api";
import {
  getMe,
  loginWithPassword,
  requestOtp,
  verifyOtp as verifyOtpApi,
  type AuthResponse,
} from "@/services/auth";
import tailorBg from "@/assets/tailor-bg.jpg";

function postLoginPath(state: unknown): string {
  const from = (state as { from?: Location } | null)?.from;
  if (from?.pathname && from.pathname !== "/login") {
    return `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`;
  }
  return "/";
}

export default function Login() {
  type Branch = { id: number; name: string; code: string };
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionBootstrap, setSessionBootstrap] = useState<
    "checking" | "ready"
  >(() =>
    typeof window !== "undefined" && getAuthToken() ? "checking" : "ready",
  );
  const [method, setMethod] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otp, setOtp] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  const isEmailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email],
  );
  const getErrorMessage = (err: unknown) =>
    typeof err === "object" && err !== null && "message" in err
      ? String((err as { message?: unknown }).message ?? "")
      : "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiRequest<Branch[]>("/api/branches", { auth: false });
        if (cancelled) return;
        setBranches(list);
        if (list.length > 0) {
          setSelectedBranchId((prev) => prev ?? list[0].id);
        }
      } catch {
        if (cancelled) return;
        setBranches([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (sessionBootstrap !== "checking") return;
    const token = getAuthToken();
    if (!token) {
      setSessionBootstrap("ready");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (!cancelled) {
          navigate(postLoginPath(location.state), { replace: true });
        }
      } catch {
        clearAuthToken();
        if (!cancelled) setSessionBootstrap("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionBootstrap, navigate, location.state]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const id = window.setInterval(() => {
      setOtpCooldown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [otpCooldown]);

  useEffect(() => {
    setPassword("");
    setShowPassword(false);
    setOtp("");
    setOtpStep("request");
    setOtpCooldown(0);
    setIsSubmitting(false);
  }, [method]);

  useEffect(() => {
    if (method !== "otp") return;
    setOtp("");
    setOtpStep("request");
    setOtpCooldown(0);
  }, [email, method]);

  const signInSuccess = (auth: AuthResponse) => {
    toast({
      title: "Signed in",
      description: auth.today_wishes.length > 0
        ? `Welcome back. ${auth.today_wishes.length} wish${auth.today_wishes.length > 1 ? "es" : ""} ready for today.`
        : "Welcome Back.",
    });
    const returnTo = postLoginPath(location.state);
    if (auth.today_wishes.length > 0) {
      navigate("/wishes", { replace: true, state: { returnTo } });
      return;
    }
    navigate(returnTo, { replace: true });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedBranchId) {
      toast({
        title: "Branch required",
        description: "Please select your branch.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const auth = await loginWithPassword(email.trim(), password, selectedBranchId, remember);
      signInSuccess(auth);
    } catch (err: unknown) {
      toast({
        title: "Login failed",
        description: getErrorMessage(err) || "Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendOtp = async () => {
    if (!isEmailValid) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    if (otpCooldown > 0) return;
    if (!selectedBranchId) {
      toast({
        title: "Branch required",
        description: "Please select your branch.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await requestOtp(email.trim(), selectedBranchId);
      setOtpStep("verify");
      setOtpCooldown(30);
      toast({
        title: "OTP sent",
        description: res.debug_otp
          ? `Enter OTP. Debug OTP: ${res.debug_otp}`
          : "Enter the 6-digit code sent to your email.",
      });
    } catch (err: unknown) {
      toast({
        title: "OTP failed",
        description: getErrorMessage(err) || "Unable to send OTP.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (!isEmailValid) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Enter the 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedBranchId) {
      toast({
        title: "Branch required",
        description: "Please select your branch.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const auth = await verifyOtpApi(email.trim(), otp, selectedBranchId, remember);
      signInSuccess(auth);
    } catch (err: unknown) {
      toast({
        title: "OTP verify failed",
        description: getErrorMessage(err) || "Invalid OTP.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendOtp();
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyOtp();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage: `url(${tailorBg})`,
          filter: "blur(2px)",
        }}
      />
      {/* Gradient overlay — left side dark, overall branded */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-slate-900/60" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/spoke-by-nishit-soni-logo.svg"
              alt="SPOKE"
              className="h-16 w-auto object-contain brightness-0 invert"
            />
          </div>
          <p className="text-white/70 text-sm tracking-widest uppercase">
            Professional Tailoring Management System
          </p>
          <div className="mt-3 h-px w-24 bg-white/30 mx-auto" />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Login</h2>

          {sessionBootstrap === "checking" ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm font-medium text-foreground">
                {"You're already signed in."}
              </p>
              <p className="text-sm text-muted-foreground">
                Taking you to the app…
              </p>
            </div>
          ) : null}

          {sessionBootstrap === "ready" ? (
            <Tabs
              value={method}
              onValueChange={(v) => setMethod(v as "password" | "otp")}
              className="w-full"
            >
              <TabsList className="w-full">
                <TabsTrigger value="password" className="flex-1">
                  Email & Password
                </TabsTrigger>
                <TabsTrigger value="otp" className="flex-1">
                  Email & OTP
                </TabsTrigger>
              </TabsList>

              <TabsContent value="password" className="mt-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="branch_id">Branch</Label>
                    <select
                      id="branch_id"
                      className="w-full h-10 rounded-md border border-input bg-muted/50 px-3 text-sm"
                      value={selectedBranchId ?? ""}
                      onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : null)}
                      required
                    >
                      <option value="" disabled>Select branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_password">Email</Label>
                    <Input
                      id="email_password"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="bg-muted/50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-muted/50 pr-10"
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={remember}
                      onCheckedChange={(v) => setRemember(v === true)}
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Remember
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-foreground text-background hover:bg-foreground/90 h-11 text-base"
                  >
                    {isSubmitting ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="otp" className="mt-6">
                <form
                  onSubmit={
                    otpStep === "request"
                      ? handleSendOtpSubmit
                      : handleVerifyOtpSubmit
                  }
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="branch_id_otp">Branch</Label>
                    <select
                      id="branch_id_otp"
                      className="w-full h-10 rounded-md border border-input bg-muted/50 px-3 text-sm"
                      value={selectedBranchId ?? ""}
                      onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : null)}
                      required
                    >
                      <option value="" disabled>Select branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp_email">Email</Label>
                    <Input
                      id="otp_email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="bg-muted/50"
                      required
                    />
                  </div>

                  {otpStep === "verify" && (
                    <div className="space-y-2">
                      <Label htmlFor="otp_code">OTP</Label>
                      <div className="flex items-center justify-between gap-3">
                        <InputOTP
                          id="otp_code"
                          maxLength={6}
                          value={otp}
                          onChange={setOtp}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {otpCooldown > 0
                          ? `Resend OTP in ${otpCooldown}s`
                          : "Didn’t receive the code? Resend OTP."}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember_otp"
                      checked={remember}
                      onCheckedChange={(v) => setRemember(v === true)}
                    />
                    <Label
                      htmlFor="remember_otp"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Remember
                    </Label>
                  </div>

                  {otpStep === "request" ? (
                    <Button
                      type="submit"
                      disabled={isSubmitting || !isEmailValid}
                      className="w-full bg-foreground text-background hover:bg-foreground/90 h-11 text-base"
                    >
                      {isSubmitting ? "Sending..." : "Send OTP"}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        type="submit"
                        disabled={isSubmitting || otp.length !== 6}
                        className="w-full bg-foreground text-background hover:bg-foreground/90 h-11 text-base"
                      >
                        {isSubmitting ? "Verifying..." : "Verify & Sign in"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting || otpCooldown > 0}
                        onClick={() => void sendOtp()}
                        className="w-full h-11 text-base"
                      >
                        {otpCooldown > 0
                          ? `Resend OTP (${otpCooldown}s)`
                          : "Resend OTP"}
                      </Button>
                    </div>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </div>
    </div>
  );
}
