let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playShuffleSound(): void {
  try {
    const ctx = getAudioContext();
    let time = ctx.currentTime;
    // 6 cascading triangle noise-like bursts simulating card flipping
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 80, time);

      gain.gain.setValueAtTime(0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      osc.start(time);
      osc.stop(time + 0.05);
      time += 0.06;
    }
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

export function playCardPlaySound(): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

export function playChatSound(): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

export function playWinSound(): void {
  try {
    const ctx = getAudioContext();
    let time = ctx.currentTime;
    const freqs = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 (C Major)
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      osc.start(time);
      osc.stop(time + 0.3);
      time += 0.06;
    });
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

export function playLossSound(): void {
  try {
    const ctx = getAudioContext();
    let time = ctx.currentTime;
    const freqs = [392.00, 311.13, 261.63, 196.00]; // G4, Eb4, C4, G3 (C Minor)
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

      osc.start(time);
      osc.stop(time + 0.4);
      time += 0.09;
    });
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

export function playTrickWonSound(): void {
  try {
    const ctx = getAudioContext();
    let time = ctx.currentTime;
    const freqs = [392.00, 523.25]; // G4, C5 (perfect fifth resolution)
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      osc.start(time);
      osc.stop(time + 0.22);
      time += 0.06;
    });
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

export function playClickSound(): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

export function playLobbyJoinSound(): void {
  try {
    const ctx = getAudioContext();
    let time = ctx.currentTime;
    const freqs = [329.63, 440.00]; // E4, A4
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc.start(time);
      osc.stop(time + 0.17);
      time += 0.08;
    });
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

