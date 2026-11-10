// The hero portrait. It stands in the portal, and scrolling swallows it: the hero stays pinned while you scroll
// through a tall track, and the scroll position drives a vortex that twists the cut-out and pulls it into the middle.
// After the portrait the portal eats the rest of the hero (feast.ts), then closes.
//
// Three layers of fallback, so nothing is ever missing:
//   1. WebGL2: the vortex is a fragment shader (this file).
//   2. No WebGL: the plain <img> is scrubbed with CSS transforms, driven by the same progress value.
//   3. No JavaScript, or reduced motion: the <img> just stands in the portal.

import { createFeast } from './feast';
import { heroPortal, readColors } from './portal';

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Half the width of the figure canvas, in portal radii. The CSS box is 2.7 radii wide. */
const HALF = 1.35;

/** Without pinning (short windows): the scroll progress at which the portrait is swallowed; the portal then closes. */
const SWALLOWED_AT = 0.8;

/**
 * With the hero pinned, the scroll plays in acts, each a share of the pinned distance:
 * the portrait goes under, the portal eats the rest of the hero while it grows, a short pause, and it closes.
 */
const ACTS = { portrait: 0.26, eatFrom: 0.2, eatTo: 0.72, closeFrom: 0.78, closeTo: 0.97 };

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uTex;
uniform vec2 uTexel;   // 1 / texture size
uniform vec4 uFig;     // centre x, centre y, width, height of the portrait, in portal radii (y is up)
uniform float uHalf;   // half the canvas, in portal radii
uniform float uPx;     // one device pixel, in portal radii
uniform float uW;      // how far the portrait has been swallowed: 0 = standing, 1 = gone
uniform float uTime;
uniform vec2 uShift;   // pointer parallax, in portal radii
uniform vec3 uRim;     // rim light colour
uniform vec3 uGlow;    // halo colour

const float PI = 3.14159265359;

float inside(vec2 uv) {
  vec2 i = step(vec2(0.0), uv) * step(uv, vec2(1.0));
  return i.x * i.y;
}

vec4 fetchTex(vec2 uv, float bias) {
  return texture(uTex, uv, bias) * inside(uv);
}

// The photo was cut off by its frame at the bottom and on the left. While the portrait stands in the portal the
// portal's rim hides those edges; once it is pulled in they would show, so they dissolve instead.
float fadeAt(vec2 uv) {
  float grow = smoothstep(0.0, 0.5, uW);
  float fromBottom = smoothstep(0.0, mix(0.05, 0.38, grow), 1.0 - uv.y);
  float fromLeft = smoothstep(0.0, mix(0.04, 0.24, grow), uv.x);
  return mix(1.0, fromBottom * fromLeft, smoothstep(0.02, 0.2, uW));
}

float alphaAt(vec2 uv) {
  return textureLod(uTex, uv, 0.0).a * inside(uv) * fadeAt(uv);
}

void main() {
  // Where this pixel is, in portal radii from the centre of the portal.
  vec2 q = (vUv - 0.5) * 2.0 * uHalf;

  // The vortex, run backwards: for each pixel, find where in the portrait it comes from.
  float w = uW;
  float s = max(pow(1.0 - w, 1.1), 0.02);        // the portrait shrinks towards the middle
  vec2 p = q / s;
  float rs = length(p);
  // A little spin overall, and a lot more twist near the middle than at the edges (differential rotation, like a drain).
  float th = 0.5 * PI * w * w + 10.0 * pow(w, 2.6) * exp(-rs * rs / 0.9);
  float cs = cos(th);
  float sn = sin(th);
  p = vec2(cs * p.x - sn * p.y, sn * p.x + cs * p.y);

  // Idle float and pointer parallax, in the portrait's own space.
  p -= uShift;
  p.y -= 0.009 * sin(uTime * 1.35) * (1.0 - w);

  vec2 uv = vec2((p.x - uFig.x) / uFig.z + 0.5, 0.5 - (p.y - uFig.y) / uFig.w);

  vec4 tex = fetchTex(uv, mix(-0.6, 0.0, smoothstep(0.0, 0.3, w)));
  tex *= fadeAt(uv);
  float a = tex.a;

  // Edge light: a thin outline and a soft halo, both outside the silhouette. A coarse mip level says whether the
  // silhouette is anywhere near; far from it (or deep inside it) the extra taps are skipped.
  float line = 0.0;
  float halo = 0.0;
  float coarse = textureLod(uTex, uv, 5.0).a;
  if (coarse > 0.002 && coarse < 0.998) {
    float far = 0.0;
    float ring = 0.0;
    for (int i = 0; i < 8; i++) {
      float ang = (float(i) + 0.5) * 0.78539816;
      vec2 d = vec2(cos(ang), sin(ang));
      far += alphaAt(uv + d * uTexel * 18.0);
      ring = max(ring, alphaAt(uv + d * uTexel * 3.5));
    }
    line = smoothstep(0.1, 0.8, ring) * (1.0 - a);
    halo = clamp(far / 8.0 * 1.5, 0.0, 1.0) * (1.0 - a);
  }

  vec4 res = tex;
  float ga = clamp(line * 0.78 + halo * 0.36, 0.0, 1.0);
  res += vec4(uGlow * ga, ga) * (1.0 - a);

  // As it goes under, the portrait takes on the portal's light and fades out.
  float tint = smoothstep(0.3, 0.95, w);
  res.rgb = mix(res.rgb, uRim * res.a, tint * 0.88);
  res *= 1.0 - smoothstep(0.78, 0.995, w);

  // Below the middle of the portal the portrait is cut off by the portal's own rim; above it, it may stick out.
  float inCircle = 1.0 - smoothstep(1.0 - uPx, 1.0 + uPx, length(q));
  res *= q.y > 0.0 ? 1.0 : inCircle;

  outColor = res;
}`;

type GL = WebGL2RenderingContext;

function compile(gl: GL, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader failed to compile: ${log}`);
  }
  return shader;
}

export function initFigure() {
  const stage = document.querySelector<HTMLElement>('[data-hero]');
  const track = document.querySelector<HTMLElement>('[data-hero-track]');
  const frame = document.querySelector<HTMLElement>('[data-hero-frame]');
  const wrap = stage?.querySelector<HTMLElement>('[data-figure]');
  const canvas = wrap?.querySelector<HTMLCanvasElement>('canvas');
  const img = wrap?.querySelector<HTMLImageElement>('img');
  if (!stage || !track || !frame || !wrap || !canvas || !img) return;

  // Reduced motion: the portrait just stands in the portal.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    wrap.dataset.mode = 'static';
    return;
  }

  const rootStyle = getComputedStyle(document.documentElement);
  const navH = () => parseFloat(rootStyle.getPropertyValue('--nav-h')) || 68;
  const num = (name: string, fallback: number) => {
    const v = parseFloat(getComputedStyle(stage).getPropertyValue(name));
    return Number.isFinite(v) ? v : fallback;
  };

  // ---------- Progress ----------

  let pinned = true;
  let nav = 68;
  const measureLayout = () => {
    pinned = getComputedStyle(frame).position === 'sticky';
    nav = navH();
  };

  /** 0 at the top of the page, 1 once the whole track has been scrolled through. */
  const scrollProgress = () => {
    const rect = track.getBoundingClientRect();
    const distance = pinned ? rect.height - frame.offsetHeight : rect.height * 0.62;
    if (distance <= 1) return 0;
    return clamp((nav - rect.top) / distance);
  };

  measureLayout();
  let target = scrollProgress();
  let current = target;

  // The portrait steps out of the portal when the page loads: the swallow, played backwards. The clock starts once
  // the first frame can be drawn (see start()), so a slow device does not miss it.
  let introFrom = Infinity;
  const introLength = 1500;
  let introDone = target > 0.02;
  const introValue = (now: number) => {
    if (introDone) return 0;
    const t = clamp((now - introFrom) / introLength);
    if (t >= 1) {
      introDone = true;
      return 0;
    }
    return Math.pow(1 - t, 3);
  };

  // ---------- Applying progress ----------

  let lastPulse = 0;
  let lastW = 0;

  // Only touch the page when a value actually changed.
  const written = new Map<string, string>();
  const setVar = (name: string, value: string) => {
    if (written.get(name) === value) return;
    written.set(name, value);
    stage.style.setProperty(name, value);
  };

  const feast = createFeast(stage, frame, ACTS);

  const publish = (p: number, w: number, pull: number) => {
    const closeFrom = pinned ? ACTS.closeFrom : SWALLOWED_AT - 0.02;
    const closeTo = pinned ? ACTS.closeTo : 1;
    const pc = clamp((p - closeFrom) / (closeTo - closeFrom));
    const closing = pc * pc * (3 - 2 * pc);
    const scale = (1 - closing) * (1 + 0.05 * Math.sin(pc * Math.PI));
    setVar('--w', w.toFixed(4));
    setVar('--ps', scale.toFixed(4));
    setVar('--pr', `${(pc * pc * 200).toFixed(1)}deg`);
    setVar('--po', (1 - smooth(0.85, 1, pc)).toFixed(3));
    stage.toggleAttribute('data-closed', pc > 0.4);

    // The swirl spins up for the portrait, and faster still while the portal feeds on the rest.
    heroPortal.setSwallow(Math.max(w, pull * 1.6));
    // A burst when the portrait goes under (and again when it comes back up).
    if ((lastW < 0.92 && w >= 0.92) || (lastW >= 0.92 && w < 0.92)) {
      const now = performance.now();
      if (now - lastPulse > 600) {
        heroPortal.pulse();
        lastPulse = now;
      }
    }
    lastW = w;
  };

  const swallowOf = (p: number, intro: number) =>
    Math.max(Math.pow(clamp(p / (pinned ? ACTS.portrait : SWALLOWED_AT)), 1.2), intro);

  // ---------- WebGL ----------

  let gl: GL | null = null;
  let render: ((time: number, w: number) => void) | null = null;

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let colors = readColors();

  const setupGl = () => {
    const context = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!context) throw new Error('WebGL2 is not available');
    gl = context;

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`Program failed to link: ${gl.getProgramInfoLog(program)}`);
    gl.useProgram(program);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const u = (name: string) => gl!.getUniformLocation(program, name);
    const uni = {
      tex: u('uTex'),
      texel: u('uTexel'),
      fig: u('uFig'),
      half: u('uHalf'),
      px: u('uPx'),
      w: u('uW'),
      time: u('uTime'),
      shift: u('uShift'),
      rim: u('uRim'),
      glow: u('uGlow'),
    };

    gl.uniform1i(uni.tex, 0);
    gl.uniform2f(uni.texel, 1 / img.naturalWidth, 1 / img.naturalHeight);
    gl.uniform1f(uni.half, HALF);
    gl.clearColor(0, 0, 0, 0);

    let fig = [0, 0.025, 1.5, 2.25];
    const readFigure = () => {
      const h = num('--fig-h', 2.25);
      const aspect = num('--fig-aspect', img.naturalWidth / img.naturalHeight);
      fig = [num('--fig-x', 0), num('--fig-y', 0.025), h * aspect, h];
    };
    readFigure();

    const lift = (c: number[], k: number): [number, number, number] => [
      (c[0] + (255 - c[0]) * k) / 255,
      (c[1] + (255 - c[1]) * k) / 255,
      (c[2] + (255 - c[2]) * k) / 255,
    ];

    const resize = () => {
      const cssW = canvas.clientWidth;
      if (!cssW) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const size = Math.round(cssW * dpr);
      if (canvas.width !== size || canvas.height !== size) {
        canvas.width = size;
        canvas.height = size;
      }
      readFigure();
      gl!.viewport(0, 0, size, size);
      gl!.uniform1f(uni.px, (2 * HALF) / size);
    };
    resize();
    new ResizeObserver(resize).observe(canvas);

    window.addEventListener('dimensionchange', () => {
      colors = readColors();
    });

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      render = null;
      wrap.dataset.mode = 'css';
    });

    render = (time, w) => {
      const g = gl!;
      g.uniform4f(uni.fig, fig[0], fig[1], fig[2], fig[3]);
      g.uniform1f(uni.w, w);
      g.uniform1f(uni.time, time);
      g.uniform2f(uni.shift, -pointer.x * 0.03, pointer.y * 0.02);
      const rim = lift(colors.c2, 0.45);
      const glow = lift(colors.c3, 0.2);
      g.uniform3f(uni.rim, rim[0], rim[1], rim[2]);
      g.uniform3f(uni.glow, glow[0], glow[1], glow[2]);
      g.clear(g.COLOR_BUFFER_BIT);
      g.drawArrays(g.TRIANGLES, 0, 3);
    };
  };

  // ---------- Loop ----------

  let raf = 0;
  let last = 0;
  let onScreen = true;

  const frameLoop = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;

    // Follow the scroll position, a little smoothed so wheel clicks do not make it jump.
    current += (target - current) * (1 - Math.exp(-dt * 14));
    if (Math.abs(target - current) < 0.0005) current = target;

    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 5);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 5);

    const w = swallowOf(current, introValue(now));
    publish(current, w, feast.update(current, now / 1000, dt, pinned));
    render?.(now / 1000, w);

    // Only keep drawing while something is moving, or the portrait is idling in view.
    if (onScreen && !document.hidden) raf = requestAnimationFrame(frameLoop);
  };

  const wake = () => {
    if (raf || !onScreen || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frameLoop);
  };

  const onScroll = () => {
    target = scrollProgress();
    wake();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    measureLayout();
    feast.measure();
    onScroll();
  });

  new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) wake();
    },
    { rootMargin: '60px' },
  ).observe(track);
  document.addEventListener('visibilitychange', wake);

  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const rect = canvas.getBoundingClientRect();
    pointer.tx = clamp((e.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.6), -1, 1);
    pointer.ty = clamp((e.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.6), -1, 1);
  });
  stage.addEventListener('pointerleave', () => {
    pointer.tx = 0;
    pointer.ty = 0;
  });

  // ---------- Go ----------

  const start = async () => {
    try {
      await img.decode();
    } catch {
      /* a broken image just means the plain fallback stays */
    }
    try {
      if (!img.naturalWidth) throw new Error('portrait did not load');
      setupGl();
      wrap.dataset.mode = 'gl';
    } catch (error) {
      console.warn('Portrait falls back to CSS:', error);
      render = null;
      wrap.dataset.mode = 'css';
    }
    introFrom = performance.now() + 300;
    wake();
  };

  start();
}
