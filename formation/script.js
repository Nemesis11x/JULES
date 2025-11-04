(function () {
  const body = document.body;
  const yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointerFineQuery = window.matchMedia('(pointer: fine) and (hover: hover)');

  const addMediaListener = (query, handler) => {
    if ('addEventListener' in query) {
      query.addEventListener('change', handler);
    } else if ('addListener' in query) {
      query.addListener(handler);
    }
  };

  let cursorTeardown = null;

  function initCustomCursor() {
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');

    if (!cursor || !follower) {
      return null;
    }

    body.classList.add('has-custom-cursor');

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let followerX = targetX;
    let followerY = targetY;
    let followerSize = 40;
    let cursorScale = 1;
    let rafId = null;

    follower.style.width = '40px';
    follower.style.height = '40px';

    const render = () => {
      cursor.style.transform = `translate(${targetX - 6}px, ${targetY - 6}px) scale(${cursorScale})`;
      followerX += (targetX - followerX) * 0.18;
      followerY += (targetY - followerY) * 0.18;
      const half = followerSize / 2;
      follower.style.transform = `translate(${followerX - half}px, ${followerY - half}px)`;
      rafId = requestAnimationFrame(render);
    };

    const handleMouseMove = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }
    };

    const handleHoverStart = () => {
      cursorScale = 1.5;
      followerSize = 60;
      follower.style.width = '60px';
      follower.style.height = '60px';
    };

    const handleHoverEnd = () => {
      cursorScale = 1;
      followerSize = 40;
      follower.style.width = '40px';
      follower.style.height = '40px';
    };

    const handleWindowLeave = () => {
      cursor.style.opacity = '0';
      follower.style.opacity = '0';
    };

    const handleWindowEnter = () => {
      cursor.style.opacity = '1';
      follower.style.opacity = '1';
    };

    const interactiveElements = Array.from(document.querySelectorAll('a, button, .btn'));
    interactiveElements.forEach((element) => {
      element.addEventListener('mouseenter', handleHoverStart);
      element.addEventListener('mouseleave', handleHoverEnd);
    });

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleWindowLeave);
    document.addEventListener('mouseenter', handleWindowEnter);

    handleWindowEnter();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleWindowLeave);
      document.removeEventListener('mouseenter', handleWindowEnter);
      interactiveElements.forEach((element) => {
        element.removeEventListener('mouseenter', handleHoverStart);
        element.removeEventListener('mouseleave', handleHoverEnd);
      });
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      cursor.removeAttribute('style');
      follower.removeAttribute('style');
      body.classList.remove('has-custom-cursor');
    };
  }

  const evaluateCursor = () => {
    const shouldEnableCursor = pointerFineQuery.matches && !reduceMotionQuery.matches;
    if (shouldEnableCursor) {
      if (!cursorTeardown) {
        cursorTeardown = initCustomCursor();
      }
    } else if (cursorTeardown) {
      cursorTeardown();
      cursorTeardown = null;
    } else {
      body.classList.remove('has-custom-cursor');
    }
  };

  evaluateCursor();
  addMediaListener(pointerFineQuery, evaluateCursor);
  addMediaListener(reduceMotionQuery, evaluateCursor);

  // Manage a CSS hook to disable heavy scroll effects on touch devices or when
  // user prefers reduced motion. This allows CSS to remove overlays/shadows
  // that otherwise interact poorly with transforms on mobile.
  const evaluateScrollEffects = () => {
    if (reduceMotionQuery.matches || !pointerFineQuery.matches) {
      body.classList.add('no-scroll-effects');
    } else {
      body.classList.remove('no-scroll-effects');
    }
  };

  evaluateScrollEffects();
  addMediaListener(pointerFineQuery, evaluateScrollEffects);
  addMediaListener(reduceMotionQuery, evaluateScrollEffects);

  const header = document.querySelector('header');
  if (header) {
    const toggleHeaderState = () => {
      if (window.pageYOffset > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', toggleHeaderState, { passive: true });
    toggleHeaderState();
  }

  const revealElements = Array.from(document.querySelectorAll('.scroll-reveal'));
  let revealObserver = null;

  const applyScrollReveal = () => {
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }

    revealElements.forEach((element) => {
      element.style.transition = '';
    });

    // Disable scroll-reveal animations on devices that prefer reduced motion
    // or on touch devices (pointer not fine) because transforms / blend modes
    // can cause rendering issues on some mobile browsers while scrolling.
    if (!('IntersectionObserver' in window) || reduceMotionQuery.matches || !pointerFineQuery.matches) {
      revealElements.forEach((element) => {
        element.style.opacity = '1';
        element.style.transform = 'none';
      });
      return;
    }

    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    });

    revealElements.forEach((element) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(40px)';
      element.style.transition = 'opacity 0.8s cubic-bezier(0.19, 1, 0.22, 1), transform 0.8s cubic-bezier(0.19, 1, 0.22, 1)';
      revealObserver.observe(element);
    });
  };

    applyScrollReveal();
  addMediaListener(reduceMotionQuery, applyScrollReveal);

  // Smooth scroll to reservation with stable offset (handles mobile reflow)
  (function () {
    const smoothScrollTo = (element) => {
      const isDesktop = window.matchMedia('(min-width: 769px)').matches;
      const baseOffset = isDesktop ? 64 : 0;

      const go = () => {
        const rect = element.getBoundingClientRect();
        const y = Math.max(0, window.pageYOffset + rect.top - baseOffset);
        window.scrollTo({ top: y, behavior: 'smooth' });
      };

      go();

      // Re-align after potential reflow (images/fonts) on mobile
      setTimeout(go, 250);
      setTimeout(go, 600);

      // Final precise nudge if still off by a few pixels
      setTimeout(() => {
        const finalRect = element.getBoundingClientRect();
        if (Math.abs(finalRect.top - (isDesktop ? 64 : 0)) > 2) {
          go();
        }
      }, 900);
    };

    const scrollToReservation = (event) => {
      event.preventDefault();
      const target = document.getElementById('reservation') || document.getElementById('reservation-direct');
      if (target) {
        try { history.replaceState(null, '', '#reservation'); } catch (_) {}
        smoothScrollTo(target);
      } else {
        window.location.hash = '#reservation';
      }
    };
    const selectors = ['a[href="#reservation"]', 'a[href="#reservation-direct"]', '.btn-reserver'];
    document.querySelectorAll(selectors.join(',')).forEach((el) => {
      el.addEventListener('click', scrollToReservation, { passive: false });
    });
  })();

  // Trailer video: premium minimal player
  const trailerVideo = document.querySelector('#trailer .trailer-video');
  if (trailerVideo) {
    trailerVideo.autoplay = false;
    trailerVideo.loop = false;
    trailerVideo.removeAttribute('autoplay');
    trailerVideo.removeAttribute('loop');
    trailerVideo.preload = 'none';

    const wrapper = trailerVideo.closest('.trailer-video-wrapper');
    const icons = {
      play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5L19 12L7 19.5V4.5Z" fill="currentColor"></path></svg>',
      pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="4.5" width="3.5" height="15" rx="1" fill="currentColor"></rect><rect x="13.5" y="4.5" width="3.5" height="15" rx="1" fill="currentColor"></rect></svg>',
      volume: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4V5z"></path><path d="M19 12a4 4 0 0 0-4-4"></path><path d="M19 12a4 4 0 0 1-4 4"></path></svg>',
      muted: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4V5z"></path><line x1="22" y1="9" x2="16" y2="15"></line><line x1="16" y1="9" x2="22" y2="15"></line></svg>',
      fullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 9 3 3 9 3"></polyline><polyline points="21 9 21 3 15 3"></polyline><polyline points="21 15 21 21 15 21"></polyline><polyline points="3 15 3 21 9 21"></polyline></svg>',
      exitFullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 3 9 9 3 9"></polyline><polyline points="15 3 15 9 21 9"></polyline><polyline points="15 21 15 15 21 15"></polyline><polyline points="9 21 9 15 3 15"></polyline></svg>'
    };

    if (wrapper) {
      trailerVideo.removeAttribute('controls');
      wrapper.classList.add('is-paused');

      const ui = document.createElement('div');
      ui.className = 'video-ui';

      const overlay = document.createElement('button');
      overlay.type = 'button';
      overlay.className = 'video-ui__overlay';
      overlay.setAttribute('aria-label', 'Lire la bande-annonce ALTER');
      overlay.innerHTML = icons.play;

      const controls = document.createElement('div');
      controls.className = 'video-ui__controls';

      const playToggle = document.createElement('button');
      playToggle.type = 'button';
      playToggle.className = 'video-ui__control video-ui__control--play';
      playToggle.setAttribute('aria-label', 'Lecture');
      playToggle.innerHTML = icons.play;

      const progress = document.createElement('div');
      progress.className = 'video-ui__progress';
      progress.setAttribute('role', 'slider');
      progress.setAttribute('aria-label', 'Position dans la video');
      progress.setAttribute('aria-valuemin', '0');
      progress.setAttribute('aria-valuemax', '100');
      progress.setAttribute('aria-valuenow', '0');
      progress.tabIndex = 0;

      const progressTrack = document.createElement('div');
      progressTrack.className = 'video-ui__progress-track';
      const progressFill = document.createElement('div');
      progressFill.className = 'video-ui__progress-fill';
      const progressHandle = document.createElement('div');
      progressHandle.className = 'video-ui__progress-handle';
      progressTrack.append(progressFill, progressHandle);
      progress.appendChild(progressTrack);

      const time = document.createElement('div');
      time.className = 'video-ui__time';
      const currentTimeLabel = document.createElement('span');
      currentTimeLabel.dataset.videoCurrent = 'true';
      currentTimeLabel.textContent = '0:00';
      const separator = document.createElement('span');
      separator.className = 'video-ui__separator';
      separator.textContent = '/';
      const durationLabel = document.createElement('span');
      durationLabel.dataset.videoDuration = 'true';
      durationLabel.textContent = '--:--';
      time.append(currentTimeLabel, separator, durationLabel);

      const muteBtn = document.createElement('button');
      muteBtn.type = 'button';
      muteBtn.className = 'video-ui__control video-ui__control--mute';
      muteBtn.setAttribute('aria-label', 'Activer le son');
      muteBtn.innerHTML = icons.muted;

      const fullscreenBtn = document.createElement('button');
      fullscreenBtn.type = 'button';
      fullscreenBtn.className = 'video-ui__control video-ui__control--fullscreen';
      fullscreenBtn.setAttribute('aria-label', 'Plein ecran');
      fullscreenBtn.innerHTML = icons.fullscreen;

      controls.append(playToggle, progress, time, muteBtn, fullscreenBtn);
      ui.append(overlay, controls);
      wrapper.appendChild(ui);

      const formatTime = (value) => {
        if (!Number.isFinite(value)) return '--:--';
        const totalSeconds = Math.max(0, Math.floor(value));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
      };

      let hideChromeTimer = null;
      const showControls = () => {
        wrapper.classList.remove('hide-chrome');
        if (hideChromeTimer) {
          clearTimeout(hideChromeTimer);
          hideChromeTimer = null;
        }
      };

      const scheduleHide = () => {
        if (trailerVideo.paused || trailerVideo.ended) return;
        if (hideChromeTimer) clearTimeout(hideChromeTimer);
        hideChromeTimer = setTimeout(() => {
          wrapper.classList.add('hide-chrome');
        }, 2200);
      };

      const updatePlayState = () => {
        const playing = !trailerVideo.paused && !trailerVideo.ended;
        wrapper.classList.toggle('is-playing', playing);
        wrapper.classList.toggle('is-paused', !playing);
        playToggle.innerHTML = playing ? icons.pause : icons.play;
        playToggle.setAttribute('aria-label', playing ? 'Pause' : 'Lecture');
        overlay.setAttribute('aria-label', playing ? 'Mettre la video en pause' : 'Lire la bande-annonce ALTER');
        overlay.setAttribute('aria-hidden', playing ? 'true' : 'false');
        overlay.tabIndex = playing ? -1 : 0;
        if (!playing) {
          overlay.innerHTML = icons.play;
          showControls();
        } else {
          scheduleHide();
        }
      };

      const updateProgress = () => {
        if (!Number.isFinite(trailerVideo.duration) || trailerVideo.duration <= 0) {
          progressFill.style.width = '0%';
          progressHandle.style.left = '0%';
          progress.setAttribute('aria-valuenow', '0');
          progress.setAttribute('aria-valuetext', '0:00');
          return;
        }
        const pct = Math.min(Math.max((trailerVideo.currentTime / trailerVideo.duration) * 100, 0), 100);
        progressFill.style.width = `${pct}%`;
        progressHandle.style.left = `${pct}%`;
        progress.setAttribute('aria-valuenow', pct.toFixed(2));
        progress.setAttribute('aria-valuetext', formatTime(trailerVideo.currentTime));
      };

      const updateTimeLabels = () => {
        currentTimeLabel.textContent = formatTime(trailerVideo.currentTime);
        durationLabel.textContent = formatTime(trailerVideo.duration);
      };

      const updateMuteState = () => {
        const muted = trailerVideo.muted || trailerVideo.volume === 0;
        muteBtn.innerHTML = muted ? icons.muted : icons.volume;
        muteBtn.setAttribute('aria-label', muted ? 'Activer le son' : 'Couper le son');
      };

      const updateFullscreenState = () => {
        const fsElement = document.fullscreenElement
          || document.webkitFullscreenElement
          || document.mozFullScreenElement
          || document.msFullscreenElement;
        const isFullscreen = fsElement === wrapper || fsElement === trailerVideo;
        fullscreenBtn.innerHTML = isFullscreen ? icons.exitFullscreen : icons.fullscreen;
        fullscreenBtn.setAttribute('aria-label', isFullscreen ? 'Quitter le plein ecran' : 'Plein ecran');
      };

      const togglePlay = () => {
        if (trailerVideo.paused || trailerVideo.ended) {
          trailerVideo.play().catch(() => {});
        } else {
          trailerVideo.pause();
        }
      };

      const toggleMute = () => {
        const muted = trailerVideo.muted || trailerVideo.volume === 0;
        if (muted) {
          trailerVideo.muted = false;
          if (trailerVideo.volume === 0) {
            trailerVideo.volume = 0.8;
          }
        } else {
          trailerVideo.muted = true;
        }
      };

      const toggleFullscreen = () => {
        const doc = document;
        const fsElement = doc.fullscreenElement
          || doc.webkitFullscreenElement
          || doc.mozFullScreenElement
          || doc.msFullscreenElement;
        if (fsElement === wrapper || fsElement === trailerVideo) {
          if (doc.exitFullscreen) doc.exitFullscreen();
          else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
          else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
          else if (doc.msExitFullscreen) doc.msExitFullscreen();
        } else {
          if (wrapper.requestFullscreen) wrapper.requestFullscreen();
          else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
          else if (wrapper.mozRequestFullScreen) wrapper.mozRequestFullScreen();
          else if (wrapper.msRequestFullscreen) wrapper.msRequestFullscreen();
          else if (trailerVideo.requestFullscreen) trailerVideo.requestFullscreen();
        }
      };

      let isSeeking = false;
      let wasPlayingBeforeSeek = false;
      let activePointerId = null;
      const seekToRatio = (ratio) => {
        if (!Number.isFinite(trailerVideo.duration) || trailerVideo.duration <= 0) return;
        const clampedRatio = Math.min(Math.max(ratio, 0), 1);
        trailerVideo.currentTime = clampedRatio * trailerVideo.duration;
      };

      const pointerSeek = (clientX) => {
        const rect = progress.getBoundingClientRect();
        if (!rect.width) return;
        const ratio = (clientX - rect.left) / rect.width;
        seekToRatio(ratio);
      };

      progress.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        activePointerId = event.pointerId;
        if (progress.setPointerCapture) {
          try { progress.setPointerCapture(event.pointerId); } catch (err) {}
        }
        isSeeking = true;
        wasPlayingBeforeSeek = !trailerVideo.paused && !trailerVideo.ended;
        wrapper.classList.add('is-seeking');
        showControls();
        pointerSeek(event.clientX);
        if (wasPlayingBeforeSeek) {
          trailerVideo.pause();
        }
      });

      progress.addEventListener('pointermove', (event) => {
        if (!isSeeking || event.pointerId !== activePointerId) return;
        pointerSeek(event.clientX);
      });

      const endSeek = (event) => {
        if (!isSeeking) return;
        if (typeof event.pointerId === 'number' && event.pointerId !== activePointerId) return;
        if (typeof event.pointerId === 'number' && progress.releasePointerCapture) {
          try { progress.releasePointerCapture(event.pointerId); } catch (err) {}
        }
        isSeeking = false;
        activePointerId = null;
        wrapper.classList.remove('is-seeking');
        if (wasPlayingBeforeSeek) {
          trailerVideo.play().catch(() => {});
        }
        scheduleHide();
      };

      progress.addEventListener('pointerup', endSeek);
      progress.addEventListener('pointercancel', endSeek);

      progress.addEventListener('pointerleave', (event) => {
        if (!isSeeking || event.pointerId !== activePointerId) return;
        pointerSeek(event.clientX);
      });

      progress.addEventListener('keydown', (event) => {
        if (!Number.isFinite(trailerVideo.duration) || trailerVideo.duration <= 0) return;
        let handled = false;
        if (event.key === 'ArrowLeft') {
          trailerVideo.currentTime = Math.max(0, trailerVideo.currentTime - 5);
          handled = true;
        } else if (event.key === 'ArrowRight') {
          trailerVideo.currentTime = Math.min(trailerVideo.duration, trailerVideo.currentTime + 5);
          handled = true;
        } else if (event.key === 'Home') {
          trailerVideo.currentTime = 0;
          handled = true;
        } else if (event.key === 'End') {
          trailerVideo.currentTime = trailerVideo.duration;
          handled = true;
        }
        if (handled) {
          event.preventDefault();
          showControls();
          scheduleHide();
        }
      });

      overlay.addEventListener('click', togglePlay);
      playToggle.addEventListener('click', togglePlay);
      trailerVideo.addEventListener('click', (event) => {
        if (isSeeking) return;
        if (event.target !== trailerVideo) return;
        togglePlay();
      });
      trailerVideo.addEventListener('dblclick', (event) => {
        event.preventDefault();
        toggleFullscreen();
      });
      muteBtn.addEventListener('click', toggleMute);
      fullscreenBtn.addEventListener('click', toggleFullscreen);

      trailerVideo.addEventListener('play', () => {
        updatePlayState();
        scheduleHide();
      });
      trailerVideo.addEventListener('pause', () => {
        updatePlayState();
        showControls();
      });
      trailerVideo.addEventListener('ended', () => {
        updateProgress();
        updateTimeLabels();
        updatePlayState();
        showControls();
      });
      trailerVideo.addEventListener('timeupdate', () => {
        updateProgress();
        updateTimeLabels();
      });
      trailerVideo.addEventListener('loadedmetadata', () => {
        updateTimeLabels();
        updateProgress();
      });
      trailerVideo.addEventListener('durationchange', () => {
        updateTimeLabels();
        updateProgress();
      });
      trailerVideo.addEventListener('volumechange', updateMuteState);
      trailerVideo.addEventListener('seeking', () => {
        showControls();
        updateProgress();
      });
      trailerVideo.addEventListener('seeked', () => {
        updateProgress();
        if (!trailerVideo.paused) scheduleHide();
      });

      const showChromeOnInteraction = () => {
        showControls();
        scheduleHide();
      };
      ['pointermove', 'mousemove', 'mouseenter', 'touchstart'].forEach((eventName) => {
        wrapper.addEventListener(eventName, showChromeOnInteraction, { passive: true });
      });
      wrapper.addEventListener('mouseleave', scheduleHide);
      wrapper.addEventListener('focusin', showControls);
      wrapper.addEventListener('focusout', scheduleHide);

      ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach((eventName) => {
        document.addEventListener(eventName, updateFullscreenState);
      });

      updateMuteState();
      updateProgress();
      updateTimeLabels();
      updateFullscreenState();
      showControls();
    }
  }

  // --- Fullscreen fixes: force portrait videos to contain on desktop fullscreen ---
  // Some browsers/cases ignore CSS fullscreen pseudo-classes or the video
  // is moved into a native fullscreen player; we therefore apply inline
  // styles on fullscreenchange to ensure the 9:16 video stays portrait
  // and is centered (pillarboxing) instead of being stretched/cropped.
  (function () {
    const video = trailerVideo;
    const wrapper = document.querySelector('.trailer-video-wrapper');

    if (!video) return;

    function applyFsStyles(enable) {
      if (enable) {
        // Only apply when the source looks portrait (height > width)
        const isPortrait = (video.videoWidth && video.videoHeight)
          ? video.videoHeight > video.videoWidth
          : true;
        if (!isPortrait) return;

        // Force a contained, centered layout so the whole portrait frame is visible
        video.style.objectFit = 'contain';
        video.style.width = 'auto';
        video.style.height = '100vh';
        video.style.maxHeight = '100vh';
        video.style.background = '#000';

        if (wrapper) {
          wrapper.style.display = 'flex';
          wrapper.style.alignItems = 'center';
          wrapper.style.justifyContent = 'center';
          wrapper.style.background = '#000';
        }
      } else {
        // restore
        video.style.objectFit = '';
        video.style.width = '';
        video.style.height = '';
        video.style.maxHeight = '';
        video.style.background = '';
        if (wrapper) {
          wrapper.style.display = '';
          wrapper.style.alignItems = '';
          wrapper.style.justifyContent = '';
          wrapper.style.background = '';
        }
      }
    }

    function onFsChange() {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      const isFs = fsEl === video || fsEl === wrapper;
      applyFsStyles(!!isFs);
    }

    // Listen for standard and vendor fullscreen change events
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('mozfullscreenchange', onFsChange);
    document.addEventListener('MSFullscreenChange', onFsChange);

    // iOS Safari fires webkitbeginfullscreen/webkitendfullscreen on the video element
    video.addEventListener('webkitbeginfullscreen', () => applyFsStyles(true));
    video.addEventListener('webkitendfullscreen', () => applyFsStyles(false));

    // Also ensure styles apply when metadata becomes available (videoWidth/videoHeight)
    video.addEventListener('loadedmetadata', onFsChange);
  })();

  const hero = document.querySelector('.hero');
  const heroContent = hero ? hero.querySelector('.container') : null;

  if (hero && heroContent) {
    let heroRaf = null;
    let scrollListenerAttached = false;

    const updateHero = () => {
      const scrolled = window.pageYOffset;
      heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
      heroContent.style.opacity = Math.max(1 - scrolled * 0.002, 0);
      heroRaf = null;
    };

    const handleHeroScroll = () => {
      if (!heroRaf) {
        heroRaf = requestAnimationFrame(updateHero);
      }
    };

    const applyHeroParallax = () => {
      // Disable parallax on devices that prefer reduced motion or on touch devices
      // because parallax transforms can trigger rendering/compositing bugs on mobile.
      if (reduceMotionQuery.matches || !pointerFineQuery.matches) {
        if (scrollListenerAttached) {
          window.removeEventListener('scroll', handleHeroScroll);
          scrollListenerAttached = false;
        }
        if (heroRaf) {
          cancelAnimationFrame(heroRaf);
          heroRaf = null;
        }
        heroContent.style.transform = 'none';
        heroContent.style.opacity = '1';
        return;
      }

      if (!scrollListenerAttached) {
        window.addEventListener('scroll', handleHeroScroll, { passive: true });
        scrollListenerAttached = true;
        handleHeroScroll();
      }
    };

    applyHeroParallax();
    addMediaListener(reduceMotionQuery, applyHeroParallax);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      body.classList.add('keyboard-nav');
    }
  });

  document.addEventListener('mousedown', () => {
    body.classList.remove('keyboard-nav');
  });

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
})();
