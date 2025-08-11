import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Publish from "./pages/Publish";

export default function App() {
  const path = window.location.pathname;
  switch (path) {
    case "/dashboard":
      return <Dashboard />;
    case "/publish":
      return <Publish />;
    default:
      return <Home />;
  }
}
