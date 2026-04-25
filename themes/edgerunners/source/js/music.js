/**
 * Edgerunners Theme - Music Player
 * Search songs by name, play directly, playlist management
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════
  // MUSIC API (NetEase Cloud Music proxy)
  // ═══════════════════════════════════════════
  const API_BASE = 'https://api.injahow.cn/meting';

  let playlist = [];
  let currentIndex = 0;
  let audio = null;
  let isPlaying = false;
  let audioCtx = null;
  let analyser = null;
  let visualizerRAF = null;
  let searchTimer = null;

  // ═══════════════════════════════════════════
  // DOM HELPERS
  // ═══════════════════════════════════════════
  function $(sel, parent) {
    return (parent || document).querySelector(sel);
  }

  function $$(sel, parent) {
    return Array.from((parent || document).querySelectorAll(sel));
  }

  // ═══════════════════════════════════════════
  // MUSIC API - Search & Get URL
  // ═══════════════════════════════════════════
  async function searchSongs(keyword) {
    try {
      const url = `${API_BASE}?type=search&source=netease&s=${encodeURIComponent(keyword)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Search failed');
      const data = await resp.json();
      if (!Array.isArray(data)) return [];
      return data.slice(0, 10).map(function (item) {
        return {
          id: item.id,
          title: item.title || item.name || 'Unknown',
          artist: item.author || item.artist || 'Unknown',
          url: `${API_BASE}?type=url&source=netease&id=${item.id}`,
          cover: item.pic || item.cover || '',
          duration: item.duration || 0
        };
      });
    } catch (err) {
      console.warn('Search failed:', err);
      return [];
    }
  }

  // ═══════════════════════════════════════════
  // MINI PLAYER (floating widget)
  // ═══════════════════════════════════════════
  function initMiniPlayer() {
    const toggle = $('#miniPlayerToggle');
    const panel = $('#miniPlayerPanel');
    const playBtn = $('#miniPlay');
    const prevBtn = $('#miniPrev');
    const nextBtn = $('#miniNext');
    const titleEl = $('#miniTitle');
    const artistEl = $('#miniArtist');
    const progressEl = $('#miniProgress');

    if (!toggle || !panel) return;

    audio = document.getElementById('audioPlayer');
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'audioPlayer';
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      document.body.appendChild(audio);
    }

    // Load saved playlist
    try {
      const saved = localStorage.getItem('edgerunners_playlist');
      playlist = saved ? JSON.parse(saved) : [];
    } catch (e) {
      playlist = [];
    }

    // Toggle panel
    toggle.addEventListener('click', function () {
      panel.classList.toggle('open');
      toggle.classList.toggle('active');
    });

    // Play/Pause
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (isPlaying) pause();
        else play();
      });
    }

    // Prev/Next
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (!playlist.length) return;
        currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        loadAndPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (!playlist.length) return;
        currentIndex = (currentIndex + 1) % playlist.length;
        loadAndPlay();
      });
    }

    // Audio events
    audio.addEventListener('timeupdate', function () {
      if (audio.duration && progressEl) {
        const pct = (audio.currentTime / audio.duration) * 100;
        progressEl.style.width = pct + '%';
      }
    });

    audio.addEventListener('ended', function () {
      if (!playlist.length) return;
      currentIndex = (currentIndex + 1) % playlist.length;
      loadAndPlay();
    });

    audio.addEventListener('error', function () {
      if (titleEl) titleEl.textContent = '播放出错';
      isPlaying = false;
      updatePlayButton();
    });

    updateMiniDisplay();
  }

  function loadAndPlay() {
    if (!audio || !playlist.length) return;
    const track = playlist[currentIndex];
    if (!track || !track.url) {
      currentIndex = (currentIndex + 1) % playlist.length;
      if (currentIndex !== 0) loadAndPlay();
      return;
    }
    audio.src = track.url;
    audio.load();
    play();
    updateMiniDisplay();
    updateFullPlayerDisplay();
    renderPlaylist();
  }

  function play() {
    if (!audio) return;
    audio.play().then(function () {
      isPlaying = true;
      updatePlayButton();
      initVisualizer();
    }).catch(function (err) {
      console.warn('Play failed:', err);
      isPlaying = false;
      updatePlayButton();
    });
  }

  function pause() {
    if (!audio) return;
    audio.pause();
    isPlaying = false;
    updatePlayButton();
  }

  function updatePlayButton() {
    const miniBtn = $('#miniPlay');
    const fullBtn = $('#fullPlay');
    if (miniBtn) miniBtn.textContent = isPlaying ? '⏸' : '▶';
    if (fullBtn) fullBtn.textContent = isPlaying ? '⏸' : '▶';
  }

  function updateMiniDisplay() {
    const titleEl = $('#miniTitle');
    const artistEl = $('#miniArtist');
    if (!playlist.length || !titleEl) return;
    const track = playlist[currentIndex];
    titleEl.textContent = track.title || 'Unknown';
    if (artistEl) artistEl.textContent = track.artist || 'Unknown';
  }

  // ═══════════════════════════════════════════
  // FULL MUSIC PAGE
  // ═══════════════════════════════════════════
  function initFullPlayer() {
    const container = $('.music-container');
    if (!container) return;

    renderPlaylist();

    // Full player controls
    const playBtn = $('#fullPlay');
    const prevBtn = $('#fullPrev');
    const nextBtn = $('#fullNext');
    const progressBar = $('#fullProgressBar');
    const volumeSlider = $('#volumeSlider');

    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (isPlaying) pause();
        else play();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (!playlist.length) return;
        currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        loadAndPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (!playlist.length) return;
        currentIndex = (currentIndex + 1) % playlist.length;
        loadAndPlay();
      });
    }

    if (progressBar) {
      progressBar.addEventListener('click', function (e) {
        if (!audio || !audio.duration) return;
        const rect = progressBar.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        audio.currentTime = pct * audio.duration;
      });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', function () {
        if (audio) audio.volume = parseFloat(volumeSlider.value);
      });
    }

    updateFullPlayerDisplay();
    initSearchBox();
  }

  // ═══════════════════════════════════════════
  // SEARCH BOX - Type song name, search & play
  // ═══════════════════════════════════════════
  function initSearchBox() {
    const input = $('#songSearchInput');
    const results = $('#songSearchResults');
    const searchBtn = $('#songSearchBtn');
    if (!input || !results) return;

    // Search on input with debounce
    input.addEventListener('input', function () {
      clearTimeout(searchTimer);
      const keyword = input.value.trim();
      if (!keyword) {
        results.innerHTML = '';
        results.classList.remove('open');
        return;
      }
      searchTimer = setTimeout(function () {
        doSearch(keyword, results);
      }, 500);
    });

    // Search on Enter
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        clearTimeout(searchTimer);
        const keyword = input.value.trim();
        if (keyword) doSearch(keyword, results);
      }
    });

    // Search button click
    if (searchBtn) {
      searchBtn.addEventListener('click', function () {
        clearTimeout(searchTimer);
        const keyword = input.value.trim();
        if (keyword) doSearch(keyword, results);
      });
    }
  }

  async function doSearch(keyword, resultsEl) {
    resultsEl.innerHTML = '<div class="search-loading">搜索中...</div>';
    resultsEl.classList.add('open');

    const songs = await searchSongs(keyword);

    if (!songs.length) {
      resultsEl.innerHTML = '<div class="search-loading">未找到相关歌曲</div>';
      return;
    }

    resultsEl.innerHTML = songs.map(function (song, i) {
      return `
        <div class="song-result" data-index="${i}">
          <div class="song-result-info">
            <span class="song-result-title">${song.title}</span>
            <span class="song-result-artist">${song.artist}</span>
          </div>
          <button class="song-result-play" data-index="${i}" title="播放">▶</button>
          <button class="song-result-add" data-index="${i}" title="加入列表">+</button>
        </div>
      `;
    }).join('');

    // Store search results for later use
    resultsEl._songs = songs;

    // Play button - play immediately
    resultsEl.querySelectorAll('.song-result-play').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        const song = songs[idx];
        // Add to playlist and play
        playlist.push(song);
        currentIndex = playlist.length - 1;
        savePlaylist();
        loadAndPlay();
        resultsEl.classList.remove('open');
        resultsEl.innerHTML = '';
        const input = $('#songSearchInput');
        if (input) input.value = '';
      });
    });

    // Add button - add to playlist without playing
    resultsEl.querySelectorAll('.song-result-add').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        const song = songs[idx];
        playlist.push(song);
        savePlaylist();
        renderPlaylist();
        btn.textContent = '✓';
        btn.disabled = true;
        setTimeout(function () {
          btn.textContent = '+';
          btn.disabled = false;
        }, 1500);
      });
    });

    // Click result row to play
    resultsEl.querySelectorAll('.song-result').forEach(function (row) {
      row.addEventListener('click', function () {
        const idx = parseInt(row.dataset.index);
        const song = songs[idx];
        playlist.push(song);
        currentIndex = playlist.length - 1;
        savePlaylist();
        loadAndPlay();
        resultsEl.classList.remove('open');
        resultsEl.innerHTML = '';
        const input = $('#songSearchInput');
        if (input) input.value = '';
      });
    });
  }

  function renderPlaylist() {
    const list = $('#playlistItems');
    if (!list) return;

    if (!playlist.length) {
      list.innerHTML = '<div class="playlist-empty">播放列表为空，搜索歌曲名开始点歌</div>';
      return;
    }

    list.innerHTML = playlist.map(function (track, i) {
      const active = i === currentIndex ? 'active' : '';
      return `
        <div class="playlist-item ${active}" data-index="${i}">
          <span class="playlist-num">${String(i + 1).padStart(2, '0')}</span>
          <div class="playlist-info">
            <span class="playlist-title">${track.title}</span>
            <span class="playlist-artist">${track.artist}</span>
          </div>
          <button class="playlist-delete" data-index="${i}" title="删除">✕</button>
        </div>
      `;
    }).join('');

    // Click to play
    list.querySelectorAll('.playlist-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        if (e.target.classList.contains('playlist-delete')) return;
        currentIndex = parseInt(item.dataset.index);
        loadAndPlay();
      });
    });

    // Delete button
    list.querySelectorAll('.playlist-delete').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        playlist.splice(idx, 1);
        if (currentIndex >= playlist.length) currentIndex = 0;
        if (currentIndex > idx) currentIndex--;
        savePlaylist();
        renderPlaylist();
      });
    });
  }

  function updateFullPlayerDisplay() {
    const titleEl = $('#fullTitle');
    const artistEl = $('#fullArtist');
    const currentTime = $('#fullCurrentTime');
    const duration = $('#fullDuration');
    const progressFill = $('#fullProgressFill');

    if (!playlist.length) return;
    const track = playlist[currentIndex];
    if (titleEl) titleEl.textContent = track.title || 'Unknown';
    if (artistEl) artistEl.textContent = track.artist || 'Unknown';

    function updateTime() {
      if (!audio) return;
      if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
      if (duration) duration.textContent = formatTime(audio.duration || 0);
      if (progressFill && audio.duration) {
        progressFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
      }
    }

    if (audio) {
      audio.removeEventListener('timeupdate', updateTime);
      audio.addEventListener('timeupdate', updateTime);
    }
  }

  function formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function savePlaylist() {
    try {
      localStorage.setItem('edgerunners_playlist', JSON.stringify(playlist));
    } catch (e) { /* ignore */ }
  }

  // ═══════════════════════════════════════════
  // AUDIO VISUALIZER
  // ═══════════════════════════════════════════
  function initVisualizer() {
    const canvas = $('#visualizerCanvas');
    if (!canvas || !audio) return;

    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 256;
      } catch (e) {
        console.warn('Audio visualizer not supported');
        return;
      }
    }

    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      visualizerRAF = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const barCount = 64;
      const barWidth = w / barCount;

      for (let i = 0; i < barCount; i++) {
        const dataIdx = Math.floor(i * bufferLength / barCount);
        const val = dataArray[dataIdx] / 255;
        const barHeight = val * h;

        const r = Math.floor(5 + val * 250);
        const g = Math.floor(217 - val * 175);
        const b = Math.floor(232 - val * 127);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(i * barWidth, h - barHeight, barWidth - 1, barHeight);
      }
    }

    draw();
  }

  // ═══════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════
  function init() {
    initMiniPlayer();
    initFullPlayer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
