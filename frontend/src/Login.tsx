import { useGlobusAuth } from "@globus/react-auth-context";

export function Login() {
  if (import.meta.env.VITE_USE_GLOBUS === "true") {
      const { isAuthenticated, authorization } = useGlobusAuth();
      return isAuthenticated ? (
        <>
          <h1>Authenticated</h1>
          <button onClick={async () => await authorization?.revoke()}>
            logout
          </button>
        </>
      ) : (
        <>
          <h1>Logged out</h1>
          <button onClick={async () => await authorization?.login()}>login</button>
        </>
      );
  } else {
      return (<>
            <h1>Authentication Disabled</h1>
      </>);
  }

}
