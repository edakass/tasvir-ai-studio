import { useLanguage } from "../../../context/language";

function StepExtras({ data, update }) {
  const { isTurkish } = useLanguage();
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
          value={data.extras.join(", ")}
          onChange={(e) =>
            update({ extras: e.target.value ? [e.target.value] : [] })
          }
          maxLength={2000}
          rows={5}
        />
      </div>
    </div>
  );
}

export default StepExtras;
