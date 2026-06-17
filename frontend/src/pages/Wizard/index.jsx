import { useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createProject, deleteProject } from "../../api/projects";
import { generateImages } from "../../api/generate";
import StepSubject from "./steps/StepSubject";
import StepStyle from "./steps/StepStyle";
import StepFormat from "./steps/StepFormat";
import StepExtras from "./steps/StepExtras";
import StepPrompt from "./steps/StepPrompt";
import StepGenerating from "./steps/StepGenerating";
import StepResult from "./steps/StepResult";
import { useLanguage } from "../../context/language";
import "./Wizard.css";

function Wizard() {
  const { isTurkish } = useLanguage();
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [projectId, setProjectId] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const generatingRef = useRef(false);

  const [data, setData] = useState({
    projectName: "",
    subject: "",
    style: "",
    format: "",
    customWidth: "",
    customHeight: "",
    extras: [],
    prompt: "",
  });

  const update = useCallback((fields) => {
    const promptInputs = [
      "subject",
      "style",
      "format",
      "customWidth",
      "customHeight",
      "extras",
    ];
    const shouldClearPrompt =
      !Object.hasOwn(fields, "prompt") &&
      Object.keys(fields).some((field) => promptInputs.includes(field));

    setGenerationError("");
    setData((prev) => ({
      ...prev,
      ...fields,
      ...(shouldClearPrompt ? { prompt: "" } : {}),
    }));
  }, []);

  const totalSteps = 5;
  const promptStep = 5;

  const handleNext = async () => {
    if (step === promptStep) {
      await handleGenerate();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      navigate(`/categories/${categoryId}`);
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleGenerate = async () => {
    if (generatingRef.current) return;

    const generatingStep = 6;
    const resultStep = 7;
    let createdProjectId = null;
    generatingRef.current = true;
    setGenerationError("");
    setIsGenerating(true);
    setStep(generatingStep);
    try {
      const selectedFormat =
        data.format === "Custom"
          ? `Custom ${data.customWidth}×${data.customHeight}`
          : data.format;

      const project = await createProject({
        category_id: parseInt(categoryId),
        name: data.projectName,
        subject: data.subject,
        style: data.style,
        format: selectedFormat,
        extra_elements: data.extras.join(", "),
        prompt: data.prompt,
      });

      const newProjectId = project.data.id;
      createdProjectId = newProjectId;
      setProjectId(newProjectId);

      const res = await generateImages({
        project_id: newProjectId,
        prompt: data.prompt,
      });

      if (!Array.isArray(res.data) || res.data.length === 0) {
        throw new Error("Image service returned no images");
      }

      setGeneratedImages(res.data);
      setStep(resultStep);
    } catch (err) {
      console.error(err);
      if (createdProjectId) {
        try {
          await deleteProject(createdProjectId);
          setProjectId(null);
        } catch (cleanupError) {
          console.error("Failed to clean up empty project", cleanupError);
        }
      }
      setGenerationError(
        isTurkish
          ? "Görsel üretilemedi. Bağlantını ve API ayarlarını kontrol edip promptu değiştirerek tekrar dene."
          : "The visual could not be generated. Check your connection and API settings, then adjust the prompt and try again."
      );
      setStep(promptStep);
    } finally {
      generatingRef.current = false;
      setIsGenerating(false);
    }
  };

  const canNext = () => {
    if (step === 1) {
      return (
        data.projectName.trim().length > 0 && data.subject.trim().length >= 2
      );
    }
    if (step === 2) return data.style.trim().length >= 2;
    if (step === 3) {
      if (data.format !== "Custom") return !!data.format;

      const width = Number(data.customWidth);
      const height = Number(data.customHeight);
      return (
        Number.isInteger(width) &&
        Number.isInteger(height) &&
        width >= 256 &&
        width <= 2048 &&
        height >= 256 &&
        height <= 2048
      );
    }
    if (step === 4) return true;
    if (step === 5) return data.prompt.trim().length >= 3 && !isGenerating;
    return false;
  };

  const isGeneratingOrResult = () => {
    return step === 6 || step === 7;
  };

  const selectedFormat =
    data.format === "Custom"
      ? `Custom ${data.customWidth}×${data.customHeight}`
      : data.format;

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepSubject data={data} update={update} />;
      case 2:
        return <StepStyle data={data} update={update} />;
      case 3:
        return <StepFormat data={data} update={update} />;
      case 4:
        return <StepExtras data={data} update={update} />;
      case 5:
        return <StepPrompt data={data} update={update} />;
      case 6:
        return <StepGenerating />;
      case 7:
        return (
          <StepResult
            images={generatedImages}
            projectId={projectId}
            prompt={data.prompt}
            format={selectedFormat}
            onNew={() => navigate(`/categories/${categoryId}`)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="wizard">
      {!isGeneratingOrResult() && (
        <div className="wizard-header">
          <div className="wizard-title">
            {isTurkish ? "Metinden Görsele Projesi" : "Text-to-Image Project"}{" "}
            — {isTurkish ? "Adım" : "Step"} {step} / {totalSteps}
          </div>
          <div className="wizard-steps">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(
              (s, i) => (
                <div key={s} className="wizard-step-row">
                  <div
                    className={`step-bubble ${
                      step > s ? "done" : step === s ? "active" : "pending"
                    }`}
                  >
                    {step > s ? <i className="ti ti-check" /> : s}
                  </div>
                  {i < totalSteps - 1 && <div className="step-line" />}
                </div>
              )
            )}
          </div>
        </div>
      )}

      <div className="wizard-content">{renderStep()}</div>

      {generationError && step === promptStep && (
        <div className="wizard-error" role="alert">
          <i className="ti ti-alert-circle" />
          <span>{generationError}</span>
        </div>
      )}

      {!isGeneratingOrResult() && (
        <div className="wizard-footer">
          <button className="btn-back" onClick={handleBack}>
            ← {isTurkish ? "Geri" : "Back"}
          </button>
          <button
            className="btn-next"
            onClick={handleNext}
            disabled={!canNext() || isGenerating}
          >
            {step === promptStep
              ? isTurkish
                ? "Oluştur →"
                : "Generate →"
              : isTurkish
                ? "İleri →"
                : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Wizard;
