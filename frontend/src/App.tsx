import { MantineProvider} from '@mantine/core';
import { theme } from "./theme";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { Routes, Route, BrowserRouter, useLocation } from "react-router-dom";
import {QuestionAuthoring} from "./Authoring";
import {QuestionReviewing} from "./Reviewing";
import {Contributions} from "./Contributions";

function NotFound() {
	let location = useLocation();
	console.log(location);
	return <h1>Not Found "{location.pathname}"</h1>;
}

export default function App() {
  console.log(import.meta.env.BASE_URL);

  //TODO actually get the userID from GitHub/Globus OAUTH
  return (
    <MantineProvider theme={theme}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
            <Route index element={<QuestionAuthoring />} />
            <Route path="/contributions" element={<Contributions />} />
            <Route path="/reviewing" element={<QuestionReviewing />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
    </MantineProvider>
  );
}





