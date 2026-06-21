import { useEffect, useRef } from 'react'
import './HeroDistortion.css'

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
  uniform float u_time;
  uniform vec2 u_resolution;
  varying vec2 v_uv;

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    float row = floor(v_uv.y * 64.0);
    float rowWave = sin(row * 0.52 + u_time * 0.8) * 0.5 + 0.5;

    float dist = distance(v_uv, u_mouse);
    float ripple = sin(dist * 40.0 - u_time * 2.0) * 0.5 + 0.5;

    float dispX = (rowWave - 0.5) * 0.08 * u_intensity;
    dispX += (ripple - 0.5) * 0.06 * u_intensity;
    dispX += (u_mouse.x - 0.5) * 0.12 * u_intensity;

    float dispY = sin(v_uv.x * 50.0 + u_time) * 0.04 * u_intensity;

    float split = 0.025 * u_intensity;
    vec2 uvR = clamp(v_uv + vec2(dispX + split, dispY), 0.0, 1.0);
    vec2 uvG = clamp(v_uv + vec2(dispX, dispY), 0.0, 1.0);
    vec2 uvB = clamp(v_uv + vec2(dispX - split, dispY), 0.0, 1.0);

    float r = texture2D(u_texture, uvR).r;
    float g = texture2D(u_texture, uvG).g;
    float b = texture2D(u_texture, uvB).b;

    vec3 color = vec3(r, g, b);
    float grain = rand(v_uv * u_resolution + u_time) * 0.06 * u_intensity;
    color += grain - 0.03 * u_intensity;

    float vignette = 1.0 - dist * 0.6 * u_intensity;
    color *= clamp(vignette, 0.0, 1.0);

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

interface HeroDistortionProps {
  outputRef: React.RefObject<HTMLPreElement | null>
}

export function HeroDistortion({ outputRef }: HeroDistortionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const intensityRef = useRef(0)
  const timeRef = useRef(0)
  const hoveringRef = useRef(false)
  const frameRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true })
    if (!gl) return
    glRef.current = gl

    const program = createProgram(gl)
    if (!program) return
    programRef.current = program

    const positionLoc = gl.getAttribLocation(program, 'a_position')
    const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord')

    const uniforms = {
      texture: gl.getUniformLocation(program, 'u_texture'),
      mouse: gl.getUniformLocation(program, 'u_mouse'),
      intensity: gl.getUniformLocation(program, 'u_intensity'),
      time: gl.getUniformLocation(program, 'u_time'),
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
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.uniform1i(uniforms.texture, 0)

    const draw = () => {
      const output = outputRef.current
      if (!output) return

      const rect = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio, 2)
      const w = Math.floor(rect.width * dpr)
      const h = Math.floor(rect.height * dpr)

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
        gl.uniform2f(uniforms.resolution, w, h)
      }

      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        output,
      )

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)

      gl.uniform2f(uniforms.mouse, mouseRef.current.x, mouseRef.current.y)
      gl.uniform1f(uniforms.intensity, intensityRef.current)
      gl.uniform1f(uniforms.time, timeRef.current)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1 - (e.clientY - rect.top) / rect.height,
      }
    }

    const onEnter = () => { hoveringRef.current = true }
    const onLeave = () => { hoveringRef.current = false }

    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseenter', onEnter)
    container.addEventListener('mouseleave', onLeave)

    let lastTime = performance.now()
    const animate = (now: number) => {
      timeRef.current += (now - lastTime) * 0.001
      lastTime = now

      const target = hoveringRef.current ? 1 : 0
      intensityRef.current += (target - intensityRef.current) * 0.05

      draw()
      frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameRef.current)
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mouseenter', onEnter)
      container.removeEventListener('mouseleave', onLeave)
    }
  }, [outputRef])

  return (
    <div ref={containerRef} className="hero-distortion">
      <canvas ref={canvasRef} className="hero-distortion__canvas" aria-hidden="true" />
    </div>
  )
}
