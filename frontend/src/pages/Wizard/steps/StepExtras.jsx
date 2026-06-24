import { useLanguage } from "../../../context/language";

const EXTRAS_MAX_LENGTH = 2000;

function StepExtras({ data, update }) {
  const { isTurkish } = useLanguage();
  const extrasValue = data.extras.join(", ");
  const extrasLength = extrasValue.length;
  const isNearLimit = extrasLength >= EXTRAS_MAX_LENGTH * 0.9;

  return (
    <div className="step-container">
      <div className="step-title-row">
        <h2>{isTurkish ? "Ek notlar" : "Additional notes"}</h2>
        <span>{isTurkish ? "İsteğe bağlı" : "Optional"}</span>
      </div>

      <div className="form-group">
        <textarea
          className="prompt-textarea"
          aria-label={isTurkish ? "Ek notlar" : "Additional notes"}
          placeholder={
            isTurkish
              ? "Örn. Bitkiler, sıcak ışık ve ahşap zemin ekle..."
              : "e.g. Add plants, warm lighting, wooden floor, no text or logos..."
          }
          value={extrasValue}
          onChange={(e) =>
            update({ extras: e.target.value ? [e.target.value] : [] })
          }
          maxLength={EXTRAS_MAX_LENGTH}
          rows={5}
        />
        <div className="form-meta">
          <span className="form-hint">
            {isTurkish
              ? "Detayları burada kısa ve net tutabilirsin"
              : "Keep extra details short and specific"}
          </span>
          <span className={`char-count ${isNearLimit ? "near-limit" : ""}`}>
            {extrasLength}/{EXTRAS_MAX_LENGTH}
          </span>
        </div>
      </div>
    </div>
  );
}

export default StepExtras;
