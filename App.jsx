import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddItem from "./pages/AddItem";
import Requests from "./pages/Requests";
import Admin from "./pages/Admin";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-black min-h-screen text-white">
      <BrowserRouter>
        <Routes>

          {/* Public */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected — any logged-in user */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          <Route path="/add" element={
            <PrivateRoute>
              <AddItem />
            </PrivateRoute>
          } />

          <Route path="/requests" element={
            <PrivateRoute>
              <Requests />
            </PrivateRoute>
          } />

          {/* Admin only — non-admins are redirected to /dashboard */}
          <Route path="/admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;