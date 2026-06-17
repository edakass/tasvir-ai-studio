import { useCallback, useEffect, useState } from "react";
import { generatePrompt } from "../../../api/generate";
import { useLanguage } from "../../../context/language";

function StepPrompt({ data, update }) {
  const { isTurkish } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const selectedFormat =
    data.format === "Custom"
      ? `Custom ${data.customWidth}×${data.customHeight}`
      : data.format;

  const fetchPrompt = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generatePrompt({
        subject: data.subject,
        style: data.style,
        format: selectedFormat,
        extra_elements: data.extras.join(", "),
      });
      update({ prompt: res.data.prompt });
    } catch {
      setError(
        isTurkish
          ? "Prompt oluşturulamadı. API ayarlarını ve bağlantını kontrol edip tekrar dene."
          : "The prompt could not be generated. Check your API settings and connection, then try again."
      );
    } finally {
      setLoading(false);
    }
  }, [
    data.extras,
    data.style,
    data.subject,
    isTurkish,
    selectedFormat,
    update,
  ]);

  useEffect(() => {
    if (!data.prompt) {
      const timeoutId = window.setTimeout(fetchPrompt, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [data.prompt, fetchPrompt]);

  return (
    <div className="step-container">
      <h2>{isTurkish ? "Prompt ön izlemesi" : "Preview prompt"}</h2>
      <p className="step-desc">
        {isTurkish
          ? "AI seçimlerine göre bu promptu hazırladı. Düzenleyebilirsin."
          : "AI generated this prompt based on your selections. You can edit it."}
      </p>

      {loading && (
        <div className="prompt-loading">
          <i className="ti ti-loader" />{" "}
          {isTurkish ? "Prompt oluşturuluyor..." : "Generating prompt..."}
        </div>
      )}

      {!loading && error && (
        <div className="prompt-error">
          <div className="prompt-error-icon">
            <i className="ti ti-clock-pause" />
          </div>
          <h3>
            {isTurkish ? "Servis geçici olarak yoğun" : "Service temporarily busy"}
          </h3>
          <p>{error}</p>
          <button className="btn-regenerate" onClick={fetchPrompt}>
            <i className="ti ti-refresh" />{" "}
            {isTurkish ? "Tekrar dene" : "Try again"}
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <textarea
            className="prompt-textarea"
            value={data.prompt}
            onChange={(e) => update({ prompt: e.target.value })}
            rows={8}
            maxLength={8000}
          />
          <button className="btn-regenerate" onClick={fetchPrompt}>
            <i className="ti ti-refresh" />{" "}
            {isTurkish ? "Promptu yenile" : "Regenerate prompt"}
          </button>
        </>
      )}
    </div>
  );
}

export default StepPrompt;
