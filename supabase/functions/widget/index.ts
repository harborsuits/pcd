// Widget edge function - serves embeddable chat widget JS
// GET /widget.js - returns the widget JavaScript

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Allowed origins for embedding (production-safe)
const ALLOWED_ORIGINS = [
  // Lovable domains
  /^https?:\/\/.*\.lovable\.app$/,
  /^https?:\/\/.*\.lovableproject\.com$/,
  // Squarespace
  /^https?:\/\/.*\.squarespace\.com$/,
  /^https?:\/\/.*\.sqsp\.com$/,
  // Local development
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  // Custom domains - add more as needed
  /^https?:\/\/.*\.pleasantcove\.design$/,
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Allow requests without origin (some embeds)
  return ALLOWED_ORIGINS.some(pattern => pattern.test(origin));
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  if (origin && isAllowedOrigin(origin)) {
    return {
      ...corsHeaders,
      "Access-Control-Allow-Origin": origin,
    };
  }
  return corsHeaders;
}

Deno.serve(async (req) => {
  const headers = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

  // The widget JavaScript - self-contained, no React needed
  const widgetJS = `
(function() {
  'use strict';

  // Configuration
  const SUPABASE_URL = '${supabaseUrl}';
  const SUPABASE_ANON_KEY = '${supabaseAnonKey}';
  
  // Find script tag and read data attributes
  const scriptTag = document.currentScript || document.querySelector('script[data-project-token]');
  if (!scriptTag) {
    console.error('[PleasantCove] Widget script tag not found');
    return;
  }

  const config = {
    token: scriptTag.getAttribute('data-project-token'),
    theme: scriptTag.getAttribute('data-theme') || 'light',
    position: scriptTag.getAttribute('data-position') || 'bottom-right',
    accent: scriptTag.getAttribute('data-accent') || '#111827',
  };

  if (!config.token) {
    console.error('[PleasantCove] Missing data-project-token attribute');
    return;
  }

  // State
  let isOpen = false;
  let messages = [];
  let businessName = 'Support';
  let businessStatus = 'active';
  let unreadCount = 0;
  let isLoading = true;
  let error = null;
  let isSending = false;
  let pollingInterval = null;
  let markReadInFlight = false;

  // DOM Elements
  let container, button, badge, panel, messagesContainer, composer, sendButton, closeButton;

  // Styles
  const styles = \`
    .pc-widget-container {
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }
    .pc-widget-container.bottom-right { bottom: 20px; right: 20px; }
    .pc-widget-container.bottom-left { bottom: 20px; left: 20px; }
    .pc-widget-container.top-right { top: 20px; right: 20px; }
    .pc-widget-container.top-left { top: 20px; left: 20px; }
    
    .pc-widget-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: relative;
    }
    .pc-widget-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }
    .pc-widget-button svg {
      width: 28px;
      height: 28px;
    }
    
    .pc-widget-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      border-radius: 10px;
      background: #ef4444;
      color: white;
      font-size: 12px;
      font-weight: 600;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .pc-widget-badge.visible { display: flex; }
    
    .pc-widget-panel {
      position: absolute;
      width: 380px;
      max-width: calc(100vw - 40px);
      height: 520px;
      max-height: calc(100vh - 100px);
      border-radius: 16px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      display: none;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: scale(0.95) translateY(10px);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .pc-widget-panel.open {
      display: flex;
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    .bottom-right .pc-widget-panel, .bottom-left .pc-widget-panel {
      bottom: 70px;
    }
    .top-right .pc-widget-panel, .top-left .pc-widget-panel {
      top: 70px;
    }
    .bottom-right .pc-widget-panel, .top-right .pc-widget-panel {
      right: 0;
    }
    .bottom-left .pc-widget-panel, .top-left .pc-widget-panel {
      left: 0;
    }
    
    .pc-widget-header {
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }
    .pc-widget-header-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .pc-widget-header-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }
    .pc-widget-header-status {
      font-size: 12px;
      opacity: 0.7;
    }
    .pc-widget-close {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    }
    .pc-widget-close:hover {
      background: rgba(0,0,0,0.1);
    }
    
    .pc-widget-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .pc-widget-message {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 16px;
      word-break: break-word;
    }
    .pc-widget-message.client {
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .pc-widget-message.admin {
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .pc-widget-message-time {
      font-size: 11px;
      opacity: 0.6;
      margin-top: 4px;
    }
    .pc-widget-message.sending {
      opacity: 0.7;
    }
    
    .pc-widget-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
      opacity: 0.7;
    }
    .pc-widget-empty svg {
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
      opacity: 0.5;
    }
    
    .pc-widget-loading {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pc-widget-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(0,0,0,0.1);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: pc-spin 0.8s linear infinite;
    }
    @keyframes pc-spin {
      to { transform: rotate(360deg); }
    }
    
    .pc-widget-error {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
    }
    .pc-widget-error-text {
      color: #ef4444;
      margin-bottom: 12px;
    }
    .pc-widget-retry {
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    }
    
    .pc-widget-composer {
      padding: 12px 16px;
      border-top: 1px solid rgba(0,0,0,0.1);
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }
    .pc-widget-input {
      flex: 1;
      min-height: 40px;
      max-height: 120px;
      padding: 10px 14px;
      border: 1px solid rgba(0,0,0,0.15);
      border-radius: 20px;
      resize: none;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.4;
      outline: none;
      transition: border-color 0.2s ease;
    }
    .pc-widget-input:focus {
      border-color: currentColor;
    }
    .pc-widget-send {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s ease;
    }
    .pc-widget-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .pc-widget-send svg {
      width: 20px;
      height: 20px;
    }
    
    .pc-widget-footer {
      padding: 8px 16px;
      text-align: center;
      font-size: 11px;
      opacity: 0.5;
      border-top: 1px solid rgba(0,0,0,0.05);
    }
    .pc-widget-footer a {
      color: inherit;
      text-decoration: none;
    }
    .pc-widget-footer a:hover {
      text-decoration: underline;
    }
    
    /* Light theme */
    .pc-widget-container.light .pc-widget-panel {
      background: #ffffff;
      color: #111827;
    }
    .pc-widget-container.light .pc-widget-message.client {
      background: var(--pc-accent);
      color: #ffffff;
    }
    .pc-widget-container.light .pc-widget-message.admin {
      background: #f3f4f6;
      color: #111827;
    }
    .pc-widget-container.light .pc-widget-input {
      background: #ffffff;
      color: #111827;
    }
    
    /* Dark theme */
    .pc-widget-container.dark .pc-widget-panel {
      background: #1f2937;
      color: #f9fafb;
    }
    .pc-widget-container.dark .pc-widget-header {
      border-color: rgba(255,255,255,0.1);
    }
    .pc-widget-container.dark .pc-widget-message.client {
      background: var(--pc-accent);
      color: #ffffff;
    }
    .pc-widget-container.dark .pc-widget-message.admin {
      background: #374151;
      color: #f9fafb;
    }
    .pc-widget-container.dark .pc-widget-input {
      background: #374151;
      color: #f9fafb;
      border-color: rgba(255,255,255,0.15);
    }
    .pc-widget-container.dark .pc-widget-composer {
      border-color: rgba(255,255,255,0.1);
    }
    .pc-widget-container.dark .pc-widget-close:hover {
      background: rgba(255,255,255,0.1);
    }
    .pc-widget-container.dark .pc-widget-footer {
      border-color: rgba(255,255,255,0.05);
    }

    @media (prefers-reduced-motion: reduce) {
      .pc-widget-panel {
        transition: none;
      }
      .pc-widget-button {
        transition: none;
      }
      .pc-widget-spinner {
        animation-duration: 1.5s;
      }
    }
  \`;

  // Icons
  const chatIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  const closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  const sendIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
  const emptyIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>';

  // Utilities
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  async function apiCall(endpoint, options = {}) {
    const url = SUPABASE_URL + '/functions/v1/' + endpoint;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        ...(options.headers || {}),
      },
    });
    return res.json();
  }

  // Fetch portal data
  async function fetchData() {
    isLoading = true;
    error = null;
    render();

    try {
      const data = await apiCall('portal/' + config.token + '?messages_limit=100');
      
      if (data.error) {
        throw new Error(data.error);
      }

      businessName = data.business?.name || 'Support';
      businessStatus = data.business?.status || 'active';
      messages = data.messages || [];
      
      // Count unread admin messages
      unreadCount = messages.filter(m => m.sender_type === 'admin' && !m.read_at).length;
      
      isLoading = false;
      render();
      scrollToBottom();
      
      // Mark as read if panel is open
      if (isOpen && unreadCount > 0) {
        markAsRead();
      }
    } catch (err) {
      console.error('[PleasantCove] Fetch error:', err);
      error = err.message || 'Failed to load';
      isLoading = false;
      render();
    }
  }

  // Send message
  async function sendMessage(content) {
    if (!content.trim() || isSending) return;

    const tempId = 'temp-' + Date.now();
    const tempMsg = {
      id: tempId,
      content: content.trim(),
      sender_type: 'client',
      created_at: new Date().toISOString(),
      sending: true,
    };

    // Optimistic insert
    messages = [...messages, tempMsg];
    isSending = true;
    render();
    scrollToBottom();

    try {
      const data = await apiCall('messages/' + config.token, {
        method: 'POST',
        body: JSON.stringify({ content: content.trim() }),
      });

      if (data.error) {
        throw new Error(data.error);
      }

      // Replace temp message with real one
      messages = messages.map(m => 
        m.id === tempId ? { ...data.message, sending: false } : m
      );
    } catch (err) {
      console.error('[PleasantCove] Send error:', err);
      // Remove failed message
      messages = messages.filter(m => m.id !== tempId);
    }

    isSending = false;
    render();
    scrollToBottom();
  }

  // Mark admin messages as read
  async function markAsRead() {
    if (markReadInFlight || unreadCount === 0) return;
    markReadInFlight = true;

    try {
      await apiCall('messages/' + config.token + '/mark-read', { method: 'POST' });
      unreadCount = 0;
      messages = messages.map(m => 
        m.sender_type === 'admin' && !m.read_at 
          ? { ...m, read_at: new Date().toISOString() } 
          : m
      );
      render();
    } catch (err) {
      console.error('[PleasantCove] Mark read error:', err);
    }

    markReadInFlight = false;
  }

  // Polling fallback
  function startPolling() {
    if (pollingInterval) return;
    pollingInterval = setInterval(async () => {
      if (!isOpen) return;
      
      try {
        const data = await apiCall('portal/' + config.token + '?messages_limit=100');
        if (data.error) return;

        const oldIds = new Set(messages.map(m => m.id));
        const newMessages = (data.messages || []).filter(m => !oldIds.has(m.id));
        
        if (newMessages.length > 0) {
          messages = data.messages || [];
          unreadCount = messages.filter(m => m.sender_type === 'admin' && !m.read_at).length;
          render();
          scrollToBottom();
          
          // Show notification for new admin messages
          const newAdminMsgs = newMessages.filter(m => m.sender_type === 'admin');
          if (newAdminMsgs.length > 0) {
            showNotification(newAdminMsgs[0].content);
          }
        }
      } catch (err) {
        // Silent fail for polling
      }
    }, 8000);
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  // Notifications
  function showNotification(content) {
    // Flash tab title
    const originalTitle = document.title;
    document.title = '(1) New message — ' + businessName;
    setTimeout(() => {
      document.title = originalTitle;
    }, 5000);
  }

  // Scroll to bottom
  function scrollToBottom() {
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 50);
    }
  }

  // Toggle panel
  function toggle() {
    isOpen = !isOpen;
    render();
    
    if (isOpen) {
      fetchData();
      startPolling();
    } else {
      stopPolling();
    }
  }

  // Render
  function render() {
    // Badge
    if (badge) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.classList.toggle('visible', unreadCount > 0 && !isOpen);
    }

    // Panel visibility
    if (panel) {
      panel.classList.toggle('open', isOpen);
    }

    // Header
    const headerTitle = panel?.querySelector('.pc-widget-header-title');
    if (headerTitle) {
      headerTitle.textContent = businessName;
    }

    // Messages content
    if (messagesContainer) {
      if (isLoading) {
        messagesContainer.innerHTML = '<div class="pc-widget-loading"><div class="pc-widget-spinner"></div></div>';
      } else if (error) {
        messagesContainer.innerHTML = \`
          <div class="pc-widget-error">
            <div class="pc-widget-error-text">\${escapeHtml(error)}</div>
            <button class="pc-widget-retry" onclick="window.__pcWidget.retry()">Try Again</button>
          </div>
        \`;
      } else if (messages.length === 0) {
        messagesContainer.innerHTML = \`
          <div class="pc-widget-empty">
            \${emptyIcon}
            <div>No messages yet</div>
            <div style="font-size:12px;margin-top:4px;">Send a message to get started</div>
          </div>
        \`;
      } else {
        messagesContainer.innerHTML = messages.map(m => \`
          <div class="pc-widget-message \${m.sender_type}\${m.sending ? ' sending' : ''}">
            <div>\${escapeHtml(m.content)}</div>
            <div class="pc-widget-message-time">\${m.sending ? 'Sending...' : formatTime(m.created_at)}</div>
          </div>
        \`).join('');
      }
    }
  }

  // Initialize
  function init() {
    // Add styles
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Set CSS variable for accent color
    document.documentElement.style.setProperty('--pc-accent', config.accent);

    // Create container
    container = document.createElement('div');
    container.className = 'pc-widget-container ' + config.position + ' ' + config.theme;

    // Create button
    button = document.createElement('button');
    button.className = 'pc-widget-button';
    button.style.backgroundColor = config.accent;
    button.style.color = '#ffffff';
    button.innerHTML = chatIcon;
    button.onclick = toggle;
    button.setAttribute('aria-label', 'Open chat');

    // Create badge
    badge = document.createElement('span');
    badge.className = 'pc-widget-badge';
    button.appendChild(badge);

    // Create panel
    panel = document.createElement('div');
    panel.className = 'pc-widget-panel';
    panel.innerHTML = \`
      <div class="pc-widget-header">
        <div class="pc-widget-header-info">
          <h3 class="pc-widget-header-title">\${escapeHtml(businessName)}</h3>
          <span class="pc-widget-header-status">We typically reply within a few hours</span>
        </div>
        <button class="pc-widget-close" aria-label="Close chat">\${closeIcon}</button>
      </div>
      <div class="pc-widget-messages"></div>
      <div class="pc-widget-composer">
        <textarea class="pc-widget-input" placeholder="Type a message..." rows="1"></textarea>
        <button class="pc-widget-send" aria-label="Send message">\${sendIcon}</button>
      </div>
      <div class="pc-widget-footer">
        Powered by <a href="https://pleasantcove.design" target="_blank" rel="noopener">Pleasant Cove</a>
      </div>
    \`;

    // Get elements
    messagesContainer = panel.querySelector('.pc-widget-messages');
    closeButton = panel.querySelector('.pc-widget-close');
    composer = panel.querySelector('.pc-widget-input');
    sendButton = panel.querySelector('.pc-widget-send');

    // Set accent colors
    sendButton.style.backgroundColor = config.accent;
    sendButton.style.color = '#ffffff';
    panel.querySelector('.pc-widget-retry')?.style.setProperty('background', config.accent);

    // Event listeners
    closeButton.onclick = toggle;
    
    sendButton.onclick = () => {
      if (composer.value.trim()) {
        sendMessage(composer.value);
        composer.value = '';
        composer.style.height = 'auto';
      }
    };

    composer.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendButton.click();
      }
    };

    // Auto-resize textarea
    composer.oninput = () => {
      composer.style.height = 'auto';
      composer.style.height = Math.min(composer.scrollHeight, 120) + 'px';
    };

    // Assemble
    container.appendChild(panel);
    container.appendChild(button);
    document.body.appendChild(container);

    // Expose retry function
    window.__pcWidget = {
      retry: fetchData,
      open: () => { if (!isOpen) toggle(); },
      close: () => { if (isOpen) toggle(); },
    };

    console.log('[PleasantCove] Widget initialized for token:', config.token.slice(0, 8) + '...');
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;

  return new Response(widgetJS, {
    status: 200,
    headers: {
      ...headers,
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300", // Cache for 5 minutes
    },
  });
});
