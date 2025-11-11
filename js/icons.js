// icons.js - Lucide icon utilities for WritingPage
(function() {
  'use strict';

  // Minimal Lucide icon SVG strings (from lucide-react)
  const icons = {
    eye: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12C2.5 7.5 7 4 12 4s9.5 3.5 9.5 8-4.5 8-9.5 8-9.5-3.5-9.5-8Z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>',
    settings: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>'
  };

  // Create icon element with accessibility
  function createIcon(name, options = {}) {
    const { size = 16, label = '', className = '' } = options;
    const svg = icons[name];
    if (!svg) {
      console.warn(`Icon "${name}" not found`);
      return document.createElement('span');
    }

    const wrapper = document.createElement('span');
    wrapper.className = `icon icon-${name} ${className}`.trim();
    wrapper.innerHTML = svg;
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.width = `${size}px`;
    wrapper.style.height = `${size}px`;

    if (label) {
      wrapper.setAttribute('aria-label', label);
      wrapper.setAttribute('role', 'img');
    }

    return wrapper;
  }

  // Replace emoji in element with icon
  function replaceEmojiWithIcon(element, emoji, iconName, options = {}) {
    if (!element) return;

    const text = element.textContent || element.innerHTML;
    if (text.includes(emoji)) {
      const icon = createIcon(iconName, options);
      element.innerHTML = text.replace(emoji, icon.outerHTML);
    }
  }

  // Global access
  window.WritingIcons = {
    createIcon,
    replaceEmojiWithIcon,
    icons
  };

})();
