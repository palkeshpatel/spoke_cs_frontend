import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scissors } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { loginWithPassword, requestOtp, verifyOtp } from "@/services/auth";
import tailorBg from "@/assets/tailor-bg.jpg";

export default function Login() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otp, setOtp] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const getErrorMessage = (err: unknown) =>
    typeof err === "object" && err !== null && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const id = window.setInterval(() => {
      setOtpCooldown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [otpCooldown]);

  useEffect(() => {
    setPassword("");
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

  const signInSuccess = () => {
    toast({
      title: "Signed in",
      description: "Welcome back.",
    });
    navigate("/");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (!password.trim()) {
      toast({ title: "Password required", description: "Please enter your password.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      await loginWithPassword(email.trim(), password, remember);
      signInSuccess();
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
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (otpCooldown > 0) return;

    try {
      setIsSubmitting(true);
      const res = await requestOtp(email.trim());
      setOtpStep("verify");
      setOtpCooldown(30);
      toast({
        title: "OTP sent",
        description: res.debug_otp ? `Enter OTP. Debug OTP: ${res.debug_otp}` : "Enter the 6-digit code sent to your email.",
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

  const verifyOtpCode = async () => {
    if (!isEmailValid) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (otp.length !== 6) {
      toast({ title: "Invalid OTP", description: "Enter the 6-digit OTP.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      await verifyOtp(email.trim(), otp, remember);
      signInSuccess();
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
    await verifyOtpCode();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${tailorBg})` }}
      />
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scissors className="h-8 w-8 text-white" />
            <h1 className="text-4xl font-bold text-white tracking-widest">SPOKE</h1>
          </div>
          <p className="text-white/80 text-sm">Professional Tailoring Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Login</h2>

          <Tabs value={method} onValueChange={(v) => setMethod(v as "password" | "otp")} className="w-full">
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
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
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-muted/50"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
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
              <form onSubmit={otpStep === "request" ? handleSendOtpSubmit : handleVerifyOtpSubmit} className="space-y-5">
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
                      <InputOTP id="otp_code" maxLength={6} value={otp} onChange={setOtp}>
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
                      {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : "Didn’t receive the code? Resend OTP."}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox id="remember_otp" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                  <Label htmlFor="remember_otp" className="text-sm font-normal cursor-pointer">
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
                      {otpCooldown > 0 ? `Resend OTP (${otpCooldown}s)` : "Resend OTP"}
                    </Button>
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
