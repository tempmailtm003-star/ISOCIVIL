import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Shield,
  Flame,
  Stethoscope,
  AlertTriangle,
  Zap,
  Car,
  Minimize2,
  Maximize2,
  Activity,
  Signal,
  Lock,
  ChevronRight,
  Send,
  Sparkles,
  Wifi,
  Disc,
  Play,
  Pause
} from 'lucide-react';
import { Vehicle, ChatChannel, RadioCallSession, RadioTransmission } from '../types';
import { getUnitStyles, playRadioChirp, playRadioStatic, speakTacticalRadio } from '../utils/tacticalUtils';
import { requestMicrophonePermission, startVoiceRecording, stopVoiceRecording, VoiceRecordingSession, playVoiceAudio, unlockAudio } from '../utils/voiceUtils';

interface RadioCallModalProps {
  session: RadioCallSession | null;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onSendTransmission: (
    text: string,
    isDispatcher?: boolean,
    isVoiceNote?: boolean,
    voiceDuration?: string,
    audioData?: string
  ) => void;
  vehicles: Vehicle[];
  channels: ChatChannel[];
  onStartCall: (target: { type: 'Unit' | 'Channel'; id: string; name: string; vehicle?: Vehicle; channel?: ChatChannel }) => void;
  isOpen: boolean;
  onCloseModal: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

const TACTICAL_PROMPTS = [
  'Report status and current ETA to incident scene.',
  'Priority 1: Establish north traffic diversion cordon immediately.',
  'Hydrant pressure online. Advise attack team readiness.',
  'Ambulance en route. Requesting green corridor at junction.',
  'Hazmat containment level 2 activated. Wear SCBA gear.',
  'Deploy thermal aerial drone for rooftop scan.'
];

export const RadioCallModal: React.FC<RadioCallModalProps> = ({
  session,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onSendTransmission,
  vehicles,
  channels,
  onStartCall,
  isOpen,
  onCloseModal,
  isMinimized,
  onToggleMinimize
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [pttHeld, setPttHeld] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [dialTargetType, setDialTargetType] = useState<'Unit' | 'Channel'>('Unit');
  const [selectedTargetId, setSelectedTargetId] = useState<string>(vehicles[0]?.id || 'FE-12');
  const [squelchFilter, setSquelchFilter] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingTxId, setPlayingTxId] = useState<string | null>(null);

  const transmissionsEndRef = useRef<HTMLDivElement>(null);
  const audioWaveIntervalRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);
  const liveTranscriptRef = useRef<string>('');
  const pttSessionRef = useRef<VoiceRecordingSession | null>(null);
  const pttSessionPromiseRef = useRef<Promise<VoiceRecordingSession> | null>(null);
  const stopPlaybackRef = useRef<(() => void) | null>(null);
  const [waveHeights, setWaveHeights] = useState<number[]>([20, 45, 80, 55, 90, 40, 75, 60, 30, 85, 50, 65, 40, 95]);

  // Clean up audio & recording on unmount or session change
  useEffect(() => {
    return () => {
      clearInterval(recordingTimerRef.current);
      clearInterval(audioWaveIntervalRef.current);
      if (stopPlaybackRef.current) {
        stopPlaybackRef.current();
        stopPlaybackRef.current = null;
      }
      if (pttSessionRef.current) {
        stopVoiceRecording(pttSessionRef.current).catch(() => {});
        pttSessionRef.current = null;
      }
      pttSessionPromiseRef.current = null;
    };
  }, []);

  // Auto scroll transcriptions
  useEffect(() => {
    transmissionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.transmissions]);

  // Waveform animation while transmitting or connected
  useEffect(() => {
    if (session?.status === 'connected') {
      audioWaveIntervalRef.current = setInterval(() => {
        setWaveHeights(prev =>
          prev.map(() => (session.isPTTActive || pttHeld ? Math.floor(Math.random() * 70 + 30) : Math.floor(Math.random() * 18 + 8)))
        );
      }, 120);
    } else {
      clearInterval(audioWaveIntervalRef.current);
    }
    return () => clearInterval(audioWaveIntervalRef.current);
  }, [session?.status, session?.isPTTActive, pttHeld]);

  // Keyboard spacebar PTT shortcut support when call modal is active
  useEffect(() => {
    if (!session || session.status !== 'connected' || isMinimized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger PTT if typing in text input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.code === 'Space' && !e.repeat && !pttHeld) {
        e.preventDefault();
        handlePttPress();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.code === 'Space' && pttHeld) {
        e.preventDefault();
        handlePttRelease();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [session, pttHeld, isMinimized]);

  if (!isOpen && !session) return null;

  const handlePttPress = async () => {
    if (!session || session.status !== 'connected' || pttHeld) return;
    unlockAudio();

    // Stop any currently playing voice transmission audio
    if (stopPlaybackRef.current) {
      stopPlaybackRef.current();
      stopPlaybackRef.current = null;
      setPlayingTxId(null);
    }

    setPttHeld(true);
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    setRecordingSeconds(0);
    playRadioStatic(40);
    setTimeout(() => playRadioChirp('grant'), 50);

    clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(s => s + 1);
    }, 1000);

    try {
      const recPromise = startVoiceRecording((text) => {
        setLiveTranscript(text);
        liveTranscriptRef.current = text;
      });
      pttSessionPromiseRef.current = recPromise;
      const recSession = await recPromise;
      pttSessionRef.current = recSession;
    } catch (e) {
      console.warn('Tactical PTT start error:', e);
    }
  };

  const handlePttRelease = async () => {
    if (!pttHeld || !session) return;
    setPttHeld(false);
    clearInterval(recordingTimerRef.current);
    playRadioChirp('roger');
    playRadioStatic(60);

    let recordedData: { audioData?: string; durationSeconds: number; durationStr: string; transcript: string } = {
      durationSeconds: Math.max(1, recordingSeconds),
      durationStr: `0:0${Math.max(1, Math.min(recordingSeconds, 9))}`,
      transcript: liveTranscriptRef.current || liveTranscript || ''
    };

    let sessionToStop = pttSessionRef.current;
    if (!sessionToStop && pttSessionPromiseRef.current) {
      try {
        sessionToStop = await pttSessionPromiseRef.current;
      } catch (err) {
        console.warn('Error awaiting PTT session in release:', err);
      }
    }

    if (sessionToStop) {
      try {
        recordedData = await stopVoiceRecording(sessionToStop, liveTranscriptRef.current || liveTranscript);
      } catch (err) {
        console.warn('Error stopping voice recording:', err);
      }
      pttSessionRef.current = null;
      pttSessionPromiseRef.current = null;
    }

    // Determine what exact message was spoken or typed
    const spokenTranscript = (recordedData.transcript || liveTranscriptRef.current || liveTranscript || '').trim();

    if (manualInput.trim()) {
      handleSendSpokenTransmission(manualInput.trim(), true, false, undefined, undefined);
      setManualInput('');
    } else if (spokenTranscript) {
      // User spoke! Send the exact spoken message
      handleSendSpokenTransmission(spokenTranscript, true, true, recordedData.durationStr, recordedData.audioData);
    } else if (recordedData.audioData || recordingSeconds >= 1) {
      // Audio captured without speech recognition words (e.g. mic active)
      const fallbackVoiceMsg = `Voice radio transmission (${recordedData.durationStr})`;
      handleSendSpokenTransmission(fallbackVoiceMsg, true, true, recordedData.durationStr, recordedData.audioData);
    } else {
      // Instant tap fallback
      handleSendSpokenTransmission('Control to Unit, acknowledge transmission.', true, false, undefined, undefined);
    }

    setLiveTranscript('');
    liveTranscriptRef.current = '';
    setRecordingSeconds(0);
  };

  const handleSendSpokenTransmission = (
    text: string,
    isDispatcher = true,
    isVoiceNote = false,
    voiceDuration?: string,
    audioData?: string
  ) => {
    if (!session || !text.trim()) return;
    onSendTransmission(text.trim(), isDispatcher, isVoiceNote, voiceDuration, audioData);
  };

  const handleTogglePlayback = (tx: RadioTransmission) => {
    unlockAudio();
    if (playingTxId === tx.id) {
      if (stopPlaybackRef.current) {
        stopPlaybackRef.current();
        stopPlaybackRef.current = null;
      }
      setPlayingTxId(null);
      return;
    }

    if (stopPlaybackRef.current) {
      stopPlaybackRef.current();
      stopPlaybackRef.current = null;
    }

    setPlayingTxId(tx.id);
    const stopFn = playVoiceAudio(
      tx.audioData,
      tx.text,
      () => setPlayingTxId(tx.id),
      () => {
        setPlayingTxId(null);
        stopPlaybackRef.current = null;
      }
    );
    stopPlaybackRef.current = stopFn;
  };

  const handleStartDialing = (e: React.FormEvent) => {
    e.preventDefault();
    requestMicrophonePermission().catch(() => {});
    if (dialTargetType === 'Unit') {
      const v = vehicles.find(item => item.id === selectedTargetId) || vehicles[0];
      if (v) {
        onStartCall({
          type: 'Unit',
          id: v.id,
          name: v.name,
          vehicle: v
        });
      }
    } else {
      const c = channels.find(item => item.id === selectedTargetId) || channels[0];
      if (c) {
        onStartCall({
          type: 'Channel',
          id: c.id,
          name: c.name,
          channel: c
        });
      }
    }
  };

  // Format call duration MM:SS
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const targetVehicle = session?.targetType === 'Unit' ? vehicles.find(v => v.id === session.targetId) : null;
  const unitStyles = targetVehicle ? getUnitStyles(targetVehicle.type || targetVehicle.id, isDark) : getUnitStyles('Police', isDark);

  // Minimized In-Call Dock Bar (Fixed bottom right)
  if (session && isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-[4000] rounded-2xl shadow-xl p-3 flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 border ${
        isDark ? 'bg-[#090e1a] border-[#223554]' : 'bg-white border-slate-300 text-slate-900 shadow-md'
      }`}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div className={`p-1.5 rounded-lg border ${
            isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
          }`}>
            <Radio size={14} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold max-w-[140px] truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{session.targetName}</span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">
                {formatDuration(session.durationSeconds)}
              </span>
            </div>
            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{session.frequency}</span>
          </div>
        </div>

        {/* Mini PTT button */}
        <button
          onMouseDown={handlePttPress}
          onMouseUp={handlePttRelease}
          onTouchStart={handlePttPress}
          onTouchEnd={handlePttRelease}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
            pttHeld
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950 border border-emerald-300 shadow-xs'
          }`}
        >
          <Mic size={12} className={pttHeld ? 'animate-bounce' : ''} />
          <span>{pttHeld ? 'TX LIVE' : 'HOLD PTT'}</span>
        </button>

        <button
          onClick={onToggleMinimize}
          className={`p-1.5 rounded-lg transition-colors ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Expand Radio Call Screen"
        >
          <Maximize2 size={14} />
        </button>

        <button
          onClick={onEndCall}
          className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-600 dark:text-red-300 hover:text-white rounded-lg border border-red-500/40 transition-colors"
          title="End Call"
        >
          <PhoneOff size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[4000] flex items-center justify-center p-3 sm:p-4 ${
      isDark ? 'bg-slate-950/85 backdrop-blur-md' : 'bg-slate-900/40 backdrop-blur-xs'
    }`}>
      <div className={`rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 border ${
        isDark ? 'bg-[#090e1a] border-[#223554]' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        {/* Top Tactical Transceiver Status Bar */}
        <div className={`p-3 sm:p-4 border-b flex justify-between items-center ${
          isDark ? 'bg-[#070b14] border-[#1b2a45]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
            }`}>
              <Radio size={18} className={session?.status === 'connected' ? 'animate-pulse' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Tactical P25 Digital Radio Transceiver
                </h3>
                <span className={`flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                  isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-800 bg-emerald-50 border-emerald-300'
                }`}>
                  <Lock size={9} /> AES-256 SECURE
                </span>
              </div>
              <div className={`flex items-center gap-2 text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Signal size={12} /> RSSI -62 dBm
                </span>
                <span>•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">P25 Trunking Repeater: ONLINE</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {session && (
              <button
                onClick={onToggleMinimize}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Minimize Call to Dock"
              >
                <Minimize2 size={15} />
              </button>
            )}
            <button
              onClick={() => {
                if (session) {
                  onEndCall();
                } else {
                  onCloseModal();
                }
              }}
              className={`p-1.5 rounded-lg transition-colors text-xs font-bold ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* If NO active session: Dialing / Select Target Screen */}
        {!session ? (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
            <div>
              <h4 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Initiate Direct Radio Dispatch Call</h4>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Establish an encrypted, 2-way tactical voice radio frequency link with field vehicles or tactical operational nets.
              </p>
            </div>

            <form onSubmit={handleStartDialing} className="space-y-4">
              {/* Type Switcher */}
              <div className={`flex p-1 rounded-xl border gap-1 ${
                isDark ? 'bg-[#0d1527] border-[#1b2b46]' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setDialTargetType('Unit');
                    setSelectedTargetId(vehicles[0]?.id || 'FE-12');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    dialTargetType === 'Unit'
                      ? 'bg-emerald-400 text-emerald-950 font-bold border border-emerald-300 shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Car size={14} />
                  <span>Call Specific Emergency Unit ({vehicles.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDialTargetType('Channel');
                    setSelectedTargetId(channels[0]?.id || 'inc-015');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    dialTargetType === 'Channel'
                      ? 'bg-emerald-400 text-emerald-950 font-bold border border-emerald-300 shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Radio size={14} />
                  <span>Call Net Frequency ({channels.length})</span>
                </button>
              </div>

              {/* Target Selector */}
              {dialTargetType === 'Unit' ? (
                <div className="space-y-2">
                  <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Select Field Vehicle / Unit:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {vehicles.map(v => {
                      const vStyles = getUnitStyles(v.type || v.id, isDark);
                      const isSelected = selectedTargetId === v.id;
                      return (
                        <button
                          type="button"
                          key={v.id}
                          onClick={() => setSelectedTargetId(v.id)}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                            isSelected
                              ? isDark
                                ? 'bg-[#15233c] border-emerald-500/70 shadow-md ring-1 ring-emerald-500'
                                : 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                              : isDark
                              ? 'bg-[#0b1120] border-[#18263e] hover:border-slate-600 text-slate-300'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full ${vStyles.dot}`}></span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono font-bold ${vStyles.idBadge}`}>
                                  {v.id}
                                </span>
                                <span className={`font-bold text-xs truncate max-w-[130px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{v.name}</span>
                              </div>
                              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{v.driver} • {v.station}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{v.status}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Select Tactical Net / Net Channel:</label>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {channels.map(c => {
                      const isSelected = selectedTargetId === c.id;
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => setSelectedTargetId(c.id)}
                          className={`p-3 rounded-xl border text-left w-full transition-all flex items-center justify-between ${
                            isSelected
                              ? isDark
                                ? 'bg-[#15233c] border-emerald-500/70 shadow-md ring-1 ring-emerald-500'
                                : 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                              : isDark
                              ? 'bg-[#0b1120] border-[#18263e] hover:border-slate-600 text-slate-300'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-800'
                          }`}
                        >
                          <div>
                            <h5 className={`font-bold text-xs ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{c.name}</h5>
                            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{c.description}</p>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-800 bg-emerald-50 border-emerald-300'
                          }`}>
                            {c.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Channel Frequency Summary */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                isDark ? 'bg-[#070b14] border-[#17243a] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center gap-2">
                  <Radio size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Assigned Frequency:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">TAC-852.125 MHz (CH 01)</strong>
                </div>
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Duplex Repeater Active</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className={`flex-1 py-2.5 font-bold rounded-xl text-xs transition-colors ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold border border-emerald-300 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PhoneCall size={14} />
                  <span>Open Tactical Radio Link</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ACTIVE RADIO CALL SESSION SCREEN */
          <div className="flex flex-col flex-1 min-h-0">
            {/* Call Header Profile Bar */}
            <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'bg-[#0b1222] border-[#1b2b46]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl border ${unitStyles.borderGlow} ${unitStyles.bgSubtle} relative`}>
                  {unitStyles.category === 'Fire' && <Flame size={22} className="text-red-500" />}
                  {unitStyles.category === 'Police' && <Shield size={22} className="text-blue-500" />}
                  {unitStyles.category === 'Ambulance' && <Stethoscope size={22} className="text-emerald-500" />}
                  {unitStyles.category === 'Hazmat' && <AlertTriangle size={22} className="text-yellow-500" />}
                  {unitStyles.category === 'Drone' && <Zap size={22} className="text-violet-500" />}
                  {unitStyles.category === 'Marine' && <Zap size={22} className="text-cyan-500" />}
                  {unitStyles.category === 'Rescue' && <Car size={22} className="text-orange-500" />}
                  {unitStyles.category === 'Other' && <Radio size={22} className="text-emerald-500" />}

                  {session.status === 'connected' && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded border font-mono font-bold ${unitStyles.idBadge}`}>
                      {session.targetId}
                    </span>
                    <h4 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{session.targetName}</h4>
                  </div>
                  <div className={`flex items-center gap-2 text-xs mt-0.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{session.frequency}</span>
                    <span>•</span>
                    <span>{session.driver ? `${session.driver} • ${session.station}` : session.targetType}</span>
                  </div>
                </div>
              </div>

              {/* Call Status & Timer Badge */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${
                      session.status === 'connected'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : session.status === 'dialing'
                        ? 'text-amber-500 animate-pulse'
                        : 'text-red-500'
                    }`}
                  >
                    {session.status === 'connected' ? 'RADIO LINK ACTIVE' : 'DIALING TRUNKING NET...'}
                  </span>
                  <span className={`text-base font-mono font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {formatDuration(session.durationSeconds)}
                  </span>
                </div>

                {/* Squelch filter toggle */}
                <button
                  onClick={() => {
                    setSquelchFilter(!squelchFilter);
                    playRadioStatic(50);
                  }}
                  className={`p-2 rounded-xl border text-xs font-mono transition-colors ${
                    squelchFilter
                      ? isDark ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                  title="Radio Noise Squelch Gate"
                >
                  SQUELCH
                </button>
              </div>
            </div>

            {/* Live Audio Frequency Spectrum Visualizer */}
            <div className={`px-4 py-2 border-b flex items-center justify-between ${
              isDark ? 'bg-[#060a14] border-[#15233a]' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className={`flex items-center gap-1.5 text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <Activity size={13} className={session.isPTTActive || pttHeld ? 'text-red-500 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'} />
                <span>{session.isPTTActive || pttHeld ? 'TRANSMITTING (TX)' : 'RECEIVING (RX IDLE)'}</span>
              </div>

              {/* Audio Spectrum Bars */}
              <div className="flex items-center gap-1 h-6">
                {waveHeights.map((h, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-100 ${
                      session.isPTTActive || pttHeld
                        ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                        : isDark ? 'bg-emerald-500/70' : 'bg-emerald-600'
                    }`}
                    style={{ height: `${h}%` }}
                  ></span>
                ))}
              </div>

              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>VOCODER: AMBE+2™ 4.8kbps</span>
            </div>

            {/* Live Call Transmissions Stream (Real-Time Tactical Transcript) */}
            <div className={`flex-1 p-3 sm:p-4 space-y-2.5 overflow-y-auto max-h-56 ${
              isDark ? 'bg-[#070c17]/60' : 'bg-slate-50/80'
            }`}>
              {session.transmissions.length === 0 ? (
                <div className={`p-6 text-center text-xs space-y-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  <Radio size={24} className={`mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                  <p className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Radio Channel Open & Ready</p>
                  <p>Hold the Push-To-Talk (PTT) button below or press [Spacebar] to transmit dispatch voice.</p>
                </div>
              ) : (
                session.transmissions.map(tx => (
                  <div
                    key={tx.id}
                    className={`p-2.5 rounded-xl text-xs space-y-1.5 border ${
                      tx.speakerType === 'Dispatcher'
                        ? isDark ? 'bg-[#0f1d33]/80 border-emerald-500/40 text-emerald-100 ml-6' : 'bg-emerald-50 border-emerald-200 text-slate-800 ml-6 shadow-xs'
                        : tx.speakerType === 'Responder'
                        ? isDark ? 'bg-[#0c1926]/90 border-emerald-500/40 text-emerald-100 mr-6' : 'bg-white border-slate-200 text-slate-800 mr-6 shadow-xs'
                        : isDark ? 'bg-[#111927] border-[#1f2e46] text-slate-400 text-center text-[11px]' : 'bg-slate-100 border-slate-200 text-slate-600 text-center text-[11px]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold flex items-center gap-1">
                        {tx.speaker}
                        {tx.isVoiceNote && (
                          <span className={`px-1 py-0.2 rounded text-[9px] border ${
                            isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            VOICE
                          </span>
                        )}
                      </span>
                      <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>{tx.time}</span>
                    </div>
                    {/* Voice Note or Text Message */}
                    {tx.isVoiceNote || tx.audioData ? (
                      <div className="space-y-1.5 mt-1">
                        {/* Tactical Voice Recording Green Pill Badge matching screenshot */}
                        <div className={`flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md w-fit border ${
                          isDark ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' : 'text-emerald-800 bg-emerald-50 border-emerald-300'
                        }`}>
                          <Mic size={10} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
                          <span>TACTICAL VOICE RECORDING</span>
                        </div>

                        {/* Audio Waveform Player Card matching screenshot */}
                        <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border shadow-inner ${
                          isDark ? 'bg-[#090f1d] border-[#1b2a42]' : 'bg-white border-slate-200'
                        }`}>
                          <button
                            type="button"
                            onClick={() => handleTogglePlayback(tx)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                              playingTxId === tx.id
                                ? 'bg-emerald-500 text-white animate-pulse shadow-md'
                                : 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950 border border-emerald-300 shadow-xs'
                            }`}
                            title={playingTxId === tx.id ? "Pause Voice Recording" : "Play Voice Recording"}
                          >
                            {playingTxId === tx.id ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                          </button>

                          <div className="flex-1 flex items-center gap-1">
                            {[35, 75, 95, 55, 85, 40, 100, 70, 30, 80, 90, 45, 65, 85, 50, 70].map((h, i) => (
                              <span
                                key={i}
                                className={`w-1 rounded-full transition-all duration-150 ${
                                  playingTxId === tx.id
                                    ? 'bg-emerald-500 animate-bounce'
                                    : isDark ? 'bg-slate-600' : 'bg-slate-300'
                                }`}
                                style={{ 
                                  height: playingTxId === tx.id ? `${Math.max(6, (h / 100) * 18)}px` : '8px',
                                  animationDelay: `${i * 40}ms`
                                }}
                              ></span>
                            ))}
                          </div>

                          <div className="flex flex-col items-end shrink-0 text-[10px] font-mono">
                            <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{tx.voiceDuration || tx.audioDuration || '0:04'}</span>
                            <span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{playingTxId === tx.id ? 'Playing' : 'Audio Note'}</span>
                          </div>
                        </div>

                        {tx.text && !tx.text.startsWith('Voice radio transmission') && (
                          <div className={`rounded-lg px-2.5 py-1.5 border text-xs ${
                            isDark ? 'bg-[#0b1322]/80 border-[#1c2e4a] text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                          }`}>
                            <p className="leading-relaxed font-sans">{tx.text}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="leading-relaxed font-sans">{tx.text}</p>
                    )}
                  </div>
                ))
              )}
              
              {/* Live Active Voice Recording / Speech Transcription Indicator */}
              {pttHeld && (
                <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl flex items-center justify-between gap-3 animate-pulse">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                    <div className="text-xs text-red-200 truncate">
                      <span className="font-bold font-mono uppercase tracking-wider text-red-400 mr-2 shrink-0">RECORDING:</span>
                      <span className="italic">{liveTranscript || 'Listening to your microphone... speak now...'}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-red-400 shrink-0 bg-red-900/40 px-2 py-0.5 rounded border border-red-500/30">
                    00:0{recordingSeconds}
                  </span>
                </div>
              )}

              <div ref={transmissionsEndRef} />
            </div>

            {/* Quick Radio Directives Prompts */}
            <div className={`p-2 border-t flex items-center gap-1.5 overflow-x-auto scrollbar-none ${
              isDark ? 'bg-[#070b14] border-[#172338]' : 'bg-slate-100 border-slate-200'
            }`}>
              <span className={`text-[10px] font-bold uppercase shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Quick Transmit:</span>
              {TACTICAL_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    playRadioChirp('grant');
                    handleSendSpokenTransmission(prompt);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg shrink-0 transition-colors border ${
                    isDark
                      ? 'text-slate-300 hover:text-white bg-[#0e1626] hover:bg-[#15233c] border-[#1b2b46]'
                      : 'text-slate-800 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-300 shadow-xs'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* In-Call Controls & Large PTT Button Area */}
            <div className={`p-4 border-t space-y-3 ${
              isDark ? 'bg-[#090e1a] border-[#1b2a45]' : 'bg-slate-50 border-slate-200'
            }`}>
              {/* Optional text-to-speech transmitter input */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (manualInput.trim()) {
                    playRadioChirp('grant');
                    handleSendSpokenTransmission(manualInput.trim());
                    setManualInput('');
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  placeholder="Type transmission or use PTT mic..."
                  className={`flex-1 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 border ${
                    isDark ? 'bg-[#0e1626] border-[#1d2a42] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="px-3 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-emerald-950 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border border-emerald-300 shadow-xs"
                >
                  <Send size={13} />
                  <span>Transmit</span>
                </button>
              </form>

              {/* Main Bottom Tactical Radio Bar */}
              <div className="flex items-center justify-between gap-3 pt-1">
                {/* Secondary controls: Mute / Speaker */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={onToggleMute}
                    className={`p-3 rounded-xl border transition-colors ${
                      session.isMuted
                        ? 'bg-red-500/20 text-red-500 border-red-500/40'
                        : isDark ? 'bg-[#111927] hover:bg-[#18263e] text-slate-300 border-[#1f2e46]' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                    title={session.isMuted ? 'Unmute Mic' : 'Mute Mic'}
                  >
                    {session.isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>

                  <button
                    onClick={onToggleSpeaker}
                    className={`p-3 rounded-xl border transition-colors ${
                      !session.isSpeakerOn
                        ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                        : isDark ? 'bg-[#111927] hover:bg-[#18263e] text-slate-300 border-[#1f2e46]' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                    title={session.isSpeakerOn ? 'Mute Speaker' : 'Enable Speaker'}
                  >
                    {session.isSpeakerOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                </div>

                {/* Massive Tactile PUSH-TO-TALK (PTT) Button */}
                <button
                  type="button"
                  onMouseDown={handlePttPress}
                  onMouseUp={handlePttRelease}
                  onTouchStart={handlePttPress}
                  onTouchEnd={handlePttRelease}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold font-mono text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 select-none shadow-md cursor-pointer ${
                    pttHeld
                      ? 'bg-red-600 text-white shadow-lg scale-95 ring-2 ring-red-400'
                      : 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950 border border-emerald-300 shadow-md'
                  }`}
                >
                  <Mic size={18} className={pttHeld ? 'animate-bounce text-white' : 'text-emerald-100'} />
                  <span>{pttHeld ? '🔴 TRANSMITTING VOICE (LIVE)' : 'HOLD PUSH-TO-TALK [SPACE]'}</span>
                </button>

                {/* End Radio Call Button */}
                <button
                  type="button"
                  onClick={onEndCall}
                  className="p-3 bg-rose-400 hover:bg-rose-300 text-rose-950 border border-rose-300 rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Disconnect Radio Call"
                >
                  <PhoneOff size={16} />
                  <span className="hidden sm:inline text-xs">Drop Link</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
