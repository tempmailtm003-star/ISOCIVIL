import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini SDK with User-Agent header for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Structured JSON Schema for Autonomous Agentic Dispatch
export const AGENTIC_DISPATCH_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    incidentId: {
      type: Type.STRING,
      description: 'The unique identifier of the incident being dispatched.'
    },
    priorityTier: {
      type: Type.STRING,
      description: 'Tactical triage priority tier: P1-CRITICAL, P2-URGENT, or P3-ROUTINE.'
    },
    vulnerabilityScore: {
      type: Type.NUMBER,
      description: 'Calculated municipal risk and vulnerability score between 0 and 100.'
    },
    situationalAnalysis: {
      type: Type.STRING,
      description: 'Concise tactical appraisal of incident dynamics, hazards, and rationale for resource allocation.'
    },
    recommendedUnits: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          unitId: {
            type: Type.STRING,
            description: 'Callsign of recommended field vehicle (e.g. ALS-101, ENG-202, PAT-404).'
          },
          assignedRole: {
            type: Type.STRING,
            description: 'Designated role such as Primary ALS, Fire Suppression, Perimeter Lockdown, or Search & Rescue.'
          },
          reason: {
            type: Type.STRING,
            description: 'Operational justification based on vehicle proximity, equipment, and scene hazards.'
          }
        },
        required: ['unitId', 'assignedRole', 'reason']
      },
      description: 'Ranked list of recommended emergency response units.'
    },
    receivingFacility: {
      type: Type.OBJECT,
      properties: {
        facilityName: {
          type: Type.STRING,
          description: 'Name of the designated receiving trauma center, hospital, or safety haven.'
        },
        facilityType: {
          type: Type.STRING,
          description: 'Type of facility (e.g. Level 1 Trauma Center, Burn Speciality Unit, District General Hospital).'
        },
        specialtyNote: {
          type: Type.STRING,
          description: 'Clinical readiness status, capacity, or specialized emergency care note.'
        }
      },
      required: ['facilityName', 'facilityType', 'specialtyNote']
    },
    tacticalDirectives: {
      type: Type.OBJECT,
      properties: {
        radioNet: {
          type: Type.STRING,
          description: 'Designated tactical radio channel/talkgroup for the incident (e.g. TAC-1 OMNI, FIRE-OPS 2).'
        },
        greenCorridor: {
          type: Type.STRING,
          description: 'Optimal route corridor and arterial streets prioritizing expedited emergency vehicle transit.'
        },
        safetyPrecautions: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          },
          description: 'Mandatory scene safety measures, PPE levels, and hazard zone protocols.'
        }
      },
      required: ['radioNet', 'greenCorridor', 'safetyPrecautions']
    }
  },
  required: [
    'incidentId',
    'priorityTier',
    'vulnerabilityScore',
    'situationalAnalysis',
    'recommendedUnits',
    'receivingFacility',
    'tacticalDirectives'
  ]
};

// Fallback generator for resilient mock response when API is unavailable or rate limited
function generateMockDispatchPlan(incident: any, availableVehicles: any[] = [], availableHospitals: any[] = []) {
  const incidentId = incident?.id || `INC-${Date.now()}`;
  const incType = incident?.type || 'Medical';
  const incLoc = incident?.location || 'Sector Staging Hub';
  const severity = incident?.severity || 'High';

  let priorityTier = 'P2-URGENT';
  let vulnerabilityScore = 74;
  if (severity === 'Critical' || incType === 'Fire' || incType === 'Hazmat' || incType === 'Radiation') {
    priorityTier = 'P1-CRITICAL';
    vulnerabilityScore = 89;
  } else if (severity === 'Low') {
    priorityTier = 'P3-ROUTINE';
    vulnerabilityScore = 42;
  }

  // Filter or select top 1-3 appropriate units
  const unitsToSelect = (availableVehicles && availableVehicles.length > 0)
    ? availableVehicles.slice(0, 3)
    : [
        { id: 'ALS-101', type: 'Ambulance', name: 'Metro ALS Medic 1' },
        { id: 'ENG-202', type: 'Fire', name: 'Engine Company 2' }
      ];

  const recommendedUnits = unitsToSelect.map((v, idx) => ({
    unitId: v.id || `UNIT-${idx + 1}`,
    assignedRole: idx === 0 ? 'Primary Response Lead' : (v.type === 'Fire' ? 'Scene Containment & Safety' : 'Secondary Triage / Support'),
    reason: `Optimal proximity to ${incLoc} with verified operational readiness for ${incType} emergencies.`
  }));

  const hospital = (availableHospitals && availableHospitals.length > 0)
    ? availableHospitals[0]
    : { name: 'Apollo Main Hospital - Greams Road', type: 'Level 1 Trauma & Cardiac Center', beds: 42 };

  return {
    incidentId,
    priorityTier,
    vulnerabilityScore,
    situationalAnalysis: `Autonomous triage analysis for ${incType} incident at ${incLoc}. Severity assessed as ${severity}. Dispatched closest verified responders with priority emergency routing and automated corridor preemption.`,
    recommendedUnits,
    receivingFacility: {
      facilityName: hospital.name || 'Apollo Main Hospital',
      facilityType: hospital.type || 'Level 1 Trauma Center',
      specialtyNote: 'Trauma ICU and Acute Care teams alerted. Corridor clearance broadcasted.'
    },
    tacticalDirectives: {
      radioNet: `TAC-${incType === 'Fire' ? '3 FIRE' : '1 MED'} DISPATCH`,
      greenCorridor: `Primary Arterial Corridor via Mount Road / EVR Periyar Salai to ${incLoc}`,
      safetyPrecautions: [
        'Maintain 360-degree scene situational perimeter.',
        'Wear standard Level-B PPE / Biohazard precautions.',
        'Establish direct command link on designated tactical radio net.'
      ]
    },
    isMockFallback: true
  };
}

// Live agentic dispatch execution using @google/genai with structured schema and fallback
export async function generateAgenticDispatch(incident: any, availableVehicles: any[] = [], availableHospitals: any[] = []) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[AgenticDispatch] GEMINI_API_KEY is not set. Executing high-fidelity mock fallback.');
    return generateMockDispatchPlan(incident, availableVehicles, availableHospitals);
  }

  try {
    const prompt = `You are the IsoCivil Autonomous Emergency Command Agent.
Analyze the following incident and available resources to generate an authoritative, tactical dispatch plan.

INCIDENT DETAILS:
- ID: ${incident?.id || 'Unknown'}
- Type: ${incident?.type || 'General Emergency'}
- Location: ${incident?.location || 'Unknown Location'}
- Severity: ${incident?.severity || 'Medium'}
- Description: ${incident?.description || 'N/A'}
- Reported At: ${incident?.reportedTime || 'Immediate'}
- Hazard Details: ${incident?.hazardZone ? JSON.stringify(incident.hazardZone) : 'None reported'}

AVAILABLE UNITS (Total: ${availableVehicles?.length || 0}):
${(availableVehicles || []).slice(0, 10).map(v => `- ID: ${v.id}, Type: ${v.type}, CallSign: ${v.name || v.id}, Status: ${v.status}, Lat: ${v.lat}, Lng: ${v.lng}`).join('\n')}

AVAILABLE RECEIVING HOSPITALS:
${(availableHospitals || []).slice(0, 6).map(h => `- Name: ${h.name}, Type: ${h.type || 'Hospital'}, TraumaBeds: ${h.traumaBeds ?? h.beds ?? 'Available'}`).join('\n')}

INSTRUCTIONS:
1. Select the most critical 1-3 vehicles according to proximity, unit type match, and incident hazard profile.
2. Select the optimal receiving hospital facility with appropriate clinical capabilities.
3. Formulate clear tactical directives including designated radio net, green corridor street path, and mandatory scene safety precautions.
4. Return strictly structured JSON matching the provided schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: AGENTIC_DISPATCH_SCHEMA,
        systemInstruction: 'You are an autonomous tactical emergency dispatch AI engine. You make rapid, precise, life-saving resource allocation decisions in accordance with emergency management protocols.'
      }
    });

    const parsedPlan = JSON.parse(response.text || '{}');
    return {
      ...parsedPlan,
      isMockFallback: false
    };
  } catch (error) {
    console.error('[AgenticDispatch] Error calling Gemini API, triggering mock fallback block:', error);
    return generateMockDispatchPlan(incident, availableVehicles, availableHospitals);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // In-memory state for prototype
  const responders = new Map();
  const activeDirectives = new Map();

  // Agentic Dispatch API Route
  app.post('/api/agentic-dispatch', async (req, res) => {
    try {
      const { incident, availableVehicles, availableHospitals } = req.body || {};
      if (!incident) {
        return res.status(400).json({ error: 'Incident payload is required' });
      }
      const dispatchPlan = await generateAgenticDispatch(incident, availableVehicles, availableHospitals);
      res.json(dispatchPlan);
    } catch (err: any) {
      console.error('[API /api/agentic-dispatch] Unhandled error:', err);
      res.status(500).json({ error: 'Failed to generate agentic dispatch plan' });
    }
  });

  // REST API route to query unit dispatch status
  app.get('/api/unit-status/:unitId', (req, res) => {
    const unitId = req.params.unitId.toUpperCase().trim();
    const directive = activeDirectives.get(unitId);
    if (directive && directive.incident) {
      res.json({
        unitId,
        dispatched: true,
        status: 'En Route',
        incident: directive.incident,
        directive: directive.directive
      });
    } else {
      res.json({
        unitId,
        dispatched: false,
        status: 'Available',
        incident: null,
        directive: null
      });
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('responder:login', (data) => {
      const cleanUnitId = (data.unitId || '').toUpperCase().trim();
      console.log('Responder logged in:', cleanUnitId);
      
      const activeDirective = activeDirectives.get(cleanUnitId) || activeDirectives.get(data.unitId);
      const initialStatus = activeDirective ? 'En Route' : 'Available';

      responders.set(cleanUnitId, { socketId: socket.id, status: initialStatus, telemetry: null });
      socket.join(cleanUnitId);
      socket.join(data.unitId);
      socket.join('responders');
      
      // Send active directive if any, otherwise emit sync status as Available
      if (activeDirective) {
         socket.emit('responder:receive_directive', activeDirective);
      } else {
         socket.emit('responder:sync_status', { unitId: cleanUnitId, status: 'Available', incident: null });
      }
      
      // Notify dispatchers
      io.to('dispatchers').emit('responder:status_changed', { unitId: cleanUnitId, status: initialStatus });
    });

    socket.on('dispatcher:login', () => {
      socket.join('dispatchers');
      console.log('Dispatcher connected:', socket.id);
    });

    // Responder sends message or voice note
    socket.on('responder:send_message', (data) => {
       console.log('Responder message received from:', data.sender, 'for incident:', data.incidentId);
       // Send to dispatchers cleanly once (io.emit ensures all open dispatcher views receive it)
       io.emit('dispatcher:receive_message', data);
       
       // Broadcast to all other responders (socket.broadcast avoids echoing back to sender)
       socket.broadcast.emit('responder:receive_message', data);
    });

    // Dispatcher syncs whole fleet state from ERC terminal
    socket.on('dispatcher:sync_fleet_state', (data: { dispatchedUnits: { unitId: string; incident: any; directive?: string }[] }) => {
      activeDirectives.clear();
      if (Array.isArray(data?.dispatchedUnits)) {
        data.dispatchedUnits.forEach(item => {
          if (item?.unitId && item?.incident) {
            const cleanUnitId = item.unitId.toUpperCase().trim();
            activeDirectives.set(cleanUnitId, {
              directive: item.directive || `EMERGENCY DISPATCH: Unit ${cleanUnitId} assigned to ${item.incident.type} at ${item.incident.location}`,
              incident: item.incident,
              delivered: false
            });
            io.to(cleanUnitId).emit('responder:receive_directive', {
              directive: item.directive || `EMERGENCY DISPATCH: Unit ${cleanUnitId} assigned to ${item.incident.type} at ${item.incident.location}`,
              incident: item.incident
            });
          }
        });
      }
    });

    // Dispatcher explicitly clears a unit directive
    socket.on('dispatcher:clear_directive', (data: { unitId: string }) => {
      const cleanUnitId = (data?.unitId || '').toUpperCase().trim();
      activeDirectives.delete(cleanUnitId);
      if (data?.unitId) activeDirectives.delete(data.unitId);
      const res = responders.get(cleanUnitId);
      if (res) {
        res.status = 'Available';
        responders.set(cleanUnitId, res);
      }
      io.to(cleanUnitId).emit('responder:sync_status', { unitId: cleanUnitId, status: 'Available', incident: null });
      if (data?.unitId !== cleanUnitId) {
        io.to(data.unitId).emit('responder:sync_status', { unitId: cleanUnitId, status: 'Available', incident: null });
      }
      io.to('dispatchers').emit('responder:status_changed', { unitId: cleanUnitId, status: 'Available' });
    });

    // Dispatcher sends directive
    socket.on('dispatcher:send_directive', (data) => {
      const { unitId, directive, incident } = data;
      const cleanUnitId = (unitId || '').toUpperCase().trim();
      activeDirectives.set(cleanUnitId, { directive, incident, delivered: false });
      io.to(cleanUnitId).emit('responder:receive_directive', { directive, incident });
      if (unitId !== cleanUnitId) {
        io.to(unitId).emit('responder:receive_directive', { directive, incident });
      }
    });
    
    // Clear directive if status is completed or available
    socket.on('responder:update_status', (data) => {
      const { unitId, status } = data;
      const cleanUnitId = (unitId || '').toUpperCase().trim();
      const res = responders.get(cleanUnitId) || { socketId: socket.id, telemetry: null };
      res.status = status;
      responders.set(cleanUnitId, res);
      if (status === 'Completed' || status === 'Available' || status === 'Maintenance') {
        activeDirectives.delete(cleanUnitId);
        if (unitId) activeDirectives.delete(unitId);
      } else {
        const d = activeDirectives.get(cleanUnitId);
        if (d) d.delivered = true;
      }
      io.to('dispatchers').emit('responder:status_changed', { unitId: cleanUnitId, status });
    });

    socket.on('responder:inspection_completed', (data) => {
      console.log('Inspection completed for unit:', data?.unitId);
      io.to('dispatchers').emit('responder:inspection_updated', data);
    });

    // Dispatcher broadcasts text or voice message to channels/responders
    socket.on('dispatcher:broadcast', (data) => {
       const { incidentId, targetUnitId, unitIds, message, isVoiceNote, voiceDuration, audioData, tacticalStatus, sender } = data;
       const cleanTargetUnit = targetUnitId || (incidentId?.startsWith('direct-') ? incidentId.replace('direct-', '').toUpperCase().trim() : undefined);
       const payload = {
         id: data.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
         incidentId: incidentId || 'general',
         targetUnitId: cleanTargetUnit,
         unitIds: unitIds || (cleanTargetUnit ? [cleanTargetUnit] : undefined),
         message: message || '',
         sender: sender || 'EOC Dispatch Control',
         time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
         isVoiceNote: !!isVoiceNote,
         voiceDuration: voiceDuration || '0:04',
         audioData,
         tacticalStatus
       };
           
       // Always broadcast dispatcher message with routing metadata
       io.emit('responder:receive_message', payload);
       // Also sync to other dispatchers
       socket.broadcast.to('dispatchers').emit('dispatcher:receive_message', payload);
    });

    // WebRTC / VoIP Simulation Signalling
    socket.on('dispatcher:call_unit', (data) => {
      const { unitId, callerName } = data;
      io.to(unitId).emit('responder:incoming_call', { callerId: socket.id, callerName });
    });

    socket.on('responder:answer_call', (data) => {
      io.to(data.callerId).emit('dispatcher:call_answered', { unitId: data.unitId });
    });

    socket.on('responder:decline_call', (data) => {
      io.to(data.callerId).emit('dispatcher:call_declined', { unitId: data.unitId });
    });
    
    socket.on('call:end', (data) => {
      if (data.targetSocketId) {
        io.to(data.targetSocketId).emit('call:ended', { from: socket.id });
      }
    });

    // Telemetry & GPS updates
    socket.on('responder:telemetry', (data) => {
      const { unitId, telemetry, coords } = data;
      const cleanUnitId = (unitId || '').toUpperCase().trim();
      const res = responders.get(cleanUnitId);
      if (res) {
        if (telemetry) res.telemetry = telemetry;
        if (coords) res.coords = coords;
      }
      // Broadcast telemetry to all connected clients
      io.emit('responder:telemetry_update', { unitId: cleanUnitId, telemetry, coords });
    });

    // Real-time GPS Location updates from Field Responders
    socket.on('responder:location_update', (data) => {
      const { unitId, coords, status } = data;
      const cleanUnitId = (unitId || '').toUpperCase().trim();
      const res = responders.get(cleanUnitId) || { socketId: socket.id, status: status || 'Available' };
      res.coords = coords;
      if (status) res.status = status;
      responders.set(cleanUnitId, res);

      // Broadcast live coordinates to all dispatchers and maps
      io.emit('responder:location_update', {
        unitId: cleanUnitId,
        coords,
        status: res.status
      });
    });

    socket.on('disconnect', () => {
      // Find and remove responder if it was one
      for (const [unitId, res] of responders.entries()) {
        if (res.socketId === socket.id) {
          responders.delete(unitId);
          io.emit('responder:status_changed', { unitId, status: 'Offline' });
          break;
        }
      }
    });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => res.sendFile(path.resolve('dist/index.html')));
  } else {
    // Dynamic import to avoid loading Vite in production
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
