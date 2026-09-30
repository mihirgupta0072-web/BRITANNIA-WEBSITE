/**
 * Britannia Winkin' Cow | Strawberblicious Thick Shake
 * High-Performance 210-Frame 3D Canvas Scroll Engine & Interactivity
 */

(function () {
  'use strict';

  // Constants & Config
  const TOTAL_FRAMES = 210;
  const FRAME_PREFIX = 'ezgif-frame-';
  const FRAME_EXT = '.jpg';
  const BASE_WIDTH = 1920;
  const BASE_HEIGHT = 1080;

  // DOM Elements
  const preloader = document.getElementById('preloader');
  const progressFill = document.getElementById('progress-fill');
  const loaderPercent = document.getElementById('loader-percent');
  const loaderStatus = document.getElementById('loader-status');

  const topNavbar = document.getElementById('top-navbar');
  const navToggleAutoplay = document.getElementById('nav-toggle-autoplay');
  const navPlayIcon = document.getElementById('nav-play-icon');
  const navPlayText = document.getElementById('nav-play-text');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  const navMenuLinks = document.querySelectorAll('.nav-menu-link, .mobile-menu-link');

  const scrollTrack = document.getElementById('scroll-track');
  const canvas = document.getElementById('animation-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  // HUD Elements
  const hudPlayBtn = document.getElementById('hud-play-btn');
  const hudPlayIcon = document.getElementById('hud-play-icon');
  const frameScrubber = document.getElementById('frame-scrubber');
  const scrubberFill = document.getElementById('scrubber-fill');
  const hudFrameNum = document.getElementById('hud-frame-num');
  const hudPercent = document.getElementById('hud-percent');
  const hudFitBtn = document.getElementById('hud-fit-btn');
  const fitModeLabel = document.getElementById('fit-mode-label');
  const hudSoundBtn = document.getElementById('hud-sound-btn');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');
  const replayBtn = document.getElementById('replay-btn');
  const scrollHint = document.getElementById('scroll-hint');

  // Story Chapters
  const storyCards = document.querySelectorAll('.story-card');

  // Dynamic Background Elements
  const stickyViewport = document.getElementById('sticky-viewport');

  // State
  const images = new Array(TOTAL_FRAMES);
  let loadedFrames = 0;
  let currentFrame = 0;
  let targetFrame = 0;
  let lastDrawnFrame = -1;
  let isAutoPlaying = false;
  let autoPlayRafId = null;
  let fitMode = 'cover'; // 'cover' or 'contain'
  let soundEnabled = false;
  let audioCtx = null;
  let isScrubbing = false;

  // Color Interpolation for Dynamic Background Matching
  // Frame 1: #381622 (Burgundy), Frame 70: #df5b79 (Vibrant Pink), Frame 210: #f4829e (Soft Pink)
  function getDynamicBgColor(progress) {
    if (progress < 0.35) {
      // Transition from burgundy to bright pink
      const t = progress / 0.35;
      const r = Math.round(56 + (223 - 56) * t);
      const g = Math.round(22 + (91 - 22) * t);
      const b = Math.round(34 + (121 - 34) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Transition from bright pink to creamy strawberry
      const t = (progress - 0.35) / 0.65;
      const r = Math.round(223 + (244 - 223) * t);
      const g = Math.round(91 + (130 - 91) * t);
      const b = Math.round(121 + (158 - 121) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  // Preloader Logic
  function padZero(num, size = 3) {
    let s = num + '';
    while (s.length < size) s = '0' + s;
    return s;
  }

  let isFinished = false;

  function preloadImages() {
    return new Promise((resolve) => {
      // Safety timeout: automatically reveal the site after 3.5s if any asset lags
      const safetyTimer = setTimeout(() => {
        if (!isFinished) {
          console.warn('Preloader safety timeout: revealing experience');
          finishLoading(resolve);
        }
      }, 3500);

      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        const frameIndex = i + 1;
        const fileName = `${FRAME_PREFIX}${padZero(frameIndex)}${FRAME_EXT}`;

        img.onload = () => {
          loadedFrames++;
          const percent = Math.floor((loadedFrames / TOTAL_FRAMES) * 100);
          if (progressFill) progressFill.style.width = `${percent}%`;
          if (loaderPercent) loaderPercent.textContent = `${percent}%`;
          if (loaderStatus) loaderStatus.textContent = `Preloading 210 Ultra-HD Animation Frames... (${loadedFrames}/${TOTAL_FRAMES})`;

          if (loadedFrames === TOTAL_FRAMES) {
            clearTimeout(safetyTimer);
            finishLoading(resolve);
          }
        };

        img.onerror = () => {
          loadedFrames++;
          console.warn(`Frame load failed: ${fileName}`);
          if (loadedFrames === TOTAL_FRAMES) {
            clearTimeout(safetyTimer);
            finishLoading(resolve);
          }
        };

        img.src = fileName;
        images[i] = img;
      }
    });
  }

  function finishLoading(resolve) {
    if (isFinished) return;
    isFinished = true;
    setTimeout(() => {
      if (preloader) preloader.classList.add('fade-out');
      initCanvas();
      renderFrame(0);
      resolve();
    }, 300);
  }

  // Canvas Setup & Rendering
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    lastDrawnFrame = -1; // force redraw
    renderFrame(Math.round(currentFrame));
  }

  function renderFrame(frameIdx) {
    const img = images[frameIdx];
    if (!img || !img.complete) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    const imgRatio = BASE_WIDTH / BASE_HEIGHT;
    const screenRatio = w / h;

    let drawW, drawH, offsetX, offsetY;

    if (fitMode === 'cover') {
      // Cover mode: fills 100% of container viewport
      if (screenRatio > imgRatio) {
        drawW = w;
        drawH = w / imgRatio;
        offsetX = 0;
        offsetY = (h - drawH) / 2;
      } else {
        drawH = h;
        drawW = h * imgRatio;
        offsetX = (w - drawW) / 2;
        offsetY = 0;
      }
    } else {
      // Contain mode: entire 1920x1080 frame is 100% visible with zero crop
      if (screenRatio > imgRatio) {
        drawH = h;
        drawW = h * imgRatio;
        offsetX = (w - drawW) / 2;
        offsetY = 0;
      } else {
        drawW = w;
        drawH = w / imgRatio;
        offsetX = 0;
        offsetY = (h - drawH) / 2;
      }
    }

    // Set background matching color to eliminate jarring borders
    const progress = frameIdx / (TOTAL_FRAMES - 1);
    const bgColor = getDynamicBgColor(progress);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    if (stickyViewport) {
      stickyViewport.style.backgroundColor = bgColor;
    }

    // Draw frame
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    lastDrawnFrame = frameIdx;
  }

  // Story Overlays & HUD Updates
  function updateStoryOverlays(frameIdx) {
    storyCards.forEach((card) => {
      const start = parseInt(card.getAttribute('data-start'), 10);
      const end = parseInt(card.getAttribute('data-end'), 10);

      if (frameIdx >= start && frameIdx <= end) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Update active nav button
    navChapterBtns.forEach((btn, idx) => {
      const jumpVal = parseInt(btn.getAttribute('data-jump'), 10);
      const nextJump = navChapterBtns[idx + 1] ? parseInt(navChapterBtns[idx + 1].getAttribute('data-jump'), 10) : TOTAL_FRAMES;
      if (frameIdx >= jumpVal && frameIdx < nextJump) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function updateHUD(frameIdx) {
    const progress = frameIdx / (TOTAL_FRAMES - 1);
    const percent = Math.round(progress * 100);

    hudFrameNum.textContent = padZero(frameIdx + 1);
    hudPercent.textContent = `(${percent}%)`;

    if (!isScrubbing) {
      frameScrubber.value = frameIdx;
      scrubberFill.style.width = `${progress * 100}%`;
    }

    if (frameIdx > 5 && scrollHint) {
      scrollHint.style.opacity = '0';
    } else if (scrollHint) {
      scrollHint.style.opacity = '0.85';
    }
  }

  // Smooth Render Loop (60 FPS with Lerp)
  function renderLoop() {
    // Lerp towards targetFrame for silky smooth transitions
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.01) {
      currentFrame += diff * 0.16;
    } else {
      currentFrame = targetFrame;
    }

    const roundedFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentFrame)));

    if (roundedFrame !== lastDrawnFrame) {
      renderFrame(roundedFrame);
      updateStoryOverlays(roundedFrame);
      updateHUD(roundedFrame);

      if (soundEnabled && Math.abs(diff) > 0.5) {
        triggerScrollSound(roundedFrame);
      }
    }

    requestAnimationFrame(renderLoop);
  }

  // Scroll Handling
  function onScroll() {
    if (isScrubbing || isAutoPlaying) return;

    const trackRect = scrollTrack.getBoundingClientRect();
    const maxScroll = scrollTrack.offsetHeight - window.innerHeight;
    const scrolledAmount = -trackRect.top;

    let progress = scrolledAmount / maxScroll;
    progress = Math.max(0, Math.min(1, progress));

    targetFrame = Math.floor(progress * (TOTAL_FRAMES - 1));

    // Top transparent navbar scroll effect
    if (topNavbar) {
      if (window.scrollY > 40) {
        topNavbar.classList.add('navbar-scrolled');
      } else {
        topNavbar.classList.remove('navbar-scrolled');
      }
    }

    // Update active menu link based on current scroll position (ScrollSpy)
    updateActiveMenuLink();
  }

  // Specifications ScrollSpy logic
  const specSections = [
    { id: 'scroll-hero', target: 'scroll-hero' },
    { id: 'sensory-section', target: 'sensory-section' },
    { id: 'nutrition-section', target: 'nutrition-section' },
    { id: 'packs-section', target: 'packs-section' },
    { id: 'recipes-section', target: 'recipes-section' },
    { id: 'reviews-section', target: 'reviews-section' },
    { id: 'delivery-faq-section', target: 'delivery-faq-section' }
  ];

  function updateActiveMenuLink() {
    const scrollPos = window.scrollY + 120;
    let currentTarget = 'scroll-hero';

    for (let i = specSections.length - 1; i >= 0; i--) {
      const sec = document.getElementById(specSections[i].id);
      if (sec && sec.offsetTop <= scrollPos) {
        currentTarget = specSections[i].target;
        break;
      }
    }

    navMenuLinks.forEach((link) => {
      if (link.getAttribute('data-target') === currentTarget) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Smooth scroll to specification sections when navbar menus are clicked
  navMenuLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('data-target') || (link.getAttribute('href') ? link.getAttribute('href').substring(1) : '');
      const targetElem = document.getElementById(targetId);
      if (targetElem) {
        e.preventDefault();
        stopAutoPlay();
        if (mobileNavDrawer) mobileNavDrawer.classList.remove('open');

        const navHeight = topNavbar ? topNavbar.offsetHeight : 64;
        const targetTop = targetElem.getBoundingClientRect().top + window.scrollY - navHeight + 2;

        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: 'smooth'
        });
      }
    });
  });

  // Mobile Menu Toggle
  if (mobileMenuToggle && mobileNavDrawer) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileNavDrawer.classList.toggle('open');
    });
  }

  // Scrubber Controls
  frameScrubber.addEventListener('input', (e) => {
    isScrubbing = true;
    stopAutoPlay();

    const val = parseInt(e.target.value, 10);
    targetFrame = val;
    currentFrame = val;
    scrubberFill.style.width = `${(val / (TOTAL_FRAMES - 1)) * 100}%`;

    // Sync window scroll position
    const maxScroll = scrollTrack.offsetHeight - window.innerHeight;
    const targetScrollY = (val / (TOTAL_FRAMES - 1)) * maxScroll + scrollTrack.offsetTop;
    window.scrollTo({ top: targetScrollY, behavior: 'auto' });
  });

  frameScrubber.addEventListener('change', () => {
    isScrubbing = false;
  });

  // Fit Mode Toggle (Cover vs Contain)
  hudFitBtn.addEventListener('click', () => {
    if (fitMode === 'cover') {
      fitMode = 'contain';
      fitModeLabel.textContent = 'Fit: Contain';
      hudFitBtn.classList.add('active');
    } else {
      fitMode = 'cover';
      fitModeLabel.textContent = 'Fit: Cover';
      hudFitBtn.classList.remove('active');
    }
    lastDrawnFrame = -1;
    renderFrame(Math.round(currentFrame));
  });

  // Auto-Play Feature
  function startAutoPlay() {
    isAutoPlaying = true;
    hudPlayBtn.classList.add('active');
    hudPlayIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

    if (navToggleAutoplay) {
      navToggleAutoplay.classList.add('playing');
      if (navPlayText) navPlayText.textContent = 'Pause';
      if (navPlayIcon) navPlayIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    }

    const maxScroll = scrollTrack.offsetHeight - window.innerHeight;
    let startTime = performance.now();
    const duration = 12000; // 12 seconds for full sequence

    if (currentFrame >= TOTAL_FRAMES - 5) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      targetFrame = 0;
      currentFrame = 0;
    }

    function step(timestamp) {
      if (!isAutoPlaying) return;

      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);

      const targetY = progress * maxScroll + scrollTrack.offsetTop;
      window.scrollTo({ top: targetY, behavior: 'auto' });

      targetFrame = Math.floor(progress * (TOTAL_FRAMES - 1));

      if (progress < 1) {
        autoPlayRafId = requestAnimationFrame(step);
      } else {
        stopAutoPlay();
      }
    }

    autoPlayRafId = requestAnimationFrame(step);
  }

  function stopAutoPlay() {
    isAutoPlaying = false;
    hudPlayBtn.classList.remove('active');
    hudPlayIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';

    if (navToggleAutoplay) {
      navToggleAutoplay.classList.remove('playing');
      if (navPlayText) navPlayText.textContent = 'Auto Play';
      if (navPlayIcon) navPlayIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    }

    if (autoPlayRafId) {
      cancelAnimationFrame(autoPlayRafId);
      autoPlayRafId = null;
    }
  }

  function toggleAutoPlay() {
    if (isAutoPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  }

  hudPlayBtn.addEventListener('click', toggleAutoPlay);
  if (navToggleAutoplay) navToggleAutoplay.addEventListener('click', toggleAutoPlay);

  // Replay Functionality
  function replaySequence() {
    stopAutoPlay();
    targetFrame = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (replayBtn) replayBtn.addEventListener('click', replaySequence);

  // Keyboard Navigation: Spacebar toggles auto-play, Arrow keys scrub frames
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    if (e.code === 'Space') {
      e.preventDefault();
      toggleAutoPlay();
    } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
      e.preventDefault();
      stopAutoPlay();
      targetFrame = Math.min(TOTAL_FRAMES - 1, targetFrame + 2);
      syncScrollFromFrame(targetFrame);
    } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
      e.preventDefault();
      stopAutoPlay();
      targetFrame = Math.max(0, targetFrame - 2);
      syncScrollFromFrame(targetFrame);
    }
  });

  function syncScrollFromFrame(frame) {
    const maxScroll = scrollTrack.offsetHeight - window.innerHeight;
    const targetY = (frame / (TOTAL_FRAMES - 1)) * maxScroll + scrollTrack.offsetTop;
    window.scrollTo({ top: targetY, behavior: 'auto' });
  }

  // Synthesized Web Audio Sound Effects (Liquid Splash / Pop)
  let lastSoundTime = 0;
  function triggerScrollSound(frame) {
    const now = performance.now();
    if (now - lastSoundTime < 90) return; // throttle sounds
    lastSoundTime = now;

    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      // Pitch rises as strawberry splashes and brand reveals
      const freq = 220 + (frame / TOTAL_FRAMES) * 360;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (e) {
      // Audio not permitted yet
    }
  }

  hudSoundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      hudSoundBtn.classList.add('active');
      soundIconOn.classList.remove('hidden');
      soundIconOff.classList.add('hidden');
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      audioCtx.resume();
      triggerScrollSound(Math.round(currentFrame));
    } else {
      hudSoundBtn.classList.remove('active');
      soundIconOn.classList.add('hidden');
      soundIconOff.classList.remove('hidden');
    }
  });

  // Initialization
  function initCanvas() {
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', onScroll, { passive: true });
    resizeCanvas();
    renderLoop();
  }

  // Start Preloading
  preloadImages();

})();
