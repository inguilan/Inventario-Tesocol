"use client";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sun, Zap, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      setError("Por favor ingresa usuario y contraseña");
      return;
    }
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle, rgba(245,98,15,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      <div
        className="animate-fadein"
        style={{
          width: "100%",
          maxWidth: 440,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 68,
              height: 68,
              background:
                "linear-gradient(135deg, var(--orange-dark), var(--orange))",
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
              boxShadow: "0 8px 32px rgba(245,98,15,0.35)",
            }}
          >
            <Sun size={34} color="white" strokeWidth={1.5} />
          </div>
          <h1
            className="font-bebas"
            style={{
              fontSize: 42,
              letterSpacing: 4,
              color: "var(--orange)",
              lineHeight: 1,
            }}
          >
            TESOCOL
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--text2)",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            Tecnología Solar de Colombia
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "32px 36px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Iniciar Sesión
            </h2>
            <p style={{ fontSize: 13, color: "var(--text2)" }}>
              Ingresa tus credenciales para acceder al sistema de inventarios
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  color: "var(--text2)",
                  marginBottom: 7,
                }}
              >
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: admin"
                autoComplete="username"
                style={{
                  width: "100%",
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--text)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  padding: "11px 14px",
                  transition: "all .2s",
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  color: "var(--text2)",
                  marginBottom: 7,
                }}
              >
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    background: "var(--bg3)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    color: "var(--text)",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    padding: "11px 44px 11px 14px",
                    transition: "all .2s",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text2)",
                    padding: 4,
                  }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "var(--red)",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading
                  ? "var(--orange-dark)"
                  : "var(--orange)",
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "13px 0",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all .2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: loading
                  ? "none"
                  : "0 4px 20px rgba(245,98,15,0.35)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Verificando...
                </>
              ) : (
                <>
                  <Zap size={18} /> Ingresar al Sistema
                </>
              )}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "var(--text3)",
            marginTop: 20,
          }}
        >
          © {new Date().getFullYear()} TESOCOL · Sistema de Gestión de Inventarios
        </p>
      </div>
    </div>
  );
}
