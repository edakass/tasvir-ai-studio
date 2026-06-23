import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useLanguage } from "../../context/language";
import "./ContentPackageHistory.css";

const CONTENT_HISTORY_KEY = "tasvir-content-history";
const PACKAGES_PER_PAGE = 5;

function ContentPackageHistory() {
  const navigate = useNavigate();
  const { isTurkish } = useLanguage();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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
        back: "Content Studio'ya dön",
        open: "Aç",
        delete: "Sil",
        cancel: "Vazgeç",
        deleteTitle: "Bu içerik paketi silinsin mi?",
        deleteMessage: "Bu paket geçmişten kaldırılacak.",
        totalPackages: "Kayıtlı paket",
        latestPackage: "Son paket",
        noDate: "Tarih yok",
        emptyTitle: "Henüz kayıtlı paket yok",
        emptyDescription:
          "Bir içerik paketi oluşturduğunda burada görünecek.",
        outputs: "çıktı",
        unknown: "İsimsiz paket",
        search: "Paketlerde ara",
        searchPlaceholder: "Paket veya ürün adı ara...",
        noResultsTitle: "Aramana uygun paket bulunamadı",
        noResultsDescription: "Farklı bir paket veya ürün adıyla tekrar dene.",
        clearSearch: "Aramayı temizle",
        previous: "Önceki",
        next: "Sonraki",
        page: "Sayfa",
      }
    : {
        title: "Recent content packages",
        back: "Back to Content Studio",
        open: "Open",
        delete: "Delete",
        cancel: "Cancel",
        deleteTitle: "Delete this content package?",
        deleteMessage: "This package will be removed from your history.",
        totalPackages: "Saved packages",
        latestPackage: "Latest package",
        noDate: "No date",
        emptyTitle: "No saved packages yet",
        emptyDescription:
          "Packages you create will appear here.",
        outputs: "outputs",
        unknown: "Untitled package",
        search: "Search packages",
        searchPlaceholder: "Search by package or product name...",
        noResultsTitle: "No packages match your search",
        noResultsDescription: "Try another package or product name.",
        clearSearch: "Clear search",
        previous: "Previous",
        next: "Next",
        page: "Page",
      };

  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase(isTurkish ? "tr-TR" : "en-US");
    if (!query) return history;

    return history.filter((item) =>
      [item.title, item.productName]
        .filter(Boolean)
        .some((value) =>
          value.toLocaleLowerCase(isTurkish ? "tr-TR" : "en-US").includes(query)
        )
    );
  }, [history, isTurkish, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PACKAGES_PER_PAGE));
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * PACKAGES_PER_PAGE,
    currentPage * PACKAGES_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

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
        <div className="history-hero-copy">
          <h1>{text.title}</h1>
          {history.length > 0 && (
            <section className="history-controls" aria-label={text.search}>
              <label className="history-search">
                <i className="ti ti-search" aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={text.searchPlaceholder}
                  aria-label={text.search}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    aria-label={text.clearSearch}
                  >
                    <i className="ti ti-x" />
                  </button>
                )}
              </label>
            </section>
          )}
        </div>
        <div className="history-hero-aside">
          <Link to="/content-package" className="package-back">
            <i className="ti ti-arrow-left" />
            {text.back}
          </Link>
          <section className="history-overview" aria-label={text.title}>
            <div className="history-overview-item">
              <span className="history-overview-icon" aria-hidden="true">
                <i className="ti ti-folders" />
              </span>
              <div>
                <span>{text.totalPackages}</span>
                <strong>{history.length}</strong>
              </div>
            </div>
            <div className="history-overview-item">
              <span className="history-overview-icon" aria-hidden="true">
                <i className="ti ti-clock" />
              </span>
              <div>
                <span>{text.latestPackage}</span>
                <strong>{latestDate}</strong>
              </div>
            </div>
          </section>
        </div>
      </header>

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
      ) : filteredHistory.length === 0 ? (
        <section className="history-empty-state history-no-results">
          <span>
            <i className="ti ti-search-off" />
          </span>
          <h2>{text.noResultsTitle}</h2>
          <p>{text.noResultsDescription}</p>
          <button
            className="package-back"
            onClick={() => {
              setSearchQuery("");
              setCurrentPage(1);
            }}
          >
            {text.clearSearch}
          </button>
        </section>
      ) : (
        <>
        <section className="history-page-list">
          {paginatedHistory.map((item) => {
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
                    {item.form?.language && <span>{item.form.language}</span>}
                    <span>{outputCount} {text.outputs}</span>
                    <span>{createdAt}</span>
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

        {totalPages > 1 && (
          <nav className="history-pagination" aria-label={text.page}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
            >
              <i className="ti ti-chevron-left" />
              {text.previous}
            </button>
            <div>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={page === currentPage ? "active" : ""}
                    onClick={() => setCurrentPage(page)}
                    aria-label={`${text.page} ${page}`}
                    aria-current={page === currentPage ? "page" : undefined}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              {text.next}
              <i className="ti ti-chevron-right" />
            </button>
          </nav>
        )}
        </>
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
