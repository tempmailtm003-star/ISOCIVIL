// Haversine distance calculator between geographic coordinates in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 0;
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Calculate realistic emergency response ETA in minutes with siren speed (~45-55 km/h urban)
export function calculateEtaMinutes(distanceKm: number, avgSpeedKmh = 45): number {
  if (distanceKm <= 0.1) return 1;
  const hours = distanceKm / avgSpeedKmh;
  const mins = Math.round(hours * 60);
  return Math.max(1, mins);
}

// Tactical Unit Color & Identification Styles:
// Fire Engine -> RED
// Police Patrol -> BLUE
// Ambulance -> GREEN
export function getUnitCategory(typeOrId: string = ''): 'Fire' | 'Police' | 'Ambulance' | 'Rescue' | 'Hazmat' | 'Drone' | 'Marine' | 'Other' {
  const s = typeOrId.toLowerCase();
  if (s.includes('fire') || s.startsWith('fe-') || s.includes('tender') || s.includes('ladder')) return 'Fire';
  if (s.includes('police') || s.startsWith('pv-') || s.includes('patrol') || s.includes('cruiser') || s.includes('interceptor') || s.includes('cop') || s.includes('traffic') || s.startsWith('tp-') || s.startsWith('swat-')) return 'Police';
  if (s.includes('ambulance') || s.startsWith('amb-') || s.includes('medical') || s.includes('ems') || s.includes('icu') || s.includes('paramedic')) return 'Ambulance';
  if (s.includes('hazmat') || s.startsWith('hz-') || s.includes('chemical') || s.includes('decon')) return 'Hazmat';
  if (s.includes('drone') || s.startsWith('uav-') || s.includes('aerial') || s.includes('recon')) return 'Drone';
  if (s.includes('marine') || s.startsWith('cgr-') || s.includes('boat') || s.includes('coastal') || s.includes('hovercraft')) return 'Marine';
  if (s.includes('rescue') || s.startsWith('rt-') || s.includes('disaster') || s.includes('sdrf') || s.includes('ndrf')) return 'Rescue';
  return 'Other';
}

export function getUnitStyles(typeOrId: string = '', isDark: boolean = true) {
  const cat = getUnitCategory(typeOrId);
  if (!isDark) {
    switch (cat) {
      case 'Fire':
        return {
          category: 'Fire',
          colorName: 'red',
          badge: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
          idBadge: 'bg-rose-50 text-rose-700 border-rose-200 font-mono font-semibold',
          nameBadge: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
          nameText: 'text-rose-700 font-semibold',
          tabActive: 'bg-rose-400 text-slate-950 font-bold border-rose-300 shadow-xs',
          tabInactive: 'text-rose-600 hover:text-rose-800 hover:bg-rose-50 border-transparent',
          dot: 'bg-rose-500',
          iconColor: 'text-rose-600',
          borderGlow: 'border-rose-200 shadow-2xs',
          bgSubtle: 'bg-rose-50/60'
        };
      case 'Police':
        return {
          category: 'Police',
          colorName: 'blue',
          badge: 'bg-sky-50 text-sky-700 border-sky-200 font-semibold',
          idBadge: 'bg-sky-50 text-sky-700 border-sky-200 font-mono font-semibold',
          nameBadge: 'bg-sky-50 text-sky-700 border-sky-200 font-semibold',
          nameText: 'text-sky-700 font-semibold',
          tabActive: 'bg-sky-400 text-slate-950 font-bold border-sky-300 shadow-xs',
          tabInactive: 'text-sky-600 hover:text-sky-800 hover:bg-sky-50 border-transparent',
          dot: 'bg-sky-500',
          iconColor: 'text-sky-600',
          borderGlow: 'border-sky-200 shadow-sm',
          bgSubtle: 'bg-sky-50/60'
        };
      case 'Ambulance':
        return {
          category: 'Ambulance',
          colorName: 'green',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
          idBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-mono font-semibold',
          nameBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
          nameText: 'text-emerald-700 font-semibold',
          tabActive: 'bg-emerald-400 text-emerald-950 font-bold border-emerald-300 shadow-xs',
          tabInactive: 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 border-transparent',
          dot: 'bg-emerald-500',
          iconColor: 'text-emerald-600',
          borderGlow: 'border-emerald-200 shadow-sm',
          bgSubtle: 'bg-emerald-50/60'
        };
      case 'Hazmat':
        return {
          category: 'Hazmat',
          colorName: 'yellow',
          badge: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
          idBadge: 'bg-amber-50 text-amber-700 border-amber-200 font-mono font-semibold',
          nameBadge: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
          nameText: 'text-amber-700 font-semibold',
          tabActive: 'bg-amber-300 text-amber-950 font-bold border-amber-300 shadow-xs',
          tabInactive: 'text-amber-600 hover:text-amber-800 hover:bg-amber-50 border-transparent',
          dot: 'bg-amber-400',
          iconColor: 'text-amber-600',
          borderGlow: 'border-amber-200 shadow-sm',
          bgSubtle: 'bg-amber-50/60'
        };
      case 'Drone':
        return {
          category: 'Drone',
          colorName: 'violet',
          badge: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold',
          idBadge: 'bg-purple-50 text-purple-700 border-purple-200 font-mono font-semibold',
          nameBadge: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold',
          nameText: 'text-purple-700 font-semibold',
          tabActive: 'bg-purple-300 text-purple-950 font-bold border-purple-300 shadow-xs',
          tabInactive: 'text-purple-600 hover:text-purple-800 hover:bg-purple-50 border-transparent',
          dot: 'bg-purple-400',
          iconColor: 'text-purple-600',
          borderGlow: 'border-purple-200 shadow-sm',
          bgSubtle: 'bg-purple-50/60'
        };
      case 'Marine':
        return {
          category: 'Marine',
          colorName: 'cyan',
          badge: 'bg-cyan-50 text-cyan-700 border-cyan-200 font-semibold',
          idBadge: 'bg-cyan-50 text-cyan-700 border-cyan-200 font-mono font-semibold',
          nameBadge: 'bg-cyan-50 text-cyan-700 border-cyan-200 font-semibold',
          nameText: 'text-cyan-700 font-semibold',
          tabActive: 'bg-cyan-300 text-cyan-950 font-bold border-cyan-300 shadow-xs',
          tabInactive: 'text-cyan-600 hover:text-cyan-800 hover:bg-cyan-50 border-transparent',
          dot: 'bg-cyan-400',
          iconColor: 'text-cyan-600',
          borderGlow: 'border-cyan-200 shadow-sm',
          bgSubtle: 'bg-cyan-50/60'
        };
      case 'Rescue':
        return {
          category: 'Rescue',
          colorName: 'orange',
          badge: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold',
          idBadge: 'bg-orange-50 text-orange-700 border-orange-200 font-mono font-semibold',
          nameBadge: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold',
          nameText: 'text-orange-700 font-semibold',
          tabActive: 'bg-orange-300 text-orange-950 font-bold border-orange-300 shadow-xs',
          tabInactive: 'text-orange-600 hover:text-orange-800 hover:bg-orange-50 border-transparent',
          dot: 'bg-orange-400',
          iconColor: 'text-orange-600',
          borderGlow: 'border-orange-200',
          bgSubtle: 'bg-orange-50/60'
        };
      default:
        return {
          category: 'Other',
          colorName: 'amber',
          badge: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
          idBadge: 'bg-amber-50 text-amber-700 border-amber-200 font-mono font-semibold',
          nameBadge: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
          nameText: 'text-amber-700 font-semibold',
          tabActive: 'bg-amber-300 text-amber-950 font-bold border-amber-300 shadow-xs',
          tabInactive: 'text-amber-600 hover:text-amber-800 hover:bg-amber-50 border-transparent',
          dot: 'bg-amber-400',
          iconColor: 'text-amber-600',
          borderGlow: 'border-amber-200',
          bgSubtle: 'bg-amber-50/60'
        };
    }
  }

  switch (cat) {
    case 'Fire':
      return {
        category: 'Fire',
        colorName: 'red',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-400/35 font-semibold',
        idBadge: 'bg-rose-500/20 text-rose-300 border-rose-400/35 font-mono font-semibold',
        nameBadge: 'bg-rose-500/15 text-rose-200 border-rose-400/25 font-semibold',
        nameText: 'text-rose-300 font-semibold',
        tabActive: 'bg-rose-400 text-slate-950 font-bold border-rose-300 shadow-xs',
        tabInactive: 'text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 border-transparent',
        dot: 'bg-rose-400',
        iconColor: 'text-rose-300',
        borderGlow: 'border-rose-400/30',
        bgSubtle: 'bg-rose-500/10'
      };
    case 'Police':
      return {
        category: 'Police',
        colorName: 'blue',
        badge: 'bg-sky-500/20 text-sky-300 border-sky-400/35 font-semibold',
        idBadge: 'bg-sky-500/20 text-sky-300 border-sky-400/35 font-mono font-semibold',
        nameBadge: 'bg-sky-500/15 text-sky-200 border-sky-400/25 font-semibold',
        nameText: 'text-sky-300 font-semibold',
        tabActive: 'bg-sky-400 text-slate-950 font-bold border-sky-300 shadow-xs',
        tabInactive: 'text-sky-300 hover:text-sky-100 hover:bg-sky-950/40 border-transparent',
        dot: 'bg-sky-400',
        iconColor: 'text-sky-300',
        borderGlow: 'border-sky-400/30',
        bgSubtle: 'bg-sky-500/10'
      };
    case 'Ambulance':
      return {
        category: 'Ambulance',
        colorName: 'green',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/35 font-semibold',
        idBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/35 font-mono font-semibold',
        nameBadge: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/25 font-semibold',
        nameText: 'text-emerald-300 font-semibold',
        tabActive: 'bg-emerald-400 text-emerald-950 font-bold border-emerald-300 shadow-xs',
        tabInactive: 'text-emerald-300 hover:text-emerald-100 hover:bg-emerald-950/40 border-transparent',
        dot: 'bg-emerald-400',
        iconColor: 'text-emerald-300',
        borderGlow: 'border-emerald-400/30',
        bgSubtle: 'bg-emerald-500/10'
      };
    case 'Hazmat':
      return {
        category: 'Hazmat',
        colorName: 'yellow',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-400/35 font-semibold',
        idBadge: 'bg-amber-500/20 text-amber-300 border-amber-400/35 font-mono font-semibold',
        nameBadge: 'bg-amber-500/15 text-yellow-200 border-amber-400/25 font-semibold',
        nameText: 'text-amber-300 font-semibold',
        tabActive: 'bg-amber-300 text-amber-950 font-bold border-amber-300 shadow-xs',
        tabInactive: 'text-amber-300 hover:text-amber-100 hover:bg-yellow-950/40 border-transparent',
        dot: 'bg-amber-300',
        iconColor: 'text-amber-300',
        borderGlow: 'border-amber-400/30',
        bgSubtle: 'bg-amber-500/10'
      };
    case 'Drone':
      return {
        category: 'Drone',
        colorName: 'violet',
        badge: 'bg-purple-500/20 text-purple-300 border-purple-400/35 font-semibold',
        idBadge: 'bg-purple-500/20 text-purple-300 border-purple-400/35 font-mono font-semibold',
        nameBadge: 'bg-purple-500/15 text-purple-200 border-purple-400/25 font-semibold',
        nameText: 'text-purple-300 font-semibold',
        tabActive: 'bg-purple-300 text-purple-950 font-bold border-purple-300 shadow-xs',
        tabInactive: 'text-purple-300 hover:text-purple-100 hover:bg-violet-950/40 border-transparent',
        dot: 'bg-purple-400',
        iconColor: 'text-purple-300',
        borderGlow: 'border-purple-400/30',
        bgSubtle: 'bg-purple-500/10'
      };
    case 'Marine':
      return {
        category: 'Marine',
        colorName: 'cyan',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/35 font-semibold',
        idBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/35 font-mono font-semibold',
        nameBadge: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/25 font-semibold',
        nameText: 'text-cyan-300 font-semibold',
        tabActive: 'bg-cyan-300 text-cyan-950 font-bold border-cyan-300 shadow-xs',
        tabInactive: 'text-cyan-300 hover:text-cyan-100 hover:bg-cyan-950/40 border-transparent',
        dot: 'bg-cyan-400',
        iconColor: 'text-cyan-300',
        borderGlow: 'border-cyan-400/30',
        bgSubtle: 'bg-cyan-500/10'
      };
    case 'Rescue':
      return {
        category: 'Rescue',
        colorName: 'orange',
        badge: 'bg-orange-500/20 text-orange-300 border-orange-400/35 font-semibold',
        idBadge: 'bg-orange-500/20 text-orange-300 border-orange-400/35 font-mono font-semibold',
        nameBadge: 'bg-orange-500/15 text-orange-200 border-orange-400/25 font-semibold',
        nameText: 'text-orange-300 font-semibold',
        tabActive: 'bg-orange-300 text-orange-950 font-bold border-orange-300 shadow-xs',
        tabInactive: 'text-orange-300 hover:text-orange-100 hover:bg-orange-950/40 border-transparent',
        dot: 'bg-orange-400',
        iconColor: 'text-orange-300',
        borderGlow: 'border-orange-400/30',
        bgSubtle: 'bg-orange-500/10'
      };
    default:
      return {
        category: 'Other',
        colorName: 'amber',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-400/35 font-semibold',
        idBadge: 'bg-amber-500/20 text-amber-300 border-amber-400/35 font-mono font-semibold',
        nameBadge: 'bg-amber-500/15 text-amber-200 border-amber-400/25 font-semibold',
        nameText: 'text-amber-300 font-semibold',
        tabActive: 'bg-amber-300 text-amber-950 font-bold border-amber-300 shadow-xs',
        tabInactive: 'text-amber-300 hover:text-amber-100 hover:bg-amber-950/40 border-transparent',
        dot: 'bg-amber-400',
        iconColor: 'text-amber-300',
        borderGlow: 'border-amber-400/30',
        bgSubtle: 'bg-amber-500/10'
      };
  }
}

export function playRadioChirp(toneType: 'transmit' | 'roger' | 'alert' | 'grant' | 'dial' | 'connect' | 'disconnect' | 'incoming' = 'transmit') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (toneType === 'grant') {
      // P25 Motorola Trunking 3-chirp Grant Tone
      const freqs = [900, 1100, 1400];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.035);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (idx + 1) * 0.035);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.035);
        osc.stop(ctx.currentTime + (idx + 1) * 0.035);
      });
    } else if (toneType === 'connect') {
      // Radio link established chime
      [880, 1320].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.07, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.12);
      });
    } else if (toneType === 'incoming') {
      // Emergency priority ring warble
      [750, 950, 750, 950].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.08);
      });
    } else if (toneType === 'disconnect') {
      // Radio link drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (toneType === 'dial') {
      // Radio repeater trunking sync pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (toneType === 'transmit') {
      // Start of PTT transmission
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1250, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else if (toneType === 'alert') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      osc.frequency.setValueAtTime(650, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } else {
      // Roger beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch {
    // Graceful fallback
  }
}

// Generate realistic radio static noise burst
export function playRadioStatic(durationMs: number = 70) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const bufferSize = ctx.sampleRate * (durationMs / 1000);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    // Filter to simulate radio bandpass
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start();
  } catch {
    // Fallback
  }
}

// Helper alias for call tones (dialing, connected, disconnected, incoming)
export function playRadioCallTone(type: 'dialing' | 'connected' | 'disconnected' | 'incoming' | 'alert') {
  if (type === 'dialing') {
    playRadioChirp('dial');
  } else if (type === 'connected') {
    playRadioChirp('connect');
  } else if (type === 'disconnected') {
    playRadioChirp('disconnect');
  } else if (type === 'incoming') {
    playRadioChirp('incoming');
  } else {
    playRadioChirp('alert');
  }
}

// Clean text for speech synthesis to prevent browser TTS from speaking emoji symbols or technical markers
export function cleanSpokenRadioText(rawText: string): string {
  if (!rawText) return '';
  // Strip emojis, tags like [RADIO CALL]:, and symbols while keeping real message text intact
  let cleaned = rawText
    .replace(/\[RADIO CALL\]:?/gi, '')
    .replace(/\[Voice Note\]:?/gi, '')
    .replace(/🎙|📻|🚨|🚒|🚓|🚑|⚡|🔔|📡|🛑/gu, '')
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

// Cache available browser voices and pick the most natural human voice
let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    cachedVoices = voices;
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

export function getBestNaturalVoice(speakerType: 'Dispatcher' | 'Responder' | 'Officer' | 'Default' = 'Default'): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length > 0 ? cachedVoices : loadVoices();
  if (!voices || voices.length === 0) return null;

  // Prefer natural English voices (Google, Microsoft, Apple, Natural)
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));
  const candidatePool = englishVoices.length > 0 ? englishVoices : voices;

  // Filter out robotic voices like eSpeak if better voices exist
  const nonRobotic = candidatePool.filter(v => !v.name.toLowerCase().includes('espeak') && !v.name.toLowerCase().includes('croak') && !v.name.toLowerCase().includes('whisper'));
  const pool = nonRobotic.length > 0 ? nonRobotic : candidatePool;

  if (speakerType === 'Dispatcher') {
    // Try to find natural authoritative dispatcher voices (Aria, Jenny, Samantha, Google US, Karen, Victoria)
    const preferred = pool.find(v => 
      /natural|google us english|aria|jenny|samantha|karen|victoria|zira|susan/i.test(v.name)
    ) || pool.find(v => v.lang === 'en-US') || pool[0];
    return preferred || null;
  } else if (speakerType === 'Responder' || speakerType === 'Officer') {
    // Try to find responder voice (Guy, David, Daniel, Alex, Google UK English Male, George)
    const preferred = pool.find(v => 
      /natural|guy|david|daniel|alex|google uk english male|george|tom|oliver/i.test(v.name)
    ) || pool.find(v => v.lang === 'en-GB' || v.lang === 'en-US') || pool[0];
    return preferred || null;
  }

  // General default: prefer Natural or Google or Apple voices
  const defaultVoice = pool.find(v => /natural|google|samantha|aria|david|daniel/i.test(v.name)) || pool[0];
  return defaultVoice || null;
}

// Cache utterance reference globally to avoid Chrome garbage collection bug during speech
let activeTacticalUtterance: SpeechSynthesisUtterance | null = null;

// Speak radio response using browser speech synthesis with tactical radio sound wrapper and natural voices
export function speakTacticalRadio(text: string, speakerTypeOrOnEnd?: string | (() => void), onEndCallback?: () => void) {
  const onEnd = typeof speakerTypeOrOnEnd === 'function' ? speakerTypeOrOnEnd : onEndCallback;
  const speakerType = typeof speakerTypeOrOnEnd === 'string' ? speakerTypeOrOnEnd : 'Default';
  const spokenText = cleanSpokenRadioText(text);

  if (!spokenText) {
    if (onEnd) onEnd();
    return;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(spokenText);
      activeTacticalUtterance = utterance;

      const voice = getBestNaturalVoice(speakerType as any);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || 'en-US';
      } else {
        utterance.lang = 'en-US';
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        activeTacticalUtterance = null;
        playRadioChirp('roger');
        if (onEnd) onEnd();
      };
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis notice:', e);
        activeTacticalUtterance = null;
        if (onEnd) onEnd();
      };

      playRadioChirp('grant');
      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {
      console.warn('SpeechSynthesis execution notice:', e);
      activeTacticalUtterance = null;
      if (onEnd) onEnd();
    }
  } else {
    if (onEnd) onEnd();
  }
}

// Convert azimuth degrees (0-360) into 16-point cardinal compass direction (e.g. N, NNE, NE, ENE, E, etc.)
export function getCompassDirection(degree: number): string {
  const normalized = ((degree % 360) + 360) % 360;
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

// Calculate bearing angle from coordinate 1 to coordinate 2 in degrees (0-359)
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 45;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return Math.round((toDeg(theta) + 360) % 360);
}

// Authoritative Unit Base Station Coordinates in Chennai
export const UNIT_BASE_COORDS: Record<string, { lat: number; lng: number; baseHeading: number; stationName: string }> = {
  'FE-12': { lat: 13.0890, lng: 80.2320, baseHeading: 85, stationName: 'Central Fire Base (Kilpauk)' },
  'FE-04': { lat: 13.0910, lng: 80.2150, baseHeading: 120, stationName: 'Anna Nagar Fire Base' },
  'FE-09': { lat: 13.0067, lng: 80.2206, baseHeading: 35, stationName: 'Guindy Fire Station' },
  'FE-18': { lat: 13.1143, lng: 80.1548, baseHeading: 160, stationName: 'Ambattur Industrial Post' },
  'FE-02': { lat: 13.0332, lng: 80.2678, baseHeading: 275, stationName: 'Mylapore Fire Station' },
  'AMB-07': { lat: 13.0800, lng: 80.2780, baseHeading: 190, stationName: 'Rajiv Gandhi GH Base' },
  'AMB-02': { lat: 13.0600, lng: 80.2500, baseHeading: 60, stationName: 'Apollo Hospital Base' },
  'AMB-11': { lat: 13.0720, lng: 80.2580, baseHeading: 145, stationName: 'Institute of Child Health' },
  'AMB-16': { lat: 13.0012, lng: 80.2565, baseHeading: 330, stationName: 'Adyar Trauma Station' },
  'AMB-22': { lat: 13.0850, lng: 80.2800, baseHeading: 95, stationName: 'Stanley Hospital Post' },
  'AMB-33': { lat: 13.0820, lng: 80.2410, baseHeading: 210, stationName: 'KMC Kilpauk Hospital' },
  'PV-23': { lat: 13.0750, lng: 80.2250, baseHeading: 75, stationName: 'Kilpauk Police Station' },
  'PV-12': { lat: 13.0450, lng: 80.2100, baseHeading: 180, stationName: 'Guindy Police Station' },
  'PV-08': { lat: 13.0400, lng: 80.2350, baseHeading: 310, stationName: 'T. Nagar Police Station' },
  'PV-31': { lat: 13.0500, lng: 80.2820, baseHeading: 225, stationName: 'Marina Coast Precinct' },
  'PV-45': { lat: 12.9250, lng: 80.1200, baseHeading: 15, stationName: 'Tambaram Division' },
  'PV-52': { lat: 13.0827, lng: 80.2707, baseHeading: 90, stationName: 'Chennai Central Precinct' },
  'SWAT-01': { lat: 13.0827, lng: 80.2707, baseHeading: 45, stationName: 'Police Command HQ' },
  'TP-19': { lat: 13.0520, lng: 80.2510, baseHeading: 135, stationName: 'Traffic Police Post' },
  'RT-01': { lat: 13.0827, lng: 80.2707, baseHeading: 270, stationName: 'Disaster Response Post' },
  'RT-05': { lat: 13.0332, lng: 80.2678, baseHeading: 180, stationName: 'Mylapore SDRF Post' },
  'RT-09': { lat: 13.0067, lng: 80.2206, baseHeading: 45, stationName: 'South Rescue Post' },
  'HZ-03': { lat: 13.1143, lng: 80.1548, baseHeading: 315, stationName: 'Ambattur Hazmat Post' },
  'HZ-07': { lat: 13.0890, lng: 80.2320, baseHeading: 90, stationName: 'Central Hazmat Depot' },
  'UAV-01': { lat: 13.0827, lng: 80.2707, baseHeading: 10, stationName: 'Recon Drone Hub 1' },
  'UAV-02': { lat: 13.0067, lng: 80.2206, baseHeading: 180, stationName: 'Recon Drone Hub 2' },
  'UAV-03': { lat: 13.0910, lng: 80.2150, baseHeading: 90, stationName: 'Recon Drone Hub 3' },
  'CGR-02': { lat: 13.0500, lng: 80.2820, baseHeading: 90, stationName: 'Coast Guard Jetty' },
  'CGR-05': { lat: 13.0012, lng: 80.2565, baseHeading: 120, stationName: 'Marina Harbor Post' },
  'EV-01': { lat: 13.0600, lng: 80.2500, baseHeading: 240, stationName: 'Emergency Logistics Depot' }
};

