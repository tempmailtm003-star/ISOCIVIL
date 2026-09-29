import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { socket } from '../socket';
import {
  Send,
  Mic,
  Shield,
  Flame,
  Building2,
  ChevronUp,
  ChevronDown,
  Radio,
  Plus,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MapPin,
  CheckCheck,
  AlertTriangle,
  Lock,
  Stethoscope,
  Sparkles,
  Layers,
  ArrowRightLeft,
  PhoneCall,
  Phone,
  ExternalLink,
  X
} from 'lucide-react';
import { ChatMessage, ChatChannel, Vehicle, Incident } from '../types';
import { playRadioChirp, playRadioStatic } from '../utils/tacticalUtils';
import { 
  startVoiceRecording, 
  stopVoiceRecording, 
  playVoiceAudio, 
  requestMicrophonePermission, 
  getMicrophonePermissionStatus, 
  VoiceRecordingSession 
} from '../utils/voiceUtils';

export interface CommunicationCenterProps {
  channels?: ChatChannel[];
  activeChannelId?: string;
  onSelectChannel?: (id: string) => void;
  onCreateChannel?: (channel: ChatChannel) => void;
  onRemoveChannel?: (channelId: string) => void;
  vehicles?: Vehicle[];
  incidents?: Incident[];
  onOpenFullView?: () => void;
  onOpenRadioCall?: (target?: { type: 'Unit' | 'Channel'; id: string; name: string; vehicle?: Vehicle; channel?: ChatChannel }) => void;
  messages?: ChatMessage[];
  onSendMessage?: (msg: ChatMessage) => void;
  setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const DEFAULT_CHANNELS: ChatChannel[] = [
  {
    id: 'all-traffic',
    name: '🌐 All Tactical Traffic',
    category: 'Agency-Net',
    description: 'Master live radio net aggregating all responder traffic & direct links',
    lastMessage: 'Master Net active. Monitoring all emergency frequencies.',
    lastTime: '10:40 AM',
    unreadCount: 0
  },
  {
    id: 'agency-fire',
    name: '🚒 Fire & Rescue Command',
    category: 'Agency-Net',
    description: 'City-wide fire response, ladder tenders & hazmat comms',
    lastMessage: 'Fire Control: All stations acknowledge central corridor status.',
    lastTime: '10:30 AM',
    unreadCount: 0
  },
  {
    id: 'agency-police',
    name: '🚔 Police Tactical Command',
    category: 'Agency-Net',
    description: 'City-wide police patrol broadcast channel',
    lastMessage: 'Control: All patrol units keep tactical radios open for VIP corridor.',
    lastTime: '10:35 AM',
    unreadCount: 0
  },
  {
    id: 'agency-hospitals',
    name: '🏥 EMS & Trauma Net',
    category: 'Agency-Net',
    description: 'Hospital ER status and ambulance telemetry',
    lastMessage: 'General Hospital ER: Trauma Bay 2 prepped and awaiting arrival.',
    lastTime: '10:39 AM',
    unreadCount: 0
  }
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-fire-init',
    channelId: 'agency-fire',
    sender: 'Fire Control (HQ)',
    senderType: 'Fire',
    time: '10:30 AM',
    text: 'All Fire Engine & Water Tender units verify tactical digital radio link status.'
  },
  {
    id: 'm6',
    channelId: 'agency-police',
    sender: 'Control Room (Police)',
    senderType: 'Dispatcher',
    time: '10:35 AM',
    text: 'All patrol units in central sector keep tactical radios open for VIP corridor.'
  },
  {
    id: 'm7',
    channelId: 'agency-hospitals',
    sender: 'General Hospital ER',
    senderType: 'Medical',
    time: '10:39 AM',
    text: 'ER is on standby with 2 trauma beds ready. Blood bank notified.'
  }
];

export const CommunicationCenter: React.FC<CommunicationCenterProps> = ({
  channels = DEFAULT_CHANNELS,
  activeChannelId: propActiveChannelId,
  onSelectChannel: propOnSelectChannel,
  onCreateChannel,
  onRemoveChannel,
  vehicles = [],
  incidents = [],
  onOpenFullView,
  onOpenRadioCall,
  messages: propMessages,
  onSendMessage,
  setMessages: propSetMessages
}) => {
  const { theme, isDark } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [internalActiveChannelId, setInternalActiveChannelId] = useState<string>('agency-police');
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const messages = propMessages || internalMessages;
  const updateMessages = propSetMessages || setInternalMessages;

  const [inputText, setInputText] = useState('');
  const [isRecordingPTT, setIsRecordingPTT] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | number | null>(null);
  const [micState, setMicState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const pttSessionRef = useRef<VoiceRecordingSession | null>(null);
  const liveTranscriptRef = useRef<string>('');
  const stopVoiceRef = useRef<(() => void) | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUnit1, setNewUnit1] = useState('AMB-07');
  const [newUnit2, setNewUnit2] = useState('PV-12');
  const [channelCategory, setChannelCategory] = useState<'All' | 'Incident' | 'Inter-Unit' | 'Agency'>('All');
  const [incomingAlert, setIncomingAlert] = useState<{
    id: string | number;
    unitId: string;
    sender: string;
    text: string;
    isVoiceNote?: boolean;
    voiceDuration?: string;
    audioData?: string;
    channelId: string;
    time: string;
  } | null>(null);

  const handleRequestMic = async () => {
    const granted = await requestMicrophonePermission();
    setMicState(granted ? 'granted' : 'denied');
  };

  useEffect(() => {
    getMicrophonePermissionStatus().then(setMicState);
  }, []);

  useEffect(() => {
    const handleReceiveMsg = (data: any) => {
      const { sender, message, incidentId, isVoiceNote, voiceDuration, audioData, tacticalStatus, unitId, missionId } = data;
      
      // Don't add own echo if sent from local Dispatcher
      if (sender === 'EOC Dispatch Control' || sender === 'Dispatcher (Control)') {
        return;
      }

      const effectiveUnitId = (unitId || (sender?.startsWith('FE-') || sender?.startsWith('AMB-') || sender?.startsWith('PV-') || sender?.startsWith('RT-') ? sender.split(' ')[0] : '')).toUpperCase().trim();
      const fallbackUnitId = !effectiveUnitId && incidentId?.startsWith('direct-') ? incidentId.replace('direct-', '').toUpperCase().trim() : effectiveUnitId;

      let resolvedChannelId = incidentId || (fallbackUnitId ? `direct-${fallbackUnitId}` : 'general');
      if (incidentId === 'general') resolvedChannelId = 'general';
      else if (incidentId?.startsWith('direct-')) resolvedChannelId = incidentId;
      else if (incidentId?.startsWith('inc-')) resolvedChannelId = incidentId;
      else if (incidentId) resolvedChannelId = `inc-${incidentId}`;

      const senderType = (fallbackUnitId?.startsWith('FE') || sender?.includes('FE-') || sender?.toLowerCase().includes('fire')) ? 'Fire' :
                         (fallbackUnitId?.startsWith('AMB') || sender?.includes('AMB-') || sender?.toLowerCase().includes('hospital') || sender?.toLowerCase().includes('medic')) ? 'Medical' :
                         (fallbackUnitId?.startsWith('PV') || sender?.includes('PV-') || sender?.toLowerCase().includes('police') || sender?.toLowerCase().includes('patrol')) ? 'Police' : 'Responder';

      const timeStr = data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const targetChannel = fallbackUnitId ? `direct-${fallbackUnitId}` : resolvedChannelId;

      // Always display the live transmission alert banner
      setIncomingAlert({
        id: data.id || `msg-${Date.now()}`,
        unitId: fallbackUnitId || sender || 'Unit',
        sender: sender || fallbackUnitId || 'Responder',
        text: message || (isVoiceNote ? 'Voice transmission received' : ''),
        isVoiceNote: !!isVoiceNote,
        voiceDuration: voiceDuration || '0:04',
        audioData,
        channelId: targetChannel,
        time: timeStr
      });

      // If propSetMessages was NOT provided (standalone mode), update internal state
      if (!propSetMessages) {
        updateMessages(prev => {
          if (data.id && prev.some(m => m.id === data.id)) return prev;
          return [...prev, {
            id: data.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            channelId: resolvedChannelId,
            incidentId: missionId || (incidentId && !incidentId.startsWith('direct-') ? incidentId : undefined),
            sender: sender || fallbackUnitId || 'Responder',
            senderId: fallbackUnitId || unitId || sender,
            senderType,
            time: timeStr,
            text: message || (isVoiceNote ? 'Voice transmission received' : ''),
            isVoiceNote: !!isVoiceNote,
            voiceDuration: voiceDuration || '0:04',
            audioData,
            tacticalStatus
          }];
        });
      }
    };

    socket.on('dispatcher:receive_message', handleReceiveMsg);
    return () => {
      socket.off('dispatcher:receive_message', handleReceiveMsg);
      if (stopVoiceRef.current) {
        stopVoiceRef.current();
      }
    };
  }, [updateMessages, propSetMessages]);

  const activeChannelId = propActiveChannelId || internalActiveChannelId;
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<any>(null);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  const handleSelectChannel = (id: string) => {
    if (propOnSelectChannel) {
      propOnSelectChannel(id);
    } else {
      setInternalActiveChannelId(id);
    }
  };

  const handleCallCurrentChannel = () => {
    if (onOpenRadioCall) {
      if (activeChannel?.unitIds && activeChannel.unitIds.length > 0) {
        const targetV = vehicles.find(v => v.id === activeChannel.unitIds![0]);
        if (targetV) {
          onOpenRadioCall({
            type: 'Unit',
            id: targetV.id,
            name: targetV.name,
            vehicle: targetV
          });
          return;
        }
      }
      onOpenRadioCall({
        type: 'Channel',
        id: activeChannel?.id || 'inc-015',
        name: activeChannel?.name || 'Tactical Net',
        channel: activeChannel
      });
    }
  };

  const isRemovableChannel = (c: ChatChannel) => {
    if (!c) return false;
    // Never allow removal of accident ops (Fire Ops, Medical Ops, Incident Tactical) or core agency nets
    if (
      c.incidentId ||
      c.category === 'Incident-Tactical' ||
      c.category === 'Agency-Net' ||
      c.id.startsWith('inc-') ||
      c.id.startsWith('agency-') ||
      c.id === 'all-traffic' ||
      c.id === 'general' ||
      c.id === 'citywide' ||
      c.name.includes('Ops') ||
      c.name.includes('Incident')
    ) {
      return false;
    }
    // Strictly direct links of units created by dispatcher (or inter-unit direct links)
    return (
      c.category === 'Inter-Unit' ||
      c.id.startsWith('direct-') ||
      c.id.startsWith('unit-') ||
      c.name.toLowerCase().includes('direct')
    );
  };

  const handleRemoveChannelClick = (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (onRemoveChannel) {
      onRemoveChannel(channelId);
    }

    if (activeChannelId === channelId) {
      const remaining = channels.filter(c => c.id !== channelId);
      if (remaining.length > 0) {
        handleSelectChannel(remaining[0].id);
      }
    }

    playRadioChirp('roger');
  };

  const interUnitUnreads = channels.filter(c => c.category === 'Inter-Unit').reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const incidentUnreads = channels.filter(c => c.category === 'Incident-Tactical').reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const agencyUnreads = channels.filter(c => c.category === 'Agency-Net').reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const filteredChannels = channels.filter(c => {
    // ALWAYS include the active channel so it doesn't disappear when switching categories
    if (c.id === activeChannelId) return true;
    // ALWAYS include any direct link with unread messages so dispatcher doesn't miss them
    if (c.category === 'Inter-Unit' && c.unreadCount && c.unreadCount > 0) return true;

    if (channelCategory === 'Incident') return c.category === 'Incident-Tactical';
    if (channelCategory === 'Inter-Unit') return c.category === 'Inter-Unit';
    if (channelCategory === 'Agency') return c.category === 'Agency-Net';
    return true;
  });

  const channelMessages = messages.filter(m => {
    // 0. Master All Traffic Net: view every transmission across the entire city
    if (activeChannelId === 'all-traffic' || activeChannelId === 'all') {
      return true;
    }

    // 1. Direct channel id match
    if (m.channelId === activeChannelId) return true;
    
    // 2. Direct unit communication channel match (e.g. activeChannel is direct-FE-12)
    if (activeChannelId?.startsWith('direct-')) {
      const targetUnit = activeChannelId.replace('direct-', '').toUpperCase().trim();
      if (
        m.senderId?.toUpperCase() === targetUnit ||
        m.sender?.toUpperCase().includes(targetUnit) ||
        m.channelId === `direct-${targetUnit}` ||
        m.incidentId === `direct-${targetUnit}` ||
        m.incidentId?.toUpperCase() === targetUnit
      ) {
        return true;
      }
    }

    // 3. Incident Net match (e.g. active channel has incidentId or starts with inc-)
    const activeIncId = (activeChannel?.incidentId || (activeChannelId?.startsWith('inc-') ? activeChannelId : ''))
      .toLowerCase().replace('inc-', '').trim();
    
    if (activeIncId) {
      const cleanMsgChan = (m.channelId || '').toLowerCase().replace('inc-', '').trim();
      const cleanMsgInc = (m.incidentId || '').toLowerCase().replace('inc-', '').trim();
      if (cleanMsgChan === activeIncId || cleanMsgInc === activeIncId || cleanMsgChan.includes(activeIncId) || activeIncId.includes(cleanMsgChan)) {
        return true;
      }
      // If the message sender is a unit assigned to this incident
      if (m.senderId) {
        const vObj = vehicles.find(v => v.id.toUpperCase() === m.senderId?.toUpperCase());
        if (vObj?.assignedIncidentId && vObj.assignedIncidentId.toLowerCase().replace('inc-', '') === activeIncId) {
          return true;
        }
      }
    }

    // 4. Agency Command Net match:
    // If dispatcher is listening to Fire net, show all Fire units' transmissions!
    if (activeChannelId === 'agency-fire') {
      const check = `${m.senderType || ''} ${m.sender || ''} ${m.senderId || ''}`.toUpperCase();
      if (check.includes('FIRE') || check.includes('FE-') || check.includes('RESCUE') || check.includes('RT-') || check.includes('HZ-')) {
        return true;
      }
    }
    // If dispatcher is listening to Police net, show all Police units' transmissions!
    if (activeChannelId === 'agency-police') {
      const check = `${m.senderType || ''} ${m.sender || ''} ${m.senderId || ''}`.toUpperCase();
      if (check.includes('POLICE') || check.includes('PV-') || check.includes('PATROL') || check.includes('SWAT') || check.includes('TP-')) {
        return true;
      }
    }
    // If dispatcher is listening to EMS net, show all Medical units' transmissions!
    if (activeChannelId === 'agency-hospitals') {
      const check = `${m.senderType || ''} ${m.sender || ''} ${m.senderId || ''}`.toUpperCase();
      if (check.includes('MED') || check.includes('AMB-') || check.includes('HOSPITAL') || check.includes('EMS') || check.includes('TRAUMA')) {
        return true;
      }
    }

    // 5. Direct unit list configured on channel
    if (activeChannel?.unitIds && activeChannel.unitIds.length > 0) {
      if (m.senderId && activeChannel.unitIds.some(u => u.toUpperCase() === m.senderId?.toUpperCase())) return true;
      if (m.sender && activeChannel.unitIds.some(u => m.sender.toUpperCase().includes(u.toUpperCase()))) return true;
    }

    // 6. Citywide / General broadcast match
    if ((m.channelId === 'general' || m.channelId === 'citywide') && (activeChannelId === 'general' || activeChannelId === 'citywide')) {
      return true;
    }

    return false;
  });

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [channelMessages.length, activeChannelId]);

  const resolveTargetUnitAndList = (channelId: string, channelObj?: ChatChannel) => {
    const directMatch = channelId.startsWith('direct-')
      ? channelId.replace('direct-', '').toUpperCase().trim()
      : undefined;

    let targetUnit = directMatch;
    if (!targetUnit && channelObj?.unitIds && channelObj.unitIds.length > 0) {
      targetUnit = channelObj.unitIds.find(u => 
        u !== 'HQ-Control' && 
        !u.toLowerCase().includes('control') && 
        !u.toLowerCase().includes('dispatch')
      ) || channelObj.unitIds[0];
    }

    const units = channelObj?.unitIds || (targetUnit ? [targetUnit] : undefined);
    return { targetUnit, units };
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    playRadioChirp('transmit');

    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const { targetUnit, units } = resolveTargetUnitAndList(activeChannelId, activeChannel);

    socket.emit('dispatcher:broadcast', {
      id: msgId,
      incidentId: activeChannelId,
      targetUnitId: targetUnit,
      unitIds: units,
      message: inputText.trim(),
      sender: 'EOC Dispatch Control',
      time: timeStr
    });

    const newMsg: ChatMessage = {
      id: msgId,
      channelId: activeChannelId,
      sender: 'Dispatcher (Control)',
      senderType: 'Dispatcher',
      time: timeStr,
      text: inputText.trim()
    };

    if (onSendMessage) {
      onSendMessage(newMsg);
    } else {
      updateMessages(prev => [...prev, newMsg]);
    }
    setInputText('');
  };

  const handleQuickStatus = (status: 'EN_ROUTE' | 'ON_SCENE' | 'BACKUP_REQUESTED' | 'PATIENT_LOADED' | 'CONTAINED', label: string) => {
    playRadioChirp(status === 'BACKUP_REQUESTED' ? 'alert' : 'transmit');
    
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const { targetUnit, units } = resolveTargetUnitAndList(activeChannelId, activeChannel);

    socket.emit('dispatcher:broadcast', {
      id: msgId,
      incidentId: activeChannelId,
      targetUnitId: targetUnit,
      unitIds: units,
      message: label,
      sender: 'EOC Dispatch Control',
      tacticalStatus: status,
      time: timeStr
    });

    const newMsg: ChatMessage = {
      id: msgId,
      channelId: activeChannelId,
      sender: 'Dispatcher Directive',
      senderType: 'Dispatcher',
      time: timeStr,
      text: `[TACTICAL UPDATE]: ${label}`,
      tacticalStatus: status
    };
    if (onSendMessage) {
      onSendMessage(newMsg);
    } else {
      updateMessages(prev => [...prev, newMsg]);
    }
  };

  const startPTTRecording = async () => {
    if (micState !== 'granted') {
      try {
        const ok = await requestMicrophonePermission();
        setMicState(ok ? 'granted' : 'denied');
      } catch (e) {
        // Handled
      }
    }
    setIsRecordingPTT(true);
    setRecordingSeconds(0);
    setLiveTranscript('');
    liveTranscriptRef.current = '';

    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(s => s + 1);
    }, 1000);

    try {
      const session = await startVoiceRecording((text) => {
        setLiveTranscript(text);
        liveTranscriptRef.current = text;
      });
      pttSessionRef.current = session;
    } catch (e) {
      // Handled
    }
  };

  const stopPTTRecording = async () => {
    if (!isRecordingPTT) return;
    clearInterval(recordingTimerRef.current);
    setIsRecordingPTT(false);

    let recordedData: { audioData?: string; durationSeconds: number; durationStr: string; transcript: string } = {
      durationSeconds: Math.max(1, recordingSeconds),
      durationStr: `0:0${Math.max(1, Math.min(recordingSeconds, 9))}`,
      transcript: liveTranscriptRef.current || liveTranscript || ''
    };

    if (pttSessionRef.current) {
      recordedData = await stopVoiceRecording(pttSessionRef.current, liveTranscriptRef.current || liveTranscript);
      pttSessionRef.current = null;
    }

    const spokenText = recordedData.transcript?.trim() || (recordingSeconds > 0 ? 'Voice transmission recorded' : 'Voice broadcast');
    const msgId = `voice-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const { targetUnit, units } = resolveTargetUnitAndList(activeChannelId, activeChannel);

    socket.emit('dispatcher:broadcast', {
      id: msgId,
      incidentId: activeChannelId,
      targetUnitId: targetUnit,
      unitIds: units,
      message: spokenText,
      sender: 'EOC Dispatch Control',
      isVoiceNote: true,
      voiceDuration: recordedData.durationStr,
      audioData: recordedData.audioData,
      time: timeStr
    });

    const newVoiceMsg: ChatMessage = {
      id: msgId,
      channelId: activeChannelId,
      sender: 'Dispatcher (Voice Radio)',
      senderType: 'Dispatcher',
      time: timeStr,
      text: spokenText,
      isVoiceNote: true,
      voiceDuration: recordedData.durationStr,
      audioData: recordedData.audioData
    };
    if (onSendMessage) {
      onSendMessage(newVoiceMsg);
    } else {
      updateMessages(prev => [...prev, newVoiceMsg]);
    }
    setLiveTranscript('');
    liveTranscriptRef.current = '';
  };

  const cancelPTTRecording = () => {
    if (!isRecordingPTT) return;
    clearInterval(recordingTimerRef.current);
    if (pttSessionRef.current) {
      if (pttSessionRef.current.recognition) {
        try { pttSessionRef.current.recognition.stop(); } catch { /* ignore */ }
      }
      pttSessionRef.current.stream?.getTracks().forEach(t => t.stop());
      pttSessionRef.current = null;
    }
    setIsRecordingPTT(false);
    setRecordingSeconds(0);
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    playRadioChirp('disconnect');
  };

  const togglePlayVoice = (id: string | number, audioData?: string, text?: string) => {
    if (playingVoiceId === id) {
      if (stopVoiceRef.current) {
        stopVoiceRef.current();
        stopVoiceRef.current = null;
      }
      setPlayingVoiceId(null);
    } else {
      if (stopVoiceRef.current) {
        stopVoiceRef.current();
      }
      setPlayingVoiceId(id);
      stopVoiceRef.current = playVoiceAudio(
        audioData,
        text || 'Dispatch Control tactical radio transmission.',
        () => setPlayingVoiceId(id),
        () => {
          setPlayingVoiceId(null);
          stopVoiceRef.current = null;
        }
      );
    }
  };

  const handleCreateInterUnitChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUnit1 === newUnit2) return;

    const isHQ = newUnit1 === 'HQ-Control' || newUnit2 === 'HQ-Control';
    const targetUnit = newUnit1 === 'HQ-Control' ? newUnit2 : newUnit1;
    const channelId = isHQ
      ? `direct-${targetUnit}`
      : `unit-${newUnit1.toLowerCase().replace('-', '')}-${newUnit2.toLowerCase().replace('-', '')}`;

    const vObj = vehicles?.find(v => v.id === targetUnit);
    const icon = vObj ? (vObj.type.includes('Fire') ? '🚒' : vObj.type.includes('Police') ? '🚔' : '🚑') : '📱';

    const newCh: ChatChannel = {
      id: channelId,
      name: isHQ ? `${icon} ${targetUnit} Direct Link` : `🔗 ${newUnit1} ⟷ ${newUnit2} Direct`,
      category: 'Inter-Unit',
      unitIds: isHQ ? [targetUnit, 'HQ-Control'] : [newUnit1, newUnit2],
      description: isHQ
        ? `Private tactical direct link with Unit ${targetUnit}`
        : `Private direct channel established between ${newUnit1} and ${newUnit2}`,
      lastMessage: 'Channel opened. Ready for tactical comms.',
      lastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unreadCount: 0
    };

    if (onCreateChannel) {
      onCreateChannel(newCh);
    }
    handleSelectChannel(channelId);

    // Add initial channel open message
    const sysMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      channelId: channelId,
      sender: 'Tactical Radio System',
      senderType: 'Dispatcher',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: isHQ
        ? `🔒 Secure Direct Link established with Unit ${targetUnit}. 256-bit AES P25 encrypted channel.`
        : `🔒 Secure Direct Link established between Unit ${newUnit1} and Unit ${newUnit2}. 256-bit AES P25 Net.`
    };

    if (onSendMessage) {
      onSendMessage(sysMsg);
    } else {
      updateMessages(prev => [...prev, sysMsg]);
    }

    setShowCreateModal(false);
    playRadioChirp('roger');
  };

  const getSenderBadge = (type: string, senderName?: string) => {
    const check = `${type || ''} ${senderName || ''}`.toUpperCase();
    if (check.includes('FIRE') || check.includes('FE-') || check.includes('FLAME')) {
      return isDark
        ? 'bg-red-950/70 text-red-300 border-red-500/50 font-bold'
        : 'bg-red-100 text-red-900 border-red-300 font-bold';
    }
    if (check.includes('MED') || check.includes('AMB-') || check.includes('HOSPITAL') || check.includes('EMS') || check.includes('TRAUMA')) {
      return isDark
        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50 font-bold'
        : 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
    }
    if (check.includes('POLICE') || check.includes('PV-') || check.includes('PATROL') || check.includes('COP')) {
      return isDark
        ? 'bg-sky-950/70 text-sky-300 border-sky-500/50 font-bold'
        : 'bg-sky-100 text-sky-900 border-sky-300 font-bold';
    }
    if (check.includes('DISPATCH') || check.includes('CONTROL') || check.includes('EOC')) {
      return isDark
        ? 'bg-indigo-950/70 text-indigo-300 border-indigo-500/50 font-bold'
        : 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold';
    }
    return isDark
      ? 'bg-purple-950/70 text-purple-300 border-purple-500/50 font-bold'
      : 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
  };

  return (
    <div className={`rounded-2xl overflow-hidden flex flex-col transition-colors ${
      isDark 
        ? 'bg-[#0b101d] border border-[#172338] shadow-[0_4px_25px_rgba(0,0,0,0.3)]' 
        : 'bg-white border border-slate-200 shadow-sm'
    }`}>
      {/* Top Header */}
      <div className={`p-3.5 border-b flex justify-between items-center transition-colors ${
        isDark ? 'border-[#172338] bg-[#0d1322]/80' : 'border-slate-200 bg-slate-50'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${
            isDark ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-300'
          }`}>
            <Radio size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Tactical Comms Center</h2>
              <span className={`flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                isDark ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' : 'text-sky-700 bg-sky-50 border-sky-300'
              }`}>
                <Lock size={9} /> AES-256
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {micState !== 'granted' && (
            <button
              onClick={handleRequestMic}
              className={`p-1.5 rounded-lg border text-xs transition-all flex items-center gap-1 animate-pulse cursor-pointer ${
                isDark ? 'bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border-sky-500/40' : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-300'
              }`}
              title="Allow Microphone Access for Tactical Radio"
            >
              <Mic size={13} className={isDark ? "text-sky-400" : "text-sky-600"} />
              <span className="text-[11px] font-bold">Allow Mic</span>
            </button>
          )}

          <button
            onClick={handleCallCurrentChannel}
            className="p-1.5 px-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Start 2-Way Tactical Radio Voice Call"
          >
            <PhoneCall size={13} />
            <span className="text-[11px] font-bold">Radio Call</span>
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Category Filter Chips */}
          <div className={`px-3 pt-2.5 pb-1 border-b flex items-center justify-between gap-1 overflow-x-auto ${
            isDark ? 'border-[#172338] bg-[#080d18]' : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="flex gap-1">
              {(['All', 'Incident', 'Inter-Unit', 'Agency'] as const).map((cat) => {
                const unread = cat === 'Inter-Unit' ? interUnitUnreads : cat === 'Incident' ? incidentUnreads : cat === 'Agency' ? agencyUnreads : 0;
                return (
                  <button
                    key={cat}
                    onClick={() => setChannelCategory(cat)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      channelCategory === cat
                        ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sm font-bold'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    <span>{cat === 'All' ? 'All Comms' : cat}</span>
                    {unread > 0 && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-red-500 text-white animate-pulse">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Channel Selector Dropdown / Pills */}
          <div className={`px-3 py-2 border-b flex items-center gap-2 overflow-x-auto scrollbar-none ${
            isDark ? 'border-[#172338] bg-[#090f1e]/90' : 'border-slate-200 bg-slate-100'
          }`}>
            {filteredChannels.map((c) => {
              const isSelected = c.id === activeChannelId;
              const canRemove = isRemovableChannel(c);
              return (
                <div
                  key={c.id}
                  className={`group/tab inline-flex items-center rounded-xl transition-all border shrink-0 ${
                    isSelected
                      ? isDark
                        ? 'bg-[#10223c] text-sky-300 border-sky-400/50 shadow-sm font-bold'
                        : 'bg-sky-500 hover:bg-sky-400 text-white border-sky-500 shadow-sm font-bold'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200 bg-[#0c1220] border-[#18253b] hover:border-slate-700'
                      : 'text-slate-700 hover:text-slate-900 bg-white border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectChannel(c.id)}
                    className={`py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      canRemove ? 'pl-2.5 pr-1' : 'px-2.5'
                    }`}
                  >
                    <span className="truncate max-w-[170px]">{c.name}</span>
                    {c.unreadCount ? (
                      <span className="w-4 h-4 rounded-full bg-sky-400 text-white text-[9px] flex items-center justify-center font-bold">
                        {c.unreadCount}
                      </span>
                    ) : null}
                  </button>

                  {canRemove && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveChannelClick(e, c.id)}
                      className={`mr-1.5 p-1 rounded-md transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? isDark
                            ? 'hover:bg-sky-400/20 text-sky-300/80 hover:text-white'
                            : 'hover:bg-white/20 text-white/80 hover:text-white'
                          : isDark
                          ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/20'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-100'
                      }`}
                      title={`Remove direct link (${c.name})`}
                      aria-label={`Remove direct link ${c.name}`}
                    >
                      <X size={12} className="stroke-[2.5]" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Channel Info Bar */}
          {activeChannel && (
            <div className={`px-3 py-1.5 border-b flex items-center justify-between text-[11px] ${
              isDark ? 'bg-[#0a1122] border-[#142036] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <span className="truncate max-w-[240px] sm:max-w-md">{activeChannel.description}</span>
              <div className="flex items-center gap-2 shrink-0">
                {isRemovableChannel(activeChannel) && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveChannelClick(e, activeChannel.id)}
                    className="px-2 py-0.5 rounded bg-rose-400/20 hover:bg-rose-400 hover:text-rose-950 text-rose-400 text-[10px] font-bold flex items-center gap-1 border border-rose-400/30 transition-all cursor-pointer"
                    title="Remove Direct Link / Close Net"
                  >
                    <X size={10} /> Close Link
                  </button>
                )}
                <button
                  onClick={handleCallCurrentChannel}
                  className="px-2 py-0.5 rounded bg-sky-500 hover:bg-sky-400 text-white text-[10px] font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                  title="Radio Call this Net"
                >
                  <Radio size={10} /> Call Net (TAC-852)
                </button>
                <span className={`font-mono text-[10px] font-bold ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>CH-NET OPEN</span>
              </div>
            </div>
          )}

          {/* Incoming Tactical Radio Alert Banner */}
          {incomingAlert && (
            <div className={`mx-3 my-2 p-2.5 rounded-xl border flex items-center justify-between gap-3 shadow-md animate-pulse ${
              isDark ? 'bg-sky-950/90 border-sky-400 text-sky-200' : 'bg-sky-50 border-sky-400 text-sky-900'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-sky-500 text-white shrink-0">
                  {incomingAlert.isVoiceNote ? <Mic size={16} className="animate-bounce" /> : <Radio size={16} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded border border-sky-400/30">
                      Incoming: {incomingAlert.unitId}
                    </span>
                    <span className="text-[10px] opacity-75">{incomingAlert.time}</span>
                  </div>
                  <p className="text-xs truncate font-medium mt-0.5">
                    {incomingAlert.isVoiceNote ? `🎙 Voice Transmission (${incomingAlert.voiceDuration || '0:04'}) - "${incomingAlert.text}"` : incomingAlert.text}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {incomingAlert.isVoiceNote && (
                  <button
                    type="button"
                    onClick={() => togglePlayVoice(incomingAlert.id, incomingAlert.audioData, incomingAlert.text)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-500 hover:bg-sky-400 text-white flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    {playingVoiceId === incomingAlert.id ? <Pause size={12} /> : <Play size={12} />}
                    <span>{playingVoiceId === incomingAlert.id ? 'Pause' : 'Play'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleSelectChannel(incomingAlert.channelId);
                    setIncomingAlert(null);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <span>Open Net</span>
                  <ExternalLink size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setIncomingAlert(null)}
                  className="p-1 rounded-lg hover:bg-sky-500/20 opacity-70 hover:opacity-100 cursor-pointer"
                  title="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Messages Stream */}
          <div ref={chatScrollRef} className={`p-3 space-y-2.5 min-h-[180px] max-h-72 overflow-y-auto scrollbar-thin scroll-smooth ${
            isDark ? 'scrollbar-thumb-slate-800 bg-[#070b14]/50' : 'scrollbar-thumb-slate-300 bg-white'
          }`}>
            {channelMessages.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No radio transmissions yet on this channel. Transmit above or dispatch units.
              </div>
            ) : (
              channelMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-xl text-xs space-y-1.5 border transition-all ${
                    msg.tacticalStatus === 'BACKUP_REQUESTED'
                      ? isDark ? 'bg-red-950/40 border-red-500/40' : 'bg-red-50 border-red-300 text-slate-900'
                      : msg.senderType === 'Dispatcher'
                      ? isDark ? 'bg-[#0f1d33]/60 border-sky-500/30' : 'bg-sky-50/60 border-sky-200 text-slate-900'
                      : isDark ? 'bg-[#0e1626]/80 border-[#18253d]' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-1.5 py-0.2 rounded border ${getSenderBadge(msg.senderType, msg.sender)}`}>
                        {msg.sender}
                      </span>
                      {msg.tacticalStatus && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          msg.tacticalStatus === 'BACKUP_REQUESTED'
                            ? isDark ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : 'bg-red-100 text-red-900 border-red-300 font-bold'
                            : isDark ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : 'bg-sky-100 text-sky-900 border-sky-300 font-bold'
                        }`}>
                          {msg.tacticalStatus}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{msg.time}</span>
                  </div>

                  {/* Voice Note or Text Message */}
                  {msg.isVoiceNote ? (
                    <div className="space-y-1.5 mt-1">
                      <div className={`flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md w-fit border ${
                        isDark ? 'text-sky-400 bg-sky-950/40 border-sky-500/30' : 'text-sky-800 bg-sky-50 border-sky-300'
                      }`}>
                        <Mic size={10} className={isDark ? "text-sky-400 animate-pulse" : "text-sky-600 animate-pulse"} />
                        <span>TACTICAL VOICE RECORDING</span>
                      </div>

                      <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border shadow-inner ${
                        isDark ? 'bg-[#090f1d] border-[#1b2a42]' : 'bg-white border-slate-200'
                      }`}>
                        <button
                          type="button"
                          onClick={() => togglePlayVoice(msg.id, msg.audioData, msg.text)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                            playingVoiceId === msg.id
                              ? 'bg-sky-400 text-white animate-pulse shadow-[0_0_12px_#38bdf8]'
                              : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sm'
                          }`}
                          title={playingVoiceId === msg.id ? "Pause Voice Recording" : "Play Voice Recording"}
                        >
                          {playingVoiceId === msg.id ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                        </button>

                        <div className="flex-1 flex items-center gap-1">
                          {[35, 75, 95, 55, 85, 40, 100, 70, 30, 80, 90, 45, 65, 85, 50, 70].map((h, i) => (
                            <span
                              key={i}
                              className={`w-1 rounded-full transition-all duration-150 ${
                                playingVoiceId === msg.id
                                  ? 'bg-sky-400 animate-bounce'
                                  : isDark ? 'bg-slate-600' : 'bg-slate-300'
                              }`}
                              style={{ 
                                height: playingVoiceId === msg.id ? `${Math.max(6, (h / 100) * 18)}px` : '8px',
                                animationDelay: `${i * 40}ms`
                              }}
                            ></span>
                          ))}
                        </div>

                        <div className="flex flex-col items-end shrink-0 text-[10px] font-mono">
                          <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{msg.voiceDuration || '0:05'}</span>
                          <span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{playingVoiceId === msg.id ? 'Playing' : 'Audio Note'}</span>
                        </div>
                      </div>

                      {msg.text && (
                        <div className={`rounded-lg px-2.5 py-1.5 border text-xs ${
                          isDark ? 'bg-[#0b1322]/80 border-[#1c2e4a] text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                        }`}>
                          <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider block mb-0.5 ${
                            isDark ? 'text-sky-400' : 'text-sky-800'
                          }`}>Spoken Message:</span>
                          <p className={`italic text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>"{msg.text}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className={`text-xs leading-relaxed pl-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{msg.text}</p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick Tactical Responders Directives */}
          <div className={`p-2 border-t flex items-center gap-1.5 overflow-x-auto scrollbar-none ${
            isDark ? 'border-[#172338] bg-[#080d18]' : 'border-slate-200 bg-slate-50'
          }`}>
            <span className={`text-[10px] font-bold uppercase shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Quick Directives:</span>
            <button
              onClick={() => handleQuickStatus('EN_ROUTE', 'DIRECTIVE: Expedite en route with siren priority.')}
              className={`px-2 py-0.5 text-[10px] font-semibold border rounded-md shrink-0 transition-colors cursor-pointer ${
                isDark ? 'text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border-sky-400/30' : 'text-sky-800 bg-sky-100 hover:bg-sky-200 border-sky-300'
              }`}
            >
              🔵 Expedite Route
            </button>
            <button
              onClick={() => handleQuickStatus('ON_SCENE', 'DIRECTIVE: Confirm scene arrival and assess structural integrity & casualties.')}
              className={`px-2 py-0.5 text-[10px] font-semibold border rounded-md shrink-0 transition-colors cursor-pointer ${
                isDark ? 'text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border-sky-400/30' : 'text-sky-800 bg-sky-100 hover:bg-sky-200 border-sky-300'
              }`}
            >
              📍 Confirm Scene
            </button>
            <button
              onClick={() => handleQuickStatus('BACKUP_REQUESTED', 'DIRECTIVE: Immediate secondary backup & perimeter control required.')}
              className={`px-2 py-0.5 text-[10px] font-semibold border rounded-md shrink-0 transition-colors cursor-pointer ${
                isDark ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border-red-500/20' : 'text-red-900 bg-red-100 hover:bg-red-200 border-red-300 font-bold'
              }`}
            >
              ⚠️ Request Backup
            </button>
            <button
              onClick={() => handleQuickStatus('PATIENT_LOADED', 'DIRECTIVE: Patient stabilized and loaded. Initiate transit to nearest Level 1 Trauma ER.')}
              className={`px-2 py-0.5 text-[10px] font-semibold border rounded-md shrink-0 transition-colors cursor-pointer ${
                isDark ? 'text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-400/30' : 'text-sky-800 bg-sky-100 hover:bg-sky-200 border-sky-300'
              }`}
            >
              🩺 Patient Transit
            </button>
          </div>

          {/* Input Box & Push-To-Talk Radio */}
          <div className={`p-2.5 border-t ${isDark ? 'border-[#172338] bg-[#0a0f1d]' : 'border-slate-200 bg-slate-50'}`}>
            {isRecordingPTT ? (
              <div className="bg-red-950/90 border border-red-500/60 rounded-xl p-2.5 space-y-2 text-xs text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span className="font-bold font-mono text-white text-[11px] flex items-center gap-1">
                      <Mic size={13} className="text-red-400 animate-pulse" />
                      LISTENING & RECORDING LIVE VOICE...
                    </span>
                  </div>
                  <span className="font-mono font-black text-red-200 bg-red-900/50 px-2 py-0.5 rounded border border-red-500/40 text-xs">
                    0:0{recordingSeconds}
                  </span>
                </div>

                {/* Live Speech-to-Text Transcription Box */}
                {liveTranscript ? (
                  <div className="bg-[#080d18] border border-red-500/40 rounded-lg p-2 text-xs text-slate-100 font-mono">
                    <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block mb-0.5">Live Voice Transcribed:</span>
                    <p className="italic text-slate-100 font-medium leading-tight">"{liveTranscript}"</p>
                  </div>
                ) : (
                  <div className="bg-[#080d18]/60 border border-red-500/20 rounded-lg p-2 text-center text-[11px] text-red-300/80 font-mono italic">
                    Speak into your microphone — your voice is being recorded and speech transcribed live...
                  </div>
                )}

                {/* Live Animated Audio Wave Meter during Mic Recording */}
                <div className="flex items-center justify-center gap-1.5 py-1 bg-[#090e18] rounded-lg border border-red-500/20 px-2">
                  {[40, 65, 90, 100, 75, 45, 85, 95, 60, 80, 100, 50, 70, 90, 60, 40].map((h, idx) => (
                    <span
                      key={idx}
                      className="w-1 bg-red-500 rounded-full animate-bounce"
                      style={{ 
                        height: `${Math.max(6, (h / 100) * 16)}px`,
                        animationDuration: `${0.3 + (idx % 4) * 0.15}s`
                      }}
                    />
                  ))}
                  <span className="text-[10px] text-red-300 font-mono font-semibold ml-2">Hardware Mic Active</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={cancelPTTRecording}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={stopPTTRecording}
                    className="px-4 py-1.5 rounded-lg bg-rose-400 hover:bg-rose-300 text-rose-950 text-[11px] font-bold border border-rose-300 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send size={12} />
                    <span>Send Voice Message</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendText} className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Broadcast to ${activeChannel?.name || 'tactical net'}...`}
                  className={`flex-1 text-xs rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-sky-400 ${
                    isDark 
                      ? 'bg-[#111927] text-slate-200 placeholder-slate-500 border-[#1d2a42]' 
                      : 'bg-white text-slate-800 placeholder-slate-400 border-slate-300 shadow-inner'
                  }`}
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold border border-sky-300 shadow-sm transition-all shrink-0 cursor-pointer"
                  title="Send Message"
                >
                  <Send size={13} />
                </button>
              </form>
            )}

            {/* Push To Talk / Voice Note Button */}
            <button
              type="button"
              onClick={isRecordingPTT ? stopPTTRecording : startPTTRecording}
              className={`p-2 rounded-xl border transition-all shrink-0 cursor-pointer ${
                isRecordingPTT
                  ? 'bg-rose-400 text-rose-950 font-bold border-rose-300 shadow-xs'
                  : isDark
                  ? 'bg-[#101e35] hover:bg-[#182c4e] text-sky-300 border-sky-500/30'
                  : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-300'
              }`}
              title={isRecordingPTT ? 'Release to Send Voice' : 'Push to Talk (PTT)'}
            >
              <Mic size={13} className={isRecordingPTT ? 'animate-bounce' : ''} />
            </button>
          </div>
        </>
      )}

      {/* Modal: Create Inter-Unit Private Direct Link */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/70">
          <div className={`border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 ${
            isDark ? 'bg-[#0e1626] border-[#243450]' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-4 border-b flex justify-between items-center ${
              isDark ? 'border-[#1b2a45] bg-[#090e1a]' : 'border-slate-200 bg-slate-50'
            }`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                <ArrowRightLeft size={16} className={isDark ? "text-sky-400" : "text-sky-600"} />
                Establish Inter-Unit Direct Comms
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`p-1 rounded-lg cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInterUnitChannel} className="p-4 space-y-4 text-xs">
              <p className={isDark ? "text-slate-300" : "text-slate-600"}>
                Create a distinct, private peer-to-peer radio frequency link between two specific emergency response vehicles (e.g. Ambulance & Police escort).
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Select Endpoint 1</label>
                  <select
                    value={newUnit1}
                    onChange={(e) => setNewUnit1(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold focus:ring-1 focus:ring-sky-400 border ${
                      isDark ? 'bg-[#111927] border-[#1d2a42] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="HQ-Control">🏛 Dispatch Control (HQ)</option>
                    {vehicles?.map(v => (
                      <option key={v.id} value={v.id}>{v.id} - {v.name} ({v.type})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Select Endpoint 2</label>
                  <select
                    value={newUnit2}
                    onChange={(e) => setNewUnit2(e.target.value)}
                    className={`w-full rounded-xl p-2 font-bold focus:ring-1 focus:ring-sky-400 border ${
                      isDark ? 'bg-[#111927] border-[#1d2a42] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {vehicles?.map(v => (
                      <option key={v.id} value={v.id}>{v.id} - {v.name} ({v.type})</option>
                    ))}
                    <option value="GH-Trauma">🏥 GH Trauma ER Liaison</option>
                  </select>
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
                isDark ? 'bg-[#080d18] border-[#172338] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div className="flex justify-between font-mono">
                  <span className={isDark ? "text-slate-200" : "text-slate-700"}>Encryption:</span>
                  <span className="text-sky-500 font-bold">256-bit AES P25</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className={isDark ? "text-slate-200" : "text-slate-700"}>Tactical Channel:</span>
                  <span className={`font-bold ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>TAC-{newUnit1}-{newUnit2}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`flex-1 py-2 font-bold rounded-xl border cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold border border-sky-300 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Open Tactical Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
