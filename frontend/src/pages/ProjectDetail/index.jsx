import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjectById } from "../../api/projects";
import {
  getProjectImages,
  toggleFavorite,
  toggleArchive,
  deleteImage,
  getImageDownloadUrl,
} from "../../api/generate";
import { useLanguage } from "../../context/language";
import ConfirmDialog from "../../components/ConfirmDialog";
import StatusState from "../../components/StatusState";
import "./ProjectDetail.css";

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

function ProjectDetail() {
  const { isTurkish } = useLanguage();
  const text = isTurkish
    ? {
        areYouSure: "Emin misiniz?",
        cancel: "İptal",
        delete: "Sil",
        deleteMessage: "Bu görsel kalıcı olarak silinecek.",
        deleteTitle: "Görseli sil",
        deleteError: "Görsel silinemedi. Lütfen tekrar dene.",
        loading: "Yükleniyor...",
        notFound: "Proje bulunamadı",
        notFoundMessage: "Bu proje silinmiş veya bağlantı artık geçerli olmayabilir.",
        loadErrorTitle: "Proje yüklenemedi",
        loadErrorMessage:
          "Tasvir API'sine ulaşılamıyor. Backend ve MySQL bağlantısını kontrol edip tekrar dene.",
        retry: "Tekrar dene",
        back: "Kategoriye dön",
        textToImage: "Metinden Görsele",
        prompt: "Prompt",
        noImages: "Henüz görsel yok",
        favorite: "Favori",
        archive: "Arşivle",
        favoriteError:
          "Favori durumu güncellenemedi. Bağlantını kontrol edip tekrar dene.",
        archiveError:
          "Arşiv durumu güncellenemedi. Bağlantını kontrol edip tekrar dene.",
        generatedAlt: "üretilen görsel",
        preview: "Önizle",
        previewTitle: "Görsel önizleme",
        closePreview: "Önizlemeyi kapat",
        downloadNote:
          "PNG ve JPG aynı kompozisyonu indirir; yalnızca dosya türü değişir.",
      }
    : {
        areYouSure: "Are you sure?",
        cancel: "Cancel",
        delete: "Delete",
        deleteMessage: "This image will be permanently deleted.",
        deleteTitle: "Delete visual",
        deleteError: "The visual could not be deleted. Please try again.",
        loading: "Loading...",
        notFound: "Project not found",
        notFoundMessage:
          "This project may have been deleted or the link may no longer be valid.",
        loadErrorTitle: "Project could not be loaded",
        loadErrorMessage:
          "Tasvir cannot reach the API. Check the backend and MySQL connection, then try again.",
        retry: "Retry",
        back: "Back to category",
        textToImage: "Text to Image",
        prompt: "Prompt",
        noImages: "No images yet",
        favorite: "Favorite",
        archive: "Archive",
        favoriteError:
          "The favorite status could not be updated. Check your connection and try again.",
        archiveError:
          "The archive status could not be updated. Check your connection and try again.",
        generatedAlt: "generated visual",
        preview: "Preview",
        previewTitle: "Image preview",
        closePreview: "Close preview",
        downloadNote:
          "PNG and JPG download the same composition; only the file type changes.",
      };
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({});
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setNotFound(false);
    try {
      const [projRes, imgRes] = await Promise.all([
        getProjectById(projectId),
        getProjectImages(projectId),
      ]);
      setProject(projRes.data);
      setImages(imgRes.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchData, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  const handleFavorite = async (imageId) => {
    const actionId = `favorite:${imageId}`;
    if (pendingAction) return;
    setPendingAction(actionId);
    setActionError("");
    try {
      const response = await toggleFavorite(imageId);
      setImages((current) =>
        current.map((image) =>
          image.id === imageId
            ? { ...image, is_favorite: response.data.is_favorite }
            : image
        )
      );
    } catch (err) {
      console.error(err);
      setActionError(text.favoriteError);
    } finally {
      setPendingAction("");
    }
  };

  const handleArchive = async (imageId) => {
    const actionId = `archive:${imageId}`;
    if (pendingAction) return;
    setPendingAction(actionId);
    setActionError("");
    try {
      const response = await toggleArchive(imageId);
      setImages((current) =>
        current.map((image) =>
          image.id === imageId
            ? { ...image, is_archived: response.data.is_archived }
            : image
        )
      );
    } catch (err) {
      console.error(err);
      setActionError(text.archiveError);
    } finally {
      setPendingAction("");
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteImage(confirmId);
      setConfirmId(null);
      await fetchData();
    } catch (error) {
      console.error(error);
      setDeleteError(text.deleteError);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownload = (imageId, format) => {
    const link = document.createElement("a");
    link.href = getImageDownloadUrl(imageId, format);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="loading">{text.loading}</div>;
  if (loadError) {
    return (
      <StatusState
        title={text.loadErrorTitle}
        message={text.loadErrorMessage}
        actionLabel={text.retry}
        onAction={fetchData}
      />
    );
  }
  if (notFound || !project) {
    return (
      <StatusState
        icon="ti-photo-off"
        title={text.notFound}
        message={text.notFoundMessage}
        actionLabel={isTurkish ? "Kategorilere dön" : "Back to categories"}
        onAction={() => navigate("/categories")}
      />
    );
  }

  const [imageWidth, imageHeight] = getFormatDimensions(project.format);
  const getActualDimensions = (imageId) =>
    imageDimensions[imageId] || [imageWidth, imageHeight];

  return (
    <div className="project-detail">
      {confirmId && (
        <ConfirmDialog
          title={text.deleteTitle}
          message={text.deleteMessage}
          confirmLabel={text.delete}
          cancelLabel={text.cancel}
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          loading={deleteLoading}
          error={deleteError}
        />
      )}

      <button
        className="back-btn"
        onClick={() => navigate(`/categories/${project.category_id}`)}
      >
        <i className="ti ti-arrow-left" /> {text.back}
      </button>

      <div className="project-detail-header">
        <div>
          <h1>{project.name}</h1>
          <div className="project-detail-meta">
            <span className="tag">{text.textToImage}</span>
            {project.style && <span className="tag">{project.style}</span>}
            {project.format && <span className="tag">{project.format}</span>}
            <span className="project-date">
              {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {project.prompt && (
        <div className="project-prompt-box">
          <div className="project-prompt-label">{text.prompt}</div>
          <p>{project.prompt}</p>
        </div>
      )}

      {actionError && (
        <div className="project-action-error" role="alert">
          <i className="ti ti-alert-circle" />
          <span>{actionError}</span>
          <button onClick={() => setActionError("")} aria-label={text.cancel}>
            <i className="ti ti-x" />
          </button>
        </div>
      )}

      <div className="project-images-grid">
        {images.length === 0 ? (
          <div className="empty">
            <div className="empty-text">{text.noImages}</div>
          </div>
        ) : (
          images.map((image) => (
            <div key={image.id} className="project-image-card">
              <div
                className="project-image-wrapper"
                onClick={() => setPreviewImage(image)}
              >
                <img
                  src={`${API_URL}/${image.image_path}`}
                  alt={text.generatedAlt}
                  onLoad={(event) => {
                    const nextDimensions = [
                      event.currentTarget.naturalWidth,
                      event.currentTarget.naturalHeight,
                    ];
                    setImageDimensions((current) => ({
                      ...current,
                      [image.id]: nextDimensions,
                    }));
                  }}
                />
                <div className="project-image-overlay">
                  <button
                    className={`overlay-btn ${
                      image.is_favorite ? "favorited" : ""
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleFavorite(image.id);
                    }}
                    title={text.favorite}
                    disabled={Boolean(pendingAction)}
                  >
                    <i
                      className={`ti ${
                        pendingAction === `favorite:${image.id}`
                          ? "ti-loader-2 spin"
                          : "ti-heart"
                      }`}
                    />
                  </button>
                  <button
                    className={`overlay-btn ${
                      image.is_archived ? "archived" : ""
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleArchive(image.id);
                    }}
                    title={text.archive}
                    disabled={Boolean(pendingAction)}
                  >
                    <i
                      className={`ti ${
                        pendingAction === `archive:${image.id}`
                          ? "ti-loader-2 spin"
                          : "ti-archive"
                      }`}
                    />
                  </button>
                  <button
                    className="overlay-btn delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteError("");
                      setConfirmId(image.id);
                    }}
                    title={text.delete}
                  >
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>
              <div className="project-image-format">
                <span>{project.format}</span>
                <strong>
                  {getActualDimensions(image.id)[0]} ×{" "}
                  {getActualDimensions(image.id)[1]} px
                </strong>
              </div>
              <div className="project-image-actions">
                <button
                  className="btn-download"
                  onClick={() => setPreviewImage(image)}
                >
                  <i className="ti ti-eye" /> {text.preview}
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
          ))
        )}
      </div>

      {previewImage && (
        <div
          className="image-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={text.previewTitle}
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="image-preview-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="image-preview-header">
              <div>
                <span>{project.format}</span>
                <strong>
                  {getActualDimensions(previewImage.id)[0]} ×{" "}
                  {getActualDimensions(previewImage.id)[1]} px
                </strong>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                aria-label={text.closePreview}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="image-preview-canvas">
              <img
                src={`${API_URL}/${previewImage.image_path}`}
                alt={text.generatedAlt}
              />
            </div>
            <div className="image-preview-actions">
              <span>{text.downloadNote}</span>
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

export default ProjectDetail;
