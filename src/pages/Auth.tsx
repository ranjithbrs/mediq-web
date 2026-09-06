import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

// Password schema following NIST/OWASP recommendations (8+ chars with complexity)
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  
  const isRecovery = searchParams.get("recovery") === "true";

  const { isDoctor, isHospital, loading: roleLoading } = useUserRole();

  // All useState calls must be declared before any conditional returns (Rules of Hooks)
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Recovery form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Password visibility state
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    if (!loading && !roleLoading && user && !isRecovery) {
      if (isHospital) {
        navigate("/hospital-dashboard", { replace: true });
      } else if (isDoctor) {
        navigate("/doctor-dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, loading, roleLoading, isDoctor, isHospital, isRecovery, navigate]);

  if (loading || (user && !isRecovery && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUnverifiedEmail(null);

    try {
      const validated = loginSchema.parse({ email: loginEmail, password: loginPassword });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        // Handle unconfirmed email error explicitly
        if (error.message.toLowerCase().includes("email not confirmed") || 
            error.message.toLowerCase().includes("confirmation required")) {
          setUnverifiedEmail(validated.email);
          toast({
            variant: "destructive",
            title: "Verification required",
            description: "Please verify your email before logging in.",
          });
        } else if (error.message.includes("Invalid login credentials")) {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: "Invalid email or password. Please try again.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: error.message,
          });
        }
        return;
      }

      // Safe double check if email is confirmed but session returned anyway
      if (data?.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        setUnverifiedEmail(validated.email);
        toast({
          variant: "destructive",
          title: "Verification required",
          description: "Please verify your email before logging in.",
        });
        return;
      }

      // Fetch user role to redirect correctly
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      const roles = roleData?.map((r: any) => r.role) || [];
      const isHospitalUser = roles.includes("hospital");
      const isDoc = roles.includes("doctor");

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      if (isHospitalUser) {
        navigate("/hospital-dashboard", { replace: true });
      } else if (isDoc) {
        navigate("/doctor-dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: error.errors[0].message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = signupSchema.parse({
        email: signupEmail,
        password: signupPassword,
        confirmPassword,
        fullName,
      });

      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: validated.fullName,
            role: 'patient',
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("user already registered") || error.message.toLowerCase().includes("already exists")) {
          toast({
            variant: "destructive",
            title: "Signup failed",
            description: "This email is already registered. Please login instead.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Signup failed",
            description: error.message,
          });
        }
        return;
      }

      toast({
        title: "Account Created",
        description: "Account created successfully! Please check your email and verify your account before logging in.",
      });
      
      setActiveTab("login");
      setLoginEmail(signupEmail);
      setSignupEmail("");
      setSignupPassword("");
      setConfirmPassword("");
      setFullName("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: error.errors[0].message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const emailValidation = z.string().email();
      emailValidation.parse(resetEmail);

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?recovery=true`,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Success",
        description: "Password reset link sent to your email!",
      });
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: "Please enter a valid email address",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passwordSchema.parse(newPassword);
      if (newPassword !== confirmNewPassword) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: "Passwords don't match",
        });
        return;
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: error.errors[0].message,
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated! You can now log in.",
      });
      
      // Clean up recovery query param and go to login tab
      navigate("/auth", { replace: true });
      setActiveTab("login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update your password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: unverifiedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      });

      if (error) throw error;

      toast({
        title: "Verification Email Sent",
        description: "A new verification link has been sent to your email address.",
      });
      setUnverifiedEmail(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to resend",
        description: error.message || "Could not resend verification email.",
      });
    } finally {
      setIsResending(false);
    }
  };

  // 1. PASSWORD RECOVERY FLOW RENDER
  if (isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Set New Password</CardTitle>
            <CardDescription>
              Enter a strong password for your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdatePassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-new-password"
                    type={showConfirmNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  >
                    {showConfirmNewPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // 2. FORGOT PASSWORD FLOW RENDER
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Button
              variant="ghost"
              size="sm"
              className="w-fit mb-2"
              onClick={() => setShowForgotPassword(false)}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleForgotPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // 3. LOGIN & SIGNUP RENDER
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">MediQ</h1>
          <p className="text-muted-foreground">Your healthcare companion</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" disabled={isLoading}>Login</TabsTrigger>
            <TabsTrigger value="signup" disabled={isLoading}>Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        disabled={isLoading}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm h-auto"
                    onClick={() => setShowForgotPassword(true)}
                    disabled={isLoading}
                  >
                    Forgot password?
                  </Button>

                  {unverifiedEmail && (
                    <div className="text-center p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm space-y-2 mt-2">
                      <p className="font-medium">Please verify your email before logging in.</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleResendVerification}
                        disabled={isResending}
                        className="w-full bg-background hover:bg-muted text-foreground"
                      >
                        {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Resend Verification Email
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Login
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Sign up to start booking appointments
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        disabled={isLoading}
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Up
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
