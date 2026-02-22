/**
 * @fileoverview Hook de feedback sonoro para lances e eventos do monitor.
 * Usa Web Audio API para gerar sons sem depender de arquivos .mp3 externos.
 * Sons: novo-lance, meu-lance-aceito, soft-close-alerta, lote-arrematado.
 */
'use client';

import { useCallback, useRef, useEffect } from 'react';

type SoundType = 'new-bid' | 'my-bid-accepted' | 'soft-close' | 'lot-sold' | 'error';

// Frequency + duration configs per sound type
const SOUND_CONFIG: Record<SoundType, { freq: number[]; dur: number[]; type: OscillatorType }> = {
  'new-bid':        { freq: [880, 1100],       dur: [0.08, 0.06],  type: 'sine' },
  'my-bid-accepted': { freq: [660, 880, 1320], dur: [0.1, 0.1, 0.15], type: 'sine' },
  'soft-close':      { freq: [440, 330, 440],  dur: [0.15, 0.15, 0.2], type: 'triangle' },
  'lot-sold':        { freq: [523, 659, 784, 1047], dur: [0.12, 0.12, 0.12, 0.25], type: 'sine' },
  'error':           { freq: [200, 150],       dur: [0.2, 0.3],    type: 'sawtooth' },
};

export interface UseBidSoundsOptions {
  enabled?: boolean;
  volume?: number; // 0-1
}

export function useBidSounds(options: UseBidSoundsOptions = {}) {
  const { enabled = true, volume = 0.3 } = options;
  const ctxRef = useRef<AudioContext | null>(null);

  // Lazy-init AudioContext (must happen after user gesture)
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback((type: SoundType) => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      const config = SOUND_CONFIG[type];
      let offset = 0;

      config.freq.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = config.type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + config.dur[i]);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + config.dur[i] + 0.01);
        offset += config.dur[i];
      });
    } catch {
      // silently fail if AudioContext not available
    }
  }, [enabled, volume, getCtx]);

  // Cleanup
  useEffect(() => {
    return () => {
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return {
    playNewBid: useCallback(() => play('new-bid'), [play]),
    playMyBidAccepted: useCallback(() => play('my-bid-accepted'), [play]),
    playSoftClose: useCallback(() => play('soft-close'), [play]),
    playLotSold: useCallback(() => play('lot-sold'), [play]),
    playError: useCallback(() => play('error'), [play]),
    play,
  };
}
