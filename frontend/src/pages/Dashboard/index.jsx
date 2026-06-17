import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/language";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const { isTurkish } = useLanguage();

  const copy = isTurkish
    ? {
        titleStart: "Ürününü anlat,",
        titleAccent: "içeriğe dönüştür.",
        description:
          "Markan için metinler, kampanyalar ve özgün görseller üret. Dağınık araçlar yerine sakin, odaklı bir çalışma alanı.",
        primary: "İçerik Stüdyosu",
        secondary: "Görsel Stüdyosu",
        trusted: ["Yerel çalışma", "Düzenlenebilir çıktılar", "Açık kaynak"],
        strip: [
          "Instagram",
          "Story",
          "Kampanya",
          "Ürün metni",
          "Kaydırmalı post",
          "Görsel proje",
        ],
      }
    : {
        titleStart: "Describe your product,",
        titleAccent: "turn it into content.",
        description:
          "Create brand copy, campaigns, and original visuals in a calm, focused workspace built around outcomes instead of tools.",
        primary: "Content Studio",
        secondary: "Image Studio",
        trusted: ["Local workflow", "Editable outputs", "Open source"],
        strip: [
          "Instagram",
          "Stories",
          "Campaigns",
          "Product copy",
          "Slide posts",
          "Visual projects",
        ],
      };

  const handleParallax = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    event.currentTarget.style.setProperty("--parallax-x", `${x * 12}px`);
    event.currentTarget.style.setProperty("--parallax-y", `${y * 10}px`);
    event.currentTarget.style.setProperty(
      "--pointer-x",
      `${event.clientX - bounds.left}px`
    );
    event.currentTarget.style.setProperty(
      "--pointer-y",
      `${event.clientY - bounds.top}px`
    );
  };

  return (
    <div className="studio-landing">
      <div className="ambient-mesh" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <section className="studio-hero" onPointerMove={handleParallax}>
        <div className="hero-editorial">
          <h1>
            {copy.titleStart}
            <strong>{copy.titleAccent}</strong>
          </h1>
          <p>{copy.description}</p>

          <div className="hero-cta-row">
            <button
              className="studio-button studio-button-primary"
              onClick={() => navigate("/content-package")}
            >
              {copy.primary}
              <i className="ti ti-arrow-up-right" />
            </button>
            <button
              className="studio-button studio-button-quiet"
              onClick={() => navigate("/categories")}
            >
              {copy.secondary}
              <i className="ti ti-arrow-up-right" />
            </button>
          </div>

          <div className="hero-trust-row">
            {copy.trusted.map((item) => (
              <span key={item}>
                <i className="ti ti-check" />
                {item}
              </span>
            ))}
          </div>
        </div>

      </section>

      <div className="studio-strip" aria-hidden="true">
        <div>
          {[...copy.strip, ...copy.strip].map((item, index) => (
            <span key={`${item}-${index}`}>
              {item}
              <i />
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
