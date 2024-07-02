import { MantineProvider} from '@mantine/core';
import { theme } from "./theme";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { Routes, Route, BrowserRouter } from "react-router-dom";
import {QuestionAuthoring} from "./Authoring";
import {QuestionReviewing} from "./Reviewing";




export default function App() {

  //TODO actually get the userID from GitHub/Globus OAUTH
  return (
    <MantineProvider theme={theme}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
            <Route index element={<QuestionAuthoring />} />
            <Route path="reviewing" element={<QuestionReviewing />} />
        </Routes>
        </BrowserRouter>
    </MantineProvider>
  );
}





