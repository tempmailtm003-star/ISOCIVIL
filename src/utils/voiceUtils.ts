// Emergency Response Tactical Voice & Audio Subsystem

import { playRadioChirp, playRadioStatic, speakTacticalRadio, cleanSpokenRadioText } from './tacticalUtils';

let activeAudioElement: HTMLAudioElement | null = null;
let activeBufferSource: AudioBufferSourceNode | null = null;
let sharedAudioContext: AudioContext | null = null;
let micPermissionState: 'prompt' | 'granted' | 'denied' = 'prompt';

// Get or create shared AudioContext and resume state on user interaction
export function getOrCreateAudioContext(): AudioContext {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContextClass();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

// Ensure audio context is resumed on user gesture
export function unlockAudio() {
  try {
    const ctx = getOrCreateAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch (e) {
    // Ignore
  }
}

// Check current microphone permission status
export async function getMicrophonePermissionStatus(): Promise<'prompt' | 'granted' | 'denied'> {
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      micPermissionState = result.state as any;
      result.onchange = () => {
        micPermissionState = result.state as any;
      };
      return micPermissionState;
    }
  } catch (e) {
    // Fallback if query not supported
  }
  return micPermissionState;
}

// Explicitly request microphone access from user with prompt
export async function requestMicrophonePermission(): Promise<boolean> {
  unlockAudio();
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      micPermissionState = 'granted';
      // Release test tracks immediately
      stream.getTracks().forEach(t => t.stop());
      return true;
    }
  } catch (err: any) {
    console.warn('Microphone permission request failed or rejected:', err?.message || err);
    micPermissionState = 'denied';
    return false;
  }
  return false;
}

export interface VoiceRecordingSession {
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  stream: MediaStream | null;
  startTime: number;
  recognition?: any;
  transcript: string;
  mimeType: string;
}

// Start Microphone Audio Recording with Live Speech Recognition & Audio Streaming
export async function startVoiceRecording(
  onTranscriptChange?: (text: string) => void
): Promise<VoiceRecordingSession> {
  unlockAudio();
  playRadioChirp('transmit');
  
  let stream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  const audioChunks: Blob[] = [];
  let recognitionInstance: any = null;
  let currentTranscript = '';
  let selectedMime = 'audio/webm';

  // 1. Initialize Real-Time Speech Recognition (Speech-to-Text)
  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (SpeechRec) {
    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = navigator.language || 'en-US';

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript + ' ';
          } else {
            interim += res[0].transcript;
          }
        }
        const full = (final + interim).trim();
        if (full) {
          currentTranscript = full;
          if (onTranscriptChange) {
            onTranscriptChange(full);
          }
        }
      };

      rec.onerror = (e: any) => {
        console.warn('SpeechRecognition live notice:', e?.error || e);
      };

      rec.start();
      recognitionInstance = rec;
    } catch (recErr) {
      console.warn('SpeechRecognition initialization notice:', recErr);
    }
  }

  // 2. Initialize Hardware Microphone MediaRecorder
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      micPermissionState = 'granted';
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        'audio/wav'
      ];
      
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      mediaRecorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : undefined);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };
      // Collect slice every 100ms
      mediaRecorder.start(100);
    }
  } catch (err) {
    console.warn('Microphone stream error on startVoiceRecording:', err);
    micPermissionState = 'denied';
  }

  return {
    mediaRecorder,
    audioChunks,
    stream,
    startTime: Date.now(),
    recognition: recognitionInstance,
    transcript: currentTranscript,
    mimeType: selectedMime
  };
}

// Stop Microphone Recording, Stop Speech Recognition, and Export Audio
export async function stopVoiceRecording(
  session: VoiceRecordingSession,
  latestLiveTranscript?: string
): Promise<{
  audioData?: string;
  durationSeconds: number;
  durationStr: string;
  transcript: string;
}> {
  const durationSeconds = Math.max(1, Math.round((Date.now() - session.startTime) / 1000));
  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  // Safely stop speech recognition
  if (session.recognition) {
    try {
      session.recognition.stop();
    } catch {
      // Ignore
    }
  }

  const finalTranscript = (latestLiveTranscript || session.transcript || '').trim();

  return new Promise((resolve) => {
    let resolved = false;

    const cleanupAndResolve = (audioData?: string) => {
      if (resolved) return;
      resolved = true;
      try {
        session.stream?.getTracks().forEach(t => t.stop());
      } catch {}
      playRadioChirp('roger');
      resolve({
        audioData,
        durationSeconds,
        durationStr,
        transcript: finalTranscript
      });
    };

    if (session.mediaRecorder && session.mediaRecorder.state !== 'inactive') {
      session.mediaRecorder.onstop = () => {
        try {
          if (session.audioChunks.length > 0) {
            const mimeType = session.mimeType || session.mediaRecorder?.mimeType || 'audio/webm';
            const blob = new Blob(session.audioChunks, { type: mimeType });
            const reader = new FileReader();
            reader.onloadend = () => {
              cleanupAndResolve(reader.result as string);
            };
            reader.onerror = () => {
              cleanupAndResolve(undefined);
            };
            reader.readAsDataURL(blob);
          } else {
            cleanupAndResolve(undefined);
          }
        } catch (e) {
          cleanupAndResolve(undefined);
        }
      };

      try {
        if (session.mediaRecorder.state === 'recording') {
          session.mediaRecorder.requestData();
        }
      } catch (e) {
        // Ignore
      }

      try {
        session.mediaRecorder.stop();
      } catch (e) {
        cleanupAndResolve(undefined);
      }

      // Safety timeout in case onstop does not fire
      setTimeout(() => {
        cleanupAndResolve(undefined);
      }, 1200);
    } else {
      cleanupAndResolve(undefined);
    }
  });
}

// Convert base64 data URL to ArrayBuffer for reliable Web Audio API decoding
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert base64 data URL to Blob
function dataURItoBlob(dataURI: string): Blob {
  try {
    const parts = dataURI.split(',');
    const base64Data = parts[1] || parts[0];
    const mimeMatch = dataURI.match(/data:([^;]+);/);
    const mimeString = mimeMatch ? mimeMatch[1] : 'audio/webm';
    const buffer = base64ToArrayBuffer(base64Data);
    return new Blob([buffer], { type: mimeString });
  } catch (e) {
    return new Blob([dataURI], { type: 'audio/webm' });
  }
}

// Play Voice Audio with primary real microphone recording playback (Native Audio Element & Web Audio API) and natural speech synthesis fallback
export function playVoiceAudio(
  audioData?: string,
  fallbackText?: string,
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  unlockAudio();
  
  // Stop currently playing audio or speech
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {}
    activeAudioElement = null;
  }
  if (activeBufferSource) {
    try {
      activeBufferSource.stop();
      activeBufferSource.disconnect();
    } catch {}
    activeBufferSource = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }

  let isCancelled = false;
  let objectUrlToRevoke: string | null = null;

  const stopPlayback = () => {
    isCancelled = true;
    if (activeBufferSource) {
      try {
        activeBufferSource.stop();
        activeBufferSource.disconnect();
      } catch {}
      activeBufferSource = null;
    }
    if (activeAudioElement) {
      try {
        activeAudioElement.pause();
        activeAudioElement.currentTime = 0;
      } catch {}
      activeAudioElement = null;
    }
    if (objectUrlToRevoke) {
      try { URL.revokeObjectURL(objectUrlToRevoke); } catch {}
      objectUrlToRevoke = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    playRadioChirp('disconnect');
    if (onEnd) onEnd();
  };

  if (onStart) onStart();

  const handleFinish = () => {
    if (isCancelled) return;
    if (objectUrlToRevoke) {
      try { URL.revokeObjectURL(objectUrlToRevoke); } catch {}
      objectUrlToRevoke = null;
    }
    activeAudioElement = null;
    activeBufferSource = null;
    playRadioChirp('roger');
    if (onEnd) onEnd();
  };

  const playFallbackTTS = () => {
    if (isCancelled) return;
    let textToSpeak = fallbackText ? cleanSpokenRadioText(fallbackText) : '';
    // If text is a generic header like "Voice radio transmission (0:04)", make it natural tactical transmission
    if (!textToSpeak || textToSpeak.toLowerCase().startsWith('voice radio transmission') || textToSpeak.toLowerCase().includes('transmission (0:')) {
      textToSpeak = 'EOC Dispatch Control transmitting on tactical channel. Message recorded and acknowledged.';
    }
    speakTacticalRadio(textToSpeak, 'Dispatcher', handleFinish);
  };

  // 1. If audioData is present, play the user's actual recorded microphone audio
  if (audioData && typeof audioData === 'string' && audioData.length > 50) {
    try {
      let playSrc = audioData;
      if (audioData.startsWith('data:audio')) {
        try {
          const blob = dataURItoBlob(audioData);
          playSrc = URL.createObjectURL(blob);
          objectUrlToRevoke = playSrc;
        } catch {
          playSrc = audioData;
        }
      }

      const audio = new Audio(playSrc);
      activeAudioElement = audio;
      audio.volume = 1.0;

      audio.onplay = () => {
        playRadioChirp('grant');
      };

      audio.onended = () => {
        handleFinish();
      };

      audio.onerror = (e) => {
        console.warn('Primary audio playback error, trying direct source:', e);
        if (playSrc !== audioData) {
          try {
            const rawAudio = new Audio(audioData);
            activeAudioElement = rawAudio;
            rawAudio.volume = 1.0;
            rawAudio.onplay = () => playRadioChirp('grant');
            rawAudio.onended = handleFinish;
            rawAudio.onerror = () => playFallbackTTS();
            rawAudio.play().catch(() => playFallbackTTS());
            return;
          } catch {}
        }
        playFallbackTTS();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play() rejected, trying direct data URL:', err);
          if (playSrc !== audioData) {
            try {
              const rawAudio = new Audio(audioData);
              activeAudioElement = rawAudio;
              rawAudio.volume = 1.0;
              rawAudio.onplay = () => playRadioChirp('grant');
              rawAudio.onended = handleFinish;
              rawAudio.onerror = () => playFallbackTTS();
              rawAudio.play().catch(() => playFallbackTTS());
              return;
            } catch {}
          }
          playFallbackTTS();
        });
      }
    } catch (e) {
      console.warn('Audio playback exception, falling back:', e);
      playFallbackTTS();
    }
  } else {
    playFallbackTTS();
  }

  return stopPlayback;
}

