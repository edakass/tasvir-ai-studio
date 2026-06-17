import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useLanguage } from "../../context/language";
import "./ContentPackageHistory.css";

const CONTENT_HISTORY_KEY = "tasvir-content-history";

function ContentPackageHistory() {
  const navigate = useNavigate();
  const { isTurkish } = useLanguage();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CONTENT_HISTORY_KEY) || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });

  const text = isTurkish
    ? {
        title: "Son içerik paketleri",
        description:
          "Bu cihazda oluşturduğun paketleri tekrar açabilir, düzenleyebilir veya silebilirsin.",
        back: "Content Studio'ya dön",
        open: "Aç",
        delete: "Sil",
        cancel: "Vazgeç",
        deleteTitle: "Bu içerik paketi silinsin mi?",
        deleteMessage:
          "Bu paket yalnızca bu cihazdaki geçmişten kaldırılır. Üretilen metinleri tekrar görmek için yeniden oluşturman gerekir.",
        totalPackages: "Kayıtlı paket",
        latestPackage: "Son paket",
        noDate: "Tarih yok",
        emptyTitle: "Henüz kayıtlı paket yok",
        emptyDescription:
          "Bir içerik paketi oluşturduğunda burada görünecek.",
        outputs: "çıktı",
        unknown: "İsimsiz paket",
      }
    : {
        title: "Recent content packages",
        description:
          "Reopen, edit, or remove the content packages created on this device.",
        back: "Back to Content Studio",
        open: "Open",
        delete: "Delete",
        cancel: "Cancel",
        deleteTitle: "Delete this content package?",
        deleteMessage:
          "This removes the package from the history on this device. You will need to generate it again to see the same copy.",
        totalPackages: "Saved packages",
        latestPackage: "Latest package",
        noDate: "No date",
        emptyTitle: "No saved packages yet",
        emptyDescription:
          "Packages you create will appear here.",
        outputs: "outputs",
        unknown: "Untitled package",
      };

  const deleteItem = (id) => {
    setHistory((current) => {
      const next = current.filter((item) => item.id !== id);
      localStorage.setItem(CONTENT_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
    setPendingDelete(null);
  };

  const openItem = (item) => {
    navigate("/content-package", { state: { contentPackage: item } });
  };

  const latestDate = history[0]?.createdAt
    ? new Date(history[0].createdAt).toLocaleString(isTurkish ? "tr-TR" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : text.noDate;

  return (
    <div className="content-history-page">
      <header className="history-page-hero">
        <div>
          <h1>{text.title}</h1>
          <p>{text.description}</p>
        </div>
        <Link to="/content-package" className="package-back">
          <i className="ti ti-arrow-left" />
          {text.back}
        </Link>
      </header>

      <section className="history-overview" aria-label={text.title}>
        <div>
          <span>{text.totalPackages}</span>
          <strong>{history.length}</strong>
        </div>
        <div>
          <span>{text.latestPackage}</span>
          <strong>{latestDate}</strong>
        </div>
      </section>

      {history.length === 0 ? (
        <section className="history-empty-state">
          <span>
            <i className="ti ti-history" />
          </span>
          <h2>{text.emptyTitle}</h2>
          <p>{text.emptyDescription}</p>
          <Link to="/content-package" className="package-primary">
            <i className="ti ti-plus" />
            {text.back}
          </Link>
        </section>
      ) : (
        <section className="history-page-list">
          {history.map((item) => {
            const outputCount = Array.isArray(item.results) ? item.results.length : 0;
            const firstResult = Array.isArray(item.results) ? item.results[0]?.content : "";
            const createdAt = item.createdAt
              ? new Date(item.createdAt).toLocaleString(
                  isTurkish ? "tr-TR" : "en-US",
                  { dateStyle: "medium", timeStyle: "short" }
                )
              : "";

            return (
              <article className="history-package-card" key={item.id}>
                <div className="history-package-top">
                  <span>
                    <i className="ti ti-file-text" />
                  </span>
                  <div>
                    <h2>{item.title || item.productName || text.unknown}</h2>
                    {item.productName && <p>{item.productName}</p>}
                  </div>
                </div>
                {firstResult && <p className="history-package-preview">{firstResult}</p>}
                <div className="history-package-bottom">
                  <div className="history-package-meta">
                    <span>{createdAt}</span>
                    <span>{outputCount} {text.outputs}</span>
                    {item.form?.language && <span>{item.form.language}</span>}
                  </div>
                  <div className="history-package-actions">
                    <button onClick={() => openItem(item)}>
                      <i className="ti ti-arrow-up-right" />
                      {text.open}
                    </button>
                    <button onClick={() => setPendingDelete(item)}>
                      <i className="ti ti-trash" />
                      {text.delete}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={text.deleteTitle}
          message={text.deleteMessage}
          confirmLabel={text.delete}
          cancelLabel={text.cancel}
          onConfirm={() => deleteItem(pendingDelete.id)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

export default ContentPackageHistory;
