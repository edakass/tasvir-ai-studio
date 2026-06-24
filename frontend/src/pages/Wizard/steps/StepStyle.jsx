import { useLanguage } from "../../../context/language";

const STYLE_MAX_LENGTH = 500;

function StepStyle({ data, update }) {
  const { isTurkish } = useLanguage();
  const styleLength = data.style.length;
  const isNearLimit = styleLength >= STYLE_MAX_LENGTH * 0.9;

  return (
    <div className="step-container">
      <h2>{isTurkish ? "Stil" : "Style"}</h2>

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
          maxLength={STYLE_MAX_LENGTH}
        />
        <div className="form-meta">
          <span className="form-hint">
            {isTurkish ? "Dilediğin dilde yazabilirsin" : "Write freely in any language"}
          </span>
          <span className={`char-count ${isNearLimit ? "near-limit" : ""}`}>
            {styleLength}/{STYLE_MAX_LENGTH}
          </span>
        </div>
      </div>
    </div>
  );
}

export default StepStyle;
