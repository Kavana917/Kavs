// Darkest to brightest — reference style with extra shadow/mid steps
export const ASCII_CHARS = [' ', '·', '.', ':', 'K', '|', '█'] as const

// Art/craft themed palette — darkest to brightest
export const PROJECTS_ASCII_CHARS = [
  ' ',
  '·',
  "'",
  ':',
  ';',
  '!',
  'i',
  'l',
  'L',
  'T',
  'I',
  'J',
  '#',
  '@',
] as const

// Per-tier alternates for subtle shimmer (same perceived density)
export const PROJECTS_CHAR_VARIANTS: readonly (readonly string[])[] = [
  [' '],
  ['·', '.'],
  ["'", '`'],
  [':', ','],
  [';', ':'],
  ['!', '1'],
  ['i', 'j', 'r'],
  ['l', '|', '!'],
  ['L', 'l', 'I'],
  ['T', 't', 'F'],
  ['I', 'H', 'E'],
  ['J', 'L', 'U'],
  ['#', '%', '&'],
  ['@', 'W', 'M'],
]

export type AsciiToneConfig = {
  contrast: number
  brightness: number
  shadowLift: number
  highlightGamma: number
  charWidthRatio: number
  lineHeightRatio: number
  targetCols: number
  sampleScale: number
}

export const ASCII_CONFIG: AsciiToneConfig = {
  contrast: 2.25,
  brightness: 0.05,
  shadowLift: 0.68,
  highlightGamma: 1.08,
  charWidthRatio: 0.6,
  lineHeightRatio: 1.05,
  targetCols: 200,
  sampleScale: 2,
}

export const PROJECTS_ASCII_CONFIG: AsciiToneConfig = {
  contrast: 2.5,
  brightness: 0.05,
  shadowLift: 0.62,
  highlightGamma: 1.12,
  charWidthRatio: 0.6,
  lineHeightRatio: 1.05,
  targetCols: 220,
  sampleScale: 2,
}

export type FrameToAsciiOptions = {
  palette?: readonly string[]
  variants?: readonly (readonly string[])[]
  frameTick?: number
  config?: AsciiToneConfig
}

function applyTone(value: number, config: AsciiToneConfig): number {
  const { contrast, brightness, shadowLift, highlightGamma } = config

  let v = Math.pow(value, shadowLift)
  v = (v - 0.5) * contrast + 0.5 + brightness
  v = Math.max(0, Math.min(1, v))
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

function toneToIndex(lum: number, paletteLength: number, config: AsciiToneConfig): number {
  const toned = applyTone(lum, config)
  const stretched = Math.pow(toned, 0.9)
  return Math.min(paletteLength - 1, Math.floor(stretched * paletteLength))
}

function toneToChar(
  lum: number,
  palette: readonly string[],
  config: AsciiToneConfig,
): string {
  const index = toneToIndex(lum, palette.length, config)
  return palette[index]
}

function toneToDynamicChar(
  lum: number,
  palette: readonly string[],
  variants: readonly (readonly string[])[],
  x: number,
  y: number,
  frameTick: number,
  config: AsciiToneConfig,
): string {
  const index = toneToIndex(lum, palette.length, config)
  const tierVariants = variants[index] ?? [palette[index]]
  const variantIndex = (x * 7 + y * 13 + frameTick) % tierVariants.length
  return tierVariants[variantIndex]
}

export function luminanceToChar(r: number, g: number, b: number): string {
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return toneToChar(lum, ASCII_CHARS, ASCII_CONFIG)
}

export function computeGridSize(
  viewportWidth: number,
  viewportHeight: number,
  videoWidth: number,
  videoHeight: number,
  configOverride?: Partial<AsciiToneConfig>,
): {
  cols: number
  rows: number
  fontSize: number
  canvasHeight: number
  sampleScale: number
} {
  const config = { ...ASCII_CONFIG, ...configOverride }
  const { targetCols, charWidthRatio, lineHeightRatio, sampleScale } = config

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
  options?: FrameToAsciiOptions,
): string {
  const config = options?.config ?? ASCII_CONFIG
  const palette = options?.palette ?? ASCII_CHARS
  const variants = options?.variants
  const frameTick = options?.frameTick ?? 0

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
      if (variants) {
        line += toneToDynamicChar(lum, palette, variants, x, y, frameTick, config)
      } else {
        line += toneToChar(lum, palette, config)
      }
    }
    lines.push(line)
  }
  return lines.join('\n')
}
