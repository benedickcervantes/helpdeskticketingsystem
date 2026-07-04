(function () {
  const SLIDE_W = 1920;
  const SLIDE_H = 1080;
  const TRANSITION_MS = 520;
  let currentIndex = 0;
  let presentationMode = false;
  let isTransitioning = false;

  function getWraps() {
    return [...document.querySelectorAll('.slide-scale-wrap')];
  }

  function wrapSlides() {
    const container = document.getElementById('slides-container');
    if (!container) return;
    [...container.querySelectorAll('.slide')].forEach((slide) => {
      if (slide.parentElement?.classList.contains('slide-scale-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'slide-scale-wrap';
      slide.parentNode.insertBefore(wrap, slide);
      wrap.appendChild(slide);
    });
  }

  function layoutWrap(wrap, scale) {
    const w = SLIDE_W * scale;
    const h = SLIDE_H * scale;
    wrap.style.width = `${w}px`;
    wrap.style.height = `${h}px`;
    const slide = wrap.querySelector('.slide');
    if (slide) {
      slide.style.width = `${SLIDE_W}px`;
      slide.style.height = `${SLIDE_H}px`;
      slide.style.transform = `scale(${scale})`;
      slide.style.transformOrigin = 'top left';
    }
  }

  function fitSlides() {
    const PAD = presentationMode ? 0 : 16;
    const availW = Math.max(window.innerWidth - PAD * 2, 280);
    const availH = Math.max(window.innerHeight - PAD * 2, 180);
    const maxScale = presentationMode ? Infinity : 1;
    const scale = Math.min(availW / SLIDE_W, availH / SLIDE_H, maxScale);

    getWraps().forEach((wrap, i) => {
      if (presentationMode) {
        const visible =
          wrap.classList.contains('is-active') ||
          wrap.classList.contains('is-visible') ||
          wrap.classList.contains('is-exiting');
        if (!visible) return;
      }
      layoutWrap(wrap, scale);
    });
  }

  function clearSlideClasses(wrap) {
    wrap.classList.remove(
      'is-active',
      'is-visible',
      'is-exiting',
      'from-right',
      'from-left',
      'to-left',
      'to-right',
    );
  }

  function resetAllSlides() {
    getWraps().forEach(clearSlideClasses);
  }

  function setInstantSlide(index) {
    resetAllSlides();
    getWraps().forEach((wrap, i) => {
      if (i === index) {
        wrap.classList.add('is-visible', 'is-active');
      }
    });
    fitSlides();
    updateHud();
  }

  function updateHud() {
    const hud = document.getElementById('present-hud');
    const wraps = getWraps();
    if (hud && wraps.length) {
      hud.textContent = `${currentIndex + 1} / ${wraps.length}`;
    }
    const progress = document.getElementById('present-progress');
    if (progress && wraps.length) {
      progress.style.width = `${((currentIndex + 1) / wraps.length) * 100}%`;
    }
  }

  function showSlide(index, direction = 0) {
    const wraps = getWraps();
    if (!wraps.length) return;

    const nextIndex = Math.max(0, Math.min(index, wraps.length - 1));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!presentationMode) {
      currentIndex = nextIndex;
      fitSlides();
      updateHud();
      return;
    }

    if (isTransitioning) return;
    if (nextIndex === currentIndex && direction !== 0) return;

    const prevIndex = currentIndex;
    currentIndex = nextIndex;

    if (direction === 0 || reducedMotion || prevIndex === nextIndex) {
      setInstantSlide(currentIndex);
      return;
    }

    const outgoing = wraps[prevIndex];
    const incoming = wraps[nextIndex];
    if (!outgoing || !incoming) {
      setInstantSlide(currentIndex);
      return;
    }

    isTransitioning = true;
    document.body.classList.add('is-transitioning');

    resetAllSlides();
    outgoing.classList.add('is-visible', 'is-active', 'is-exiting');
    incoming.classList.add('is-visible', direction > 0 ? 'from-right' : 'from-left');
    fitSlides();
    updateHud();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        outgoing.classList.remove('is-active');
        outgoing.classList.add(direction > 0 ? 'to-left' : 'to-right');
        incoming.classList.remove('from-right', 'from-left');
        incoming.classList.add('is-active');
      });
    });

    window.setTimeout(() => {
      resetAllSlides();
      incoming.classList.add('is-visible', 'is-active');
      isTransitioning = false;
      document.body.classList.remove('is-transitioning');
      fitSlides();
    }, TRANSITION_MS);
  }

  function enterPresentation() {
    presentationMode = true;
    document.body.classList.add('presentation-mode');
    document.getElementById('present-start')?.classList.add('hidden');
    document.getElementById('present-hud')?.classList.remove('hidden');
    document.getElementById('present-progress')?.classList.remove('hidden');
    currentIndex = 0;
    setInstantSlide(0);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  function exitPresentation() {
    presentationMode = false;
    isTransitioning = false;
    document.body.classList.remove('presentation-mode', 'is-transitioning');
    resetAllSlides();
    document.getElementById('present-start')?.classList.remove('hidden');
    document.getElementById('present-hud')?.classList.add('hidden');
    document.getElementById('present-progress')?.classList.add('hidden');
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    fitSlides();
  }

  function nextSlide() {
    showSlide(currentIndex + 1, 1);
  }

  function prevSlide() {
    showSlide(currentIndex - 1, -1);
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;

    if (!presentationMode) {
      if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        enterPresentation();
      }
      return;
    }

    if (isTransitioning && !['Escape', 'f', 'F'].includes(e.key)) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        prevSlide();
        break;
      case 'Home':
        e.preventDefault();
        showSlide(0, currentIndex > 0 ? -1 : 0);
        break;
      case 'End':
        e.preventDefault();
        showSlide(getWraps().length - 1, currentIndex < getWraps().length - 1 ? 1 : 0);
        break;
      case 'Escape':
        exitPresentation();
        break;
      case 'f':
      case 'F':
        if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
        else document.documentElement.requestFullscreen?.().catch(() => {});
        break;
      default:
        break;
    }
  });

  document.getElementById('present-start-btn')?.addEventListener('click', enterPresentation);

  document.addEventListener('click', (e) => {
    if (!presentationMode || isTransitioning) return;
    if (e.target.closest('#present-hud, #present-progress')) return;
    const x = e.clientX / window.innerWidth;
    if (x > 0.65) nextSlide();
    else if (x < 0.35) prevSlide();
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && presentationMode) exitPresentation();
  });

  window.addEventListener('resize', fitSlides);
  window.addEventListener('orientationchange', fitSlides);
  window.addEventListener('load', () => {
    wrapSlides();
    fitSlides();
    setTimeout(fitSlides, 100);
    if (new URLSearchParams(window.location.search).has('present')) {
      enterPresentation();
    }
  });

  window.Presentation = { enter: enterPresentation, exit: exitPresentation, next: nextSlide, prev: prevSlide };
})();
