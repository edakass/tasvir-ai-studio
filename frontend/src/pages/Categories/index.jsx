import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/categories";
import { useLanguage } from "../../context/language";
import ConfirmDialog from "../../components/ConfirmDialog";
import StatusState from "../../components/StatusState";
import "emoji-picker-element";
import "./Categories.css";

const COLORS = [
  "#7C3AED",
  "#6366F1",
  "#3B82F6",
  "#0EA5E9",
  "#06B6D4",
  "#10B981",
  "#84CC16",
  "#EAB308",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#F43F5E",
  "#8B5CF6",
  "#A78BFA",
  "#C084FC",
  "#FB923C",
  "#FBBF24",
  "#34D399",
  "#38BDF8",
  "#E879F9",
];

const emptyForm = { name: "", description: "", icon: "", color: "#7C3AED" };

function Categories() {
  const { isTurkish } = useLanguage();
  const text = isTurkish
    ? {
        loading: "Yükleniyor...",
        title: "Kategoriler",
        subtitle: "Görsel proje kategorilerini yönet",
        newCategory: "Yeni Kategori",
        deleteConfirm: "Bu kategori silinsin mi?",
        deleteTitle: "Kategoriyi sil",
        deleteMessage:
          "Bu kategori, içindeki projeler ve üretilen görseller kalıcı olarak silinecek.",
        deleteAction: "Kategoriyi sil",
        deleteError: "Kategori silinemedi. Lütfen tekrar dene.",
        loadErrorTitle: "Kategoriler yüklenemedi",
        loadErrorMessage:
          "Tasvir API'sine ulaşılamıyor. Backend ve MySQL bağlantısını kontrol edip tekrar dene.",
        retry: "Tekrar dene",
        saveError:
          "Kategori kaydedilemedi. Bağlantını kontrol edip tekrar dene.",
        saving: "Kaydediliyor...",
        edit: "Kategoriyi Düzenle",
        name: "Kategori adı",
        namePlaceholder: "Örn. Kapı ve Panel",
        description: "Açıklama (isteğe bağlı)",
        descriptionPlaceholder: "Kısa açıklama",
        color: "Renk",
        icon: "İkon",
        changeIcon: "İkonu değiştir",
        selectIcon: "İkon seç",
        cancel: "İptal",
        save: "Kaydet",
      }
    : {
        loading: "Loading...",
        title: "Categories",
        subtitle: "Manage your visual project categories",
        newCategory: "New Category",
        deleteConfirm: "Delete this category?",
        deleteTitle: "Delete category",
        deleteMessage:
          "This category, its projects, and generated visuals will be permanently deleted.",
        deleteAction: "Delete category",
        deleteError: "The category could not be deleted. Please try again.",
        loadErrorTitle: "Categories could not be loaded",
        loadErrorMessage:
          "Tasvir cannot reach the API. Check the backend and MySQL connection, then try again.",
        retry: "Retry",
        saveError:
          "The category could not be saved. Check your connection and try again.",
        saving: "Saving...",
        edit: "Edit Category",
        name: "Category name",
        namePlaceholder: "e.g. Doors and Panels",
        description: "Description (optional)",
        descriptionPlaceholder: "Short description",
        color: "Color",
        icon: "Icon",
        changeIcon: "Change icon",
        selectIcon: "Select icon",
        cancel: "Cancel",
        save: "Save",
      };
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const emojiPickerRef = useRef(null);
  const navigate = useNavigate();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchCategories, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchCategories]);

  useEffect(() => {
    const picker = emojiPickerRef.current;
    if (!picker) return;

    const handleEmojiClick = (e) => {
      setForm((prev) => ({ ...prev, icon: e.detail.unicode }));
      setShowEmojiPicker(false);
    };

    picker.addEventListener("emoji-click", handleEmojiClick);
    return () => picker.removeEventListener("emoji-click", handleEmojiClick);
  }, [showEmojiPicker]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setSaveError("");
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditTarget(cat);
    setSaveError("");
    setForm({
      name: cat.name,
      description: cat.description || "",
      icon: cat.icon || "",
      color: cat.color || "#7C3AED",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || saveLoading) return;
    setSaveLoading(true);
    setSaveError("");
    try {
      if (editTarget) {
        await updateCategory(editTarget.id, form);
      } else {
        await createCategory(form);
      }
      setShowModal(false);
      await fetchCategories();
    } catch (err) {
      console.error(err);
      setSaveError(text.saveError);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      await fetchCategories();
    } catch (error) {
      console.error(error);
      setDeleteError(text.deleteError);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <div className="loading">{text.loading}</div>;
  if (loadError) {
    return (
      <StatusState
        title={text.loadErrorTitle}
        message={text.loadErrorMessage}
        actionLabel={text.retry}
        onAction={fetchCategories}
      />
    );
  }

  return (
    <div className="categories-page">
      <div className="page-topbar">
        <div>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + {text.newCategory}
        </button>
      </div>

      <div className="cat-grid">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="cat-card"
            style={{ borderColor: cat.color + "44" }}
            onClick={() => navigate(`/categories/${cat.id}`)}
          >
            <div className="cat-card-top">
              <div
                className="cat-icon"
                style={{ background: cat.color + "22" }}
              >
                {cat.icon}
              </div>
              <div className="cat-actions" onClick={(e) => e.stopPropagation()}>
                <button className="action-btn" onClick={() => openEdit(cat)}>
                  <i className="ti ti-edit" />
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => {
                    setDeleteError("");
                    setDeleteTarget(cat);
                  }}
                >
                  <i className="ti ti-trash" />
                </button>
              </div>
            </div>
            <div className="cat-name">{cat.name}</div>
            {cat.description && (
              <div className="cat-desc">{cat.description}</div>
            )}
            <div className="cat-footer">
              <span className="cat-date">
                {new Date(cat.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}

        <div className="new-cat-card" onClick={openCreate}>
          <span className="new-cat-icon">+</span>
          <span className="new-cat-text">{text.newCategory}</span>
        </div>
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!saveLoading) setShowModal(false);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editTarget ? text.edit : text.newCategory}</h2>

            <div className="form-group">
              <label className="form-label">{text.name}</label>
              <input
                className="form-input"
                placeholder={text.namePlaceholder}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{text.description}</label>
              <input
                className="form-input"
                placeholder={text.descriptionPlaceholder}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">{text.color}</label>
              <div className="color-row">
                {COLORS.map((color) => (
                  <div
                    key={color}
                    className={`color-dot ${
                      form.color === color ? "selected" : ""
                    }`}
                    style={{ background: color }}
                    onClick={() => setForm({ ...form, color })}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{text.icon}</label>
              <div className="emoji-selector">
                <button
                  className="emoji-preview-btn"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <span>{form.icon || "+"}</span>
                  <span className="emoji-change-text">
                    {form.icon ? text.changeIcon : text.selectIcon}
                  </span>
                </button>
                {showEmojiPicker && (
                  <div className="emoji-picker-wrapper">
                    <emoji-picker ref={emojiPickerRef} class="dark" />
                  </div>
                )}
              </div>
            </div>

            {saveError && (
              <div className="modal-form-error" role="alert">
                <i className="ti ti-alert-circle" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
                disabled={saveLoading}
              >
                {text.cancel}
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={!form.name.trim() || saveLoading}
              >
                {saveLoading && <i className="ti ti-loader-2 spin" />}
                {saveLoading ? text.saving : text.save}
              </button>
            </div>
          </div>
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

export default Categories;
