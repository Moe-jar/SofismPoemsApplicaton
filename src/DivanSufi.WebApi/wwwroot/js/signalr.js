// SignalR connection with polling fallback for ديوان الصوفية

let connection = null;
let pollingInterval = null;
const POLL_INTERVAL = 20000; // 20 seconds

export function connectSignalR(onPoemUpdate, onWaslaUpdate) {
  const token = localStorage.getItem('divan_token');
  if (!token) return;

  // Load SignalR client from CDN
  if (!window.signalR) {
    console.warn('SignalR client not loaded, falling back to polling');
    startPolling(onPoemUpdate, onWaslaUpdate);
    return;
  }

  try {
    connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/divan', { 
        accessTokenFactory: () => token 
      })
      .withAutomaticReconnect()
      .build();

    connection.on('CurrentPoemUpdated', (data) => {
      console.log('SignalR: Current poem updated', data);
      if (onPoemUpdate) onPoemUpdate(data);
    });

    connection.on('CurrentWaslaUpdated', (data) => {
      console.log('SignalR: Current wasla updated', data);
      if (onWaslaUpdate) onWaslaUpdate(data);
    });

    connection.onclose(() => {
      console.log('SignalR connection closed, starting polling fallback');
      startPolling(onPoemUpdate, onWaslaUpdate);
    });

    connection.onreconnected(() => {
      console.log('SignalR reconnected, stopping polling');
      stopPolling();
    });

    connection.start()
      .then(() => {
        console.log('SignalR connected successfully');
        stopPolling();
      })
      .catch(err => {
        console.log('SignalR connection failed:', err);
        startPolling(onPoemUpdate, onWaslaUpdate);
      });
  } catch (err) {
    console.log('SignalR setup failed:', err);
    startPolling(onPoemUpdate, onWaslaUpdate);
  }
}

function startPolling(onPoemUpdate, onWaslaUpdate) {
  if (pollingInterval) return;
  
  console.log('Starting polling fallback');
  pollingInterval = setInterval(async () => {
    try {
      const token = localStorage.getItem('divan_token');
      if (!token) return;
      
      // Poll for poem updates
      if (onPoemUpdate) {
        const res = await fetch('/api/current/poem', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (res.ok) { 
          const data = await res.json(); 
          onPoemUpdate(data); 
        }
      }
      
      // Poll for wasla updates
      if (onWaslaUpdate) {
        const res = await fetch('/api/current/wasla', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (res.ok) { 
          const data = await res.json(); 
          onWaslaUpdate(data); 
        }
      }
    } catch (err) {
      console.log('Polling error:', err);
    }
  }, POLL_INTERVAL);
}

function stopPolling() {
  if (pollingInterval) { 
    console.log('Stopping polling');
    clearInterval(pollingInterval); 
    pollingInterval = null; 
  }
}

export function disconnectSignalR() {
  stopPolling();
  if (connection) {
    connection.stop();
    connection = null;
  }
}

export function isConnected() {
  return connection && connection.state === signalR.HubConnectionState.Connected;
}

export function getConnectionStatus() {
  if (!connection) return 'disconnected';
  
  switch (connection.state) {
    case signalR.HubConnectionState.Connected:
      return 'connected';
    case signalR.HubConnectionState.Connecting:
    case signalR.HubConnectionState.Reconnecting:
      return 'connecting';
    default:
      return 'disconnected';
  }
}