/** In-iframe HTML viewer (PDF.js). Renders PDF in-page — no browser download dialog. */
export function buildDatasheetViewerHtml(sourceUrl: string) {
  const filePath = `/api/datasheet/file?src=${encodeURIComponent(sourceUrl)}`;
  const safeJson = JSON.stringify(filePath);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Datasheet</title>
<style>
  html, body { margin: 0; height: 100%; background: #525659; }
  #status {
    color: #f7f7f7;
    font: 14px/1.5 system-ui, sans-serif;
    text-align: center;
    padding: 24px;
  }
  #pages {
    overflow: auto;
    height: 100%;
    padding: 12px 8px 24px;
    box-sizing: border-box;
  }
  .page {
    display: block;
    margin: 0 auto 16px;
    max-width: 100%;
    height: auto;
    box-shadow: 0 2px 12px rgba(0,0,0,0.35);
    background: #fff;
  }
</style>
</head>
<body>
<p id="status">Loading data sheet…</p>
<div id="pages" hidden></div>
<script type="module">
const fileUrl = ${safeJson};
const statusEl = document.getElementById("status");
const pagesEl = document.getElementById("pages");

try {
  const pdfjs = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

  const loadingTask = pdfjs.getDocument({ url: fileUrl, withCredentials: false });
  const pdf = await loadingTask.promise;

  statusEl.hidden = true;
  pagesEl.hidden = false;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    const maxWidth = Math.min(920, pagesEl.clientWidth - 16 || 920);
    const scale = maxWidth / baseViewport.width;
    const viewport = page.getViewport({ scale: Math.max(scale, 0.85) });

    const canvas = document.createElement("canvas");
    canvas.className = "page";
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    pagesEl.appendChild(canvas);

    await page.render({
      canvasContext: canvas.getContext("2d"),
      viewport,
    }).promise;
  }
} catch (err) {
  statusEl.textContent =
    "Could not display this data sheet. The file may be unavailable or restricted.";
  console.error(err);
}
</script>
</body>
</html>`;
}
