const NOTE_SEQUENCE = [
  523.25,
  659.25,
  783.99,
  659.25,
  587.33,
  739.99,
  987.77,
  739.99
];

export function createChiptunePlayer({ onStateChange } = {}) {
  let context = null;
  let gain = null;
  let timer = null;
  let step = 0;
  let volume = 0.25;

  function ensureContext() {
    if (!context) {
      context = new AudioContext();
      gain = context.createGain();
      gain.gain.value = volume;
      gain.connect(context.destination);
    }
  }

  function playNote() {
    ensureContext();
    const oscillator = context.createOscillator();
    const noteGain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = NOTE_SEQUENCE[step % NOTE_SEQUENCE.length];
    noteGain.gain.setValueAtTime(0.001, context.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.35, context.currentTime + 0.015);
    noteGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
    oscillator.connect(noteGain);
    noteGain.connect(gain);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
    step += 1;
  }

  return {
    get isPlaying() {
      return Boolean(timer);
    },
    setVolume(nextVolume) {
      volume = Number(nextVolume);
      if (gain) {
        gain.gain.value = volume;
      }
    },
    async start() {
      ensureContext();
      await context.resume();
      if (!timer) {
        playNote();
        timer = setInterval(playNote, 260);
        onStateChange?.(true);
      }
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
        onStateChange?.(false);
      }
    },
    toggle() {
      if (timer) {
        this.stop();
      } else {
        return this.start();
      }
    }
  };
}
