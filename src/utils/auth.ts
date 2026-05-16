export async function login(username: string, password: string) {
  if (typeof window === "undefined") return null;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matricula: username, senha: password }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userType", data.user.tipo);
      localStorage.setItem("userId", data.user.id.toString());
      localStorage.setItem("userName", data.user.nome);
      return data.user.tipo;
    }
  } catch (error) {
    console.error("Erro ao fazer login:", error);
  }

  return null;
}

export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("isAuthenticated") === "true";
}

export function getUserType() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userType");
}

export function getUserId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userId") || localStorage.getItem("userType");
}

export function getUserName() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userName");
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
  }
}
