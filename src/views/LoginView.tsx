import { useState, FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";
import { S } from "../styles/appStyles";

export default function LoginView() {
  const { login } = useAuth();
  const { showToast } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    if (success) {
      showToast("Login successful");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div style={S.loginContainer}>
      <div style={S.loginCard}>
        <h1 style={S.loginTitle}>TableOrders</h1>
        <p style={S.loginSubtitle}>Restaurant Order Management</p>

        <form onSubmit={handleSubmit} style={S.loginForm}>
          <div>
            <label style={S.loginLabel}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={S.loginInput}
              autoFocus
              required
            />
          </div>

          <div>
            <label style={S.loginLabel}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={S.loginInput}
              required
            />
          </div>

          {error && <div style={S.loginError}>{error}</div>}

          <button type="submit" style={S.loginButton} disabled={loading}>
            {loading ? "Logging in…" : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
