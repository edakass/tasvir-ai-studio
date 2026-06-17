import { useLanguage } from "../../../context/language";

const FORMATS = [
  { value: "Instagram Feed 1:1", icon: "ti-brand-instagram", size: "1080×1080" },
  { value: "Instagram Reels 9:16", icon: "ti-video", size: "1080×1920" },
  { value: "Instagram Story 9:16", icon: "ti-device-mobile", size: "1080×1920" },
  { value: "Facebook Post 1.91:1", icon: "ti-brand-facebook", size: "1200×630" },
  { value: "WhatsApp 9:16", icon: "ti-brand-whatsapp", size: "1080×1920" },
  { value: "Custom", icon: "ti-ruler-measure", size: "256–2048 px" },
];

function StepFormat({ data, update }) {
  const { isTurkish } = useLanguage();

  const selectFormat = (format) => {
    if (format.value === "Custom") {
      update({ format: "Custom" });
      return;
    }

    update({
      format: format.value,
      customWidth: "",
      customHeight: "",
    });
  };

  return (
    <div className="step-container">
      <h2>{isTurkish ? "Format seç" : "Select format"}</h2>
      <p className="step-desc">
        {isTurkish
          ? "Görselin çıktı formatını seç"
          : "Choose the output format for your visual"}
      </p>

      <div className="options-grid">
        {FORMATS.map((format) => (
          <div
            key={format.value}
            className={`option-card ${
              data.format === format.value ? "selected" : ""
            }`}
            onClick={() => selectFormat(format)}
          >
            <div className="option-icon">
              <i className={`ti ${format.icon}`} />
            </div>
            <div className="option-label">{format.value}</div>
            <div className="option-desc">{format.size}</div>
          </div>
        ))}
      </div>

      {data.format === "Custom" && (
        <div className="custom-size-panel">
          <div className="custom-size-heading">
            <div>
              <h3>{isTurkish ? "Özel ölçü" : "Custom size"}</h3>
              <p>
                {isTurkish
                  ? "Genişlik ve yüksekliği piksel olarak gir."
                  : "Enter the width and height in pixels."}
              </p>
            </div>
            <span>
              {data.customWidth || "—"} × {data.customHeight || "—"} px
            </span>
          </div>
          <div className="custom-size-fields">
            <label>
              {isTurkish ? "Genişlik" : "Width"}
              <input
                className="form-input"
                type="number"
                min="256"
                max="2048"
                step="8"
                value={data.customWidth}
                onChange={(event) =>
                  update({ customWidth: event.target.value })
                }
                placeholder="1200"
              />
            </label>
            <span>×</span>
            <label>
              {isTurkish ? "Yükseklik" : "Height"}
              <input
                className="form-input"
                type="number"
                min="256"
                max="2048"
                step="8"
                value={data.customHeight}
                onChange={(event) =>
                  update({ customHeight: event.target.value })
                }
                placeholder="800"
              />
            </label>
          </div>
          <small>
            {isTurkish
              ? "Her iki değer de 256 ile 2048 px arasında olmalı."
              : "Both values must be between 256 and 2048 px."}
          </small>
        </div>
      )}
    </div>
  );
}

export default StepFormat;
