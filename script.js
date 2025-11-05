import { Application } from 'https://unpkg.com/@splinetool/runtime@1.9.28/build/runtime.js';

// --- SW killer temporaire (retirer dans 2-3 semaines) ---
try {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations?.().then(regs => {
      regs?.forEach(reg => reg.unregister());
    });
  }
  if ('caches' in window) {
    caches.keys?.().then(keys => keys.forEach(k => caches.delete(k)));
  }
} catch (e) {
  // no-op
}

// Détection de la performance
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 100) {
      console.warn('Opération lente détectée:', entry.name, entry.duration);
      
      // Réduire la qualité des animations si nécessaire
      if (entry.duration > 200) {
        document.body.classList.add('reduce-motion');
      }
    }
  }
});

performanceObserver.observe({ entryTypes: ['measure'] });

// Lazy loading intelligent pour les animations
const animationObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
      animationObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '50px'
});

// Appliquer aux éléments lourds
document.querySelectorAll('.service-box, .project-box').forEach(el => {
  animationObserver.observe(el);
});

// === FORCE SCROLL TO TOP ON REFRESH ===
// This runs immediately, before DOM content is loaded
if ('scrollRestoration' in history) {
  // Disable browser's scroll restoration
  history.scrollRestoration = 'manual';
}

// Force scroll to top
window.scrollTo(0, 0);

// Additional check on load
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

// === VARIABLES GLOBALES ===
const body = document.body;
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const isMobile = window.innerWidth <= 768 || isTouch;
const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024; // ADDED: General tablet detection
const isTabletLandscape = isTablet && window.matchMedia("(orientation: landscape)").matches; // MODIFIED
const isTabletPortrait = isTablet && window.matchMedia("(orientation: portrait)").matches; // MODIFIED
let lastScrollTop = 0;
let lenis;
let webglBackgroundActive = false;
let webglHeroActive = false;

// === INITIALISATION PRINCIPALE ===
document.addEventListener('DOMContentLoaded', function() {
  // Force scroll to top again after DOM is ready
  window.scrollTo(0, 0);
  
  initPreloader();
  setupVisuals();
  
  // ADDED: Optimisations spécifiques tablette paysage
  if (isTabletLandscape) {
    optimizeForTabletLandscape();
  }
  
  // AJOUTÉ: Préchargement des images critiques
  if (isMobile) {
    const criticalImages = document.querySelectorAll('.hero-logo, .project-img:first-child');
    criticalImages.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
    initMobileCtaPlacement();
  }
  
  if (!isTouch) {
    initCustomCursor();
    initMagicTextEffect();
    initHeroCtaInteractions();
  }
});

window.addEventListener('load', function() {
  // Final scroll to top after everything is loaded
  setTimeout(() => {
    window.scrollTo(0, 0);
    
    // If Lenis is initialized, use it to scroll to top
    if (lenis) {
      lenis.scroll = 0;
    }
  }, 0);
  
  // ADDED: Timeout de sécurité pour forcer la disparition du préloader
  const maxPreloaderTime = 3000; // 3 secondes maximum
  const preloaderTimeout = setTimeout(() => {
    const preloader = document.querySelector('.preloader');
    if (preloader && !preloader.classList.contains('hidden')) {
      console.warn('Préloader forcé à disparaître après timeout');
      preloader.classList.add('hidden');
    }
  }, maxPreloaderTime);
  
  // MODIFIÉ: Initialisation progressive sur mobile
  if (isMobile) {
    // ADDED: Try-catch pour éviter que les erreurs bloquent le préloader
    try {
      // Phase 1: Essentiels
      setTimeout(() => {
        try {
          initLenisScroll();
          initHero3DAnimation();
          initBackToTop();
        } catch (error) {
          console.error("Erreur Phase 1:", error);
        }
      }, 100);
      
      // Phase 2: Interactions
      setTimeout(() => {
        try {
          initServicesInteractions();
          initFormInteractions();
          initContactForm();
        } catch (error) {
          console.error("Erreur Phase 2:", error);
        }
      }, 300);
      
      // Phase 3: Animations et masquer le préloader
      setTimeout(() => {
        try {
          if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            initScrollAnimations();
            initClientLogoInteractions();
          }
        } catch (error) {
          console.error("Erreur animations:", error);
        } finally {
          // ADDED: Toujours masquer le préloader même en cas d'erreur
          const preloader = document.querySelector('.preloader');
          if (preloader) {
            preloader.classList.add('hidden');
            clearTimeout(preloaderTimeout); // Clear le timeout de sécurité
          }
          
          // Refresh final
          if (typeof ScrollTrigger !== 'undefined') {
            try {
              ScrollTrigger.refresh();
            } catch (error) {
              console.error("Erreur ScrollTrigger refresh:", error);
            }
          }
        }
      }, 400);
    } catch (error) {
      console.error("Erreur critique mobile:", error);
      // ADDED: En cas d'erreur critique, masquer immédiatement le préloader
      const preloader = document.querySelector('.preloader');
      if (preloader) {
        preloader.classList.add('hidden');
        clearTimeout(preloaderTimeout);
      }
    }
  } else {
    // Code existant pour desktop
    setTimeout(() => {
      try {
        initLenisScroll();
        
        if (isWebGLSupported()) {
          initWebGLBackground();
        }
        
        initHero3DAnimation();
        initServicesInteractions();
        initFormInteractions();
        initContactForm();
        initBackToTop();
        initCanvasInteractions();
        
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
          initScrollAnimations();
          initClientLogoInteractions();
        }
        
        // MODIFIED: Hide preloader immediately after initialization
        document.querySelector('.preloader').classList.add('hidden');
        clearTimeout(preloaderTimeout); // ADDED: Clear le timeout de sécurité
        
        // Refresh ScrollTrigger after preloader is hidden
        setTimeout(() => {
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
          }
        }, 100);
        
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        document.querySelector('.preloader').classList.add('hidden');
        clearTimeout(preloaderTimeout); // ADDED: Clear le timeout de sécurité
      }
    }, 100);
  }
});

// Vérifier si WebGL est supporté
function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

// === LENIS SCROLL ===
function initLenisScroll() {
  // MODIFIÉ: Paramètres optimisés pour mobile
  lenis = new Lenis({
    lerp: isMobile ? 0.2 : 0.095,
    wheelMultiplier: isMobile ? 1 : 0.9,
    touchMultiplier: 1.2,
    smoothWheel: !isMobile, // MODIFIED: true for desktop, false for mobile
    smoothTouch: false, // This is generally false or handled differently for touch
    syncTouch: true,
    // AJOUTÉ: Nouveaux paramètres d'optimisation
    infinite: false,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
  });

  // MODIFIÉ: Utiliser requestAnimationFrame au lieu de gsap.ticker sur mobile
  if (isMobile) {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  } else {
    // Ensure GSAP and its ticker are available before using it
    if (typeof gsap !== 'undefined' && gsap.ticker) {
        gsap.ticker.add((time) => {
          if (lenis) { // Check if lenis instance exists
            lenis.raf(time * 1000);
          }
        });
        gsap.ticker.lagSmoothing(0);
    } else {
        console.error("GSAP ticker is not available for desktop. Lenis will use requestAnimationFrame.");
        // Fallback to requestAnimationFrame if GSAP ticker is not available
        function raf(time) {
            if (lenis) { // Check if lenis instance exists
                lenis.raf(time);
            }
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }
  }

  initNavigation();

  window.addEventListener('resize', () => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  });
}

// === PRÉCHARGEUR ===
function initPreloader() {
  // Vérifier si la bibliothèque Lottie est disponible
  if (typeof lottie === 'undefined') {
    console.error("Lottie library not loaded. Falling back to default loader.");
    return;
  }
  
  // Initialiser l'animation Lottie
  const lottieContainer = document.getElementById('lottie-loader-container');
  let lottieAnimation;
  
  if (lottieContainer) {
    lottieAnimation = lottie.loadAnimation({
      container: lottieContainer,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/assets/spiner.lottie'
    });
  } else {
    console.error("Lottie container not found");
    return;
  }
  
  let currentProgress = 0;
  let targetProgress = 0;
  let loadedResources = 0;
  let totalCount = 0;
  
  // Collecter seulement les ressources qui peuvent vraiment être trackées
  const images = Array.from(document.images).filter(img => !img.complete);
  const videos = Array.from(document.querySelectorAll('video')).filter(video => video.readyState < 3);
  
  // Compter seulement les ressources qui ont besoin d'être chargées
  totalCount = images.length + videos.length;
  
  // Si toutes les ressources sont déjà chargées, aller directement à 100%
  if (totalCount === 0) {
    setTimeout(() => {
      const preloader = document.querySelector('.preloader');
      if (preloader) {
        // Arrêter l'animation avant de masquer le préloader
        if (lottieAnimation) {
          lottieAnimation.stop();
        }
        preloader.classList.add('hidden');
      }
    }, 1200); // Délai légèrement plus long pour voir l'animation
    return;
  }
  
  // Progression minimale garantie
  let minimumProgress = 10; // Start at 10%
  targetProgress = minimumProgress;
  
  const minimumProgressInterval = setInterval(() => {
    // Augmenter la progression minimale progressivement
    if (minimumProgress < 90) {
      minimumProgress += 5;
      if (targetProgress < minimumProgress) {
        targetProgress = minimumProgress;
      }
    } else {
      // Force to 100% after reaching 90%
      clearInterval(minimumProgressInterval);
      targetProgress = 100;
    }
  }, 100);
  
  // Écouter le chargement des ressources
  function resourceLoaded() {
    loadedResources++;
    const realProgress = Math.min((loadedResources / totalCount) * 100, 100);
    
    // Toujours prendre le plus grand entre la progression réelle et minimale
    targetProgress = Math.max(realProgress, minimumProgress);
    
    // Force 100% when all resources are loaded
    if (loadedResources >= totalCount) {
      clearInterval(minimumProgressInterval);
      targetProgress = 100;
      
      // Cacher le préloader une fois que tout est chargé
      setTimeout(() => {
        const preloader = document.querySelector('.preloader');
        if (preloader && !preloader.classList.contains('hidden')) {
          // Arrêter l'animation avant de masquer le préloader
          if (lottieAnimation) {
            lottieAnimation.stop();
          }
          preloader.classList.add('hidden');
        }
      }, 300);
    }
  }
  
  // Attacher les listeners pour les images
  images.forEach(img => {
    img.addEventListener('load', resourceLoaded);
    img.addEventListener('error', resourceLoaded);
  });
  
  // Attacher les listeners pour les vidéos
  videos.forEach(video => {
    video.addEventListener('loadeddata', resourceLoaded);
    video.addEventListener('error', resourceLoaded);
  });
  
  // Timeout de sécurité pour garantir 100%
  setTimeout(() => {
    clearInterval(minimumProgressInterval);
    targetProgress = 100;
    
    // Cacher le préloader après le timeout de sécurité
    setTimeout(() => {
      const preloader = document.querySelector('.preloader');
      if (preloader && !preloader.classList.contains('hidden')) {
        // Arrêter l'animation avant de masquer le préloader
        if (lottieAnimation) {
          lottieAnimation.stop();
        }
        preloader.classList.add('hidden');
      }
    }, 300);
  }, 2500);
  
  // Force check after window load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const preloader = document.querySelector('.preloader');
      if (preloader && !preloader.classList.contains('hidden')) {
        // Arrêter l'animation avant de masquer le préloader
        if (lottieAnimation) {
          lottieAnimation.stop();
        }
        preloader.classList.add('hidden');
      }
    }, 100);
  });
}

// === NAVIGATION ===
function initNavigation() {
  const navLinks = document.querySelectorAll('.mobile-nav-link');
  const burgerButton = document.querySelector('.burger-menu-button');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
  const closeMenuButton = document.querySelector('.close-menu-button');
  const mainNav = document.querySelector('.main-navigation');
  
  // Vérifier que le bouton de fermeture existe et contient les spans
  if (closeMenuButton) {
    console.log('Close button found:', closeMenuButton);
    const spans = closeMenuButton.querySelectorAll('span');
    console.log('Spans found:', spans.length);
    
    // Si les spans n'existent pas, les créer
    if (spans.length !== 2) {
      closeMenuButton.innerHTML = '<span></span><span></span>';
      console.log('Spans created');
    }
  }

  // Gestion du menu burger
  if (burgerButton && mobileMenu && mobileMenuOverlay) {
    const openMenu = () => {
      burgerButton.classList.add('active');
      mobileMenu.classList.add('active');
      mobileMenuOverlay.classList.add('active');
      document.body.classList.add('no-scroll');
      burgerButton.setAttribute('aria-expanded', 'true');
      if (mainNav) {
        mainNav.classList.add('menu-open');
      }
      
      // ADDED: Désactiver Lenis quand le menu est ouvert
      if (lenis) {
        lenis.stop();
      }
    };

    const closeMenu = () => {
      burgerButton.classList.remove('active');
      mobileMenu.classList.remove('active');
      mobileMenuOverlay.classList.remove('active');
      document.body.classList.remove('no-scroll');
      burgerButton.setAttribute('aria-expanded', 'false');
      if (mainNav) {
        mainNav.classList.remove('menu-open');
      }
      
      // ADDED: Réactiver Lenis quand le menu est fermé
      if (lenis) {
        lenis.start();
      }
    };

    // Ouvrir le menu
    burgerButton.addEventListener('click', () => {
      const isActive = burgerButton.classList.contains('active');
      if (isActive) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Fermer avec le bouton X
    if (closeMenuButton) {
      closeMenuButton.addEventListener('click', closeMenu);
    }

    // Fermer en cliquant sur l'overlay
    mobileMenuOverlay.addEventListener('click', closeMenu);

    // Fermer avec la touche Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        closeMenu();
      }
    });
  }
  
  // MODIFIED: Gestion des liens de navigation (mobile ET desktop)
  // Sélectionner TOUS les liens avec href="#section"
  const allNavLinks = document.querySelectorAll('a[href^="#"]');
  
  allNavLinks.forEach(link => {
    // Remove number spans if they exist
    const numberSpan = link.querySelector('.link-number');
    if (numberSpan) {
      numberSpan.remove();
    }
    
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      
      // Ignorer si c'est juste "#" ou vide
      if (!targetId || targetId === '#') return;
      
      e.preventDefault();
      
      let wasMobileMenuActive = false;
      
      // Fermer le menu mobile s'il est ouvert
      if (mobileMenu && mobileMenu.classList.contains('active')) {
        wasMobileMenuActive = true;
        burgerButton.classList.remove('active');
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
        burgerButton.setAttribute('aria-expanded', 'false');
        if (mainNav) {
          mainNav.classList.remove('menu-open');
        }
        
        // Réactiver Lenis
        if (lenis) {
          lenis.start();
        }
      }
      
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        // Mettre à jour les classes actives
        allNavLinks.forEach(navLink => {
          if (navLink.getAttribute('href') === targetId) {
            navLink.classList.add('active');
          } else {
            navLink.classList.remove('active');
          }
        });
        
        const scrollDelay = wasMobileMenuActive ? 300 : 0;
        
        setTimeout(() => {
          if (lenis) {
            lenis.scrollTo(targetId, {
              offset: -80,
              duration: 1.5,
              easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            });
          } else {
            // Fallback si Lenis n'est pas disponible
            const offsetTop = targetElement.offsetTop - 80;
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });
          }
        }, scrollDelay);
      } else {
        console.error(`Section non trouvée: ${targetId}`);
      }
    });
  });

  // MODIFIED: Fonction pour mettre à jour les liens actifs lors du scroll
  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = lenis ? lenis.scroll : window.scrollY;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      // Mettre à jour TOUS les liens avec le même href
      const activeLinks = document.querySelectorAll(`a[href="#${sectionId}"]`);

      activeLinks.forEach(navLink => {
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          navLink.classList.add('active');
        } else {
          navLink.classList.remove('active');
        }
      });
    });
  }
  
  // Écouter le scroll
  if (lenis) {
    lenis.on('scroll', updateActiveNav);
  } else {
    window.addEventListener('scroll', updateActiveNav, { passive: true });
  }
  
  // Appel initial pour configurer l'état correct au chargement
  setTimeout(updateActiveNav, 100);
}

// === TOGGLE THÈME ===
function initThemeToggle() {
  const themeToggle = document.querySelector('.theme-toggle');
  if (!themeToggle) return;
  
  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.classList.remove('theme-dark', 'theme-light');
    body.classList.add(`theme-${currentTheme}`);
    localStorage.setItem('theme', currentTheme);
    
    // REMOVED: setTimeout(() => { forceScrollUpdate(); }, 300);
    // La fonction forceScrollUpdate() n'existe plus, remplacée par un appel direct
    setTimeout(() => {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }, 300);
  });
}

// === CURSEUR PERSONNALISÉ ===
function initCustomCursor() {
  const cursor = document.querySelector('.custom-cursor');
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorCircle = document.querySelector('.cursor-circle');
  
  if (!cursor || !cursorDot || !cursorCircle) return;
  
  // Ne pas rendre le curseur visible immédiatement
  // cursor.style.opacity = 1; // REMOVED
  
  // Variables pour le mouvement fluide
  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;
  let hasMouseMoved = false; // ADDED: Track if mouse has moved
  
  // Fonction pour animer le curseur de manière fluide
  function animateCursor() {
    const speed = 0.15;
    
    cursorX += (mouseX - cursorX) * speed;
    cursorY += (mouseY - cursorY) * speed;
    
    gsap.set(cursorDot, {
      x: cursorX,
      y: cursorY,
      xPercent: -50,
      yPercent: -50
    });
    
    requestAnimationFrame(animateCursor);
  }
  
  // Démarrer l'animation fluide
  animateCursor();
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // ADDED: Show cursor on first mouse move
    if (!hasMouseMoved) {
      hasMouseMoved = true;
      cursor.style.opacity = 1;
      
      // Initialize cursor position to current mouse position
      cursorX = mouseX;
      cursorY = mouseY;
      
      gsap.set(cursorDot, {
        x: cursorX,
        y: cursorY,
        xPercent: -50,
        yPercent: -50
      });
    }
  });
  
  // ADDED: Also handle mouse enter to show cursor
  document.addEventListener('mouseenter', (e) => {
    if (!hasMouseMoved && e.clientX && e.clientY) {
      hasMouseMoved = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorX = mouseX;
      cursorY = mouseY;
      
      cursor.style.opacity = 1;
      
      gsap.set(cursorDot, {
        x: cursorX,
        y: cursorY,
        xPercent: -50,
        yPercent: -50
      });
    }
  });
  

  
  // Effets interactifs pour les titres h1, h2, h3 (modifié pour le nouvel effet)
  const titleElements = document.querySelectorAll('h1, h2, h3');
  titleElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      // cursorDot.classList.add('text-hover'); // REMOVED: text-hover related to color change
      cursorDot.classList.remove('interactive-hover', 'clicking');
    });
    
    element.addEventListener('mouseleave', () => {
    });
  });
  
  // MODIFIED: Séparer les service/project boxes des autres éléments interactifs
  const serviceProjectBoxes = document.querySelectorAll('.service-box, .project-box');
  const otherInteractiveElements = document.querySelectorAll('a, button, input, textarea, .nav-link, .submit-button');
  const nonClickableHoverElements = document.querySelectorAll('.hover-effect.non-clickable'); // ADDED: Selector for non-clickable hover elements

  // Pour les service boxes et project boxes - classe spéciale
  serviceProjectBoxes.forEach(element => {
    element.addEventListener('mouseenter', () => {
      cursorDot.classList.add('service-project-hover');
      cursorDot.classList.remove('interactive-hover', 'clicking', 'text-hover');
    });
    
    element.addEventListener('mouseleave', () => {
      cursorDot.classList.remove('service-project-hover');
    });
  });
  
  // Pour les autres éléments interactifs
  otherInteractiveElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      if (!cursorDot.classList.contains('text-hover') && !cursorDot.classList.contains('service-project-hover')) {
        cursorDot.classList.add('interactive-hover');
        cursorDot.classList.remove('clicking');
      }
    });
    
    element.addEventListener('mouseleave', () => {
      cursorDot.classList.remove('interactive-hover', 'clicking');
    });
  });

  // ADDED: For non-clickable hover elements to apply service-project-hover cursor style
  nonClickableHoverElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      cursorDot.classList.add('service-project-hover');
      cursorDot.classList.remove('interactive-hover', 'clicking', 'text-hover');
    });

    element.addEventListener('mouseleave', () => {
      cursorDot.classList.remove('service-project-hover');
    });
  });
  
  // Effet de clic global
  document.addEventListener('mousedown', () => {
    cursorDot.classList.add('clicking');
    cursorDot.classList.remove('text-hover', 'interactive-hover');
    
    // Petite vibration lors du clic
    gsap.to(cursorDot, {
      scale: 0.8,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });
  });
  
  document.addEventListener('mouseup', () => {
    setTimeout(() => {
      cursorDot.classList.remove('clicking');
    }, 100);
  });
  
  // Effet de sortie/entrée de la fenêtre
  document.addEventListener('mouseleave', () => {
    gsap.to(cursorDot, {
      scale: 0,
      duration: 0.3,
      ease: 'power2.out'
    });
  });
  
  document.addEventListener('mouseenter', () => {
    gsap.to(cursorDot, {
      scale: 1,
      duration: 0.3,
      ease: 'back.out(1.7)'
    });
  });
  
  // Effet magnétique pour les boutons importants - MODIFIÉ
  const magneticElements = document.querySelectorAll('.theme-toggle');
  // Modifié: retiré '.back-button' du sélecteur pour empêcher le mouvement magnétique

  magneticElements.forEach(element => {
    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) * 0.3;
      const deltaY = (e.clientY - centerY) * 0.3;
      
      gsap.to(element, {
        x: deltaX,
        y: deltaY,
        duration: 0.3,
        ease: 'power2.out'
      });
      
      // Effet magnétique sur le curseur aussi
      gsap.to(cursorDot, {
        scale: 1.5,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
    
    element.addEventListener('mouseleave', () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)'
      });
      
      gsap.to(cursorDot, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
  });
}

function initHeroCtaInteractions() {
  const cta = document.querySelector('.hero-cta .btn.btn-primary');
  if (!cta) return;
  const factor = 0.04;
  cta.addEventListener('mousemove', (e) => {
    const rect = cta.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    cta.style.setProperty('--mx', mx + '%');
    cta.style.setProperty('--my', my + '%');
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const max = 6;
    const tx = Math.max(-max, Math.min(max, dx * factor));
    const ty = Math.max(-max, Math.min(max, dy * factor));
    cta.style.setProperty('--tx', tx + 'px');
    cta.style.setProperty('--ty', ty + 'px');
  });
  cta.addEventListener('mouseleave', () => {
    cta.style.setProperty('--mx', '50%');
    cta.style.setProperty('--my', '50%');
    cta.style.setProperty('--tx', '0px');
    cta.style.setProperty('--ty', '0px');
  });
}

function initMobileCtaPlacement() {
  try {
    const videoContainer = document.querySelector('.webgl-animation-container');
    const ctaGroup = document.querySelector('.hero-cta');
    if (videoContainer && ctaGroup && !videoContainer.contains(ctaGroup)) {
      videoContainer.appendChild(ctaGroup);
    }
  } catch (_) {}
}

// === ANIMATIONS SCROLL AVEC GSAP ===
function initScrollAnimations() {
  if (!lenis) return;

  // MODIFIÉ: Désactiver certaines animations sur mobile
  const animateHero = !isMobile;
  
  // Vérifier que les éléments existent avant d'animer
  if (animateHero) {
    const heroLogo = document.querySelector('.hero-logo');
    if (heroLogo) {
      gsap.from(heroLogo, {
        scrollTrigger: {
          trigger: '.hero',
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play reverse play reverse'
        },
        y: 30,
        autoAlpha: 0,
        duration: 0.8,
        ease: 'power2.out'
      });
    }

    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
      gsap.from(heroSubtitle, {
        scrollTrigger: {
          trigger: '.hero',
          start: 'top 75%',
          end: 'bottom 25%',
          toggleActions: 'play reverse play reverse'
        },
        y: 30,
        autoAlpha: 0,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.1
      });
    }

    const heroMainSpans = document.querySelectorAll('.hero-title .hero-main');
    if (heroMainSpans.length > 0) {
      gsap.from(heroMainSpans, {
        scrollTrigger: {
          trigger: '.hero',
          start: 'top 70%',
          end: 'bottom 30%',
          toggleActions: 'play reverse play reverse'
        },
        y: 30,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out',
        delay: 0.2
      });
    }

    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual) {
      gsap.from(heroVisual, {
        scrollTrigger: {
          trigger: '.hero',
          start: 'top 65%',
          end: 'bottom 35%',
          toggleActions: 'play reverse play reverse'
        },
        y: 40,
        autoAlpha: 0,
        duration: 1,
        ease: 'power2.out',
        delay: 0.3
      });
    }
  }

  // MODIFIÉ: Animations simplifiées pour les sections
  const sections = ['.about', '.services', '.projects', '.trusted-by', '.contact'];
  
  sections.forEach(section => {
    const sectionTitle = document.querySelector(`${section} .section-title`);
    if (sectionTitle) {
      gsap.fromTo(sectionTitle, {
        y: isMobile ? 30 : 50,
        autoAlpha: 0
      }, {
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none none',
          fastScrollEnd: true // AJOUTÉ: Optimisation pour scroll rapide
        },
        y: 0,
        autoAlpha: 1,
        duration: isMobile ? 0.6 : 0.8,
        ease: 'power2.out'
      });
    }
  });

  // MODIFIÉ: Animations batch optimisées
  const aboutParagraphs = document.querySelectorAll('.about-paragraph');
  if (aboutParagraphs.length > 0) {
    gsap.fromTo(aboutParagraphs, {
      y: isMobile ? 20 : 30,
      autoAlpha: 0
    }, {
      scrollTrigger: {
        trigger: '.about-text', 
        start: 'top 85%',
        toggleActions: 'play none none none',
        fastScrollEnd: true
      },
      y: 0,
      autoAlpha: 1,
      duration: 0.6,
      stagger: isMobile ? 0.1 : 0.2,
      ease: 'power2.out'
    });
  }

  /* === SERVICES === */
  const serviceBoxes = document.querySelectorAll(".service-box");
  const serviceGrid = document.querySelector(".service-grid");
  if (serviceBoxes.length > 0 && serviceGrid) {
    // Set initial state explicitly
    gsap.set(serviceBoxes, {
      y: isMobile ? 50 : 90,
      autoAlpha: 0,
      scale: isMobile ? 1 : 0.9,
      rotationX: isMobile ? 0 : -15,
      transformPerspective: isMobile ? 0 : 1000
    });
    
    ScrollTrigger.batch(serviceBoxes, {
      trigger: serviceGrid,
      start: "top 85%",
      onEnter: batch => gsap.to(batch, {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        rotationX: 0,
        duration: isMobile ? 0.8 : 1.4,
        stagger: { each: isMobile ? 0.1 : 0.15, from: "start" },
        ease: isMobile ? "power2.out" : "expo.out",
        clearProps: "transform"
      }),
      fastScrollEnd: true
    });
  }

  /* === PROJECTS === */
  const projectBoxes = document.querySelectorAll(".project-box");
  const projectsGrid = document.querySelector(".projects-grid");
  if (projectBoxes.length > 0 && projectsGrid) {
    // Set initial state explicitly
    gsap.set(projectBoxes, {
      y: isMobile ? 50 : 90,
      autoAlpha: 0,
      scale: isMobile ? 1 : 0.9,
      rotationX: isMobile ? 0 : -15,
      transformPerspective: isMobile ? 0 : 1000
    });
    
    ScrollTrigger.batch(projectBoxes, {
      trigger: projectsGrid,
      start: "top 85%",
      onEnter: batch => gsap.to(batch, {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        rotationX: 0,
        duration: isMobile ? 0.8 : 1.4,
        stagger: { each: isMobile ? 0.1 : 0.15, from: "start" },
        ease: isMobile ? "power2.out" : "expo.out",
        clearProps: "transform"
      }),
      fastScrollEnd: true
    });
  }

  /* === CLIENT LOGOS === */
  const clientLogos = document.querySelectorAll(".client-logo");
  const trustedGrid = document.querySelector(".trusted-grid");
  if (clientLogos.length > 0 && trustedGrid) {
    // MODIFIED: Disable complex animations on mobile
    if (isMobile) {
      // Simple fade-in for mobile
      gsap.set(clientLogos, {
        autoAlpha: 0,
        y: 20
      });
      
      ScrollTrigger.create({
        trigger: trustedGrid,
        start: "top 90%",
        onEnter: () => {
          gsap.to(clientLogos, {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.05,
            ease: "power2.out"
          });
        },
        once: true
      });
    } else {
      // Keep existing desktop animations
      gsap.set(clientLogos, {
        y: 70,
        autoAlpha: 0,
        scale: 0.95
      });
      
      ScrollTrigger.batch(clientLogos, {
        trigger: trustedGrid,
        start: "top 90%",
        onEnter: batch => {
          batch.forEach(logo => logo.style.pointerEvents = 'none');
          gsap.to(batch, {
            y: 0,
            autoAlpha: 1,
            scale: 1.08,
            duration: 1.1,
            stagger: { each: 0.12, from: "start" },
            ease: "power3.out",
            onUpdate: function() {
              const t = this.time();
              batch.forEach((logo, i) => {
                if (t >= i * 0.12 + 0.3) logo.style.pointerEvents = 'auto';
              });
            }
          });
        },
        fastScrollEnd: true
      });
    }
  }

  // Contact Section
  const contactTitle = document.querySelector('.contact-title');
  if (contactTitle) {
    gsap.fromTo(contactTitle, {
      y: isMobile ? 20 : 50, // MODIFIED: Reduced from 30
      autoAlpha: 0
    }, {
      scrollTrigger: {
        trigger: '.contact',
        start: 'top 80%',
        toggleActions: 'play none none none',
        fastScrollEnd: true
      },
      y: 0,
      autoAlpha: 1,
      duration: isMobile ? 0.5 : 0.8, // MODIFIED: Faster on mobile
      ease: 'power2.out'
    });
  }

  const contactSubtitle = document.querySelector('.contact-subtitle');
  if (contactSubtitle) {
    gsap.fromTo(contactSubtitle, {
      y: isMobile ? 15 : 30, // MODIFIED: Reduced from 20
      autoAlpha: 0
    }, {
      scrollTrigger: {
        trigger: '.contact',
        start: 'top 80%',
        toggleActions: 'play none none none',
        fastScrollEnd: true
      },
      y: 0,
      autoAlpha: 1,
      duration: isMobile ? 0.4 : 0.6, // MODIFIED: Faster on mobile
      delay: isMobile ? 0.1 : 0.2, // MODIFIED: Shorter delay
      ease: 'power2.out'
    });
  }

  const contactBox = document.querySelector('.contact-box');
  if (contactBox) {
    gsap.fromTo(contactBox, {
      y: isMobile ? 30 : 60, // MODIFIED: Reduced from 40
      autoAlpha: 0
    }, {
      scrollTrigger: {
        trigger: contactBox,
        start: 'top 85%',
        toggleActions: 'play none none none',
        fastScrollEnd: true
      },
      y: 0,
      autoAlpha: 1,
      duration: isMobile ? 0.6 : 1, // MODIFIED: Faster on mobile
      ease: 'power2.out'
    });
  }
}

// === INTERACTIONS HOVER LOGOS CLIENTS ===
function initClientLogoInteractions() {
  const clientLogos = document.querySelectorAll('.client-logo');
  
  if (!isTouch && clientLogos.length > 0) {
    clientLogos.forEach(logo => {
      logo.addEventListener('mouseenter', function() {
        gsap.to(this, {
          filter: 'grayscale(0%) brightness(1)',
          scale: 1.18,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: "auto" // Changed from true to "auto"
        });
      });
      
      logo.addEventListener('mouseleave', function() {
        gsap.to(this, {
          filter: 'grayscale(100%) brightness(1.2)',
          scale: 1.08,
          duration: 0.45,
          ease: 'power2.inOut',
          overwrite: "auto" // Changed from true to "auto"
        });
      });
    });
  }
}

// === SERVICES INTERACTIONS ===
function initServicesInteractions() {
  const serviceBoxes = document.querySelectorAll('.service-box');
  
  if (!isTouch && serviceBoxes.length > 0) {
    serviceBoxes.forEach(box => {
      const iconMono = box.querySelector('.icon-mono');
      const iconColor = box.querySelector('.icon-color');
      const serviceDescription = box.querySelector('.service-description');
      const serviceDescriptionP = box.querySelector('.service-description p');
      
      // Vérifier que tous les éléments existent
      if (!iconMono || !iconColor || !serviceDescription || !serviceDescriptionP) return;
      
      // Effet de suivi de souris pour la lueur
      box.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        this.style.setProperty('--mouse-x', `${x}%`);
        this.style.setProperty('--mouse-y', `${y}%`);
      });
      
      box.addEventListener('mouseenter', function() {
        // Animation GSAP existante
        gsap.to(iconMono, {
          opacity: 0,
          duration: 0.2,
          ease: "power1.out",
          overwrite: "auto"
        });
        
        gsap.to(iconColor, {
          opacity: 1,
          duration: 0.3,
          ease: "power1.in",
          overwrite: "auto"
        });
        
        gsap.fromTo(serviceDescription,
          { opacity: 0, y: -10, maxHeight: 0 },
          { opacity: 1, y: 0, maxHeight: 120, duration: 0.3, ease: "power1.out", overwrite: "auto" }
        );
        
        gsap.fromTo(serviceDescriptionP,
          { opacity: 0, y: 5 },
          { opacity: 1, y: 0, duration: 0.3, overwrite: "auto" }
        );
      });
      
      box.addEventListener('mouseleave', function() {
        gsap.to(iconMono, {
          opacity: 1,
          duration: 0.2,
          overwrite: "auto"
        });
        
        gsap.to(iconColor, {
          opacity: 0,
          duration: 0.2,
          overwrite: "auto"
        });
        
        gsap.to(serviceDescription,
          { opacity: 0, y: -10, duration: 0.2, overwrite: "auto" }
        );
        
        gsap.to(serviceDescriptionP,
          { opacity: 0, y: 10, duration: 0.2, overwrite: "auto" }
        );
      });
    });
  }
}

// === INTERACTIONS FORMULAIRE ===
function initFormInteractions() {
  const formInputs = document.querySelectorAll('.form-input');
  
  formInputs.forEach(input => {
    // Vérifier l'état initial (si le champ a une valeur)
    if (input.value.trim() !== '') {
      input.parentElement.classList.add('has-value');
    }
    
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
      
      // ADDED: Fix scroll issues on mobile when input is focused
      if (isMobile) {
        // Disable Lenis temporarily when input is focused
        if (lenis) {
          lenis.stop();
        }
        
        // Re-enable native scroll
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        
        // Prevent viewport resize on iOS
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
        }
        
        // ADDED: Prevent scroll to focused element
        const currentScrollPos = window.scrollY || window.pageYOffset;
        
        // Use setTimeout to override the browser's default scroll behavior
        setTimeout(() => {
          window.scrollTo(0, currentScrollPos);
        }, 0);
        
        // ADDED: Also prevent scrollIntoView
        this.scrollIntoView = function() { return false; };
        this.scrollIntoViewIfNeeded = function() { return false; };
      }
    });
    
    input.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
      if (this.value.trim() !== '') {
        this.parentElement.classList.add('has-value');
      } else {
        this.parentElement.classList.remove('has-value');
      }
      
      // ADDED: Re-enable Lenis when input loses focus
      if (isMobile) {
        // Small delay to ensure keyboard is closed
        setTimeout(() => {
          if (lenis) {
            lenis.start();
          }
          
          // Reset overflow
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
          
          // Reset viewport
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
          }
          
          // ADDED: Restore scrollIntoView functions
          delete this.scrollIntoView;
          delete this.scrollIntoViewIfNeeded;
        }, 300);
      }
    });
    
    input.addEventListener('input', function() {
      if (this.validity.valid) {
        this.parentElement.classList.remove('has-error');
      } else {
        this.parentElement.classList.add('has-error');
      }
    });
  });
  
  // ADDED: Global handler for mobile form interactions
  if (isMobile) {
    // Track if any input is focused
    let inputFocused = false;
    let savedScrollPosition = 0;
    
    document.addEventListener('focusin', function(e) {
      if (e.target.matches('.form-input, textarea')) {
        inputFocused = true;
        
        // ADDED: Save current scroll position
        savedScrollPosition = window.scrollY || window.pageYOffset;
        
        // Ensure smooth scroll is disabled
        document.documentElement.style.scrollBehavior = 'auto';
        
        // Prevent body scroll lock
        document.body.classList.remove('no-scroll');
        
        // ADDED: Prevent the default focus scroll behavior
        e.preventDefault();
        
        // ADDED: Override focus method temporarily
        const originalFocus = e.target.focus;
        e.target.focus = function(options) {
          if (options && options.preventScroll === undefined) {
            options = { ...options, preventScroll: true };
          } else if (!options) {
            options = { preventScroll: true };
          }
          return originalFocus.call(this, options);
        };
        
        // Force enable native scroll
        if (lenis) {
          lenis.destroy();
          window.lenisDestroyed = true;
        }
        
        // ADDED: Maintain scroll position
        setTimeout(() => {
          window.scrollTo(0, savedScrollPosition);
        }, 0);
      }
    });
    
    document.addEventListener('focusout', function(e) {
      // Check if focus moved to another input
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (!activeElement || !activeElement.matches('.form-input, textarea')) {
          inputFocused = false;
          
          // Re-enable smooth scroll
          document.documentElement.style.scrollBehavior = '';
          
          // Reinitialize Lenis if it was destroyed
          if (window.lenisDestroyed && !lenis) {
            initLenisScroll();
            window.lenisDestroyed = false;
          }
        }
      }, 100);
    });
    
    // ADDED: Prevent scroll on touch when input is focused
    let touchStartY = 0;
    
    document.addEventListener('touchstart', function(e) {
      if (inputFocused) {
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
      if (inputFocused && !e.target.matches('.form-input, textarea')) {
        // Allow scroll but maintain current input focus
        const currentScrollPos = window.scrollY || window.pageYOffset;
        
        // Check if user is trying to scroll
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        
        if (Math.abs(deltaY) > 10) {
          // User is scrolling, don't interfere
          return;
        }
      }
    }, { passive: true });
    
    // ADDED: Override scrollIntoView globally for form elements
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    const originalScrollIntoViewIfNeeded = Element.prototype.scrollIntoViewIfNeeded;
    
    Element.prototype.scrollIntoView = function(...args) {
      if (this.matches && this.matches('.form-input, textarea, .radio-item input, .radio-item label') && isMobile) {
        return false;
      }
      return originalScrollIntoView.apply(this, args);
    };
    
    if (originalScrollIntoViewIfNeeded) {
      Element.prototype.scrollIntoViewIfNeeded = function(...args) {
        if (this.matches && this.matches('.form-input, textarea, .radio-item input, .radio-item label') && isMobile) {
          return false;
        }
        return originalScrollIntoViewIfNeeded.apply(this, args);
      };
    }
  }
  
  // ADDED: Fix radio button scroll issues on mobile
  if (isMobile) {
    const radioButtons = document.querySelectorAll('.radio-item input[type="radio"]');
    const radioLabels = document.querySelectorAll('.radio-item label');
    
    // Prevent default focus behavior on radio buttons
    radioButtons.forEach(radio => {
      radio.addEventListener('focus', function(e) {
        e.preventDefault();
        // Don't scroll to the element
        if (window.scrollY !== undefined) {
          const currentScroll = window.scrollY;
          setTimeout(() => {
            window.scrollTo(0, currentScroll);
          }, 0);
        }
      });
      
      // Prevent touchstart from causing issues
      radio.addEventListener('touchstart', function(e) {
        e.stopPropagation();
      }, { passive: true });
    });
    
    // Handle label clicks more smoothly
    radioLabels.forEach(label => {
      label.addEventListener('click', function(e) {
        const radio = document.getElementById(this.getAttribute('for'));
        if (radio) {
          // Prevent the default scroll behavior
          const currentScroll = window.scrollY || document.documentElement.scrollTop;
          
          // Check the radio without triggering focus
          radio.checked = true;
          
          // Dispatch change event manually
          const event = new Event('change', { bubbles: true });
          radio.dispatchEvent(event);
          
          // Restore scroll position
          setTimeout(() => {
            window.scrollTo(0, currentScroll);
            if (lenis) {
              lenis.scroll = currentScroll;
            }
          }, 0);
        }
      });
      
      // Prevent touch events from causing scroll jumps
      label.addEventListener('touchend', function(e) {
        e.preventDefault();
        // Trigger click instead
        this.click();
      }, { passive: false });
    });
  }
}

// === FORMULAIRE CONTACT ===
function initContactForm() {
  const form = document.getElementById('contact-form');
  const confirmationMessage = document.getElementById('confirmation-message');
  
  if (!form || !confirmationMessage) return;
  
  const backToFormBtn = document.getElementById('back-to-form');
  const submitBtn = form.querySelector('button[type="submit"]');
  
  if (!submitBtn) return;
  
  // Initialiser EmailJS avec votre Public Key
  emailjs.init("gIpkD2M8JE5VdTM8r");
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Vérifications côté client
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.validity.valid) {
        field.parentElement.classList.add('has-error');
        isValid = false;
      } else {
        field.parentElement.classList.remove('has-error');
      }
    });
    
    // Vérifier qu'un sujet est sélectionné
    const sujetChecked = form.querySelector('input[name="sujet"]:checked');
    if (!sujetChecked) {
      const sujetGroup = form.querySelector('.sujet-group');
      if (sujetGroup) {
        sujetGroup.classList.add('has-error');
      }
      isValid = false;
    }
    
    if (!isValid) {
      const firstError = form.querySelector('.has-error');
      if (firstError && lenis) {
        lenis.scrollTo(firstError, { offset: -150, duration: 1 });
      }
      return;
    }
    
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    // Préparer les données du formulaire
    const formData = {
      nom: form.nom.value,
      prenom: form.prenom.value,
      email: form.email.value,
      telephone: form.telephone.value,
      sujet: sujetChecked.value === 'identite' ? 'Conception graphique' :
             sujetChecked.value === 'community' ? 'Community management' :
             sujetChecked.value === 'site' ? 'Site web' : 'Autre',
      message: form.message.value,
      // Ajouter la date et l'heure
      date: new Date().toLocaleDateString('fr-FR'),
      heure: new Date().toLocaleTimeString('fr-FR')
    };
    
    // Envoyer l'email via EmailJS avec VOS identifiants
    emailjs.send("service_9ulz0qx", "template_9wml8hb", formData)
      .then(function(response) {
        console.log('Email envoyé avec succès!', response.status, response.text);
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        confirmationMessage.classList.add('visible');
        form.reset();
        
        // Mettre à jour les classes des champs après reset
        form.querySelectorAll('.form-group').forEach(group => {
          group.classList.remove('has-value', 'has-error', 'focused');
        });
      }, function(error) {
        console.error('Erreur lors de l\'envoi:', error);
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        
        // Message d'erreur plus détaillé
        let errorMessage = 'Une erreur est survenue lors de l\'envoi.';
        if (error.text) {
          if (error.text.includes('The Public Key is invalid')) {
            errorMessage = 'Erreur de configuration EmailJS. Veuillez contacter l\'administrateur.';
          } else if (error.text.includes('The service ID is invalid')) {
            errorMessage = 'Service email non configuré. Veuillez réessayer plus tard.';
          } else if (error.text.includes('The template ID is invalid')) {
            errorMessage = 'Template email non trouvé. Veuillez contacter l\'administrateur.';
          }
        }
        alert(errorMessage);
      });
  });
  
  if (backToFormBtn) {
    backToFormBtn.addEventListener('click', function() {
      confirmationMessage.classList.remove('visible');
    });
  }
}

// === RETOUR EN HAUT ===
function initBackToTop() {
  const backToTopBtn = document.querySelector('.back-to-top');
  
  if (!backToTopBtn) return;
  
  // ADDED: Fonction pour gérer la visibilité du bouton
  function handleBackToTopVisibility() {
    const scrollTop = lenis ? lenis.scroll : window.scrollY;
    
    if (scrollTop > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }
  
  // ADDED: Écouter le scroll avec Lenis
  if (lenis) {
    lenis.on('scroll', handleBackToTopVisibility);
  } else {
    // ADDED: Fallback si Lenis n'est pas disponible
    window.addEventListener('scroll', handleBackToTopVisibility);
  }
  
  // ADDED: Vérification initiale
  handleBackToTopVisibility();
  
  backToTopBtn.addEventListener('click', () => {
    if (lenis) {
      lenis.scrollTo('top', {
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    }
  });
}

// === CANVAS INTERACTIONS ===
function initCanvasInteractions() {
  // This function can be removed or kept empty since we're handling Spline in HTML
}

// === WEBGL BACKGROUND === 
function initWebGLBackground() {
  const canvasContainer = document.querySelector('.webgl-background');
  
  if (webglBackgroundActive) return;
  
  if (canvasContainer) canvasContainer.style.display = '';

  try {
    let canvas = canvasContainer.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvasContainer.appendChild(canvas);
    } else {
      while (canvasContainer.firstChild && canvasContainer.firstChild !== canvas) {
        canvasContainer.removeChild(canvasContainer.firstChild);
      }
      if (canvasContainer.children.length > 1) {
         Array.from(canvasContainer.children).forEach(child => {
            if (child !== canvas && child.tagName === 'CANVAS') {
                canvasContainer.removeChild(child);
            }
         });
      }
    }
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: false
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // MODIFIÉ: Ajuster le nombre de particules selon l'appareil
    let particlesCount;
    if (isTabletLandscape) {
      particlesCount = 600; // ADDED: Moins de particules en tablette paysage
    } else if (isMobile) {
      particlesCount = 400;
    } else {
      particlesCount = 1150;
    }
    
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x17c7d2,
      transparent: true,
      opacity: 0.8
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    camera.position.z = 3;
    
    let mouseX = 0;
    let mouseY = 0;
    let animationFrame;
    
    if (!isTouch) {
      document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth - 0.5) * 0.5;
        mouseY = (event.clientY / window.innerHeight - 0.5) * 0.5;
      });
    }
    
    function animate() {
      if (!document.hidden) {
        particlesMesh.rotation.x += 0.0005;
        particlesMesh.rotation.y += 0.0005;
        
        particlesMesh.rotation.x += (mouseY * 0.1 - particlesMesh.rotation.x) * 0.05;
        particlesMesh.rotation.y += (mouseX * 0.1 - particlesMesh.rotation.y) * 0.05;
        
        renderer.render(scene, camera);
      }
      
      animationFrame = requestAnimationFrame(animate);
    }

    animate();
    webglBackgroundActive = true;
    
    let resizeTimeout;
    function handleResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }, 250);
    }
    
    window.addEventListener('resize', handleResize);
    
    window.addEventListener('beforeunload', () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    });
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
      } else {
        if (!animationFrame && webglBackgroundActive) {
          animate();
        }
      }
    });
  } catch (error) {
    console.error('WebGL Background initialization error:', error);
    webglBackgroundActive = false;
    if (canvasContainer) canvasContainer.style.display = 'none';
  }
}

// === SETUP VISUALS (Spline or Video) ===
function setupVisuals() {
  const heroCanvas = document.getElementById('canvas3d');
  const heroVideo = document.getElementById('hero-video');
  const heroFallback = document.getElementById('hero-fallback');
  
  const aboutCanvas = document.getElementById('about-canvas');
  const aboutVideo = document.getElementById('about-video');
  const aboutFallback = document.getElementById('about-fallback');

  // MODIFIED: Simplifier la logique - utiliser vidéo pour TOUTES les tablettes et mobiles
  if (isMobile || isTablet) {
    // Hide canvases completely
    if (heroCanvas) {
      heroCanvas.style.display = 'none';
      const heroContainer = heroCanvas.closest('.webgl-animation-container');
      if (heroContainer) {
        // ADDED: Remove any Spline elements that might have been created
        const splineViewers = heroContainer.querySelectorAll('spline-viewer');
        splineViewers.forEach(viewer => viewer.remove());
      }
    }
    
    if (aboutCanvas) {
      aboutCanvas.style.display = 'none';
      const aboutContainer = aboutCanvas.closest('.interactive-container');
      if (aboutContainer) {
        // ADDED: Remove any Spline elements that might have been created
        const splineViewers = aboutContainer.querySelectorAll('spline-viewer');
        splineViewers.forEach(viewer => viewer.remove());
      }
    }
    
    // Show videos
    if (heroVideo) {
      heroVideo.style.display = 'block';
      heroVideo.controls = false;
      heroVideo.autoplay = true;
      heroVideo.muted = true;
      heroVideo.loop = true;
      heroVideo.playsInline = true;
      
      // ADDED: Force video to load and play
      heroVideo.load();
      const playPromise = heroVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Hero video autoplay failed:', error);
        });
      }
      
      // Handle video loading errors
      heroVideo.addEventListener('error', function() {
        console.log('Hero video failed to load, showing fallback image');
        heroVideo.classList.add('fallback-active');
        if (heroFallback) {
          heroFallback.classList.add('fallback-active');
          heroFallback.style.display = 'block';
        }
      });
      
      heroVideo.addEventListener('loadeddata', function() {
        if (heroFallback) {
          heroFallback.style.display = 'none';
          heroFallback.classList.remove('fallback-active');
        }
      });
    }

    if (aboutVideo) {
      aboutVideo.style.display = 'block';
      aboutVideo.controls = false;
      aboutVideo.autoplay = true;
      aboutVideo.muted = true;
      aboutVideo.loop = true;
      aboutVideo.playsInline = true;
      
      // ADDED: Force video to load and play
      aboutVideo.load();
      const playPromise = aboutVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('About video autoplay failed:', error);
        });
      }
      
      // Handle video loading errors
      aboutVideo.addEventListener('error', function() {
        console.log('About video failed to load, showing fallback image');
        aboutVideo.classList.add('fallback-active');
        if (aboutFallback) {
          aboutFallback.classList.add('fallback-active');
          aboutFallback.style.display = 'block';
        }
      });
      
      aboutVideo.addEventListener('loadeddata', function() {
        if (aboutFallback) {
          aboutFallback.style.display = 'none';
          aboutFallback.classList.remove('fallback-active');
        }
      });
    }
  } else {
    // Desktop only: Use Spline
    if (heroVideo) heroVideo.style.display = 'none';
    if (heroFallback) heroFallback.style.display = 'none';
    if (aboutVideo) aboutVideo.style.display = 'none';
    if (aboutFallback) aboutFallback.style.display = 'none';
    
    // Initialize Spline for hero
    if (heroCanvas) {
      heroCanvas.style.display = 'block';
      const webglContainerParentHero = heroCanvas.closest('.webgl-animation-container');
      if (webglContainerParentHero) webglContainerParentHero.style.display = 'block';

      try {
        const app3d = new Application(heroCanvas);
        app3d.load('https://prod.spline.design/GF5m-CdGpkcjETMO/scene.splinecode')
          .then(() => {
            console.log('Hero Spline scene loaded successfully');
          })
          .catch(error => {
            console.error('Error loading Hero Spline scene:', error);
            // Show video fallback on Spline error
            if (heroCanvas) heroCanvas.style.display = 'none';
            if (heroVideo) {
              heroVideo.style.display = 'block';
              heroVideo.controls = false;
              heroVideo.autoplay = true;
              heroVideo.muted = true;
              heroVideo.loop = true;
              heroVideo.playsInline = true;
              console.log('Showing hero video as fallback for failed Spline load');
            }
          });
      } catch (e) {
        console.error("Failed to initialize Hero Spline:", e);
        if (heroCanvas) heroCanvas.style.display = 'none';
        if (heroVideo) {
          heroVideo.style.display = 'block';
          heroVideo.controls = false;
          heroVideo.autoplay = true;
          heroVideo.muted = true;
          heroVideo.loop = true;
          heroVideo.playsInline = true;
          console.log('Showing hero video as fallback for failed Spline initialization');
        }
      }
    }

    // Initialize Spline for about
    if (aboutCanvas) {
      aboutCanvas.style.display = 'block';
      const webglContainerParentAbout = aboutCanvas.closest('.interactive-container');
      if (webglContainerParentAbout) webglContainerParentAbout.style.display = 'block';

      try {
        const aboutApp = new Application(aboutCanvas);
        const aboutSceneUrl = 'https://prod.spline.design/3k6CUI4OP5s1PBYL/scene.splinecode';
        aboutApp.load(aboutSceneUrl)
          .then(() => {
            console.log('About section Spline scene loaded successfully');
          })
          .catch(error => {
            console.error('Error loading About Spline scene:', error);
            if (aboutCanvas) aboutCanvas.style.display = 'none';
            if (aboutVideo) {
              aboutVideo.style.display = 'block';
              aboutVideo.controls = false;
              aboutVideo.autoplay = true;
              aboutVideo.muted = true;
              aboutVideo.loop = true;
              aboutVideo.playsInline = true;
              console.log('Showing about video as fallback for failed Spline load');
            }
          });
      } catch (e) {
        console.error("Failed to initialize About Spline:", e);
        if (aboutCanvas) aboutCanvas.style.display = 'none';
        if (aboutVideo) {
          aboutVideo.style.display = 'block';
          aboutVideo.controls = false;
          aboutVideo.autoplay = true;
          aboutVideo.muted = true;
          aboutVideo.loop = true;
          aboutVideo.playsInline = true;
          console.log('Showing about video as fallback for failed Spline initialization');
        }
      }
    }
  }
}

// === ANIMATION HERO 3D ===
function initHero3DAnimation() {
  if (webglHeroActive) return;

  const webglContainerParent = document.querySelector('.hero-visual .webgl-animation-container');

  if (webglContainerParent) {
    // MODIFIED: Only show container on desktop
    if (!isMobile && !isTablet) {
      webglContainerParent.style.display = 'block';
    } else {
      webglContainerParent.style.display = 'block'; // Still show container but for video
    }
  }

  webglHeroActive = true;
  console.log('Hero visual area initialized (Spline for desktop, Video for mobile/tablet).');
}

// === MAGIC TEXT CURSOR EFFECT FOR TITLES ===
function initMagicTextEffect() {
  if (isTouch) return;

  const allTitleElements = document.querySelectorAll('h1, h2, h3');
  const mainCursorDot = document.querySelector('.cursor-dot');

  if (!mainCursorDot) return;

  let currentActiveWrapper = null;
  let mouseX = 0;
  let mouseY = 0;
  let rafId = null;

  // Créer tous les wrappers au démarrage
  const magicWrappers = new Map();

  allTitleElements.forEach(titleEl => {
    // Skip les titres dans service-box ou project-box
    if (titleEl.closest('.service-box') || titleEl.closest('.project-box')) {
      return;
    }

    // NOUVEAU: Skip les titres dans la section hero
    if (titleEl.closest('.hero')) {
      return;
    }

    // Skip si déjà wrappé
    if (titleEl.parentElement.classList.contains('magic-text-area')) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.classList.add('magic-text-area');

    if (titleEl.parentNode) {
      titleEl.parentNode.insertBefore(wrapper, titleEl);
    }
    wrapper.appendChild(titleEl);

    const magicCursor = document.createElement('div');
    magicCursor.classList.add('magic-text-cursor-element');
    wrapper.appendChild(magicCursor);

    // Stocker les références
    magicWrappers.set(wrapper, {
      cursor: magicCursor,
      rect: null,
      isActive: false,
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0
    });
  });

  // NOUVEAU: Ajouter le burger menu aux éléments magnétiques
  const burgerButton = document.querySelector('.burger-menu-button');
  if (burgerButton) {
    // Créer un wrapper pour le burger
    const burgerWrapper = document.createElement('div');
    burgerWrapper.classList.add('magic-text-area', 'burger-magic-area');
    
    if (burgerButton.parentNode) {
      burgerButton.parentNode.insertBefore(burgerWrapper, burgerButton);
    }
    burgerWrapper.appendChild(burgerButton);

    const burgerMagicCursor = document.createElement('div');
    burgerMagicCursor.classList.add('magic-text-cursor-element', 'burger-magic-cursor');
    burgerWrapper.appendChild(burgerMagicCursor);

    // Ajouter aux wrappers
    magicWrappers.set(burgerWrapper, {
      cursor: burgerMagicCursor,
      rect: null,
      isActive: false,
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
      isBurger: true // Flag pour identifier le burger
    });
  }

  // Mise à jour des positions de souris
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Vérifier immédiatement lors du mouvement
    checkMagicCursorPosition();
  });

  // NOUVEAU: Détection pendant le scroll à la molette
  document.addEventListener('wheel', (e) => {
    // Mettre à jour la position de la souris si elle n'a pas bougé
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Forcer une vérification immédiate
    checkMagicCursorPosition();
  }, { passive: true });

  // Gestion optimisée du scroll standard
  let scrollTimeout;
  let lastScrollTime = 0;
  const scrollThrottle = 16; // ~60fps

  const handleScroll = () => {
    const now = Date.now();
    
    // Throttle pour éviter trop d'appels
    if (now - lastScrollTime < scrollThrottle) {
      return;
    }
    lastScrollTime = now;

    // Mise à jour immédiate des rectangles pendant le scroll
    updateAllRects();
    
    // Vérification immédiate de la position
    checkMagicCursorPosition();
    
    // Vérification finale après l'arrêt du scroll
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      updateAllRects();
      checkMagicCursorPosition();
    }, 150);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  if (lenis) {
    lenis.on('scroll', () => {
      handleScroll();
    });
  }

  // Mettre à jour les rectangles de tous les wrappers
  function updateAllRects() {
    magicWrappers.forEach((data, wrapper) => {
      data.rect = wrapper.getBoundingClientRect();
    });
  }

  // Vérifier quelle zone magique est sous la souris
  function checkMagicCursorPosition() {
    let foundWrapper = null;

    magicWrappers.forEach((data, wrapper) => {
      if (!data.rect) {
        data.rect = wrapper.getBoundingClientRect();
      }

      // Pour le burger, utiliser directement le rect du wrapper
      if (data.isBurger) {
              const rect = data.rect;
        
        // Zone de détection élargie pour le burger
        const padding = 10;
        if (mouseX >= rect.left - padding &&
            mouseX <= rect.right + padding &&
            mouseY >= rect.top - padding &&
            mouseY <= rect.bottom + padding) {
          foundWrapper = wrapper;
        }
      } else {
        // Code existant pour les titres
        const textElement = wrapper.querySelector('h1, h2, h3');
        if (!textElement) return;

        const textRects = textElement.getClientRects();
        
        for (let i = 0; i < textRects.length; i++) {
          const rect = textRects[i];
          
          if (mouseX >= rect.left &&
              mouseX <= rect.right &&
              mouseY >= rect.top &&
              mouseY <= rect.bottom) {
            foundWrapper = wrapper;
            break;
          }
        }
      }
    });

    // Gérer les changements d'état
    if (foundWrapper !== currentActiveWrapper) {
      if (currentActiveWrapper) {
        deactivateMagicCursor(currentActiveWrapper);
      }
      if (foundWrapper) {
        activateMagicCursor(foundWrapper);
      }
      currentActiveWrapper = foundWrapper;
    }

    // Mettre à jour la position même si le wrapper est déjà actif
    if (currentActiveWrapper && magicWrappers.has(currentActiveWrapper)) {
      const data = magicWrappers.get(currentActiveWrapper);
      if (data.isActive && data.rect) {
        data.targetX = mouseX - data.rect.left;
        data.targetY = mouseY - data.rect.top;
      }
    }
  }

  // Animation fluide de la position
  function animateCursors() {
    if (currentActiveWrapper && magicWrappers.has(currentActiveWrapper)) {
      const data = magicWrappers.get(currentActiveWrapper);
      
      if (data.isActive) {
        // Interpolation douce
        const smoothing = 0.25;
        data.currentX += (data.targetX - data.currentX) * smoothing;
        data.currentY += (data.targetY - data.currentY) * smoothing;
        
        // Appliquer la transformation
        gsap.set(data.cursor, {
          x: data.currentX,
          y: data.currentY,
          xPercent: -50,
          yPercent: -50
        });
      }
    }
    
    rafId = requestAnimationFrame(animateCursors);
  }

  function activateMagicCursor(wrapper) {
    const data = magicWrappers.get(wrapper);
    if (!data || data.isActive) return;

    data.isActive = true;
    
    if (!data.rect) data.rect = wrapper.getBoundingClientRect();
    data.currentX = mouseX - data.rect.left;
    data.currentY = mouseY - data.rect.top;
    data.targetX = data.currentX;
    data.targetY = data.currentY;

    // Kill any existing animations
    gsap.killTweensOf([mainCursorDot, data.cursor]);

    // Position initiale du curseur magique exactement où est le bleu
    gsap.set(data.cursor, {
      x: data.currentX,
      y: data.currentY,
      xPercent: -50,
      yPercent: -50,
      scale: 0.343, // Ajusté de 0.24 à 0.343 (12px / 35px)
      opacity: 0
    });

    // Transition ultra rapide et fluide
    const duration = 0.2; // 200ms pour une transition quasi-instantanée mais fluide

    // Fondu enchaîné simultané
    gsap.to(mainCursorDot, {
      scale: 0.343, // Ajusté pour correspondre à la nouvelle taille
      opacity: 0,
      duration: duration,
      ease: 'power2.inOut',
      overwrite: true
    });

    gsap.to(data.cursor, {
      scale: 1,
      opacity: 1,
      duration: duration,
      ease: 'power2.inOut',
      overwrite: true
    });
  }

  function deactivateMagicCursor(wrapper) {
    const data = magicWrappers.get(wrapper);
    if (!data || !data.isActive) return;

    data.isActive = false;

    // Kill any existing animations
    gsap.killTweensOf([mainCursorDot, data.cursor]);

    const duration = 0.2;

    // Transition inverse ultra fluide
    gsap.to(data.cursor, {
      scale: 0.343, // Ajusté pour correspondre à la nouvelle taille
      opacity: 0,
      duration: duration,
      ease: 'power2.inOut',
      overwrite: true
    });

    // Le curseur bleu reprend exactement où le blanc s'arrête
    gsap.set(mainCursorDot, {
      scale: 0.343, // Ajusté pour correspondre à la nouvelle taille
      opacity: 0
    });
    
    gsap.to(mainCursorDot, {
      scale: 1,
      opacity: 1,
      duration: duration,
      ease: 'power2.inOut',
      overwrite: true
    });
  }

  // NOUVEAU: Vérification périodique pour capturer les cas edge
  setInterval(() => {
    if (document.hasFocus() && !document.hidden) {
      checkMagicCursorPosition();
    }
  }, 100);

  // Observer pour gérer le resize
  const resizeObserver = new ResizeObserver(() => {
    updateAllRects();
    checkMagicCursorPosition();
  });

  magicWrappers.forEach((data, wrapper) => {
       resizeObserver.observe(wrapper);
  });

  // Démarrer l'animation
  animateCursors();

  // Mise à jour initiale des rectangles
  setTimeout(() => {
    updateAllRects();
    checkMagicCursorPosition();
  }, 100);

  // Nettoyage
  window.addEventListener('beforeunload', () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    resizeObserver.disconnect();
  });
}

// === LAZY LOADING AMÉLIORÉ ===
class EnhancedLazyLoader {
  constructor() {
    this.imageQueue = new Map();
    this.loadingImages = new Set();
    this.maxConcurrent = isMobile ? 2 : 4;
    this.priorityBoost = 200; // pixels
    
    this.init();
  }
  
  init() {
    // Native lazy loading avec fallback Intersection Observer
    if ('loading' in HTMLImageElement.prototype) {
      this.setupNativeLazyLoading();
    } else {
      this.setupIntersectionObserver();
    }
    
    // Préchargement intelligent basé sur la connexion
    this.setupAdaptiveLoading();
    
    // Gestion des erreurs de chargement
    this.setupErrorHandling();
  }
  
  setupNativeLazyLoading() {
    const lazyImages = document.querySelectorAll('img.lazy-load[data-src]');
    
    lazyImages.forEach(img => {
      // Observer pour le chargement progressif
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            observer.unobserve(entry.target);
          }
               });
      }, {
        rootMargin: `${this.priorityBoost}px`,
        threshold: 0.01
      });
      
      
      observer.observe(img);
    });
  }
  
  setupIntersectionObserver() {
    const lazyImages = document.querySelectorAll('img.lazy-load[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const priority = this.calculatePriority(img, entry);
          
          this.queueImage(img, priority);
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: `${this.priorityBoost}px`,
      threshold: [0, 0.01, 0.1, 0.5, 1]
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
    
    // Traiter la queue
    this.processQueue();
  }
  
  calculatePriority(img, entry) {
    let priority = 0;
    
    // Plus l'image est visible, plus la priorité est élevée
    priority += entry.intersectionRatio * 100;
    
    // Les images dans le viewport ont la priorité maximale
    if (entry.boundingClientRect.top < window.innerHeight) {
      priority += 1000;
    }
    
    // Les images critiques (hero, above-the-fold) ont une priorité boost
    if (img.closest('.hero, .about')) {
      priority += 500;
    }
    
    // Les petites images se chargent plus vite
    const size = (img.width || 320) * (img.height || 320);
    priority += (1 - size / 1000000) * 50;
    
    return priority;
  }
  
  queueImage(img, priority) {
    if (!this.imageQueue.has(img) && !this.loadingImages.has(img)) {
      this.imageQueue.set(img, priority);
    }
  }
  
  async processQueue() {
    if (this.loadingImages.size >= this.maxConcurrent) {
      return;
    }
    
    // Trier par priorité
    const sortedImages = Array.from(this.imageQueue.entries())
      .sort((a, b) => b[1] - a[1]);
    
    while (sortedImages.length > 0 && this.loadingImages.size < this.maxConcurrent) {
      const [img] = sortedImages.shift();
      this.imageQueue.delete(img);
      
      this.loadingImages.add(img);
      
      try {
        await this.loadImage(img);
      } catch (error) {
        console.error('Image loading failed:', error);
      } finally {
        this.loadingImages.delete(img);
        // Continuer avec la prochaine image
        if (this.imageQueue.size > 0) {
          this.processQueue();
        }
      }
    }
  }
  
  loadImage(img) {
    return new Promise((resolve, reject) => {
      const dataSrc = img.dataset.src;
      const dataSrcset = img.dataset.srcset;
      
      if (!dataSrc) {
        resolve();
        return;
      }
      
      // Créer une nouvelle image pour précharger
      const newImg = new Image();
      
      // Copier les attributs importants
      if (img.sizes) newImg.sizes = img.sizes;
      if (dataSrcset) newImg.srcset = dataSrcset;
      
      newImg.onload = () => {
        // Appliquer les sources à l'image originale
        if (dataSrcset) img.srcset = dataSrcset;
        img.src = dataSrc;
        
        // Animation de fondu
        img.classList.add('lazy-loaded');
        img.classList.remove('lazy-load');
        
        // Nettoyer les attributs data
        delete img.dataset.src;
        delete img.dataset.srcset;
        
        resolve();
      };
      
      newImg.onerror = () => {
        img.classList.add('lazy-error');
        reject(new Error(`Failed to load image: ${dataSrc}`));
      };
      
      // Commencer le chargement
      newImg.src = dataSrc;
    });
  }
  
  setupAdaptiveLoading() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      // Ajuster les paramètres selon la connexion
      if (connection.effectiveType) {
        switch (connection.effectiveType) {
          case '4g':
            this.maxConcurrent = 6;
            this.priorityBoost = 400;
            break;
          case '3g':
            this.maxConcurrent = 3;
            this.priorityBoost = 200;
            break;
          case '2g':
            this.maxConcurrent = 1;
            this.priorityBoost = 100;
            break;
          case 'slow-2g':
            this.maxConcurrent = 1;
            this.priorityBoost = 50;
            break;
        }
      }
      
      // Écouter les changements de connexion
      connection.addEventListener('change', () => {
        this.setupAdaptiveLoading();
      });
    }
  }
  
  setupErrorHandling() {
    document.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG' && e.target.classList.contains('lazy-load')) {
        const img = e.target;
        const fallbackSrc = img.dataset.fallback;
        
        if (fallbackSrc && !img.dataset.fallbackTried) {
          img.dataset.fallbackTried = 'true';
          img.src = fallbackSrc;
        } else {
          img.classList.add('lazy-error');
          // Optionnel : afficher une image placeholder d'erreur
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"%3E%3Crect width="320" height="320" fill="%23222"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-family="sans-serif" font-size="16"%3EImage non disponible%3C/text%3E%3C/svg%3E';
        }
      }
    }, true);
  }
  
  // Précharger les images critiques
  preloadCriticalImages() {
    const criticalImages = document.querySelectorAll('.hero img[data-src], .about img[data-src]');
    
    criticalImages.forEach((img) => {
      this.queueImage(img, 2000); // Priorité maximale
    });
    
    this.processQueue();
  }
}

// Remplacer l'ancien lazy loader
document.addEventListener('DOMContentLoaded', function() {
  // Initialiser le lazy loader amélioré
  const lazyLoader = new EnhancedLazyLoader();
  
  // Précharger les images critiques après un court délai
  setTimeout(() => {
    lazyLoader.preloadCriticalImages();
  }, 100);
});

// === LAZY LOADING POUR LES VIDÉOS ===
function setupVideoLazyLoading() {
  const lazyVideos = document.querySelectorAll('video[data-src]');
  
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        
        // Charger la vidéo
        if (video.dataset.src) {
          video.src = video.dataset.src;
          delete video.dataset.src;
        }
        
        // Charger les sources alternatives
        const sources = video.querySelectorAll('source[data-src]');
        sources.forEach(source => {
          source.src = source.dataset.src;
          delete source.dataset.src;
        });
        
        // Recharger la vidéo avec les nouvelles sources
        video.load();
        
        // Jouer automatiquement si autoplay
        if (video.hasAttribute('autoplay')) {
          video.play().catch(e => console.log('Autoplay prevented:', e));
        }
        
        videoObserver.unobserve(video);
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.25
  });
  
  lazyVideos.forEach(video => videoObserver.observe(video));
}

// Ajouter à l'initialisation
window.addEventListener('load', function() {
  setupVideoLazyLoading();
});

// === RESOURCE HINTS DYNAMIQUES ===
function setupResourceHints() {
  const resourceHints = {
    dns: new Set(),
    preconnect: new Set(),
    prefetch: new Set()
  };
  
  // Observer les liens pour précharger les ressources
  const linkObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const link = entry.target;
        const href = link.href;
        
        if (href && !href.startsWith('#')) {
          try {
            const url = new URL(href);
            
            // DNS prefetch pour les domaines externes
            if (url.hostname !== window.location.hostname) {
              if (!resourceHints.dns.has(url.origin)) {
                const link = document.createElement('link');
                link.rel = 'dns-prefetch';
                link.href = url.origin;
                document.head.appendChild(link);
                resourceHints.dns.add(url.origin);
              }
            }
          } catch (e) {
            // URL invalide
          }
        }
      }
    });
  }, {
    rootMargin: '50px'
  });
  
  // Observer tous les liens
  document.querySelectorAll('a[href]').forEach(link => {
    linkObserver.observe(link);
  });
}

// Ajouter à l'initialisation
document.addEventListener('DOMContentLoaded', setupResourceHints);

// ADDED: Événement de secours si 'load' ne se déclenche pas
document.addEventListener('DOMContentLoaded', function() {
  // Si après 5 secondes le préloader est toujours là, le forcer à disparaître
  setTimeout(() => {
    const preloader = document.querySelector('.preloader');
    if (preloader && !preloader.classList.contains('hidden')) {
      console.warn('Préloader forcé à disparaître (DOMContentLoaded timeout)');
      preloader.classList.add('hidden');
      
      // ADDED: Forcer le défilement en haut après suppression du préloader
      window.scrollTo(0, 0);
      if (lenis) {
        lenis.scroll = 0;
      }
    }
  }, 5000);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
    if (window.caches && caches.keys) { caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {}); }
  });
}

// === CHROME CUBERTO SMOOTH BUTTON SYSTEM === //
class ChromeCubertoButton {
  constructor(button) {
    this.button = button;
    this.particleContainer = button.querySelector('.particle-container');
    this.darkCore = button.querySelector('.dark-core');
    this.galacticRing = button.querySelector('.galactic-ring');
    
    // Configuration
    this.config = {
      particles: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cta-particles')) || 36,
      minSize: 1,
      maxSize: 3,
      lifeTime: 420,
      proximityThreshold: 32,
      magnetStrength: 0.15
    };
    
    // État
    this.isHovering = false;
    this.rafId = null;
    this.particles = [];
    this.mousePosition = { x: 0, y: 0 };
    this.buttonRect = null;
    
    // Initialisation
    this.init();
  }
  
  init() {
    // Micro-respiration aléatoire
    this.startBreathing();
    
    // Événements souris
    this.button.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.button.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.button.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.button.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Événements tactiles
    this.button.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.button.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // Événements clavier
    this.button.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.button.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Proximité magnétique
    if (!isMobile) {
      document.addEventListener('mousemove', this.handleProximity.bind(this));
    }
    
    // Reduced motion check
    this.respectReducedMotion();
  }
  
  startBreathing() {
    // Ajouter une variation aléatoire à la période de respiration
    const jitter = 0.8 + Math.random() * 0.4; // ±20%
    const period = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cta-breathe-period')) || 4.8;
    this.button.style.animationDuration = `${period * jitter}s`;
  }
  
  handleMouseEnter(e) {
    if (this.isHovering) return;
    this.isHovering = true;
    this.buttonRect = this.button.getBoundingClientRect();
    
    // Créer les particules
    this.createParticles();
    
    // Activer le noyau sombre
    if (this.darkCore) {
      this.darkCore.style.transition = 'all 280ms cubic-bezier(0.22, 0.61, 0.36, 1)';
      setTimeout(() => {
        this.darkCore.style.width = '60px';
        this.darkCore.style.height = '60px';
        this.darkCore.style.opacity = '0.6';
      }, 10);
    }
    
    // Activer l'anneau galactique
    if (this.galacticRing) {
      this.galacticRing.style.animation = `ctaRingExpand var(--cta-ring-duration) cubic-bezier(0.19, 1, 0.22, 1) forwards`;
    }
  }
  
  handleMouseLeave(e) {
    this.isHovering = false;
    
    // Réinitialiser le noyau sombre
    if (this.darkCore) {
      this.darkCore.style.width = '0';
      this.darkCore.style.height = '0';
      this.darkCore.style.opacity = '0';
    }
    
    // Réinitialiser l'anneau galactique
    if (this.galacticRing) {
      this.galacticRing.style.animation = 'none';
      this.galacticRing.style.transform = 'translate(-50%, -50%) scale(0)';
      this.galacticRing.style.opacity = '0';
    }
    
    // Nettoyer les particules
    this.clearParticles();
    this.button.classList.remove('proximity-hover');
  }
  
  handleMouseDown(e) {
    this.button.style.transform = 'scale(0.98)';
    
    // Créer des micro-étincelles
    this.createSparkles(5, e.offsetX, e.offsetY);
  }
  
  handleMouseUp(e) {
    this.button.style.transform = '';
  }
  
  handleTouchStart(e) {
    this.handleMouseEnter(e);
    this.handleMouseDown(e);
  }
  
  handleTouchEnd(e) {
    this.handleMouseUp(e);
    this.handleMouseLeave(e);
  }
  
  handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      this.handleMouseEnter(e);
      this.handleMouseDown(e);
    }
  }
  
  handleKeyUp(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      this.handleMouseUp(e);
      setTimeout(() => this.handleMouseLeave(e), 100);
    }
  }
  
  handleProximity(e) {
    if (!this.button || this.isHovering) return;
    
    const rect = this.button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
    
    // Aimantation progressive
    if (distance < this.config.proximityThreshold + rect.width / 2) {
      this.button.classList.add('proximity-hover');
      
      // Micro-déplacement magnétique
      const pullX = (e.clientX - centerX) * this.config.magnetStrength;
      const pullY = (e.clientY - centerY) * this.config.magnetStrength;
      
      this.button.style.setProperty('--mx', `${50 + pullX}%`);
      this.button.style.setProperty('--my', `${50 + pullY}%`);
    } else {
      this.button.classList.remove('proximity-hover');
      this.button.style.setProperty('--mx', '50%');
      this.button.style.setProperty('--my', '50%');
    }
  }
  
  createParticles() {
    if (!this.particleContainer) return;
    
    const rect = this.button.getBoundingClientRect();
    const particleCount = Math.min(this.config.particles, isMobile ? 20 : 36);
    
    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        if (!this.isHovering) return;
        
        const particle = document.createElement('span');
        particle.className = 'cta-particle';
        
        // Position initiale au centre
        const startX = rect.width / 2;
        const startY = rect.height / 2;
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        
        // Variables visuelles de l'étoile
        const rot = Math.floor(Math.random() * 180);
        const len = 10 + Math.random() * 10;      // 10–20px
        const thick = 0.8 + Math.random() * 0.8;  // 0.8–1.6px
        const palette = ['rgba(255,255,255,0.85)','rgba(23,199,210,0.75)','rgba(226,14,150,0.75)','rgba(252,164,62,0.75)'];
        const glow = Math.random() > 0.65 ? palette[1 + Math.floor(Math.random() * 3)] : palette[0];

        particle.style.setProperty('--rot', `${rot}deg`);
        particle.style.setProperty('--len', `${len}px`);
        particle.style.setProperty('--thick', `${thick}px`);
        particle.style.setProperty('--glow', glow);

        // Direction aléatoire
        const angle = Math.random() * Math.PI * 2;
        const velocity = 30 + Math.random() * 70; // 30–100px
        const endX = startX + Math.cos(angle) * velocity;
        const endY = startY + Math.sin(angle) * velocity;
        
        this.particleContainer.appendChild(particle);
        
        // Animation
        particle.animate([
          { 
            transform: 'translate(-50%, -50%) scale(1)',
            opacity: 1,
            filter: 'blur(0px)'
          },
          { 
            transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.25)`,
            opacity: 0,
            filter: 'blur(1.6px)'
          }
        ], {
          duration: this.config.lifeTime + Math.random() * 200,
          easing: 'cubic-bezier(0.19, 1, 0.22, 1)',
          fill: 'forwards'
        }).onfinish = () => particle.remove();
        
      }, i * 8); // Décalage progressif
    }
  }
  
  createSparkles(count, x, y) {
    if (!this.particleContainer) return;
    
    for (let i = 0; i < count; i++) {
      const sparkle = document.createElement('span');
      sparkle.className = 'cta-particle';
      sparkle.style.width = '2px';
      sparkle.style.height = '2px';
      sparkle.style.left = `${x}px`;
      sparkle.style.top = `${y}px`;
      sparkle.style.setProperty('--glow', 'rgba(255,255,255,0.95)');
      sparkle.style.setProperty('--len', `${8 + Math.random()*6}px`);
      sparkle.style.setProperty('--thick', `${0.8 + Math.random()*0.6}px`);
      sparkle.style.setProperty('--rot', `${Math.floor(Math.random()*180)}deg`);
      
      this.particleContainer.appendChild(sparkle);
      
      const angle = (Math.PI * 2 / count) * i;
      const distance = 20 + Math.random() * 10;
      
      sparkle.animate([
        { 
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: 1
        },
        { 
          transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
          opacity: 0
        }
      ], {
        duration: 300,
        easing: 'ease-out',
        fill: 'forwards'
      }).onfinish = () => sparkle.remove();
    }
  }
  
  clearParticles() {
    if (this.particleContainer) {
      // Fade out existantes
      const particles = this.particleContainer.querySelectorAll('.cta-particle');
      particles.forEach(p => {
        p.style.transition = 'opacity 200ms ease';
        p.style.opacity = '0';
        setTimeout(() => p.remove(), 200);
      });
    }
  }
  
  respectReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Désactiver les animations complexes
      this.config.particles = 0;
      this.button.style.animation = 'none';
      
      if (this.darkCore) this.darkCore.style.display = 'none';
      if (this.galacticRing) this.galacticRing.style.display = 'none';
    }
  }
  
  destroy() {
    // Nettoyer tous les écouteurs
    this.button.removeEventListener('mouseenter', this.handleMouseEnter);
    this.button.removeEventListener('mouseleave', this.handleMouseLeave);
    this.button.removeEventListener('mousedown', this.handleMouseDown);
    this.button.removeEventListener('mouseup', this.handleMouseUp);
    this.button.removeEventListener('touchstart', this.handleTouchStart);
    this.button.removeEventListener('touchend', this.handleTouchEnd);
    this.button.removeEventListener('keydown', this.handleKeyDown);
    this.button.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mousemove', this.handleProximity);
    
    this.clearParticles();
  }
}

// Initialisation des boutons Chrome Cuberto
document.addEventListener('DOMContentLoaded', function() {
  const ctaButtons = document.querySelectorAll('.btn.cta-formation');
  ctaButtons.forEach(button => {
    new ChromeCubertoButton(button);
  });
});
