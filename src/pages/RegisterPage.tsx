import { useState, type CSSProperties, type FormEvent } from "react";
import {
  registerWithPassword,
  type AuthUser,
} from "../lib/authApi";
import { useI18n } from "../lib/useI18n";

type RegisterPageProps = {
  onAuthenticated?: (user: AuthUser) => void;
};

export default function RegisterPage({ onAuthenticated }: RegisterPageProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async (event?: FormEvent) => {
    event?.preventDefault();

    if (!email || !password) {
      setErrorMessage(t("login.emailPasswordRequired"));
      return;
    }

    setIsLoading(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const result = await registerWithPassword(email, password);
      setStatusMessage(
        result.needsEmailConfirmation
          ? t("login.confirmationSent")
          : t("login.registerSuccess"),
      );

      if (result.user && !result.needsEmailConfirmation) {
        onAuthenticated?.(result.user);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("login.registerFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      <form style={styles.card} data-card onSubmit={handleRegister}>
        <div style={styles.logoWrapper}>
          <div style={styles.logoBox}>
            <img src="/app-icon.png" alt="" style={styles.logoImage} />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>{t("login.email")}</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="your@email.com"
            style={styles.input}
            autoComplete="email"
            onFocus={(event) => {
              (event.target as HTMLInputElement).style.borderColor = "#333333";
              (event.target as HTMLInputElement).style.boxShadow =
                "0 0 0 3px rgba(51,51,51,0.12)";
            }}
            onBlur={(event) => {
              (event.target as HTMLInputElement).style.borderColor = "#E5E7EB";
              (event.target as HTMLInputElement).style.boxShadow = "none";
            }}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>{t("login.password")}</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            style={styles.input}
            autoComplete="new-password"
            onFocus={(event) => {
              (event.target as HTMLInputElement).style.borderColor = "#333333";
              (event.target as HTMLInputElement).style.boxShadow =
                "0 0 0 3px rgba(51,51,51,0.12)";
            }}
            onBlur={(event) => {
              (event.target as HTMLInputElement).style.borderColor = "#E5E7EB";
              (event.target as HTMLInputElement).style.boxShadow = "none";
            }}
          />
        </div>

        {statusMessage ? (
          <p style={styles.statusMessage} role="status">
            {statusMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p style={styles.errorMessage} role="alert">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading || !email || !password}
          style={{
            ...styles.primaryButton,
            opacity: isLoading || !email || !password ? 0.6 : 1,
            cursor:
              isLoading || !email || !password ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(event) => {
            if (!isLoading && email && password) {
              (event.currentTarget as HTMLButtonElement).style.background =
                "#1F2933";
            }
          }}
          onMouseLeave={(event) => {
            (event.currentTarget as HTMLButtonElement).style.background =
              "#333333";
          }}
        >
          {isLoading ? t("login.loading") : t("login.register")}
        </button>
      </form>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        input::placeholder { color: #9AA1AA; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        div[data-card] {
          animation: fadeUp 0.5s ease forwards;
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#F7F8F9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    position: "relative",
    overflow: "hidden",
  },
  bgCircle1: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    top: -120,
    right: -100,
    pointerEvents: "none",
  },
  bgCircle2: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    bottom: -80,
    left: -80,
    pointerEvents: "none",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#FFFFFF",
    borderRadius: 20,
    padding: "44px 40px 40px",
    boxShadow: "0 18px 48px rgba(31,41,51,0.10)",
    border: "1px solid #E5E7EB",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    position: "relative",
    zIndex: 1,
    animation: "fadeUp 0.5s ease forwards",
  },
  logoWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 36,
    gap: 10,
  },
  logoBox: {
    width: 64,
    height: 64,
    background: "#F6F7F8",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 12px rgba(31,41,51,0.08)",
    border: "1px solid #E5E7EB",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6B7280",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
  },
  input: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    border: "1.5px solid #E5E7EB",
    padding: "0 16px",
    fontSize: 15,
    color: "#333333",
    background: "#FFFFFF",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
  },
  statusMessage: {
    margin: "-2px 0 14px",
    padding: "10px 12px",
    borderRadius: 10,
    background: "#F0F7F2",
    color: "#375A42",
    fontSize: 12,
    lineHeight: 1.6,
  },
  errorMessage: {
    margin: "-2px 0 14px",
    padding: "10px 12px",
    borderRadius: 10,
    background: "#FDF1F1",
    color: "#8A3A3A",
    fontSize: 12,
    lineHeight: 1.6,
  },
  primaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    border: "none",
    background: "#333333",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "inherit",
    letterSpacing: "0.03em",
    transition: "background 0.2s, opacity 0.2s",
    marginTop: 6,
    marginBottom: 0,
  },
};
