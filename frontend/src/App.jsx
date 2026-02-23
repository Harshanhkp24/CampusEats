import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import StudentHome from "./pages/student/Home";
import ShopItems from "./pages/student/ShopItems";
import Cart from "./pages/student/Cart";
import MyOrders from "./pages/student/MyOrders";
import OrderStatus from "./pages/student/OrderStatus";
import Payment from "./pages/student/Payment";
import PaymentConfirmation from "./pages/student/PaymentConfirmation";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageShops from "./pages/admin/ManageShops";
import VendorDashboard from "./pages/vendor/Dashboard";
import VendorOrders from "./pages/vendor/Orders";
import VendorManageItems from "./pages/vendor/ManageItems";
import VendorKitchenDisplay from "./pages/vendor/KitchenDisplay";

function App() {
  const { user } = useAuth();

  const isStudent = user?.role === "student";
  const isManager = user?.role === "vendor";
  const isChef = user?.role === "chef";
  const isAdmin = user?.role === "admin";

  const defaultPath = user
    ? isAdmin
      ? "/admin"
      : isChef
        ? "/chef/kitchen"
        : isManager
        ? "/vendor"
        : "/student/home"
    : "/login";

  const requireStudent = element =>
    isStudent ? element : <Navigate to="/login" replace />;

  const requireManager = element =>
    isManager ? element : <Navigate to="/login" replace />;

  const requireChef = element =>
    isChef ? element : <Navigate to="/login" replace />;

  const requireAdmin = element =>
    isAdmin ? element : <Navigate to="/login" replace />;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to={defaultPath} replace />}
        />

        <Route path="/student/home" element={requireStudent(<StudentHome />)} />
        <Route path="/shop/:shopId" element={requireStudent(<ShopItems />)} />
        <Route path="/student/cart" element={requireStudent(<Cart />)} />
        <Route path="/student/orders" element={requireStudent(<MyOrders />)} />
        <Route path="/student/order/:id" element={requireStudent(<OrderStatus />)} />
        <Route path="/student/payment" element={requireStudent(<Payment />)} />
        <Route
          path="/student/payment/confirmation/:orderId"
          element={requireStudent(<PaymentConfirmation />)}
        />

        <Route path="/vendor" element={requireManager(<VendorDashboard />)} />
        <Route path="/vendor/orders" element={requireManager(<VendorOrders />)} />
        <Route path="/vendor/items" element={requireManager(<VendorManageItems />)} />
        <Route
          path="/vendor/kitchen"
          element={isChef ? <Navigate to="/chef/kitchen" replace /> : <Navigate to="/vendor" replace />}
        />
        <Route path="/chef/kitchen" element={requireChef(<VendorKitchenDisplay />)} />

        <Route path="/admin" element={requireAdmin(<AdminDashboard />)} />
        <Route path="/admin/shops" element={requireAdmin(<ManageShops />)} />

        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
