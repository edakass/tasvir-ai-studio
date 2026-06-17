import { Link, useLocation } from "react-router-dom";
import { useMemo, useRef, useState } from "react";
import { generateContentPackage } from "../../api/content";
import { useLanguage } from "../../context/language";
import tasvirMark from "../../assets/tasvir-mark.svg";
import "./ContentPackage.css";

const OUTPUTS = [
  ["instagram", "ti-brand-instagram", "Instagram caption", "Instagram açıklaması"],
  ["story", "ti-device-mobile", "Story copy", "Story metni"],
  ["advertisement", "ti-ad", "Ad headlines", "Reklam başlıkları"],
  ["product", "ti-package", "Product description", "Ürün açıklaması"],
  ["hashtags", "ti-hash", "Hashtags", "Hashtag"],
  ["cta", "ti-click", "CTA (Call to Action)", "CTA (Eyleme çağrı)"],
  ["carousel", "ti-layout-board-split", "Slide post plan", "Kaydırmalı post planı"],
];

const TONES = [
  ["friendly", "Friendly", "Samimi"],
  ["professional", "Professional", "Profesyonel"],
  ["energetic", "Energetic", "Enerjik"],
  ["luxury", "Luxury", "Lüks"],
  ["informative", "Informative", "Bilgilendirici"],
];

const GOALS = [
  ["promotion", "Promotion", "Tanıtım"],
  ["sales", "Sales", "Satış"],
  ["engagement", "Engagement", "Etkileşim"],
  ["information", "Information", "Bilgilendirme"],
];

const LENGTHS = [
  ["short", "Short", "Kısa"],
  ["standard", "Standard", "Standart"],
  ["detailed", "Detailed", "Detaylı"],
];

const LANGUAGES = [
  ["Türkçe", "Türkçe", "Türkçe"],
  ["English", "English", "English"],
];

const CONTENT_HISTORY_KEY = "tasvir-content-history";
const MAX_HISTORY_ITEMS = 12;
const CJK_TEXT_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g;

function cleanLanguageArtifacts(value, selectedLanguage) {
  const isTurkishOutput = selectedLanguage === "Türkçe";
  const replacements = {
    walnut纹理: isTurkishOutput ? "ceviz dokusu" : "walnut texture",
    纹理: isTurkishOutput ? " doku" : " texture",
    质感: isTurkishOutput ? " doku" : " texture",
    颜色: isTurkishOutput ? " renk" : " color",
    材料: isTurkishOutput ? " malzeme" : " material",
    风格: isTurkishOutput ? " stil" : " style",
  };

  return Object.entries(replacements)
    .reduce(
      (text, [source, replacement]) => text.replaceAll(source, replacement),
      String(value || "")
    )
    .replace(CJK_TEXT_RE, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function getLocalizedPackageTitle(form, text, isTurkish) {
  const projectName = form.projectName?.trim();
  const productName = form.productName?.trim();

  if (projectName === "New season launch" || projectName === "Yeni sezon tanıtımı") {
    return isTurkish ? "Yeni sezon tanıtımı" : "New season launch";
  }

  if (productName === "Modern walnut interior door" || productName === "Modern ceviz iç kapı") {
    return isTurkish ? "Modern ceviz iç kapı" : "Modern walnut interior door";
  }

  return projectName || productName || text.fallbackTitle;
}

function StudioSelect({
  id,
  label,
  value,
  options,
  isTurkish,
  openDropdown,
  setOpenDropdown,
  onChange,
}) {
  const current = options.find(([optionValue]) => optionValue === value);
  const isOpen = openDropdown === id;

  return (
    <label className="studio-select-field" onClick={(event) => event.stopPropagation()}>
      <span>{label}</span>
      <div className={`studio-select ${isOpen ? "open" : ""}`}>
        <button
          type="button"
          className="studio-select-trigger"
          onClick={() => setOpenDropdown(isOpen ? "" : id)}
        >
          <span>{current?.[isTurkish ? 2 : 1] || value}</span>
          <i className={`ti ${isOpen ? "ti-chevron-up" : "ti-chevron-down"}`} />
        </button>
        {isOpen && (
          <div className="studio-select-menu">
            {options.map(([optionValue, en, tr]) => {
              const selected = optionValue === value;
              return (
                <button
                  key={optionValue}
                  type="button"
                  className={selected ? "selected" : ""}
                  onClick={() => {
                    onChange(optionValue);
                    setOpenDropdown("");
                  }}
                >
                  <span>{isTurkish ? tr : en}</span>
                  {selected && <i className="ti ti-check" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </label>
  );
}

function ContentPackage() {
  const { isTurkish, language } = useLanguage();
  const location = useLocation();
  const loadedPackage = location.state?.contentPackage;
  const lockRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [copyError, setCopyError] = useState("");
  const [openDropdown, setOpenDropdown] = useState("");
  const [results, setResults] = useState(() =>
    Array.isArray(loadedPackage?.results) ? loadedPackage.results : []
  );
  const [edits, setEdits] = useState({});
  const [history, setHistory] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CONTENT_HISTORY_KEY) || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState(() => ({
    projectName: "",
    productName: "",
    description: "",
    audience: "",
    tone: "professional",
    goal: "promotion",
    contentLength: "short",
    language: language === "tr" ? "Türkçe" : "English",
    selectedOutputs: ["instagram", "story", "product", "hashtags"],
    ...(loadedPackage?.form || {}),
  }));

  const text = isTurkish
    ? {
        kicker: "Content Studio",
        title: "Markan için yayın hazır içerik paketi oluştur",
        description:
          "Ürününü veya fikrini yapılandırılmış bir brief'e dönüştür. Tasvir; açıklama, story, reklam metni ve sosyal medya çıktıları için düzenlenebilir bir yayın paketi hazırlar.",
        briefTitle: "Kaynak içerik",
        briefHint: "Ürünü, hedefi ve bağlamı net bir başlangıç noktasına dönüştür.",
        projectName: "Paket adı",
        projectPlaceholder: "Örn. Yeni sezon tanıtımı",
        productName: "Ürün veya konu *",
        productPlaceholder: "Örn. Modern ceviz iç kapı",
        descriptionLabel: "Kısaca anlat *",
        descriptionPlaceholder:
          "Ne tanıtılıyor, kime hitap ediyor, öne çıkan faydası ne?",
        audience: "Hedef kitle",
        audiencePlaceholder: "Örn. Ev sahipleri, mimarlar, küçük işletmeler",
        settingsTitle: "Üretim ayarı",
        settingsHint: "Ton, amaç ve çıktı kapsamını sade tut.",
        tone: "Ton",
        goal: "Amaç",
        length: "Uzunluk",
        language: "Dil",
        outputsTitle: "Çıktılar",
        outputsHint: "Hızlı başlangıç için temel paket seçili. İstersen reklam, CTA ve kaydırmalı post planı ekleyebilirsin.",
        selectedOutputs: "Seçilen çıktılar",
        selected: "seçili",
        generate: "Paketi oluştur",
        generating: "Hazırlanıyor...",
        required: "Ürün veya konu ve kısa açıklama gerekli.",
        sample: "Örnek doldur",
        ready: "Paket hazır",
        resultDescription: "Metinleri düzenleyebilir, tek tek veya topluca kopyalayabilirsin.",
        edit: "Düzenle",
        newPackage: "Yeni paket",
        copy: "Kopyala",
        copied: "Kopyalandı",
        copyAll: "Tümünü kopyala",
        download: "TXT indir",
        pdf: "PDF hazırla",
        allCopied: "Paket kopyalandı",
        historyTitle: "Son paketler",
        historyHint: "Bu cihazda oluşturulan son içerik paketleri.",
        historyLink: "Son paketleri görüntüle",
        historyEmpty: "Henüz kayıtlı paket yok.",
        open: "Aç",
        delete: "Sil",
        createdAt: "Oluşturulma",
        copyFailed: "Kopyalanamadı. Tarayıcı pano iznini kontrol et.",
        ollamaUnavailable:
          "Ollama'ya bağlanılamadı. Ollama'yı başlatıp tekrar dene.",
        timeout:
          "Yerel model yanıt vermek için çok uzun sürdü. Daha az çıktı seçip tekrar deneyebilirsin.",
        failed: "İçerik paketi oluşturulamadı. Bilgileri kontrol edip tekrar dene.",
        fallbackTitle: "Yeni içerik paketi",
      }
    : {
        kicker: "Content Studio",
        title: "Create a publish-ready content package",
        description:
          "Turn a product or idea into a structured brief. Tasvir prepares editable captions, story copy, ad lines, and social content in one polished workspace.",
        briefTitle: "Source content",
        briefHint: "Turn the product, goal, and context into a clear starting point.",
        projectName: "Package name",
        projectPlaceholder: "e.g. New season launch",
        productName: "Product or topic *",
        productPlaceholder: "e.g. Modern walnut interior door",
        descriptionLabel: "Describe it briefly *",
        descriptionPlaceholder:
          "What is being promoted, who is it for, and what is the main benefit?",
        audience: "Target audience",
        audiencePlaceholder: "e.g. Homeowners, architects, small businesses",
        settingsTitle: "Production setup",
        settingsHint: "Keep the tone, goal, and output scope simple.",
        tone: "Tone",
        goal: "Goal",
        length: "Length",
        language: "Language",
        outputsTitle: "Outputs",
        outputsHint: "The starter package is selected for speed. Add ads, CTA, or a slide post plan when needed.",
        selectedOutputs: "Selected outputs",
        selected: "selected",
        generate: "Create package",
        generating: "Preparing...",
        required: "Product or topic and short description are required.",
        sample: "Fill example",
        ready: "Package ready",
        resultDescription: "Edit, copy individually, or export the whole package.",
        edit: "Edit",
        newPackage: "New package",
        copy: "Copy",
        copied: "Copied",
        copyAll: "Copy all",
        download: "Download TXT",
        pdf: "Prepare PDF",
        allCopied: "Package copied",
        historyTitle: "Recent packages",
        historyHint: "Content packages created on this device.",
        historyLink: "View recent packages",
        historyEmpty: "No saved packages yet.",
        open: "Open",
        delete: "Delete",
        createdAt: "Created",
        copyFailed: "Copy failed. Check browser clipboard permission.",
        ollamaUnavailable:
          "Tasvir could not connect to Ollama. Start Ollama and try again.",
        timeout: "The local model took too long to respond. Select fewer outputs and try again.",
        failed: "The content package could not be created. Check the details and try again.",
        fallbackTitle: "New content package",
      };

  const visibleResults = useMemo(
    () =>
      results.map((result) => {
        const output = OUTPUTS.find(([id]) => id === result.id);
        return {
          ...result,
          icon: output?.[1] || "ti-file-text",
          title: output?.[isTurkish ? 3 : 2] || result.id,
          content: cleanLanguageArtifacts(
            edits[result.id] ?? result.content,
            form.language
          ),
        };
      }),
    [edits, form.language, isTurkish, results]
  );

  const canGenerate = form.productName.trim() && form.description.trim();
  const packageTitle = getLocalizedPackageTitle(form, text, isTurkish);

  const saveHistory = (nextItem) => {
    setHistory((current) => {
      const next = [
        nextItem,
        ...current.filter((item) => item.id !== nextItem.id),
      ].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(CONTENT_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const update = (field, value) => {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleOutput = (id) => {
    setForm((current) => {
      const selected = current.selectedOutputs.includes(id);
      if (selected && current.selectedOutputs.length === 1) return current;
      return {
        ...current,
        selectedOutputs: selected
          ? current.selectedOutputs.filter((item) => item !== id)
          : [...current.selectedOutputs, id],
      };
    });
  };

  const fillExample = () => {
    setForm((current) => ({
      ...current,
      projectName: isTurkish ? "Yeni sezon tanıtımı" : "New season launch",
      productName: isTurkish
        ? "Modern ceviz iç kapı"
        : "Modern walnut interior door",
      description: isTurkish
        ? "Doğal ceviz dokusunu sade çizgilerle birleştiren, modern evler için tasarlanmış iç kapı."
        : "An interior door for modern homes, combining natural walnut texture with clean lines.",
      audience: isTurkish ? "Ev sahipleri ve mimarlar" : "Homeowners and architects",
    }));
  };

  const getPackageText = () => {
    const title = packageTitle;
    return [
      title,
      "=".repeat(title.length),
      ...visibleResults.flatMap((result) => [
        "",
        result.title.toUpperCase(),
        result.content,
      ]),
    ].join("\n");
  };

  const writeToClipboard = async (value) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return;
      } catch {
        // Fallback below handles restricted clipboard permission.
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Clipboard write failed");
  };

  const copyText = async (id, value) => {
    setCopyError("");
    try {
      await writeToClipboard(value);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(""), 1400);
    } catch (error) {
      console.error(error);
      setCopiedId("");
      setCopyError(id);
    }
  };

  const downloadPackage = () => {
    const fileBase = (form.projectName || form.productName || "tasvir-content")
      .toLocaleLowerCase("en-US")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const blob = new Blob([getPackageText()], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileBase || "tasvir-content"}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const exportPdf = () => {
    const title = packageTitle;
    const createdDate = new Date().toLocaleString(isTurkish ? "tr-TR" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const toneLabel =
      TONES.find(([value]) => value === form.tone)?.[isTurkish ? 2 : 1] || form.tone;
    const sections = visibleResults
      .map(
        (result, index) => `
          <section class="pdf-section">
            <div class="pdf-section-heading">
              <span>${String(index + 1).padStart(2, "0")}</span>
              <h2>${escapeHtml(result.title)}</h2>
            </div>
            <p>${escapeHtml(result.content).replace(/\n/g, "<br />")}</p>
          </section>
        `
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(title)} - Tasvir</title>
          <style>
            * { box-sizing: border-box; }
            html {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              margin: 0;
              padding: 22px;
              color: #17131f;
              font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background:
                radial-gradient(circle at 88% 0%, rgba(139, 92, 246, 0.12), transparent 34%),
                #f7f4ee;
            }
            .pdf-page {
              overflow: hidden;
              border: 1px solid #ded7ea;
              border-radius: 22px;
              background: #fffdf9;
              box-shadow: 0 24px 70px rgba(28, 22, 44, 0.12);
            }
            .pdf-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 24px;
              margin: 0;
              padding: 18px 26px;
              border: 0;
              border-radius: 0;
              background:
                radial-gradient(circle at 9% 0%, rgba(139, 92, 246, 0.22), transparent 28%),
                linear-gradient(180deg, #080d19, #0b1020);
              border-bottom: 1px solid rgba(148, 163, 184, 0.16);
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .pdf-brand {
              display: flex;
              align-items: center;
              gap: 12px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .pdf-brand img {
              width: 34px;
              height: 34px;
              filter: drop-shadow(0 0 14px rgba(139, 92, 246, 0.42));
            }
            .pdf-brand strong {
              display: inline-flex;
              align-items: center;
              gap: 12px;
              color: #ffffff;
              font-size: 16px;
              letter-spacing: 0.22em;
            }
            .pdf-brand strong::after {
              content: "";
              width: 1px;
              height: 18px;
              background: rgba(196, 181, 253, 0.45);
            }
            .pdf-brand span {
              display: inline-block;
              color: #a78bfa;
              font-size: 13px;
              font-weight: 800;
            }
            .pdf-meta {
              color: #c4b5fd;
              font-size: 11px;
              line-height: 1.6;
              text-align: right;
            }
            .pdf-cover {
              padding: 24px 28px 18px;
              border-bottom: 1px solid #ebe5f2;
              background:
                radial-gradient(circle at 100% 0%, rgba(124, 58, 237, 0.08), transparent 35%),
                linear-gradient(180deg, #fffdf9, #fbfaf7);
            }
            h1 {
              margin: 0 0 8px;
              max-width: 680px;
              color: #17131f;
              font-size: 32px;
              line-height: 1.1;
              letter-spacing: -0.055em;
            }
            .pdf-subtitle {
              max-width: 660px;
              margin: 0;
              color: #6b6377;
              font-size: 13px;
              line-height: 1.55;
            }
            .pdf-meta-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin-top: 18px;
            }
            .pdf-meta-card {
              padding: 11px 12px;
              border: 1px solid #e7e0ee;
              border-radius: 14px;
              background: #ffffff;
            }
            .pdf-meta-card span {
              display: block;
              margin-bottom: 6px;
              color: #7c3aed;
              font-size: 10px;
              font-weight: 900;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }
            .pdf-meta-card strong {
              color: #252033;
              font-size: 13px;
            }
            .pdf-content {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
              padding: 16px 28px 28px;
            }
            .pdf-section {
              break-inside: avoid;
              min-height: 150px;
              margin: 0;
              padding: 16px 17px;
              border: 1px solid #e2dceb;
              border-radius: 18px;
              background:
                linear-gradient(180deg, #ffffff, #fbfaf7);
              box-shadow: 0 10px 24px rgba(28, 22, 44, 0.045);
            }
            .pdf-section-heading {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 10px;
            }
            .pdf-section-heading span {
              display: grid;
              width: 26px;
              height: 26px;
              place-items: center;
              border-radius: 9px;
              background: #ede9fe;
              color: #4c1d95;
              font-size: 10px;
              font-weight: 900;
            }
            .pdf-section h2 {
              margin: 0;
              color: #31234f;
              font-size: 13px;
              letter-spacing: -0.01em;
            }
            .pdf-section p {
              margin: 0;
              color: #2d2738;
              font-size: 11.5px;
              line-height: 1.62;
              white-space: normal;
            }
            .pdf-section:nth-child(7),
            .pdf-section:last-child:nth-child(odd) {
              grid-column: 1 / -1;
            }
            @media print {
              body { padding: 12px; background: #ffffff; }
              .pdf-page { box-shadow: none; }
              .pdf-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <article class="pdf-page">
            <header class="pdf-header">
              <div class="pdf-brand">
                <img src="${tasvirMark}" alt="" />
                <strong>TASVIR</strong>
                <span>AI Studio</span>
              </div>
              <div class="pdf-meta">
                ${escapeHtml(text.createdAt)}<br />
                ${escapeHtml(createdDate)}
              </div>
            </header>
            <main>
              <section class="pdf-cover">
                <h1>${escapeHtml(title)}</h1>
                <p class="pdf-subtitle">${escapeHtml(form.productName || title)}</p>
                <div class="pdf-meta-grid">
                  <div class="pdf-meta-card">
                    <span>${escapeHtml(text.outputsTitle)}</span>
                    <strong>${visibleResults.length}</strong>
                  </div>
                  <div class="pdf-meta-card">
                    <span>${escapeHtml(text.language)}</span>
                    <strong>${escapeHtml(form.language)}</strong>
                  </div>
                  <div class="pdf-meta-card">
                    <span>${escapeHtml(text.tone)}</span>
                    <strong>${escapeHtml(toneLabel)}</strong>
                  </div>
                </div>
              </section>
              <section class="pdf-content">
                ${sections}
              </section>
            </main>
          </article>
          <script>
            window.onload = () => {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const generate = async () => {
    if (!canGenerate || lockRef.current) return;
    lockRef.current = true;
    setLoading(true);
    setError("");

    try {
      const response = await generateContentPackage({
        project_name: form.projectName || null,
        product_name: form.productName || null,
        description: form.description || null,
        features: null,
        sector: null,
        audience: form.audience || null,
        tone: form.tone,
        goal: form.goal,
        output_language: form.language === "Türkçe" ? "tr" : "en",
        brand_name: null,
        campaign: null,
        include_carousel: form.selectedOutputs.includes("carousel"),
        content_length: form.contentLength,
        selected_outputs: form.selectedOutputs,
      });

      if (!Array.isArray(response.data?.results) || !response.data.results.length) {
        throw new Error("Content service returned no results");
      }

      setResults(response.data.results);
      setEdits({});
      saveHistory({
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: form.projectName || form.productName || text.fallbackTitle,
        productName: form.productName,
        form,
        results: response.data.results,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      if (error.response?.status === 503) setError(text.ollamaUnavailable);
      else if (error.response?.status === 504 || error.code === "ECONNABORTED") {
        setError(text.timeout);
      } else setError(text.failed);
    } finally {
      setLoading(false);
      lockRef.current = false;
    }
  };

  const reset = () => {
    setResults([]);
    setEdits({});
    setError("");
    setCopyError("");
  };

  return (
    <div className="content-package-page" onClick={() => setOpenDropdown("")}>
      {results.length === 0 ? (
        <>
          <header className="package-hero">
            <div>
              <h1>{text.title}</h1>
              <p>{text.description}</p>
            </div>
            <Link to="/content-package/history" className="history-inline-link">
              <i className="ti ti-history" />
              {text.historyLink}
              {history.length > 0 && <span>{history.length}</span>}
            </Link>
          </header>
          <section className="package-builder">
          <div className="brief-card">
            <div className="section-title">
              <div>
                <h2>{text.briefTitle}</h2>
                <p>{text.briefHint}</p>
              </div>
              <button onClick={fillExample}>
                <i className="ti ti-wand" />
                {text.sample}
              </button>
            </div>

            <div className="simple-form-grid">
              <label>
                <span>{text.projectName}</span>
                <input
                  value={form.projectName}
                  onChange={(event) => update("projectName", event.target.value)}
                  placeholder={text.projectPlaceholder}
                />
              </label>
              <label>
                <span>{text.productName}</span>
                <input
                  value={form.productName}
                  onChange={(event) => update("productName", event.target.value)}
                  placeholder={text.productPlaceholder}
                />
              </label>
              <label className="wide">
                <span>{text.descriptionLabel}</span>
                <textarea
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder={text.descriptionPlaceholder}
                  rows={5}
                />
              </label>
              <label className="wide">
                <span>{text.audience}</span>
                <input
                  value={form.audience}
                  onChange={(event) => update("audience", event.target.value)}
                  placeholder={text.audiencePlaceholder}
                />
              </label>
            </div>

            <div className="outputs-block">
              <div>
                <h3>{text.outputsTitle}</h3>
                <p>{text.outputsHint}</p>
              </div>
              <div className="simple-output-grid">
                {OUTPUTS.map(([id, icon, en, tr]) => {
                  const active = form.selectedOutputs.includes(id);
                  return (
                    <button
                      key={id}
                      className={active ? "active" : ""}
                      onClick={() => toggleOutput(id)}
                    >
                      <i className={`ti ${icon}`} />
                      {isTurkish ? tr : en}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="settings-card">
            <div className="section-title compact">
              <div>
                <h2>{text.settingsTitle}</h2>
                <p>{text.settingsHint}</p>
              </div>
            </div>

            <div className="simple-control">
              <span>{text.tone}</span>
              <div>
                {TONES.map(([value, en, tr]) => (
                  <button
                    key={value}
                    className={form.tone === value ? "active" : ""}
                    onClick={() => update("tone", value)}
                  >
                    {isTurkish ? tr : en}
                  </button>
                ))}
              </div>
            </div>

            <div className="simple-control">
              <span>{text.goal}</span>
              <div>
                {GOALS.map(([value, en, tr]) => (
                  <button
                    key={value}
                    className={form.goal === value ? "active" : ""}
                    onClick={() => update("goal", value)}
                  >
                    {isTurkish ? tr : en}
                  </button>
                ))}
              </div>
            </div>

            <div className="inline-controls">
              <StudioSelect
                id="length"
                label={text.length}
                value={form.contentLength}
                options={LENGTHS}
                isTurkish={isTurkish}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                onChange={(value) => update("contentLength", value)}
              />
              <StudioSelect
                id="language"
                label={text.language}
                value={form.language}
                options={LANGUAGES}
                isTurkish={isTurkish}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                onChange={(value) => update("language", value)}
              />
            </div>

            <div className="package-submit">
              <span>
                {form.selectedOutputs.length} {text.selected}
              </span>
              <button disabled={!canGenerate || loading} onClick={generate}>
                {loading ? (
                  <>
                    <i className="ti ti-loader-2 spin" />
                    {text.generating}
                  </>
                ) : (
                  <>
                    <i className="ti ti-sparkles" />
                    {text.generate}
                  </>
                )}
              </button>
            </div>

            {!canGenerate && <small className="required-note">{text.required}</small>}
            {error && (
              <div className="content-generation-error" role="alert">
                <i className="ti ti-alert-circle" />
                <span>{error}</span>
              </div>
            )}
          </aside>
          </section>
        </>
      ) : (
        <section className="results-section">
          <div className="results-heading">
            <div className="results-title-row">
              <div>
                <span className="page-kicker">{text.ready}</span>
                <h2>{packageTitle}</h2>
                <p>{text.resultDescription}</p>
                <div className="results-meta-chips">
                  <span>
                    <strong>{visibleResults.length}</strong>
                    {text.outputsTitle}
                  </span>
                  <span>
                    <strong>{form.language}</strong>
                    {text.language}
                  </span>
                  <span>
                    <strong>
                      {TONES.find(([value]) => value === form.tone)?.[
                        isTurkish ? 2 : 1
                      ]}
                    </strong>
                    {text.tone}
                  </span>
                </div>
              </div>
              <div className="results-actions">
                <button className="package-primary" onClick={reset}>
                  <i className="ti ti-plus" />
                  {text.newPackage}
                </button>
                <div className="results-action-group">
                  <button
                    className="package-back"
                    onClick={() => copyText("all", getPackageText())}
                  >
                    <i className={`ti ${copiedId === "all" ? "ti-check" : "ti-copy"}`} />
                    {copiedId === "all" ? text.allCopied : text.copyAll}
                  </button>
                  <button className="package-back" onClick={downloadPackage}>
                    <i className="ti ti-download" />
                    {text.download}
                  </button>
                  <button className="package-back" onClick={exportPdf}>
                    <i className="ti ti-file-type-pdf" />
                    {text.pdf}
                  </button>
                </div>
                <div className="results-action-group compact">
                  <button className="package-back" onClick={reset}>
                    <i className="ti ti-pencil" />
                    {text.edit}
                  </button>
                  <Link to="/content-package/history" className="package-back">
                    <i className="ti ti-history" />
                    {text.historyTitle}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {copyError === "all" && (
            <div className="result-copy-error package-copy-error" role="alert">
              <i className="ti ti-alert-circle" />
              <span>{text.copyFailed}</span>
            </div>
          )}

          <div className="result-layout">
            <div className={`result-grid result-count-${visibleResults.length}`}>
            {visibleResults.map((result) => (
              <article
                className={`content-result-card ${
                  result.id === "carousel" ? "wide" : ""
                }`}
                key={result.id}
              >
                <div className="result-card-header">
                  <div>
                    <span>
                      <i className={`ti ${result.icon}`} />
                    </span>
                    <h3>{result.title}</h3>
                  </div>
                  <button onClick={() => copyText(result.id, result.content)}>
                    <i className={`ti ${copiedId === result.id ? "ti-check" : "ti-copy"}`} />
                    {copiedId === result.id ? text.copied : text.copy}
                  </button>
                </div>
                <textarea
                  value={result.content}
                  onChange={(event) =>
                    setEdits((current) => ({
                      ...current,
                      [result.id]: event.target.value,
                    }))
                  }
                  rows={result.id === "carousel" ? 7 : 5}
                />
                {copyError === result.id && (
                  <div className="result-copy-error" role="alert">
                    <i className="ti ti-alert-circle" />
                    <span>{text.copyFailed}</span>
                  </div>
                )}
              </article>
            ))}
            </div>
          </div>

        </section>
      )}
    </div>
  );
}

export default ContentPackage;
