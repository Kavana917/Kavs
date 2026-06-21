import { useEffect, useRef, useCallback } from 'react'
import './DisplacementImage.css'

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_uv;
  void main() {
    v_uv = a_texCoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D u_texture;
  uniform vec2 u_mouse;
  uniform float u_intensity;
  uniform vec2 u_resolution;
  varying vec2 v_uv;

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    float stripes = 72.0;
    float row = floor(v_uv.y * stripes);
    float rowWave = sin(row * 0.42 + u_mouse.y * 6.283) * 0.5 + 0.5;

    float disp = (rowWave - 0.5) * 0.14 * u_intensity;
    disp += (u_mouse.x - 0.5) * 0.22 * u_intensity;

    float stretch = 1.0 + abs(u_mouse.y - 0.5) * 0.2 * u_intensity;
    vec2 uv = vec2(v_uv.x, (v_uv.y - 0.5) / stretch + 0.5);

    float split = 0.035 * u_intensity;
    vec2 uvR = clamp(uv + vec2(disp * 2.0 + split, 0.0), 0.0, 1.0);
    vec2 uvG = clamp(uv + vec2(disp * 1.0, 0.0), 0.0, 1.0);
    vec2 uvB = clamp(uv + vec2(disp * 0.3 - split, 0.0), 0.0, 1.0);

    float r = texture2D(u_texture, uvR).r;
    float g = texture2D(u_texture, uvG).g;
    float b = texture2D(u_texture, uvB).b;

    vec3 color = vec3(r, g, b);
    float grain = rand(uv * u_resolution) * 0.08 * u_intensity;
    color += grain - 0.04 * u_intensity;

    gl_FragColor = vec4(color, 1.0);
  }
`

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl: WebGLRenderingContext) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  if (!vs || !fs) return null

  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
    return null
  }
  return program
}

interface DisplacementImageProps {
  src: string
  alt: string
  active?: boolean
}

export function DisplacementImage({ src, alt, active = false }: DisplacementImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const textureRef = useRef<WebGLTexture | null>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const intensityRef = useRef(0)
  const hoveringRef = useRef(false)
  const activeRef = useRef(active)
  const frameRef = useRef(0)
  const uniformsRef = useRef<{
    texture: WebGLUniformLocation | null
    mouse: WebGLUniformLocation | null
    intensity: WebGLUniformLocation | null
    resolution: WebGLUniformLocation | null
  }>({ texture: null, mouse: null, intensity: null, resolution: null })

  const draw = useCallback(() => {
    const gl = glRef.current
    const program = programRef.current
    const canvas = canvasRef.current
    if (!gl || !program || !canvas) return

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)

    gl.uniform2f(uniformsRef.current.mouse, mouseRef.current.x, mouseRef.current.y)
    gl.uniform1f(uniformsRef.current.intensity, intensityRef.current)
    gl.uniform2f(uniformsRef.current.resolution, canvas.width, canvas.height)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }, [])

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false })
    if (!gl) return
    glRef.current = gl

    const program = createProgram(gl)
    if (!program) return
    programRef.current = program

    const positionLoc = gl.getAttribLocation(program, 'a_position')
    const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord')

    uniformsRef.current = {
      texture: gl.getUniformLocation(program, 'u_texture'),
      mouse: gl.getUniformLocation(program, 'u_mouse'),
      intensity: gl.getUniformLocation(program, 'u_intensity'),
      resolution: gl.getUniformLocation(program, 'u_resolution'),
    }

    const positions = new Float32Array([
      -1, -1, 0, 1,
      1, -1, 1, 1,
      -1, 1, 0, 0,
      -1, 1, 0, 0,
      1, -1, 1, 1,
      1, 1, 1, 0,
    ])

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    const stride = 16
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, stride, 0)
    gl.enableVertexAttribArray(texCoordLoc)
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, stride, 8)

    const texture = gl.createTexture()
    textureRef.current = texture
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.uniform1i(uniformsRef.current.texture, 0)

    let resizeHandler: (() => void) | null = null

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const resize = () => {
        const rect = container.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio, 2)
        canvas.width = Math.floor(rect.width * dpr)
        canvas.height = Math.floor(rect.height * dpr)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        draw()
      }
      resizeHandler = resize
      resize()
      window.addEventListener('resize', resize)
    }
    img.src = src

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1 - (e.clientY - rect.top) / rect.height,
      }
    }

    const onEnter = () => {
      hoveringRef.current = true
    }

    const onLeave = () => {
      hoveringRef.current = false
    }

    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseenter', onEnter)
    container.addEventListener('mouseleave', onLeave)

    const animate = () => {
      const target = hoveringRef.current || activeRef.current ? 1 : 0
      intensityRef.current += (target - intensityRef.current) * 0.08
      draw()
      frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameRef.current)
      if (resizeHandler) window.removeEventListener('resize', resizeHandler)
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mouseenter', onEnter)
      container.removeEventListener('mouseleave', onLeave)
    }
  }, [src, draw])

  return (
    <div ref={containerRef} className="displacement-image">
      <canvas ref={canvasRef} className="displacement-image__canvas" />
      <img src={src} alt={alt} className="displacement-image__fallback" />
    </div>
  )
}
