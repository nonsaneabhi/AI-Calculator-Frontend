import '@/index.css';
import Home from '@/views/home';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const paths = [
    {
        path: '/',
        element: (<Home />)
    }
];

const BrowserRouter = createBrowserRouter(paths);

const App = () => {
    return (
        <MantineProvider>
            <RouterProvider router={BrowserRouter} />
        </MantineProvider>
    );
};

export default App;