// SignalR + Polling fallback for real-time updates
import { API_BASE, SIGNALR_HUB, POLL_INTERVAL } from './config.js';
import { getToken } from './auth.js';

let pollTimer = null;
const listeners = {};

// Simple event emitter
function emit(event, data) {
  (listeners[event] || []).forEach(fn => fn(data));
}

export function on(event, fn) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(fn);
}

export function off(event, fn) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(f => f !== fn);
}

// Polling-based fallback (always used since we don't bundle SignalR client)
export function startPolling(fetchCurrentPoem, fetchCurrentWasla) {
  if (pollTimer) stopPolling();

  const poll = async () => {
    try {
      if (fetchCurrentPoem) {
        const poem = await fetchCurrentPoem();
        emit('currentPoemUpdated', poem);
      }
      if (fetchCurrentWasla) {
        const wasla = await fetchCurrentWasla();
        emit('currentWaslaUpdated', wasla);
      }
    } catch (err) {
      console.warn('Polling error:', err.message);
    }
  };

  poll(); // immediate first call
  pollTimer = setInterval(poll, POLL_INTERVAL);
}

export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
