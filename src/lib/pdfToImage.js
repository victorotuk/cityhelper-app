/**
 * Get pdfjs lib and ensure worker is set. Shared by both helpers.
 * @returns {Promise<typeof import('pdfjs-dist')>}
 */
async function getPdfJs() {
  const pdfjsLib = await import('pdfjs-dist')
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  }
  return pdfjsLib
}

/**
 * Render one page of a loaded PDF to a JPEG data URL.
 * @param {import('pdfjs-dist').PDFPageProxy} page
 * @param {number} scale
 * @returns {Promise<string>}
 */
async function renderPageToImageUrl(page, scale = 1.5) {
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport }).promise
  return canvas.toDataURL('image/jpeg', 0.85)
}

/**
 * Render the first page of a PDF file to a JPEG data URL for vision APIs (e.g. ai-scan).
 * @param {File} file - PDF file
 * @returns {Promise<string>} data URL (data:image/jpeg;base64,...)
 */
export async function pdfFirstPageToImageUrl(file) {
  const pdfjsLib = await getPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(1)
  return renderPageToImageUrl(page)
}

/**
 * Render every page of a PDF to JPEG data URLs (for multi-page scan).
 * @param {File} file - PDF file
 * @returns {Promise<{ count: number, imageUrls: string[] }>}
 */
export async function pdfAllPagesToImageUrls(file) {
  const pdfjsLib = await getPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const count = pdf.numPages
  const imageUrls = []
  for (let i = 1; i <= count; i++) {
    const page = await pdf.getPage(i)
    imageUrls.push(await renderPageToImageUrl(page))
  }
  return { count, imageUrls }
}
