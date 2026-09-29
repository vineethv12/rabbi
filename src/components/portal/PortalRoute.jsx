import { Navigate } from "react-router-dom";

const SESSION_KEYS = [
  "rga_portal_token", "rga_portal_role",
  "rga_portal_login_id", "rga_portal_name", "rga_portal_center_id",
];

function decodeJwtPayload(token) {
  try {
    const b64 = token.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

function clearPortalSession() {
  SESSION_KEYS.forEach(k => sessionStorage.removeItem(k));
}

/**
 * Wraps a portal route with token + role + expiry checks.
 * Redirects to /portal/login if unauthenticated, expired, or wrong role.
 */
export function PortalRoute({ role, children }) {
  const token      = sessionStorage.getItem("rga_portal_token");
  const storedRole = sessionStorage.getItem("rga_portal_role");

  if (!token || !storedRole) {
    return <Navigate to="/portal/login" replace />;
  }

  const claims = decodeJwtPayload(token);
  if (!claims || !claims.exp || claims.exp < Math.floor(Date.now() / 1000)) {
    clearPortalSession();
    return <Navigate to="/portal/login" replace />;
  }

  if (role && storedRole !== role) {
    clearPortalSession();
    return <Navigate to="/portal/login" replace />;
  }

  return children;
}
