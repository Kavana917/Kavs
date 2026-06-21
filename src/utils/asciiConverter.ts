// Darkest to brightest — reference style with extra shadow/mid steps
export const ASCII_CHARS = [' ', '·', '.', ':', 'K', '|', '█'] as const

export const ASCII_CONFIG = {
  contrast: 2.25,
  brightness: 0.05,
  shadowLift: 0.68,
  highlightGamma: 1.08,
  charWidthRatio: 0.6,
  lineHeightRatio: 1.05,
  targetCols: 200,
  sampleScale: 2,
} as const

function applyTone(value: number): number {
  const { contrast, brightness, shadowLift, highlightGamma } = ASCII_CONFIG

  // Lift shadows first so darker regions (skin, lids) keep texture
  let v = Math.pow(value, shadowLift)

  v = (v - 0.5) * contrast + 0.5 + brightness
  v = Math.max(0, Math.min(1, v))

  // Emphasize highlights for iris / sclera definition
  v = Math.pow(v, 1 / highlightGamma)

  return v
}

function averageLuminance(
  data: Uint8ClampedArray,
  width: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number {
  let r = 0
  let g = 0
  let b = 0
  let count = 0

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
      count++
    }
  }

  if (count === 0) return 0
  return (0.299 * r + 0.587 * g + 0.114 * b) / (255 * count)
}

export function luminanceToChar(r: number, g: number, b: number): string {
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return toneToChar(lum)
}

function toneToChar(lum: number): string {
  const toned = applyTone(lum)
  const stretched = Math.pow(toned, 0.9)
  const index = Math.min(
    ASCII_CHARS.length - 1,
    Math.floor(stretched * ASCII_CHARS.length),
  )
  return ASCII_CHARS[index]
}

export function computeGridSize(
  viewportWidth: number,
  viewportHeight: number,
  videoWidth: number,
  videoHeight: number,
): {
  cols: number
  rows: number
  fontSize: number
  canvasHeight: number
  sampleScale: number
} {
  const { targetCols, charWidthRatio, lineHeightRatio, sampleScale } =
    ASCII_CONFIG

  const cols = Math.min(
    targetCols,
    Math.max(60, Math.floor(viewportWidth / 5)),
  )
  const rows = Math.max(
    1,
    Math.round(
      (cols * charWidthRatio * videoHeight) /
        (lineHeightRatio * videoWidth),
    ),
  )

  const fontSizeFromWidth = viewportWidth / (cols * charWidthRatio)
  const fontSizeFromHeight = viewportHeight / (rows * lineHeightRatio)
  const fontSize = Math.max(fontSizeFromWidth, fontSizeFromHeight)

  const canvasHeight = Math.max(1, Math.round((cols * videoHeight) / videoWidth))

  return { cols, rows, fontSize, canvasHeight, sampleScale }
}

export function drawVideoFit(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
): void {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(video, 0, 0, width, height)
}

export function frameToAscii(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
): string {
  const sampleWidth = ctx.canvas.width
  const sampleHeight = ctx.canvas.height
  const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight)
  const { data } = imageData

  const lines: string[] = []
  for (let y = 0; y < rows; y++) {
    const y0 = Math.floor((y / rows) * sampleHeight)
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) / rows) * sampleHeight))
    let line = ''
    for (let x = 0; x < cols; x++) {
      const x0 = Math.floor((x / cols) * sampleWidth)
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) / cols) * sampleWidth))
      const lum = averageLuminance(data, sampleWidth, x0, y0, x1, y1)
      line += toneToChar(lum)
    }
    lines.push(line)
  }
  return lines.join('\n')
}
