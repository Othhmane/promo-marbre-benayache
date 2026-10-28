/**
 * Promo Marbre Benayache - main.js (Haute Performance & Zéro Dépendance)
 * Optimisé pour la vitesse, l'autonomie sur mobile et l'accessibilité.
 */

(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. NAVIGATION : MENU MOBILE & EFFET DE SCROLL OPTIMISÉ (RAF)
       ========================================================================== */
    const navbar = document.getElementById('navbar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    // Menu Mobile
    if (mobileMenuBtn && mobileMenu) {
      const toggleMenu = (open) => {
        const isOpen = open !== undefined ? open : !mobileMenu.classList.contains('is-open');
        mobileMenu.classList.toggle('is-open', isOpen);
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
      };

      mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
      });

      mobileLinks.forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
      });

      // Fermer au clic extérieur
      document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
          toggleMenu(false);
        }
      });
    }

    // Effet Navbar au Scroll via requestAnimationFrame (Pas de layout thrashing)
    if (navbar) {
      let isScrolling = false;
      const handleNavbarScroll = () => {
        if (window.scrollY > 40) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
        isScrolling = false;
      };

      window.addEventListener('scroll', () => {
        if (!isScrolling) {
          window.requestAnimationFrame(handleNavbarScroll);
          isScrolling = true;
        }
      }, { passive: true });
    }

    /* ==========================================================================
       2. GESTION INTELLIGENTE DE LA VIDÉO HERO (ÉCONOMIE CPU / BATTERIE)
       ========================================================================== */
    const heroVideo = document.querySelector('.hero-video-bg');
    if (heroVideo && 'IntersectionObserver' in window) {
      // Met en pause la vidéo quand elle n'est plus visible à l'écran
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            heroVideo.play().catch(() => {});
          } else {
            heroVideo.pause();
          }
        });
      }, { threshold: 0.1 });

      videoObserver.observe(heroVideo);
    }

    /* ==========================================================================
       3. CARROUSEL HAUTE PERFORMANCE (TACTILE, SOURIS & CLAVIER)
       ========================================================================== */
    function initCarousel(trackId, dotsId, autoSpeed = 3600) {
      const track = document.getElementById(trackId);
      if (!track) return;
      const slides = track.querySelectorAll('.carousel-slide');
      if (slides.length === 0) return;

      const dotsContainer = dotsId ? document.getElementById(dotsId) : null;
      let currentIndex = 0;
      let autoPlayTimer = null;
      let isPaused = false;
      let resumeTimeout = null;

      // Cache des dimensions pour éviter les reflows constants
      let cachedStep = 0;
      let cachedMaxIndex = 0;

      const computeDimensions = () => {
        if (!slides[0]) return;
        const slideRect = slides[0].getBoundingClientRect();
        const gap = parseFloat(window.getComputedStyle(track).gap) || 20;
        cachedStep = slideRect.width + gap;

        const containerWidth = track.parentElement.getBoundingClientRect().width;
        const visibleCount = Math.max(1, Math.floor((containerWidth + gap) / cachedStep));
        cachedMaxIndex = Math.max(0, slides.length - visibleCount);
      };

      const renderDots = () => {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        const totalDots = cachedMaxIndex + 1;

        for (let i = 0; i < totalDots; i++) {
          const dot = document.createElement('button');
          dot.className = `carousel-dot ${i === currentIndex ? 'active' : 'inactive'}`;
          dot.setAttribute('aria-label', `Voir diapositive ${i + 1}`);
          dot.addEventListener('click', () => {
            goToSlide(i);
            resetAutoPlay();
          });
          dotsContainer.appendChild(dot);
        }
      };

      const updateDots = () => {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, idx) => {
          if (idx === currentIndex) {
            dot.classList.add('active');
            dot.classList.remove('inactive');
          } else {
            dot.classList.add('inactive');
            dot.classList.remove('active');
          }
        });
      };

      const updateSlider = () => {
        if (currentIndex > cachedMaxIndex) currentIndex = cachedMaxIndex;
        if (currentIndex < 0) currentIndex = 0;

        // Utilise translate3d pour une accélération matérielle GPU à 60/120 fps
        track.style.transform = `translate3d(-${currentIndex * cachedStep}px, 0, 0)`;
        updateDots();
      };

      const goToSlide = (idx) => {
        if (idx > cachedMaxIndex) {
          currentIndex = 0;
        } else if (idx < 0) {
          currentIndex = cachedMaxIndex;
        } else {
          currentIndex = idx;
        }
        updateSlider();
      };

      const startAutoPlay = () => {
        if (autoPlayTimer) clearInterval(autoPlayTimer);
        autoPlayTimer = setInterval(() => {
          if (!isPaused) {
            if (currentIndex >= cachedMaxIndex) {
              currentIndex = 0;
            } else {
              currentIndex++;
            }
            updateSlider();
          }
        }, autoSpeed);
      };

      const resetAutoPlay = () => {
        startAutoPlay();
      };

      // Pause lors du survol de souris
      const parentWrap = track.parentElement;
      parentWrap.addEventListener('mouseenter', () => { isPaused = true; });
      parentWrap.addEventListener('mouseleave', () => { isPaused = false; });

      // Support du balayage tactile ultra-fluide (passive listeners)
      let startX = 0;
      let currentX = 0;
      let isSwiping = false;

      track.addEventListener('touchstart', (e) => {
        isPaused = true;
        if (resumeTimeout) clearTimeout(resumeTimeout);
        startX = e.touches[0].clientX;
        currentX = startX;
        isSwiping = true;
      }, { passive: true });

      track.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        currentX = e.touches[0].clientX;
      }, { passive: true });

      track.addEventListener('touchend', () => {
        if (!isSwiping) return;
        isSwiping = false;
        const diff = startX - currentX;
        if (Math.abs(diff) > 40) {
          if (diff > 0) {
            goToSlide(currentIndex + 1);
          } else {
            goToSlide(currentIndex - 1);
          }
        }
        resumeTimeout = setTimeout(() => {
          isPaused = false;
        }, 2500);
      }, { passive: true });

      // Support clavier (Flèches gauche / droite)
      track.parentElement.setAttribute('tabindex', '0');
      track.parentElement.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
          goToSlide(currentIndex + 1);
          resetAutoPlay();
        } else if (e.key === 'ArrowLeft') {
          goToSlide(currentIndex - 1);
          resetAutoPlay();
        }
      });

      // Redimensionnement avec debounce
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          computeDimensions();
          renderDots();
          updateSlider();
        }, 150);
      }, { passive: true });

      // Init
      computeDimensions();
      renderDots();
      updateSlider();
      startAutoPlay();
    }

    // Initialisation des carrousels marbres & réalisations
    initCarousel('carouselTrack', 'carouselDots', 3600);
    initCarousel('applicationsTrack', 'applicationsDots', 4000);

    /* ==========================================================================
       4. MODALE DE DÉTAILS DE LA PIERRE AVEC ACCESSIBILITÉ & WHATSAPP DYNAMIQUE
       ========================================================================== */
    const stoneModal = document.getElementById('stoneDetailsModal');
    const closeStoneModalBtn = document.getElementById('closeStoneModalBtn');
    const stoneCards = document.querySelectorAll('.stone-full-card');

    const modalImg = document.getElementById('modalStoneImg');
    const modalTitle = document.getElementById('modalStoneTitle');
    const modalOrigin = document.getElementById('modalStoneOrigin');
    const modalThickness = document.getElementById('modalStoneThickness');
    const modalFinish = document.getElementById('modalStoneFinish');
    const modalDesc = document.getElementById('modalStoneDesc');
    const modalApp = document.getElementById('modalStoneApp');
    const modalWhatsAppBtn = document.getElementById('modalStoneWhatsAppBtn');

    let previousActiveElement = null;

    const openModal = (card) => {
      previousActiveElement = document.activeElement;

      const name = card.getAttribute('data-name') || '';
      const origin = card.getAttribute('data-origin') || '';
      const thickness = card.getAttribute('data-thickness') || '';
      const finish = card.getAttribute('data-finish') || '';
      const desc = card.getAttribute('data-desc') || '';
      const app = card.getAttribute('data-app') || '';
      const img = card.getAttribute('data-img') || '';

      if (modalTitle) modalTitle.textContent = name;
      if (modalOrigin) modalOrigin.textContent = origin;
      if (modalThickness) modalThickness.textContent = thickness;
      if (modalFinish) modalFinish.textContent = finish;
      if (modalDesc) modalDesc.textContent = desc;
      if (modalApp) modalApp.textContent = app;
      if (modalImg) {
        modalImg.src = img;
        modalImg.alt = `Tranche de ${name}`;
      }

      if (modalWhatsAppBtn) {
        const msg = `Bonjour Promo Marbre Benayache,%0A%0AJe souhaite avoir des informations et le tarif pour le *${encodeURIComponent(name)}* (${encodeURIComponent(origin)}).%0A%0APouvez-vous me renseigner ?`;
        modalWhatsAppBtn.href = `https://wa.me/213660492010?text=${msg}`;
      }

      if (stoneModal) {
        stoneModal.classList.add('is-active');
        document.body.style.overflow = 'hidden'; // Bloque le défilement de fond
        if (closeStoneModalBtn) closeStoneModalBtn.focus();
      }
    };

    const closeModal = () => {
      if (stoneModal) {
        stoneModal.classList.remove('is-active');
        document.body.style.overflow = '';
        if (previousActiveElement) previousActiveElement.focus();
      }
    };

    stoneCards.forEach(card => {
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Voir les détails pour ${card.getAttribute('data-name')}`);

      card.addEventListener('click', () => openModal(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(card);
        }
      });
    });

    if (closeStoneModalBtn && stoneModal) {
      closeStoneModalBtn.addEventListener('click', closeModal);

      stoneModal.addEventListener('click', (e) => {
        if (e.target === stoneModal) {
          closeModal();
        }
      });

      // Fermeture via touche Escape (Échap)
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && stoneModal.classList.contains('is-active')) {
          closeModal();
        }
      });
    }

    /* ==========================================================================
       6. CONTRÔLE DU SON VIDÉO CAMION (EXTRACTION)
       ========================================================================== */
    const truckVideo = document.getElementById('truckVideo');
    const truckVideoSoundBtn = document.getElementById('truckVideoSoundBtn');
    if (truckVideo && truckVideoSoundBtn) {
      const iconMuted = truckVideoSoundBtn.querySelector('.sound-icon-muted');
      const iconUnmuted = truckVideoSoundBtn.querySelector('.sound-icon-unmuted');
      const soundText = truckVideoSoundBtn.querySelector('.sound-btn-text');

      truckVideoSoundBtn.addEventListener('click', () => {
        truckVideo.muted = !truckVideo.muted;
        if (truckVideo.muted) {
          if (iconMuted) iconMuted.style.display = 'inline-block';
          if (iconUnmuted) iconUnmuted.style.display = 'none';
          if (soundText) soundText.textContent = 'Son désactivé';
        } else {
          if (iconMuted) iconMuted.style.display = 'none';
          if (iconUnmuted) iconUnmuted.style.display = 'inline-block';
          if (soundText) soundText.textContent = 'Son activé';
          truckVideo.play().catch(() => {});
        }
      });
    }

    /* ==========================================================================
       7. MODALE LIGHTBOX : OUVERTURE DES PHOTOS DE NOS RÉALISATIONS
       ========================================================================== */
    const realCards = Array.from(document.querySelectorAll('.application-slide-card'));
    const realModal = document.getElementById('realizationModal');
    const closeRealModalBtn = document.getElementById('closeRealModalBtn');
    const realModalPrevBtn = document.getElementById('realModalPrevBtn');
    const realModalNextBtn = document.getElementById('realModalNextBtn');
    const realModalImg = document.getElementById('realModalImg');
    const realModalTitle = document.getElementById('realModalTitle');
    const realModalDesc = document.getElementById('realModalDesc');
    const realModalWhatsAppBtn = document.getElementById('realModalWhatsAppBtn');

    let currentRealIndex = 0;
    let previousRealActiveElement = null;

    const updateRealModalContent = (index) => {
      if (!realCards.length) return;
      currentRealIndex = (index + realCards.length) % realCards.length;
      const card = realCards[currentRealIndex];

      const title = card.getAttribute('data-real-title') || '';
      const desc = card.getAttribute('data-real-desc') || '';
      const img = card.getAttribute('data-real-img') || '';
      const alt = card.getAttribute('data-real-alt') || title;

      if (realModalTitle) realModalTitle.textContent = title;
      if (realModalDesc) realModalDesc.textContent = desc;
      if (realModalImg) {
        realModalImg.style.opacity = '0.3';
        realModalImg.src = img;
        realModalImg.alt = alt;
        realModalImg.onload = () => {
          realModalImg.style.opacity = '1';
        };
      }

      if (realModalWhatsAppBtn) {
        const msg = `Bonjour Promo Marbre Benayache,%0A%0AJe souhaite avoir des informations et un devis pour votre réalisation : *${encodeURIComponent(title)}* (${encodeURIComponent(desc)}).%0A%0APouvez-vous me renseigner ?`;
        realModalWhatsAppBtn.href = `https://wa.me/213660492010?text=${msg}`;
      }
    };

    const openRealModal = (cardIndex) => {
      previousRealActiveElement = document.activeElement;
      updateRealModalContent(cardIndex);

      if (realModal) {
        realModal.classList.add('is-active');
        document.body.style.overflow = 'hidden';
        if (closeRealModalBtn) closeRealModalBtn.focus();
      }
    };

    const closeRealModal = () => {
      if (realModal) {
        realModal.classList.remove('is-active');
        document.body.style.overflow = '';
        if (previousRealActiveElement) previousRealActiveElement.focus();
      }
    };

    realCards.forEach((card, index) => {
      card.addEventListener('click', () => openRealModal(index));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openRealModal(index);
        }
      });
    });

    if (closeRealModalBtn) {
      closeRealModalBtn.addEventListener('click', closeRealModal);
    }

    if (realModalPrevBtn) {
      realModalPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateRealModalContent(currentRealIndex - 1);
      });
    }

    if (realModalNextBtn) {
      realModalNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateRealModalContent(currentRealIndex + 1);
      });
    }

    if (realModal) {
      realModal.addEventListener('click', (e) => {
        if (e.target === realModal) {
          closeRealModal();
        }
      });
    }

    // Navigation au clavier pour la modale réalisations
    document.addEventListener('keydown', (e) => {
      if (realModal && realModal.classList.contains('is-active')) {
        if (e.key === 'Escape') {
          closeRealModal();
        } else if (e.key === 'ArrowLeft') {
          updateRealModalContent(currentRealIndex - 1);
        } else if (e.key === 'ArrowRight') {
          updateRealModalContent(currentRealIndex + 1);
        }
      }
    });

  });
})();
