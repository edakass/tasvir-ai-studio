import { useLanguage } from "../../../context/language";

function StepStyle({ data, update }) {
  const { isTurkish } = useLanguage();
  return (
    <div className="step-container">
      <h2>{isTurkish ? "Stil" : "Style"}</h2>
      <p className="step-desc">
        {isTurkish
          ? "İstediğin görsel stilini anlat"
          : "Describe the visual style you want"}
      </p>

      <div className="form-group">
        <label className="form-label">
          {isTurkish ? "Stil açıklaması" : "Style description"}
        </label>
        <input
          className="form-input"
          placeholder={
            isTurkish
              ? "Örn. Modern, minimal, lüks, sıcak tonlar..."
              : "e.g. Modern, minimal, luxury, warm tones, dark atmosphere..."
          }
          value={data.style}
          onChange={(e) => update({ style: e.target.value })}
          maxLength={500}
        />
        <span className="form-hint">
          {isTurkish ? "Dilediğin dilde yazabilirsin" : "Write freely in any language"}
        </span>
      </div>
    </div>
  );
}

export default StepStyle;
