import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import logo from "../assets/logo.jpg";
import { logoutUser } from "../store/slices/authSlice";

const NAV_LINKS = [
  { label: "Predict", path: "/predict" },
  { label: "Reports", path: "/reports" },
  { label: "Diet Plan", path: null },
  { label: "Routine", path: null },
  { label: "Emergency", path: null },
];

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const loggedIn = !!token;

  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNavClick = (path) => {
    setMenuOpen(false);
    if (path) navigate(path);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    setUserMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      <style>{`
        .nav-link {
          position: relative;
          color: white;
          cursor: pointer;
          font-size: clamp(0.9rem, 1.5vw, 1.05rem);
          font-weight: 500;
          opacity: 0.92;
          transition: opacity 0.2s;
          white-space: nowrap;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 50%;
          right: 50%;
          height: 2px;
          background: white;
          transition: left 0.25s ease, right 0.25s ease;
        }
        .nav-link:hover::after {
          left: 0;
          right: 0;
        }
        .nav-link:hover {
          opacity: 1;
        }
        @media (max-width: 768px) {
          .desktop-links { display: none; }
          .mobile-menu { display: flex; }
        }
        @media (min-width: 769px) {
          .hamburger { display: none; }
          .mobile-menu { display: none; }
        }
      `}</style>

      <nav className="w-full bg-red-600 relative" style={{ fontFamily: "Roboto, sans-serif" }}>

        {/* ── Main bar ── */}
        <div className="flex items-center w-full px-4 sm:px-6 py-4">

          {/* Logo + Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer shrink-0"
            onClick={() => { navigate("/"); setMenuOpen(false); }}
          >
            <img src={logo} alt="HeartPredict logo" className="w-10 h-10 object-contain rounded" />
            <span className="text-white font-bold text-xl whitespace-nowrap">
              Heart Predict
            </span>
          </div>

          {/* Desktop Nav Links */}
          <ul className="desktop-links flex items-center justify-center gap-6 lg:gap-10 list-none m-0 p-0 flex-1 px-4">
            {NAV_LINKS.map((item) => (
              <li
                key={item.label}
                className="nav-link"
                onClick={() => handleNavClick(item.path)}
              >
                {item.label}
              </li>
            ))}
          </ul>

          {/* Right side: Login/Profile + Hamburger */}
          <div className="flex items-center gap-3 shrink-0 ml-auto relative">
            {loggedIn ? (
              <div className="relative">
                <div
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="w-10 h-10 rounded-full bg-red-200 border-2 border-white flex items-center justify-center cursor-pointer hover:bg-red-300 transition-colors"
                >
                  <span className="text-red-700 font-bold text-sm">
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </span>
                </div>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="rounded-full border-2 text-sm font-medium transition-colors px-4 sm:px-6 py-2 whitespace-nowrap"
                style={{ borderColor: "#FECACA", color: "#FECACA", background: "transparent" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#FECACA";
                  e.currentTarget.style.color = "#991B1B";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#FECACA";
                }}
              >
                Login
              </button>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="hamburger flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-md hover:bg-red-500 transition-colors"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <span className="block h-0.5 bg-white transition-all duration-300 origin-center"
                style={{ width: "22px", transform: menuOpen ? "translateY(8px) rotate(45deg)" : "none" }} />
              <span className="block h-0.5 bg-white transition-all duration-300"
                style={{ width: "22px", opacity: menuOpen ? 0 : 1 }} />
              <span className="block h-0.5 bg-white transition-all duration-300 origin-center"
                style={{ width: "22px", transform: menuOpen ? "translateY(-8px) rotate(-45deg)" : "none" }} />
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown ── */}
        <div
          className="mobile-menu flex-col bg-red-700 overflow-hidden transition-all duration-300"
          style={{ maxHeight: menuOpen ? "320px" : "0px", opacity: menuOpen ? 1 : 0 }}
        >
          <ul className="flex flex-col list-none m-0 p-0 px-6 py-3 gap-1">
            {NAV_LINKS.map((item) => (
              <li
                key={item.label}
                className="text-white font-medium py-3 border-b border-red-500 cursor-pointer hover:pl-2 transition-all duration-200 last:border-0"
                onClick={() => handleNavClick(item.path)}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>

      </nav>
    </>
  );
}