/**
 * Edgerunners Theme - Main JavaScript
 * Core interactivity: weather, sidebar, navigation, glitch effects
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════
  // CONFIG
  // ═══════════════════════════════════════════
  const CONFIG = {
    weatherCities: [
      { name: '大荔县', query: 'Dali,Shaanxi' },
      { name: '韩城市', query: 'Hancheng,Shaanxi' }
    ],
    quotes: [
      '"I\'ll live twice as much in half the time." — David Martinez',
      '"You can\'t change the world with dreams alone. You have to fight." — Lucy',
      '"Wrong turn, gonk!" — Rebecca',
      '"Welcome to Night City." — Narrator',
      '"The only rule is: there are no rules." — Maine',
      '"I don\'t need a reason to help someone." — Rebecca',
      '"In Night City, you can be anyone you want... for a price."',
      '"Edgerunners don\'t follow the rules. They make them."',
      '"The city\'s gonna eat you alive, choom." — Falco',
      '"I\'d rather burn out than fade away." — David Martinez'
    ],
    weatherUpdateInterval: 30 * 60 * 1000 // 30 minutes
  };

  // ═══════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════
  function $(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  function $$(selector, parent) {
    return Array.from((parent || document).querySelectorAll(selector));
  }

  function on(el, event, handler, options) {
    if (el) el.addEventListener(event, handler, options);
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // ═══════════════════════════════════════════
  // MOBILE NAVIGATION
  // ═══════════════════════════════════════════
  function initMobileNav() {
    const toggle = $('.mobile-menu-toggle');
    const nav = $('.nav-links');
    if (!toggle || !nav) return;

    on(toggle, 'click', function () {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
      toggle.classList.toggle('active');
      nav.classList.toggle('open');
      document.body.classList.toggle('nav-open');
    });

    // Close on link click
    $$('.nav-link', nav).forEach(function (link) {
      on(link, 'click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.classList.remove('active');
        nav.classList.remove('open');
        document.body.classList.remove('nav-open');
      });
    });

    // Close on outside click
    on(document, 'click', function (e) {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.classList.remove('active');
        nav.classList.remove('open');
        document.body.classList.remove('nav-open');
      }
    });
  }

  // ═══════════════════════════════════════════
  // SIDEBAR TOGGLE
  // ═══════════════════════════════════════════
  function initSidebar() {
    const toggle = $('.sidebar-toggle');
    const sidebar = $('.sidebar');
    const overlay = $('.sidebar-overlay');
    if (!toggle || !sidebar) return;

    function openSidebar() {
      sidebar.classList.add('open');
      toggle.classList.add('active');
      if (overlay) overlay.classList.add('active');
      document.body.classList.add('sidebar-open');
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      toggle.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      document.body.classList.remove('sidebar-open');
    }

    on(toggle, 'click', function () {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });

    on(overlay, 'click', closeSidebar);
  }

  // ═══════════════════════════════════════════
  // BACK TO TOP
  // ═══════════════════════════════════════════
  function initBackToTop() {
    const btn = $('.back-to-top');
    if (!btn) return;

    function checkScroll() {
      if (window.scrollY > 300) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }

    on(window, 'scroll', debounce(checkScroll, 100));
    checkScroll();

    on(btn, 'click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ═══════════════════════════════════════════
  // WEATHER WIDGET
  // ═══════════════════════════════════════════
  function getClothingAdvice(temp, weather) {
    const w = (weather || '').toLowerCase();
    let advice = '';

    if (temp < 0) {
      advice = '极寒天气，穿羽绒服、保暖内衣、围巾手套帽子全副武装';
    } else if (temp < 5) {
      advice = '很冷，穿厚羽绒服或棉服，搭配毛衣和保暖裤';
    } else if (temp < 10) {
      advice = '偏冷，建议穿外套或风衣，内搭毛衣';
    } else if (temp < 15) {
      advice = '微凉，薄外套或卫衣即可，早晚注意添衣';
    } else if (temp < 20) {
      advice = '舒适温度，长袖T恤或薄衬衫，适合出行';
    } else if (temp < 25) {
      advice = '温暖，短袖或薄长袖，可以穿裙子或短裤';
    } else if (temp < 30) {
      advice = '较热，穿短袖短裤，注意防晒';
    } else if (temp < 35) {
      advice = '炎热，尽量穿轻薄透气衣物，多喝水防暑';
    } else {
      advice = '酷暑！避免外出，穿最薄的衣服，做好防暑降温';
    }

    if (w.includes('rain') || w.includes('雨')) {
      advice += '，记得带伞';
    } else if (w.includes('snow') || w.includes('雪')) {
      advice += '，注意路面湿滑';
    } else if (w.includes('wind') || w.includes('风')) {
      advice += '，风大注意保暖';
    } else if (w.includes('sun') || w.includes('晴') || w.includes('clear')) {
      advice += '，紫外线较强建议涂防晒';
    }

    return advice;
  }

  function getWeatherIcon(code) {
    if (code <= 1) return '☀';
    if (code <= 3) return '⛅';
    if (code <= 49) return '🌫';
    if (code <= 59) return '🌧';
    if (code <= 69) return '🌨';
    if (code <= 79) return '❄';
    if (code <= 84) return '🌧';
    if (code <= 99) return '⛈';
    return '☁';
  }

  async function fetchWeather(city) {
    try {
      const url = `https://wttr.in/${city.query}?format=j1&lang=zh`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Weather fetch failed');
      const data = await resp.json();
      const current = data.current_condition[0];
      const temp = parseInt(current.temp_C);
      const feelsLike = parseInt(current.FeelsLikeC);
      const humidity = current.humidity;
      const desc = current.lang_zh && current.lang_zh[0]
        ? current.lang_zh[0].value
        : current.weatherDesc[0].value;
      const windSpeed = current.windspeedKmph;
      const weatherCode = parseInt(current.weatherCode);

      return {
        city: city.name,
        temp: temp,
        feelsLike: feelsLike,
        humidity: humidity,
        desc: desc,
        windSpeed: windSpeed,
        icon: getWeatherIcon(weatherCode),
        clothing: getClothingAdvice(temp, desc)
      };
    } catch (err) {
      console.warn(`Weather fetch failed for ${city.name}:`, err);
      return {
        city: city.name,
        temp: '--',
        feelsLike: '--',
        humidity: '--',
        desc: '获取失败',
        windSpeed: '--',
        icon: '❓',
        clothing: '无法获取天气数据'
      };
    }
  }

  function renderWeather(data) {
    const content = $('#weatherContent');
    const clothing = $('#clothingContent');
    if (!content) return;

    let html = '';
    data.forEach(function (w) {
      html += `
        <div class="weather-city">
          <div class="weather-city-name">${w.icon} ${w.city}</div>
          <div class="weather-temp">${w.temp}°C</div>
          <div class="weather-desc">${w.desc}</div>
          <div class="weather-details">
            <span>体感 ${w.feelsLike}°C</span>
            <span>湿度 ${w.humidity}%</span>
            <span>风速 ${w.windSpeed}km/h</span>
          </div>
        </div>
      `;
    });
    content.innerHTML = html;

    if (clothing) {
      let adviceHtml = '';
      data.forEach(function (w) {
        adviceHtml += `<div class="clothing-city"><strong>${w.city}：</strong>${w.clothing}</div>`;
      });
      clothing.innerHTML = adviceHtml;
    }
  }

  async function updateWeather() {
    const results = await Promise.all(CONFIG.weatherCities.map(fetchWeather));
    renderWeather(results);
  }

  function initWeather() {
    const toggle = $('#weatherToggle');
    const panel = $('#weatherPanel');
    const close = $('#weatherClose');
    if (!toggle || !panel) return;

    on(toggle, 'click', function () {
      panel.classList.toggle('open');
      toggle.classList.toggle('active');
      if (panel.classList.contains('open')) {
        updateWeather();
      }
    });

    on(close, 'click', function () {
      panel.classList.remove('open');
      toggle.classList.remove('active');
    });

    // Auto-update periodically
    setInterval(updateWeather, CONFIG.weatherUpdateInterval);
  }

  // ═══════════════════════════════════════════
  // EDGERUNNERS QUOTES ROTATION
  // ═══════════════════════════════════════════
  function initQuotes() {
    const el = $('.sidebar-quote');
    if (!el) return;

    let lastIndex = -1;
    function showRandomQuote() {
      let idx;
      do {
        idx = Math.floor(Math.random() * CONFIG.quotes.length);
      } while (idx === lastIndex && CONFIG.quotes.length > 1);
      lastIndex = idx;
      el.textContent = CONFIG.quotes[idx];
      el.classList.remove('fade-in');
      void el.offsetWidth; // force reflow
      el.classList.add('fade-in');
    }

    showRandomQuote();
    setInterval(showRandomQuote, 15000);
  }

  // ═══════════════════════════════════════════
  // GLITCH EFFECTS
  // ═══════════════════════════════════════════
  function initGlitch() {
    // Random glitch flicker on page title
    const titles = $$('.glitch-text');
    if (!titles.length) return;

    function randomGlitch() {
      titles.forEach(function (el) {
        if (Math.random() < 0.1) {
          el.classList.add('glitching');
          setTimeout(function () {
            el.classList.remove('glitching');
          }, 100 + Math.random() * 200);
        }
      });
    }

    setInterval(randomGlitch, 3000);
  }

  // ═══════════════════════════════════════════
  // SCANLINE INTENSITY RANDOMIZER
  // ═══════════════════════════════════════════
  function initScanlines() {
    const overlay = $('.scanlines');
    if (!overlay) return;

    // Subtle intensity variation
    setInterval(function () {
      const opacity = 0.03 + Math.random() * 0.02;
      overlay.style.opacity = opacity;
    }, 5000);
  }

  // ═══════════════════════════════════════════
  // TYPING EFFECT (for hero subtitle)
  // ═══════════════════════════════════════════
  function initTyping() {
    const el = $('.typing-text');
    if (!el) return;

    const text = el.getAttribute('data-text') || el.textContent;
    el.textContent = '';
    el.style.visibility = 'visible';

    let i = 0;
    function type() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(type, 50 + Math.random() * 80);
      }
    }

    setTimeout(type, 500);
  }

  // ═══════════════════════════════════════════
  // SCROLL ANIMATIONS (Intersection Observer)
  // ═══════════════════════════════════════════
  function initScrollAnimations() {
    const elements = $$('.animate-on-scroll');
    if (!elements.length) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ═══════════════════════════════════════════
  // EXTERNAL LINKS
  // ═══════════════════════════════════════════
  function initExternalLinks() {
    $$('a[href^="http"]').forEach(function (link) {
      if (!link.hostname.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  // ═══════════════════════════════════════════
  // READING PROGRESS BAR
  // ═══════════════════════════════════════════
  function initReadingProgress() {
    const bar = $('.reading-progress');
    if (!bar) return;

    on(window, 'scroll', debounce(function () {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / docHeight) * 100;
      bar.style.width = Math.min(progress, 100) + '%';
    }, 16));
  }

  // ═══════════════════════════════════════════
  // CODE BLOCK COPY BUTTON
  // ═══════════════════════════════════════════
  function initCodeCopy() {
    $$('.highlight').forEach(function (block) {
      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.textContent = 'COPY';
      btn.setAttribute('title', '复制代码');

      on(btn, 'click', function () {
        const code = $('code', block) || $('textarea', block);
        if (!code) return;
        const text = code.textContent || code.value;
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = 'COPIED!';
          btn.classList.add('copied');
          setTimeout(function () {
            btn.textContent = 'COPY';
            btn.classList.remove('copied');
          }, 2000);
        });
      });

      block.style.position = 'relative';
      block.appendChild(btn);
    });
  }

  // ═══════════════════════════════════════════
  // HEADER SCROLL EFFECT
  // ═══════════════════════════════════════════
  function initHeaderScroll() {
    const header = $('.site-header');
    if (!header) return;

    let lastScroll = 0;
    on(window, 'scroll', debounce(function () {
      const current = window.scrollY;
      if (current > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      if (current > lastScroll && current > 200) {
        header.classList.add('hidden');
      } else {
        header.classList.remove('hidden');
      }
      lastScroll = current;
    }, 50));
  }

  // ═══════════════════════════════════════════
  // CONSOLE EASTER EGG
  // ═══════════════════════════════════════════
  function initConsoleEasterEgg() {
    console.log(
      '%c╔══════════════════════════════════╗\n' +
      '║  WELCOME TO NIGHT CITY, CHOOM.  ║\n' +
      '║  — Edgerunners Theme            ║\n' +
      '╚══════════════════════════════════╝',
      'color: #ff2a6d; font-family: monospace; font-size: 12px;'
    );
  }

  // ═══════════════════════════════════════════
  // INIT ALL
  // ═══════════════════════════════════════════
  function init() {
    initMobileNav();
    initSidebar();
    initBackToTop();
    initWeather();
    initQuotes();
    initGlitch();
    initScanlines();
    initTyping();
    initScrollAnimations();
    initExternalLinks();
    initReadingProgress();
    initCodeCopy();
    initHeaderScroll();
    initConsoleEasterEgg();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
