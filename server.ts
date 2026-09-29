import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // In-memory state for prototype
  const responders = new Map();
  const activeDirectives = new Map();

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
