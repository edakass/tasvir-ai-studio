import { useRef, useState } from "react";
import {
  toggleFavorite,
  generateImages,
  getImageDownloadUrl,
} from "../../../api/generate";
import { useLanguage } from "../../../context/language";

const FORMAT_DIMENSIONS = {
  "Instagram Feed 1:1": [1080, 1080],
  "Instagram Reels 9:16": [1080, 1920],
  "Instagram Story 9:16": [1080, 1920],
  "Facebook Post 1.91:1": [1200, 630],
  "WhatsApp 9:16": [1080, 1920],
};

function getFormatDimensions(format) {
  if (FORMAT_DIMENSIONS[format]) return FORMAT_DIMENSIONS[format];

  const customMatch = format?.match(/^Custom\s+(\d+)[×x](\d+)$/);
  return customMatch
    ? [Number(customMatch[1]), Number(customMatch[2])]
    : [1024, 1024];
}

function StepResult({
  images: initialImages,
  projectId,
  prompt,
  format,
  onNew,
}) {
  const { isTurkish } = useLanguage();
  const [images, setImages] = useState(initialImages);
  const [favorites, setFavorites] = useState({});
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const regeneratingRef = useRef(false);
  const API_URL = import.meta.env.VITE_API_URL;
  const [width, height] = getFormatDimensions(format);

  const handleFavorite = async (imageId) => {
    try {
      const res = await toggleFavorite(imageId);
      setFavorites((prev) => ({ ...prev, [imageId]: res.data.is_favorite }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (imageId, format) => {
    const link = document.createElement("a");
    link.href = getImageDownloadUrl(imageId, format);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerate = async () => {
    if (regeneratingRef.current) return;

    regeneratingRef.current = true;
    setRegenerateError("");
    setRegenerating(true);
    try {
      const res = await generateImages({
        project_id: projectId,
        prompt: prompt,
      });
      if (!Array.isArray(res.data) || res.data.length === 0) {
        throw new Error("Image service returned no images");
      }
      setImages(res.data);
    } catch (err) {
      console.error(err);
      setRegenerateError(
        isTurkish
          ? "Yeni görsel üretilemedi. Lütfen promptu düzenleyip tekrar dene."
          : "A new visual could not be generated. Please adjust the prompt and try again."
      );
    } finally {
      regeneratingRef.current = false;
      setRegenerating(false);
    }
  };

  return (
    <div className="step-result">
      <div className="result-header">
        <h2>{isTurkish ? "Görselini önizle ve indir" : "Preview and download your visual"}</h2>
        <div className="result-header-actions">
          <button
            className="btn-regenerate"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? (
              <>
                <i className="ti ti-loader" />{" "}
                {isTurkish ? "Oluşturuluyor..." : "Generating..."}
              </>
            ) : (
              <>
                <i className="ti ti-refresh" />{" "}
                {isTurkish ? "Yeniden oluştur" : "Regenerate"}
              </>
            )}
          </button>
          <button className="btn-new" onClick={onNew}>
            + {isTurkish ? "Yeni Proje" : "New Project"}
          </button>
        </div>
      </div>

      {regenerateError && (
        <div className="wizard-error" role="alert">
          <i className="ti ti-alert-circle" />
          <span>{regenerateError}</span>
        </div>
      )}

      <div className="result-grid">
        {images.map((image) => (
          <div key={image.id} className="result-card">
            <div
              className="result-img-wrapper"
              style={{ aspectRatio: `${width} / ${height}` }}
              onClick={() => setPreviewImage(image)}
            >
              <img
                src={`${API_URL}/${image.image_path}`}
                alt={isTurkish ? "üretilen görsel" : "generated"}
                className="result-img"
              />
              <div className="result-overlay">
                <button
                  className="overlay-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPreviewImage(image);
                  }}
                  aria-label={isTurkish ? "Görseli önizle" : "Preview image"}
                >
                  <i className="ti ti-maximize" />
                </button>
                <button
                  className={`overlay-btn ${
                    favorites[image.id] ? "favorited" : ""
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleFavorite(image.id);
                  }}
                  aria-label={isTurkish ? "Favoriye ekle" : "Add to favorites"}
                >
                  <i className="ti ti-heart" />
                </button>
              </div>
            </div>
            <div className="result-format-meta">
              <span>{format}</span>
              <strong>
                {width} × {height} px
              </strong>
            </div>
            <div className="result-actions">
              <button
                className="btn-download"
                onClick={() => setPreviewImage(image)}
              >
                <i className="ti ti-eye" />
                {isTurkish ? "Önizle" : "Preview"}
              </button>
              <button
                className="btn-download"
                onClick={() => handleDownload(image.id, "png")}
              >
                <i className="ti ti-download" /> PNG
              </button>
              <button
                className="btn-download"
                onClick={() => handleDownload(image.id, "jpg")}
              >
                <i className="ti ti-download" /> JPG
              </button>
            </div>
          </div>
        ))}
      </div>

      {previewImage && (
        <div
          className="image-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={isTurkish ? "Görsel önizleme" : "Image preview"}
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="image-preview-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="image-preview-header">
              <div>
                <span>{format}</span>
                <strong>
                  {width} × {height} px
                </strong>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                aria-label={isTurkish ? "Önizlemeyi kapat" : "Close preview"}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="image-preview-canvas">
              <img
                src={`${API_URL}/${previewImage.image_path}`}
                alt={isTurkish ? "Tam boy üretilen görsel" : "Full generated visual"}
              />
            </div>
            <div className="image-preview-actions">
              <span>
                {isTurkish
                  ? "PNG ve JPG aynı kompozisyonu indirir; yalnızca dosya türü değişir."
                  : "PNG and JPG download the same composition; only the file type changes."}
              </span>
              <div>
                <button onClick={() => handleDownload(previewImage.id, "png")}>
                  <i className="ti ti-download" /> PNG
                </button>
                <button onClick={() => handleDownload(previewImage.id, "jpg")}>
                  <i className="ti ti-download" /> JPG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StepResult;
