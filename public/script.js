// ===== USER SYSTEM =====
function initializeUserStats() {
  return {
    longestChew: 0,
    currentStreak: 0,
    lastChewDate: null,
    totalSessions: 0,
    totalChewTime: 0,
    todayChews: 0
  };
}

function updateChewStats(duration) {
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) return;

  const users = JSON.parse(localStorage.getItem('chewUsers')) || {};
  if (!users[currentUser]) {
    users[currentUser] = { stats: initializeUserStats() };
  }

  const stats = users[currentUser].stats;
  const today = new Date().toLocaleDateString();

  // Update streak
  if (!stats.lastChewDate || stats.lastChewDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    stats.currentStreak = (stats.lastChewDate === yesterday.toLocaleDateString()) 
      ? stats.currentStreak + 1 
      : 1;
    stats.lastChewDate = today;
    stats.todayChews = 0;
  }

  // Update stats
  stats.todayChews++;
  stats.totalSessions++;
  stats.totalChewTime += duration;
  if (duration > stats.longestChew) {
    stats.longestChew = duration;
  }

  localStorage.setItem('chewUsers', JSON.stringify(users));
}

// ===== TIMER SYSTEM =====
let startTime, elapsedTime = 0, timerInterval;

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateStageFeedback(elapsedMinutes) {
  const stages = [
    { threshold: 1, emoji: "🫧", text: "💥 Flavor Bomb – 'You're living the gum dream. Savor it.'" },
    { threshold: 4, emoji: "🫧", text: "😎 Still Got It – 'Still poppin'. Keep going, champ.'" },
    { threshold: 7, emoji: "🫠", text: "🤨 Questionable Texture – 'Getting rubbery, huh?'" },
    { threshold: 10, emoji: "👻", text: "😐 Flavor? I Don't Know Her – 'You're chewing memories now.'" },
    { threshold: 15, emoji: "💀", text: "🫠 Why Are You Still Doing This – 'Spit it. You've suffered enough.'" },
    { threshold: Infinity, emoji: "👽", text: "☠️ Eternal Chew – 'You've ascended to the flavorless plane.'" }
  ];

  const stage = stages.find(s => elapsedMinutes < s.threshold);
  document.getElementById('stageFeedback').textContent = stage.text;
  document.getElementById('gumBubble').textContent = stage.emoji;
}

function startTimer() {
  const timerDisplay = document.getElementById('timer');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');

  startTime = Date.now() - elapsedTime;
  timerInterval = setInterval(() => {
    elapsedTime = Date.now() - startTime;
    timerDisplay.textContent = formatTime(elapsedTime);
    updateStageFeedback(elapsedTime / 60000);
  }, 1000);

  startBtn.disabled = true;
  stopBtn.disabled = false;
}

function stopTimer() {
  clearInterval(timerInterval);
  
  if (elapsedTime >= 1000) { // Minimum 1 second to record
    const name = localStorage.getItem('currentUser');
    if (name) {
      // Update leaderboard
      const entries = JSON.parse(localStorage.getItem('chewLeaderboard')) || [];
      entries.push({
        name,
        time: elapsedTime,
        date: new Date().toLocaleDateString()
      });
      localStorage.setItem('chewLeaderboard', JSON.stringify(entries));
      
      // Update stats
      updateChewStats(elapsedTime);
    }
  }

  resetTimer();
}

function resetTimer() {
  clearInterval(timerInterval);
  elapsedTime = 0;
  document.getElementById('timer').textContent = "00:00";
  document.getElementById('stageFeedback').textContent = "Start chewing to begin!";
  document.getElementById('gumBubble').textContent = "🫧";
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
}

// ===== LEADERBOARD =====
function updateLeaderboard() {
  const entries = JSON.parse(localStorage.getItem('chewLeaderboard')) || [];
  const leaderboardElement = document.getElementById('leaderboardEntries');
  if (!leaderboardElement) return;

  leaderboardElement.innerHTML = entries
    .sort((a, b) => b.time - a.time)
    .map(entry => `
      <div class="leaderboard-entry">
        <span class="leaderboard-name">${entry.name}</span>
        <span class="leaderboard-time">${formatTime(entry.time)}</span>
        <span class="leaderboard-date">${entry.date}</span>
      </div>
    `).join('');
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Timer page setup
  if (document.getElementById('startBtn')) {
    document.getElementById('startBtn').addEventListener('click', startTimer);
    document.getElementById('stopBtn').addEventListener('click', stopTimer);
    
    // Check login
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      window.location.href = 'index.html';
    } else {
      document.getElementById('usernameDisplay').textContent = currentUser;
    }
  }

  // Leaderboard setup
  if (document.getElementById('clearLeaderboardBtn')) {
    updateLeaderboard();
    document.getElementById('clearLeaderboardBtn').addEventListener('click', () => {
      if (confirm("Clear entire leaderboard?")) {
        localStorage.removeItem('chewLeaderboard');
        updateLeaderboard();
      }
    });
  }

  // Stats page setup
  if (document.getElementById('longestChew')) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      window.location.href = 'index.html';
      return;
    }

    const users = JSON.parse(localStorage.getItem('chewUsers')) || {};
    const stats = users[currentUser]?.stats || initializeUserStats();

    document.getElementById('statsUsername').textContent = currentUser;
    document.getElementById('longestChew').textContent = formatTime(stats.longestChew);
    document.getElementById('currentStreak').textContent = `${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`;
    document.getElementById('todaysChews').textContent = stats.todayChews;
    document.getElementById('totalSessions').textContent = stats.totalSessions;
    document.getElementById('totalTime').textContent = formatTime(stats.totalChewTime);
    document.getElementById('averageChew').textContent = stats.totalSessions > 0 
      ? formatTime(stats.totalChewTime / stats.totalSessions) 
      : "00:00";
  }

  // Logout functionality
  const logoutBtns = document.querySelectorAll('#logoutBtn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      window.location.href = 'index.html';
    });
  });
});