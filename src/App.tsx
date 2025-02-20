import { RouterProvider } from "react-router-dom";
import { routes } from "./navigation/routes";

export const App = () => {
  return <RouterProvider router={routes} />;
};

export default App;
