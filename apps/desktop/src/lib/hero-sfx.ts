/**
 * Efectos de sonido del hero, sintetizados con WebAudio: 0 assets, 0 red.
 *
 * El contexto se crea perezosamente en la primera llamada — siempre desde un
 * gesto del usuario (el click que dispara), así el navegador no lo bloquea.
 * Cada efecto son 2-3 osciladores/ruido de menos de 300 ms con envolventes
 * exponenciales: sonido de cómic, no de simulador.
 */

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Un segundo de ruido blanco reutilizado por todos los efectos. */
function getNoise(ac: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buf;
  return buf;
}

function noiseBurst(ac: AudioContext, at: number, seconds: number, filter: BiquadFilterType, from: number, to: number, gain: number) {
  const src = ac.createBufferSource();
  src.buffer = getNoise(ac);
  const biq = ac.createBiquadFilter();
  biq.type = filter;
  biq.frequency.setValueAtTime(from, at);
  biq.frequency.exponentialRampToValueAtTime(to, at + seconds);
  biq.Q.value = 0.8;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
  src.connect(biq).connect(g).connect(ac.destination);
  src.start(at);
  src.stop(at + seconds);
}

function tone(ac: AudioContext, at: number, seconds: number, type: OscillatorType, from: number, to: number, gain: number) {
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + seconds);
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
  osc.connect(g).connect(ac.destination);
  osc.start(at);
  osc.stop(at + seconds);
}

/** Disparo: "pam" seco — golpe grave + chasquido de ruido. */
export function playShotSfx() {
  const ac = getContext();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, t, 0.12, "sine", 220, 45, 0.5);
  noiseBurst(ac, t, 0.09, "lowpass", 3800, 300, 0.45);
  noiseBurst(ac, t, 0.03, "highpass", 2500, 6000, 0.25);
}

/** Impacto: "plof" de plumas + graznido corto que cae de tono. */
export function playHitSfx() {
  const ac = getContext();
  if (!ac) return;
  const t = ac.currentTime;
  noiseBurst(ac, t, 0.16, "bandpass", 900, 250, 0.6);
  tone(ac, t + 0.02, 0.07, "triangle", 160, 60, 0.35);
  // Graznido: dos sierras desafinadas bajando, como un "cuaac" de cómic.
  tone(ac, t + 0.05, 0.22, "sawtooth", 980, 330, 0.09);
  tone(ac, t + 0.05, 0.22, "sawtooth", 1010, 350, 0.06);
}

let hornBusyUntil = 0;

/**
 * Bocina de barco al zarpar: UNA pitada larga y grave (~1,6 s). Dos sierras
 * desafinadas por un paso bajo (el "graznido" metálico de la sirena real) más
 * un seno subarmónico que da el cuerpo, con ataque de 90 ms y cola de 400 ms.
 * Si ya está sonando, el click se ignora: las bocinas no se apilan.
 */
export function playHornSfx() {
  const ac = getContext();
  if (!ac) return;
  const t = ac.currentTime;
  if (t < hornBusyUntil) return;
  const HOLD = 1.2;
  const ATTACK = 0.09;
  const RELEASE = 0.4;
  const end = t + ATTACK + HOLD + RELEASE;
  hornBusyUntil = end - 0.15;

  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(420, t);
  lp.frequency.linearRampToValueAtTime(620, t + ATTACK);
  lp.frequency.linearRampToValueAtTime(380, end);
  lp.Q.value = 1.2;

  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.5, t + ATTACK);
  env.gain.setValueAtTime(0.5, t + ATTACK + HOLD);
  env.gain.exponentialRampToValueAtTime(0.0001, end);
  lp.connect(env).connect(ac.destination);

  // Sirena de bocina de la Ría: fundamental grave, ligera caída al final.
  const voices: Array<[OscillatorType, number, number]> = [
    ["sawtooth", 96, 0.55],
    ["sawtooth", 98.5, 0.4],
    ["square", 144, 0.18],
    ["sine", 48, 0.7],
  ];
  for (const [type, hz, gain] of voices) {
    const osc = ac.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, t);
    osc.frequency.setValueAtTime(hz, t + ATTACK + HOLD);
    osc.frequency.exponentialRampToValueAtTime(hz * 0.93, end);
    const g = ac.createGain();
    g.gain.value = gain;
    osc.connect(g).connect(lp);
    osc.start(t);
    osc.stop(end + 0.05);
  }
}
