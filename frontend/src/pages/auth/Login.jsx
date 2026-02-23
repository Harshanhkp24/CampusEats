import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight, FiClock, FiLock, FiMail, FiPhone, FiShoppingBag, FiUser } from "react-icons/fi";
import { loginUser, registerUser } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";

const ROLE_OPTIONS = [
  { id: "student", label: "Student", canRegister: true },
  { id: "vendor", label: "Manager", canRegister: true },
  { id: "chef", label: "Chef", canRegister: false },
  { id: "admin", label: "Admin", canRegister: false },
];

const highlights = [
  {
    title: "Skip the queue",
    description: "Place orders before break time and pick up when ready.",
    icon: FiClock,
  },
  {
    title: "Track each stage",
    description: "Watch your order from placed to completed in real-time.",
    icon: FiShoppingBag,
  },
];

const roleRedirectPath = role => {
  if (role === "admin") return "/admin";
  if (role === "chef") return "/chef/kitchen";
  if (role === "vendor") return "/vendor";
  return "/student/home";
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [activeRole, setActiveRole] = useState("student");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeRoleConfig = useMemo(
    () => ROLE_OPTIONS.find(role => role.id === activeRole),
    [activeRole],
  );

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleRoleChange = role => {
    setActiveRole(role);
    clearMessages();
  };

  const handleModeChange = nextMode => {
    setMode(nextMode);
    clearMessages();
  };

  const handleLogin = async e => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    clearMessages();

    try {
      const res = await loginUser({
        email,
        password,
        role: activeRole,
      });

      login(res.data);
      navigate(roleRedirectPath(res.data.user.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!activeRoleConfig?.canRegister) {
      setError("Chef/Admin accounts can only be created by manager or platform admin.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setIsSubmitting(true);
    clearMessages();

    try {
      await registerUser({
        name,
        email,
        phone,
        password,
        role: activeRole,
      });

      setMode("login");
      setPassword("");
      setConfirmPassword("");
      setSuccess(
        `${activeRoleConfig.label} account created successfully. Please log in.`,
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-24 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="absolute bottom-0 -right-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-5xl rounded-3xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-xl shadow-[0_20px_80px_rgba(2,6,23,0.6)] overflow-hidden"
        >
          <div className="grid md:grid-cols-2">
            <section className="relative p-6 sm:p-8 md:p-10 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.25),_transparent_45%),linear-gradient(140deg,#0f172a_0%,#111827_60%,#1e293b_100%)] border-b md:border-b-0 md:border-r border-slate-700/70">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-500/60 bg-slate-900/50 px-3 py-1 text-xs font-semibold tracking-wide text-slate-200">
                <span className="h-2 w-2 rounded-full bg-orange-400" />
                CAPUS EATS
              </p>

              <h1 className="mt-5 text-3xl sm:text-4xl font-semibold leading-tight">
                Login by role,
                <span className="block text-orange-400">manage faster.</span>
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-md">
                Students order food, chefs handle kitchen updates, managers supervise operations.
              </p>

              <div className="mt-8 space-y-3">
                {highlights.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.07, duration: 0.35 }}
                      className="rounded-xl border border-slate-600/60 bg-slate-900/45 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-lg bg-slate-800 p-2 text-orange-300">
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{item.title}</p>
                          <p className="text-sm text-slate-300 mt-1">{item.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            <section className="p-6 sm:p-8 md:p-10 bg-slate-100 text-slate-900">
              <h2 className="text-2xl sm:text-3xl font-semibold">Welcome</h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose role and {mode === "login" ? "login" : "register"} to continue
              </p>

              <div className="mt-5 rounded-xl bg-slate-200 p-1 grid grid-cols-4 gap-1">
                {ROLE_OPTIONS.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleChange(role.id)}
                    className={`rounded-lg px-2 py-2 text-center text-xs sm:text-sm font-medium transition ${
                      activeRole === role.id
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-slate-200 p-1 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => handleModeChange("login")}
                  className={`rounded-lg px-2 py-2 text-center text-xs sm:text-sm font-medium transition ${
                    mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("register")}
                  className={`rounded-lg px-2 py-2 text-center text-xs sm:text-sm font-medium transition ${
                    mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Register
                </button>
              </div>

              <form
                onSubmit={mode === "login" ? handleLogin : handleRegister}
                className="mt-6 space-y-4"
              >
                {mode === "register" && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Full Name</label>
                      <div className="mt-2 relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          value={name}
                          onChange={e => setName(e.target.value)}
                          type="text"
                          required
                          placeholder="Enter your full name"
                          className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-3 text-sm sm:text-base outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">Phone</label>
                      <div className="mt-2 relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          type="tel"
                          required
                          placeholder="Enter phone number"
                          className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-3 text-sm sm:text-base outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <div className="mt-2 relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="name@college.edu"
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-3 text-sm sm:text-base outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <div className="mt-2 relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="Enter password"
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-3 text-sm sm:text-base outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                </div>

                {mode === "register" && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                    <div className="mt-2 relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        type="password"
                        required
                        placeholder="Re-enter password"
                        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-3 text-sm sm:text-base outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                      />
                    </div>
                  </div>
                )}

                {!activeRoleConfig?.canRegister && mode === "register" && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    This role cannot self-register. Contact your manager/platform admin.
                  </p>
                )}

                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-white font-semibold transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting
                    ? mode === "login"
                      ? "Signing in..."
                      : "Creating account..."
                    : mode === "login"
                      ? `Login as ${activeRoleConfig?.label || "User"}`
                      : `Register as ${activeRoleConfig?.label || "User"}`}
                  {!isSubmitting && <FiArrowRight size={16} />}
                </button>
              </form>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
