import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AccessGrant {
  name: string;
  grantedAt: number;
  expiresAt: number;
}

export default function SecretPage() {
  const [grant, setGrant] = useState<AccessGrant | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("access_grant");
    if (!stored) {
      navigate("/access");
      return;
    }

    try {
      const grant = JSON.parse(stored) as AccessGrant;
      const now = Date.now();
      if (now >= grant.expiresAt) {
        localStorage.removeItem("access_grant");
        navigate("/access");
        return;
      }
      setGrant(grant);
      setLoading(false);

      // Auto-redirect after 5 seconds
      const timer = setTimeout(() => {
        setRedirecting(true);
        navigate("/");
      }, 5000);

      return () => clearTimeout(timer);
    } catch {
      navigate("/access");
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("access_grant");
    navigate("/access");
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-testid="secret-loading"
      >
        Loading...
      </div>
    );
  }

  if (!grant) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-testid="secret-page"
      >
        Not authorized
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background p-4"
      data-testid="secret-page"
    >
      <div className="bg-card p-8 rounded-xl shadow-card w-full max-w-md text-center">
        <div className="mb-6 text-center">
          <div
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            data-testid="secret-success-icon"
          >
            <span className="text-3xl">✓</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2" data-testid="secret-title">
          Access Granted
        </h1>
        <p className="text-muted-foreground mb-6" data-testid="secret-greeting">
          Welcome, {grant.name}!
        </p>

        {redirecting ? (
          <p
            className="text-sm text-primary font-medium mb-6"
            data-testid="secret-redirecting"
          >
            Redirecting to home page...
          </p>
        ) : (
          <p
            className="text-sm text-muted-foreground mb-6"
            data-testid="secret-redirect-message"
          >
            You will be redirected to home in 5 seconds
          </p>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => navigate("/")}
            variant="default"
            className="flex-1"
            data-testid="secret-go-home-button"
          >
            Go Home Now
          </Button>
          <Button
            onClick={logout}
            variant="outline"
            className="flex-1"
            data-testid="secret-logout-button"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
