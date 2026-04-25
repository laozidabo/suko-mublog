/**
 * Edgerunners Theme - Music Player
 * HTML5 audio player with playlist, visualizer, and song request
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════
  // DEFAULT PLAYLIST (Night City Radio)
  // ═══════════════════════════════════════════
  const DEFAULT_PLAYLIST = [
    {
      title: 'I Really Want to Stay at Your House',
      artist: 'Rosa Walton & Hallie Coggins',
      url: 'https://music.163.com/song/media/outer/url?id=1974444090.mp3',
      cover: ''
    },
    {
      title: 'Let You Down',
      artist: 'Dawid Podsiadło',
      url: 'https://music.163.com/song/media/outer/url?id=1974444091.mp3',
      cover: ''
    },
    {
      title: 'Outsider',
      artist: 'Edgerunners OST',
      url: '',
      cover: ''
    }
  ];

  let playlist = [];
  let currentIndex = 0;
  let audio = null;
  let isPlaying = false;
  let audioCtx = null;
  let analyser = null;
  let visualizerRAF = null;

  // ═══════════════════════════════════════════
  // DOM HELPERS
  // ═══════════════════════════════════════════
  function $(sel, parent) {
    return (parent || document).querySelector(sel);
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
      document.body.appendChild(audio);
    }

    // Load saved playlist or use default
    try {
      const saved = localStorage.getItem('edgerunners_playlist');
      playlist = saved ? JSON.parse(saved) : DEFAULT_PLAYLIST.slice();
    } catch (e) {
      playlist = DEFAULT_PLAYLIST.slice();
    }

    // Toggle panel
    toggle.addEventListener('click', function () {
      panel.classList.toggle('open');
      toggle.classList.toggle('active');
    });

    // Play/Pause
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (isPlaying) {
          pause();
        } else {
          play();
        }
      });
    }

    // Prev/Next
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        loadAndPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
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
      currentIndex = (currentIndex + 1) % playlist.length;
      loadAndPlay();
    });

    audio.addEventListener('error', function () {
      if (titleEl) titleEl.textContent = '播放出错';
      isPlaying = false;
      updatePlayButton();
    });

    // Load first track info
    updateMiniDisplay();
  }

  function loadAndPlay() {
    if (!audio || !playlist.length) return;
    const track = playlist[currentIndex];
    if (!track || !track.url) {
      // Skip tracks without URLs
      currentIndex = (currentIndex + 1) % playlist.length;
      if (currentIndex !== 0) loadAndPlay();
      return;
    }
    audio.src = track.url;
    audio.load();
    play();
    updateMiniDisplay();
    updateFullPlayerDisplay();
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
    if (!playlist.length) return;
    const track = playlist[currentIndex];
    if (titleEl) titleEl.textContent = track.title || 'Unknown';
    if (artistEl) artistEl.textContent = track.artist || 'Unknown';
  }

  // ═══════════════════════════════════════════
  // FULL MUSIC PAGE
  // ═══════════════════════════════════════════
  function initFullPlayer() {
    const container = $('.music-player-full');
    if (!container) return;

    // Render playlist
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
        currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        loadAndPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
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

    // Song request form
    const form = $('#songRequestForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const titleInput = $('#requestTitle');
        const artistInput = $('#requestArtist');
        const urlInput = $('#requestUrl');
        const status = $('#requestStatus');

        if (!titleInput || !urlInput) return;

        const newTrack = {
          title: titleInput.value.trim(),
          artist: (artistInput ? artistInput.value.trim() : '') || 'Unknown',
          url: urlInput.value.trim(),
          cover: ''
        };

        if (!newTrack.url) {
          if (status) status.textContent = '请输入音频URL';
          return;
        }

        playlist.push(newTrack);
        savePlaylist();
        renderPlaylist();

        // Reset form
        titleInput.value = '';
        if (artistInput) artistInput.value = '';
        urlInput.value = '';
        if (status) {
          status.textContent = '点歌成功！已加入播放列表';
          status.style.color = '#05d9e8';
          setTimeout(function () {
            status.textContent = '';
          }, 3000);
        }
      });
    }
  }

  function renderPlaylist() {
    const list = $('#playlistItems');
    if (!list) return;

    if (!playlist.length) {
      list.innerHTML = '<div class="playlist-empty">播放列表为空，点首歌吧</div>';
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

        // Gradient from cyan to pink
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
