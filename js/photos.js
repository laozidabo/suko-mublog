/**
 * Edgerunners Theme - Photos
 * Lightbox gallery with keyboard navigation
 */

(function () {
  'use strict';

  let currentIndex = 0;
  let photos = [];
  let overlay = null;

  function $(sel, parent) {
    return (parent || document).querySelector(sel);
  }

  function $$(sel, parent) {
    return Array.from((parent || document).querySelectorAll(sel));
  }

  function createOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
      <div class="lightbox-container">
        <button class="lightbox-close" title="关闭">✕</button>
        <button class="lightbox-prev" title="上一张">❮</button>
        <button class="lightbox-next" title="下一张">❯</button>
        <div class="lightbox-image-wrapper">
          <img class="lightbox-image" src="" alt="">
        </div>
        <div class="lightbox-info">
          <span class="lightbox-title"></span>
          <span class="lightbox-counter"></span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Close button
    $('.lightbox-close', overlay).addEventListener('click', closeLightbox);

    // Nav buttons
    $('.lightbox-prev', overlay).addEventListener('click', function (e) {
      e.stopPropagation();
      navigate(-1);
    });

    $('.lightbox-next', overlay).addEventListener('click', function (e) {
      e.stopPropagation();
      navigate(1);
    });

    // Click overlay to close
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.classList.contains('lightbox-container')) {
        closeLightbox();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    });

    return overlay;
  }

  function openLightbox(index) {
    currentIndex = index;
    const ov = createOverlay();
    updateLightbox();
    ov.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigate(dir) {
    currentIndex = (currentIndex + dir + photos.length) % photos.length;
    updateLightbox();
  }

  function updateLightbox() {
    if (!overlay || !photos.length) return;
    const photo = photos[currentIndex];
    const img = $('.lightbox-image', overlay);
    const title = $('.lightbox-title', overlay);
    const counter = $('.lightbox-counter', overlay);

    if (img) {
      img.src = photo.src;
      img.alt = photo.title || '';
    }
    if (title) title.textContent = photo.title || '';
    if (counter) counter.textContent = (currentIndex + 1) + ' / ' + photos.length;
  }

  function initPhotoGrid() {
    const grid = $('.photo-grid');
    if (!grid) return;

    // Collect all photo items
    photos = $$('.photo-item', grid).map(function (item) {
      const img = $('img', item);
      const title = $('.photo-title', item);
      return {
        src: img ? img.src : '',
        title: title ? title.textContent : ''
      };
    });

    // Add click handlers
    $$('.photo-item', grid).forEach(function (item, index) {
      item.addEventListener('click', function () {
        openLightbox(index);
      });
    });
  }

  function initLazyLoad() {
    const images = $$('.photo-item img');
    if (!images.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '100px' });

      images.forEach(function (img) {
        observer.observe(img);
      });
    } else {
      // Fallback: load all immediately
      images.forEach(function (img) {
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        img.classList.add('loaded');
      });
    }
  }

  function init() {
    initPhotoGrid();
    initLazyLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
