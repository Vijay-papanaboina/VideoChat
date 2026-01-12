import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:8000"
          }/api/auth/verify-email/${token}`
        );
        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to verify email. Please try again.");
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus("error");
      setMessage("Invalid verification link");
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>Verify your email address</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <p className="text-foreground font-medium">{message}</p>
              <Button onClick={() => navigate("/login")} className="w-full">
                Continue to Login
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="w-16 h-16 text-red-500" />
              <p className="text-red-500 font-medium">{message}</p>
              <div className="space-y-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  Go to Login
                </Button>
                <p className="text-sm text-muted-foreground">
                  Need a new link?{" "}
                  <Link
                    to="/login"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Try logging in
                  </Link>{" "}
                  to receive a new verification email.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
