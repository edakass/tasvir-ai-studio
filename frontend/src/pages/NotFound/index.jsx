import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/language";
import "./NotFound.css";

function NotFound() {
  const navigate = useNavigate();
  const { isTurkish } = useLanguage();

  const copy = isTurkish
    ? {
        eyebrow: "404 / SAYFA BULUNAMADI",
        title: "Aradığın sayfa burada değil.",
        description:
          "Bağlantı değişmiş, içerik silinmiş veya adres yanlış yazılmış olabilir.",
        home: "Ana sayfaya dön",
        studio: "Görsel Stüdyosu",
      }
    : {
        eyebrow: "404 / PAGE NOT FOUND",
        title: "This page is not part of the workspace.",
        description:
          "The link may have changed, the content may have been removed, or the address may be incorrect.",
        home: "Back to home",
        studio: "Image Studio",
      };

  return (
    <section className="not-found-page">
      <div className="not-found-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="not-found-content">
        <span className="not-found-eyebrow">{copy.eyebrow}</span>
        <strong className="not-found-code">404</strong>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        <div className="not-found-actions">
          <button className="not-found-primary" onClick={() => navigate("/")}>
            {copy.home}
            <i className="ti ti-arrow-up-right" aria-hidden="true" />
          </button>
          <button
            className="not-found-secondary"
            onClick={() => navigate("/categories")}
          >
            {copy.studio}
          </button>
        </div>
      </div>
    </section>
  );
}

export default NotFound;
