
import { Routes, Route } from "react-router-dom";
import ResetPassword from "./ResetPassword";
import AuthPages from "@/pages/AuthPages";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPages />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}

export default App;
