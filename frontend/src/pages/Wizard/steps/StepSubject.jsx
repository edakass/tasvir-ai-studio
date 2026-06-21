import { useLanguage } from "../../../context/language";

function StepSubject({ data, update }) {
  const { isTurkish } = useLanguage();
  return (
    <div className="step-container">
      <h2>{isTurkish ? "Ne oluşturmak istiyorsun?" : "What do you want to create?"}</h2>

      <div className="form-group">
        <label className="form-label">
          {isTurkish ? "Proje adı" : "Project name"}
        </label>
        <input
          className="form-input"
          placeholder={
            isTurkish
              ? "Örn. Yaz Kampanyası, Ürün Tanıtımı..."
              : "e.g. Summer Campaign, Product Showcase..."
          }
          value={data.projectName}
          onChange={(e) => update({ projectName: e.target.value })}
          maxLength={255}
        />
      </div>

      <div className="form-group">
        <label className="form-label">{isTurkish ? "Konu" : "Subject"}</label>
        <textarea
          className="prompt-textarea"
          placeholder={
            isTurkish
              ? "Örn. Modern bir salonda kapı, şehir sokağında araba..."
              : "e.g. A door in a modern living room, a car in an urban street..."
          }
          value={data.subject}
          onChange={(e) => update({ subject: e.target.value })}
          maxLength={4000}
          rows={4}
        />
      </div>
    </div>
  );
}

export default StepSubject;
