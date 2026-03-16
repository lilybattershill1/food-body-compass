
// ── Audio engine ────────────────────────────────────────────────────────
const audioElements = new Map(); // player-div -> Audio
let currentPlayer = null;

function getAudio(playerDiv) {
  if (!audioElements.has(playerDiv)) {
    const src = playerDiv.dataset.src;
    const audio = new Audio(src);
    audio.preload = 'metadata';

    const timeTotal = playerDiv.querySelector('.time-total');
    const timeCurrent = playerDiv.querySelector('.time-current');
    const fill = playerDiv.querySelector('.progress-fill');
    const btn = playerDiv.querySelector('.play-btn');

    audio.addEventListener('loadedmetadata', () => {
      timeTotal.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      timeCurrent.textContent = formatTime(audio.currentTime);
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      fill.style.width = pct + '%';
    });

    audio.addEventListener('ended', () => {
      btn.textContent = '▶';
      currentPlayer = null;
      fill.style.width = '0%';
      timeCurrent.textContent = '0:00';
      // Auto-play next if chained
      const nextId = playerDiv.closest('.audio-card').dataset.next ||
                     playerDiv.dataset.next;
      if (nextId) {
        const nextCard = document.getElementById(nextId);
        if (nextCard) {
          const nextPlayer = nextCard.querySelector('.player');
          if (nextPlayer) {
            setTimeout(() => {
              const nextBtn = nextPlayer.querySelector('.play-btn');
              startPlay(nextBtn, nextPlayer);
            }, 600);
          }
        }
      }
    });

    audioElements.set(playerDiv, audio);
  }
  return audioElements.get(playerDiv);
}

function startPlay(btn, playerDiv) {
  if (currentPlayer && currentPlayer !== playerDiv) {
    pausePlayer(currentPlayer);
  }
  const audio = getAudio(playerDiv);
  audio.play();
  btn.textContent = '⏸';
  currentPlayer = playerDiv;
}

function pausePlayer(playerDiv) {
  const audio = audioElements.get(playerDiv);
  if (audio) {
    audio.pause();
    playerDiv.querySelector('.play-btn').textContent = '▶';
  }
  if (currentPlayer === playerDiv) currentPlayer = null;
}

function togglePlay(btn) {
  const playerDiv = btn.closest('.player');
  const audio = getAudio(playerDiv);
  if (audio.paused) {
    startPlay(btn, playerDiv);
  } else {
    pausePlayer(playerDiv);
  }
}

function seekAudio(progressBar, event) {
  const playerDiv = progressBar.closest('.player');
  const audio = getAudio(playerDiv);
  if (!audio.duration) return;
  const rect = progressBar.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  audio.currentTime = ratio * audio.duration;
}

function stopAllAudio() {
  audioElements.forEach((audio, playerDiv) => {
    audio.pause();
    audio.currentTime = 0;
    playerDiv.querySelector('.play-btn').textContent = '▶';
    playerDiv.querySelector('.progress-fill').style.width = '0%';
    playerDiv.querySelector('.time-current').textContent = '0:00';
  });
  currentPlayer = null;
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
}

// Handle data-next on audio-card elements too
document.querySelectorAll('.audio-card[data-next]').forEach(card => {
  const player = card.querySelector('.player');
  if (player) player.dataset.next = card.dataset.next;
});

// Eagerly load metadata for all players so duration shows on page load
document.querySelectorAll('.player').forEach(playerDiv => getAudio(playerDiv));
