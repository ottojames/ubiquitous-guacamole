import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PublishPage from "@/pages/PublishPage";
import Success from "./pages/Success";
import DetailsPage from "./pages/DetailsPage";

export default function App() {
  const path = window.location.pathname;
  switch (path) {
    case "/dashboard":
      return <Dashboard />;
    case "/publish":
      return <PublishPage />;
    case "/success":
      return <Success />;
    case "/details":
      return <DetailsPage />;
    default:
      return <Home />;
  }
}
