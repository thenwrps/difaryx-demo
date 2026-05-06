import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type GoogleUserInfo = {
  email: string;
  name: string;
  picture?: string;
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [status, setStatus] = useState("Signing in with Google...");

  useEffect(() => {
    const run = async () => {
      try {
        console.log("[AuthCallback] Starting OAuth callback processing");
        console.log("[AuthCallback] Full URL:", window.location.href);
        console.log("[AuthCallback] Hash:", window.location.hash);
        
        // Parse hash parameters
        const hash = window.location.hash.substring(1); // Remove the # character
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const error = params.get("error");

        console.log("[AuthCallback] Access token found:", !!accessToken);
        console.log("[AuthCallback] Error param:", error);

        if (error) {
          throw new Error(`Google OAuth error: ${error}`);
        }

        if (!accessToken) {
          console.error("[AuthCallback] No access token in URL hash");
          throw new Error("Missing Google access token");
        }

        console.log("[AuthCallback] Fetching user profile from Google");
        console.log("[AuthCallback] Access token (first 20 chars):", accessToken.substring(0, 20) + "...");
        
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        console.log("[AuthCallback] Google API response status:", res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error("[AuthCallback] Google API error:", errorText);
          throw new Error(`Failed to fetch Google user profile: ${res.status}`);
        }

        const user = (await res.json()) as GoogleUserInfo;
        
        console.log("[AuthCallback] User profile received:", {
          email: user.email,
          name: user.name,
          hasPicture: !!user.picture
        });

        // Use AuthContext signIn method with proper profile structure
        signIn({
          name: user.name || user.email.split("@")[0],
          email: user.email,
          organization: "DIFARYX Lab",
        });

        console.log("[AuthCallback] User signed in successfully");
        
        // Get the intended destination from sessionStorage, default to /dashboard
        const redirectTo = sessionStorage.getItem("auth_redirect_to") || "/dashboard";
        sessionStorage.removeItem("auth_redirect_to");
        
        console.log("[AuthCallback] Redirecting to:", redirectTo);
        
        setStatus("Success! Redirecting...");
        
        // Small delay to show success message
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 500);
      } catch (error) {
        console.error("[AuthCallback] Error:", error);
        console.error("[AuthCallback] Error details:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        setStatus("Authentication failed. Redirecting to sign in...");
        setTimeout(() => {
          navigate("/signin", { replace: true });
        }, 2000);
      }
    };

    run();
  }, [navigate, signIn]);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xl px-8 py-6 text-center">
        <div className="mb-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
        </div>
        <p className="text-sm text-slate-600">{status}</p>
      </div>
    </main>
  );
}