import DatStepper from "./components/DatStepper";
import AdminPage from "./pages/AdminPage";

function App() {
  if (window.location.pathname === "/admin") {
    return <AdminPage />;
  }
  return <DatStepper />;
}

export default App;
