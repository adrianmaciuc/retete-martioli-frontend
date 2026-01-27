import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

const ACCESS_SECRET = import.meta.env.VITE_ACCESS_SECRET as string | undefined;

function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  });
}

async function verifySecret(input: string): Promise<boolean> {
  if (!ACCESS_SECRET) return false;
  const inputHash = await sha256(input);
  const secretHash = await sha256(ACCESS_SECRET);
  return inputHash === secretHash;
}

export default function AccessPage() {
  const [name, setName] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!ACCESS_SECRET) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-testid="access-page"
      >
        <div className="bg-card p-6 rounded-xl shadow-card w-full max-w-md">
          <div className="flex gap-2 text-amber-600 mb-4">
            <AlertCircle className="w-5 h-5" />
            <p data-testid="access-not-configured">
              Access gate not configured
            </p>
          </div>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const valid = await verifySecret(secretKey);
      if (!valid) {
        setError("Wrong secret");
        setLoading(false);
        return;
      }

      const grantedAt = Date.now();
      const expiresAt = grantedAt + 24 * 60 * 60 * 1000; // 24 hours
      localStorage.setItem(
        "access_grant",
        JSON.stringify({ name, grantedAt, expiresAt })
      );
      navigate("/secret");
    } catch (err) {
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background p-4"
      data-testid="access-page"
    >
      <form
        onSubmit={submit}
        className="bg-card p-8 rounded-xl shadow-card w-full max-w-md"
        data-testid="access-form"
      >
        <h1 className="text-3xl font-bold mb-2" data-testid="access-title">
          Access Gate
        </h1>
        <p className="text-muted-foreground mb-6" data-testid="access-subtitle">
          Enter your name and secret key
        </p>

        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4"
            data-testid="access-error"
          >
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Name</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            data-testid="access-name-input"
            disabled={loading}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Secret Key</label>
          <Input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="Enter secret"
            data-testid="access-secret-input"
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          data-testid="access-submit-button"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify"}
        </Button>
      </form>
    </div>
  );
}
