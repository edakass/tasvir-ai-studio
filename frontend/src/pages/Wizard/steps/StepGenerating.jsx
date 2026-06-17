import { useLanguage } from "../../../context/language";

function StepGenerating() {
  const { isTurkish } = useLanguage();
  return (
    <div className="step-generating">
      <div className="generating-icon">
        <i className="ti ti-wand" />
      </div>
      <h2>
        {isTurkish ? "Görsellerin oluşturuluyor..." : "Generating your visuals..."}
      </h2>
      <p>
        {isTurkish
          ? "Bu işlem 30-60 saniye sürebilir. Lütfen bekle."
          : "This may take 30-60 seconds. Please wait."}
      </p>
      <div className="generating-dots">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default StepGenerating;
