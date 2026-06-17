import { NavLink } from "react-router-dom";
import { useLanguage } from "../../context/language";
import { useTheme } from "../../context/theme";
import tasvirMark from "../../assets/tasvir-mark.svg";
import "./Navbar.css";

function Navbar() {
  const { language, isTurkish, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <header className="topbar">
      <NavLink to="/" className="topbar-logo">
        <img src={tasvirMark} alt="" className="logo-mark" />
        <span className="logo-wordmark">
          <span className="logo-title">TASVIR</span>
          <span className="logo-divider">|</span>
          <span className="logo-sub">AI Studio</span>
        </span>
      </NavLink>

      <nav
        className="topbar-nav"
        aria-label={isTurkish ? "Ana navigasyon" : "Main navigation"}
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <i className="ti ti-layout-dashboard" aria-hidden="true" />
          {isTurkish ? "Ana Sayfa" : "Home"}
        </NavLink>
        <NavLink
          to="/content-package"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <i className="ti ti-sparkles" aria-hidden="true" />
          {isTurkish ? "Content Studio" : "Content Studio"}
        </NavLink>
        <NavLink
          to="/categories"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <i className="ti ti-photo" aria-hidden="true" />
          {isTurkish ? "Görsel Stüdyosu" : "Image Studio"}
        </NavLink>
      </nav>

      <div className="topbar-actions">
        <div
          className="theme-switch"
          aria-label={isTurkish ? "Arka plan teması" : "Background theme"}
        >
          <button
            className={theme === "light" ? "active" : ""}
            onClick={() => setTheme("light")}
            aria-label={isTurkish ? "Açık tema" : "Light theme"}
            title={isTurkish ? "Açık tema" : "Light theme"}
          >
            <i className="ti ti-sun" aria-hidden="true" />
          </button>
          <button
            className={theme === "dark" ? "active" : ""}
            onClick={() => setTheme("dark")}
            aria-label={isTurkish ? "Koyu tema" : "Dark theme"}
            title={isTurkish ? "Koyu tema" : "Dark theme"}
          >
            <i className="ti ti-moon" aria-hidden="true" />
          </button>
        </div>
        <div className="language-switch" aria-label="Language">
          <button
            className={language === "en" ? "active" : ""}
            onClick={() => setLanguage("en")}
          >
            EN
          </button>
          <button
            className={language === "tr" ? "active" : ""}
            onClick={() => setLanguage("tr")}
          >
            TR
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
