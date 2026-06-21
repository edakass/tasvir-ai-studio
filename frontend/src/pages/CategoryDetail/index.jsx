import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCategories } from "../../api/categories";
import { getProjectsByCategory, deleteProject } from "../../api/projects";
import { getProjectImages } from "../../api/generate";
import { useLanguage } from "../../context/language";
import ConfirmDialog from "../../components/ConfirmDialog";
import StatusState from "../../components/StatusState";
import "./CategoryDetail.css";

function CategoryDetail() {
  const { isTurkish } = useLanguage();
  const text = isTurkish
    ? {
        tabs: [["all", "Tüm projeler"], ["favorites", "Favoriler"], ["archived", "Arşivlenenler"]],
        loading: "Yükleniyor...",
        notFound: "Kategori bulunamadı",
        notFoundMessage: "Bu kategori silinmiş veya bağlantı artık geçerli olmayabilir.",
        loadErrorTitle: "Kategori yüklenemedi",
        loadErrorMessage:
          "Tasvir API'sine ulaşılamıyor. Backend ve MySQL bağlantısını kontrol edip tekrar dene.",
        retry: "Tekrar dene",
        deleteConfirm: "Bu proje silinsin mi?",
        deleteTitle: "Projeyi sil",
        deleteMessage:
          "Bu proje ve projeye bağlı tüm görseller kalıcı olarak silinecek.",
        deleteAction: "Projeyi sil",
        cancel: "İptal",
        deleteError: "Proje silinemedi. Lütfen tekrar dene.",
        back: "Kategorilere dön",
        projects: "proje",
        noDescription: "Açıklama yok",
        newProject: "Yeni Proje",
        empty: "Henüz proje yok",
        firstProject: "İlk projeyi oluştur",
        images: "görsel",
      }
    : {
        tabs: [["all", "All projects"], ["favorites", "Favorites"], ["archived", "Archived"]],
        loading: "Loading...",
        notFound: "Category not found",
        notFoundMessage:
          "This category may have been deleted or the link may no longer be valid.",
        loadErrorTitle: "Category could not be loaded",
        loadErrorMessage:
          "Tasvir cannot reach the API. Check the backend and MySQL connection, then try again.",
        retry: "Retry",
        deleteConfirm: "Delete this project?",
        deleteTitle: "Delete project",
        deleteMessage:
          "This project and all of its generated visuals will be permanently deleted.",
        deleteAction: "Delete project",
        cancel: "Cancel",
        deleteError: "The project could not be deleted. Please try again.",
        back: "Back to categories",
        projects: "projects",
        noDescription: "No description",
        newProject: "New Project",
        empty: "No projects yet",
        firstProject: "Create first project",
        images: "images",
      };
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectImages, setProjectImages] = useState({});
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [catRes, projRes] = await Promise.all([
        getCategories(),
        getProjectsByCategory(id),
      ]);
      const cat = catRes.data.find((c) => c.id === parseInt(id));
      setCategory(cat);
      const projs = projRes.data;
      setProjects(projs);

      const imageMap = {};
      await Promise.all(
        projs.map(async (p) => {
          try {
            const res = await getProjectImages(p.id);
            imageMap[p.id] = res.data;
          } catch {
            imageMap[p.id] = [];
          }
        })
      );
      setProjectImages(imageMap);
    } catch (err) {
      console.error(err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchData, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      await fetchData();
    } catch (error) {
      console.error(error);
      setDeleteError(text.deleteError);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const images = projectImages[p.id] || [];
    if (activeTab === "favorites") return images.some((img) => img.is_favorite);
    if (activeTab === "archived") return images.some((img) => img.is_archived);
    return true;
  });

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
  if (!category) {
    return (
      <StatusState
        icon="ti-folder-off"
        title={text.notFound}
        message={text.notFoundMessage}
        actionLabel={text.back}
        onAction={() => navigate("/categories")}
      />
    );
  }

  return (
    <div className="category-detail">
      <button className="back-btn" onClick={() => navigate("/categories")}>
        <i className="ti ti-arrow-left" /> {text.back}
      </button>

      <div className="detail-topbar">
        <div className="cat-header">
          <div
            className="cat-icon-lg"
            style={{ background: category.color + "22" }}
          >
            {category.icon}
          </div>
          <div>
            <h1>{category.name}</h1>
            <p>
              {projects.length} {text.projects} ·{" "}
              {category.description || text.noDescription}
            </p>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate(`/wizard/${id}`)}
        >
          + {text.newProject}
        </button>
      </div>

      <div className="tabs">
        {text.tabs.map(([value, label]) => (
          <button
            key={value}
            className={`tab ${activeTab === value ? "active" : ""}`}
            onClick={() => setActiveTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🎨</div>
          <div className="empty-text">{text.empty}</div>
          <button
            className="btn-primary"
            onClick={() => navigate(`/wizard/${id}`)}
          >
            {text.firstProject}
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => {
            const images = projectImages[project.id] || [];
            const visibleImages = images.filter((image) => {
              if (activeTab === "favorites") return image.is_favorite;
              if (activeTab === "archived") return image.is_archived;
              return true;
            });
            const firstImage = visibleImages[0];
            return (
              <div
                key={project.id}
                className="project-card"
                onClick={() =>
                  navigate(`/project/${project.id}`, {
                    state: {
                      imageFilter: activeTab === "all" ? null : activeTab,
                    },
                  })
                }
              >
                <div className="project-thumb">
                  {firstImage ? (
                    <img src={`${API_URL}/${firstImage.image_path}`} alt="" />
                  ) : (
                    <span>🎨</span>
                  )}
                </div>
                <div className="project-body">
                  <div className="project-card-top">
                    <div className="project-name">{project.name}</div>
                    <button
                      className="action-btn delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteError("");
                        setDeleteTarget(project);
                      }}
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                  <div className="project-tags">
                    {project.subject && (
                      <span className="tag">
                        {project.subject.slice(0, 30)}
                        {project.subject.length > 30 ? "..." : ""}
                      </span>
                    )}
                    {project.format && (
                      <span className="tag">{project.format}</span>
                    )}
                  </div>
                  <div className="project-footer">
                    <span className="project-date">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                    <span className="project-imgs">
                      {visibleImages.length} {text.images}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={text.deleteTitle}
          message={`${deleteTarget.name}: ${text.deleteMessage}`}
          confirmLabel={text.deleteAction}
          cancelLabel={text.cancel}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
          error={deleteError}
        />
      )}
    </div>
  );
}

export default CategoryDetail;
