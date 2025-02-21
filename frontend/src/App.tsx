import { useEffect } from "react";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { Routes, Route, BrowserRouter, useLocation } from "react-router-dom";
import { QuestionAuthoring } from "./Authoring";
import { QuestionReviewing } from "./Reviewing";
import { Contributions } from "./Contributions";
import { LabStyle } from "./LabStyle";
import { Login } from "./Login";
import {
  Provider as GlobusAuthProvider,
  useGlobusAuth,
} from "@globus/react-auth-context";

function NotFound() {
  let location = useLocation();
  console.log(location);
  return <h1>Not Found "{location.pathname}"</h1>;
}

const GLOBUS_AUTH_CLIENT_ID = "58fdd3bc-e1c3-4ce5-80ea-8d6b87cfb944";
const GLOBUS_AUTH_REDIRECT =
  "http://" +
  window.location.hostname +
  (window.location.port !== "" ? ":" + window.location.port : "") +
  import.meta.env.BASE_URL;
const GLOBUS_GATEWAY_CLIENT_ID = "681c10cc-f684-4540-bcd7-0b4df3bc26ef";
const GLOBUS_AUTH_SCOPES = `https://auth.globus.org/scopes/${GLOBUS_GATEWAY_CLIENT_ID}/action_all`;

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <GlobusAuthProvider
        client={GLOBUS_AUTH_CLIENT_ID}
        scopes={GLOBUS_AUTH_SCOPES}
        redirect={GLOBUS_AUTH_REDIRECT}
      >
        <Router />
      </GlobusAuthProvider>
    </MantineProvider>
  );
}

function Router() {
  const { isAuthenticated, authorization } = useGlobusAuth();
  useEffect(() => {
    async function attempt() {
      if (!authorization || isAuthenticated) {
        return;
      }
      await authorization?.handleCodeRedirect({
        shouldReplace: false,
      });
    }
    attempt();
  }, [authorization, authorization?.handleCodeRedirect, isAuthenticated]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route index element={<QuestionAuthoring />} />
        <Route path="/labstyle" element={<LabStyle />} />
        <Route path="/contributions" element={<Contributions />} />
        <Route path="/reviewing" element={<QuestionReviewing />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
