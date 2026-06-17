import { useLanguage } from "../../../context/language";

function StepExtras({ data, update }) {
  const { isTurkish } = useLanguage();
  return (
    <div className="step-container">
      <h2>{isTurkish ? "Ek notlar" : "Additional notes"}</h2>
      <p className="step-desc">
        {isTurkish
          ? "Sahnede görmek istediğin ek detaylar (isteğe bağlı)"
          : "Any extra details you want in the scene (optional)"}
      </p>

      <div className="form-group">
        <label className="form-label">
          {isTurkish ? "Ek notlar" : "Extra notes"}
        </label>
        <textarea
          className="prompt-textarea"
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
        <span className="form-hint">
          {isTurkish
            ? "İsteğe bağlı — atlamak için boş bırak"
            : "Optional — leave empty to skip"}
        </span>
      </div>
    </div>
  );
}

export default StepExtras;
