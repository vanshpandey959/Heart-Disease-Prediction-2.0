import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { HiOutlineHeart } from "react-icons/hi2";
import { loginUser } from "../store/slices/authSlice";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <HiOutlineHeart className="text-red-600 text-4xl mb-2" />
          <h1
            className="text-3xl font-black text-red-600"
            style={{ fontFamily: "Archivo Black, sans-serif" }}
          >
            Welcome Back
          </h1>
          <p
            className="text-gray-500 text-sm mt-1"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            Log in to view your saved reports
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-red-100 rounded-xl p-6 space-y-4"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none text-gray-800"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none text-gray-800"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 rounded-full font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Logging in..." : "Login"}
          </button>
        </form>

        <p
          className="text-center text-sm text-gray-500 mt-6"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          Don't have an account?{" "}
          <Link to="/register" className="text-red-600 font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}