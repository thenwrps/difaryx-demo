import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // hackathon mode: ไม่ต้อง parse token
    navigate("/demo/agent");
  }, []);

  return <div>Signing in...</div>;
}