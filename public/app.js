const api = {
  dashboard: "/api/dashboard",
  aptitude: "/api/aptitude",
  coding: "/api/coding-challenges",
  resumeFeedback: "/api/resume-feedback",
  interview: "/api/interview-questions",
  aiChat: "/api/ai-chat"
};

const $ = (selector) => document.querySelector(selector);
const dashboardEl = $("#dashboard");
const quizListEl = $("#quiz-list");
const quizStatusEl = $("#quiz-status");
const quizResultEl = $("#quiz-result");
const codingListEl = $("#coding-list");
const challengeCountEl = $("#challenge-count");
const resumeForm = $("#resume-form");
const resumeFileInput = $("#resume-file");
const resumeFileNameEl = $("#resume-file-name");
const resumeTextEl = $("#resume-text");
const feedbackEl = $("#resume-feedback");
const interviewForm = $("#interview-form");
const interviewOutputEl = $("#interview-output");
const chatForm = $("#chat-form");
const chatLog = $("#chat-log");
const themeToggle = $("#theme-toggle");
const themeLabel = $("#theme-label");
const resetProgressButton = $("#reset-progress");
const heroScoreEl = $("#hero-score");
const heroStreakEl = $("#hero-streak");
const galaxyCanvas = $("#galaxy-canvas");

// --- Premium gating utilities ---
const premiumModal = () => document.getElementById("premium-modal");
const isPremium = () => localStorage.getItem("isPremium") === "true";
const setPremium = (val) => {
  localStorage.setItem("isPremium", val ? "true" : "false");
  if (val) document.body.classList.add("is-premium"); else document.body.classList.remove("is-premium");
  const badge = document.getElementById("premium-badge");
  if (badge) badge.textContent = val ? "Premium" : "PrepPortal";
};

const openPremiumModal = () => {
  const m = premiumModal();
  if (!m) return;
  m.setAttribute("aria-hidden", "false");
};
const closePremiumModal = () => {
  const m = premiumModal();
  if (!m) return;
  m.setAttribute("aria-hidden", "true");
};

document.addEventListener("DOMContentLoaded", () => {
  // Reflect current premium state
  if (isPremium()) setPremium(true);
  // Sync with backend subscription status (mock)
  fetch('/api/subscription-status').then((r) => r.json()).then((j) => { if (j.isPremium) setPremium(true); }).catch(() => {});

  // Wire up modal buttons
  const buy = document.getElementById("buy-premium");
  const close = document.getElementById("close-premium");
  if (buy) buy.addEventListener("click", async () => {
    try {
      const resp = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (resp.ok) {
        setPremium(true);
        closePremiumModal();
      } else {
        const err = await resp.json().catch(() => ({}));
        alert(err.message || 'Purchase failed');
      }
    } catch (err) {
      alert('Network error while attempting purchase');
    }
  });
  if (close) close.addEventListener("click", () => closePremiumModal());

  // Intercept premium-locked actions (forms and buttons with data-premium)
  document.querySelectorAll("[data-premium]").forEach((el) => {
    // If element is inside a form (submit button), intercept the form submit
    if (el.tagName === "BUTTON" && el.type === "submit") {
      const form = el.closest("form");
      if (form) {
        form.addEventListener("submit", (e) => {
          if (!isPremium()) {
            e.preventDefault();
            openPremiumModal();
          }
        });
      }
    } else {
      el.addEventListener("click", (e) => {
        if (!isPremium()) {
          e.preventDefault();
          openPremiumModal();
        }
      });
    }
  });

  // Template buttons
  const saveTplBtn = document.getElementById('save-template');
  const loadTplBtn = document.getElementById('load-templates');
  const templatesModal = document.getElementById('templates-modal');
  const templatesList = document.getElementById('templates-list');
  const closeTemplates = document.getElementById('close-templates');

  if (saveTplBtn) {
    saveTplBtn.addEventListener('click', async () => {
      // Gather current form values
      const role = document.getElementById('interview-role').value;
      const topic = document.getElementById('interview-topic').value;
      const level = document.getElementById('interview-level').value;
      const name = prompt('Template name (optional):', `${role} — ${level}`) || '';
      try {
        const r = await fetch('/api/premium/templates', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, role, topic, level })
        });
        if (r.status === 403) return openPremiumModal();
        const j = await r.json();
        if (j.success) alert('Template saved'); else alert(j.error || 'Save failed');
      } catch (err) { alert('Network error'); }
    });
  }

  if (loadTplBtn) {
    loadTplBtn.addEventListener('click', async () => {
      try {
        const r = await fetch('/api/premium/templates');
        if (r.status === 403) return openPremiumModal();
        const j = await r.json();
        templatesList.innerHTML = '';
        if (!j.templates || j.templates.length === 0) templatesList.innerHTML = '<p>No templates saved yet.</p>';
        j.templates.forEach(t => {
          const el = document.createElement('div');
          el.className = 'template-item';
          el.innerHTML = `<strong>${t.name}</strong><div>${t.role} • ${t.topic} • ${t.level}</div><div class="tpl-actions"><button data-use="${t.id}">Use</button> <button data-del="${t.id}">Delete</button></div>`;
          templatesList.appendChild(el);
        });
        templatesModal.setAttribute('aria-hidden','false');
      } catch (err) { alert('Network error'); }
    });
  }

  if (closeTemplates) closeTemplates.addEventListener('click', () => templatesModal.setAttribute('aria-hidden','true'));

  // Delegate template list actions
  document.addEventListener('click', async (e) => {
    const useId = e.target && e.target.getAttribute && e.target.getAttribute('data-use');
    const delId = e.target && e.target.getAttribute && e.target.getAttribute('data-del');
    if (useId) {
      // fetch list and find template
      try {
        const r = await fetch('/api/premium/templates');
        if (r.status === 403) return openPremiumModal();
        const j = await r.json();
        const tpl = (j.templates || []).find(t => t.id === useId);
        if (tpl) {
          document.getElementById('interview-role').value = tpl.role;
          document.getElementById('interview-topic').value = tpl.topic;
          document.getElementById('interview-level').value = tpl.level;
          templatesModal.setAttribute('aria-hidden','true');
        }
      } catch (err) { alert('Network error'); }
    }
    if (delId) {
      if (!confirm('Delete this template?')) return;
      try {
        const r = await fetch(`/api/premium/templates/${delId}`, { method: 'DELETE' });
        if (r.status === 403) return openPremiumModal();
        if (r.ok) {
          e.target.closest('.template-item').remove();
        } else {
          const j = await r.json().catch(() => ({}));
          alert(j.error || 'Delete failed');
        }
      } catch (err) { alert('Network error'); }
    }
  });
});

let aptitudeQuestions = [];
let selectedAnswers = {};

const defaultProgress = {
  aptitudeScore: 0,
  aptitudeAnswered: 0,
  codingSolved: [],
  resumeAnalyzed: false,
  interviewsGenerated: 0,
  streak: 4
};

const createParticle = (clusterIndex, orbitRadius, angle, radius, speed, alpha, hue, drift) => ({
  clusterIndex,
  orbitRadius,
  angle,
  radius,
  speed,
  alpha,
  hue,
  drift,
  trail: []
});

const createStar = (width, height) => ({
  x: Math.random() * width,
  y: Math.random() * height,
  radius: Math.random() * 1.2 + 0.2,
  alpha: Math.random() * 0.35 + 0.15,
  phase: Math.random() * Math.PI * 2,
  hue: 200 + Math.random() * 50
});

const updateParticle = (particle, clusters, mouse) => {
  const cluster = clusters[particle.clusterIndex];
  particle.angle += particle.speed;
  particle.drift += 0.0008;

  particle.orbitRadius += Math.sin(particle.drift) * 0.015;
  const x = cluster.x + Math.cos(particle.angle) * particle.orbitRadius;
  const y = cluster.y + Math.sin(particle.angle) * particle.orbitRadius;

  if (mouse.x !== null && mouse.y !== null) {
    const dx = x - mouse.x;
    const dy = y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 160) {
      const repulsion = (160 - dist) / 160;
      particle.angle += repulsion * 0.003 * (dx > 0 ? 1 : -1);
      particle.orbitRadius += repulsion * 0.16;
    }
  }

  const nextX = cluster.x + Math.cos(particle.angle) * particle.orbitRadius;
  const nextY = cluster.y + Math.sin(particle.angle) * particle.orbitRadius;

  particle.trail.unshift({ x: nextX, y: nextY, alpha: particle.alpha });
  if (particle.trail.length > 18) particle.trail.pop();
};

const updateStar = (star, time) => {
  star.alpha = 0.2 + Math.sin(star.phase + time * 0.0004) * 0.12;
};

const drawParticle = (ctx, particle, clusters) => {
  const head = particle.trail[0];
  if (!head) return;

  ctx.save();
  ctx.lineCap = "round";
  particle.trail.forEach((segment, idx) => {
    const ratio = 1 - idx / particle.trail.length;
    ctx.strokeStyle = `hsla(${particle.hue}, 95%, 72%, ${segment.alpha * ratio * 0.65})`;
    ctx.lineWidth = particle.radius * (1.3 - idx / particle.trail.length);
    if (idx === 0) {
      ctx.beginPath();
      ctx.moveTo(segment.x, segment.y);
    } else {
      ctx.lineTo(segment.x, segment.y);
    }
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = head.alpha;
  ctx.shadowBlur = particle.radius * 8;
  ctx.shadowColor = `hsla(${particle.hue}, 95%, 82%, ${head.alpha * 0.8})`;
  ctx.fillStyle = `hsla(${particle.hue}, 95%, 88%, ${head.alpha})`;
  ctx.beginPath();
  ctx.arc(head.x, head.y, particle.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawStar = (ctx, star) => {
  ctx.save();
  ctx.globalAlpha = star.alpha;
  ctx.fillStyle = `hsla(${star.hue}, 80%, 88%, ${star.alpha})`;
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const initGalaxyCanvas = () => {
  if (!galaxyCanvas) return;
  const ctx = galaxyCanvas.getContext("2d");
  const particles = [];
  const clusters = [];
  const stars = [];
  const mouse = { x: null, y: null };

  const resize = () => {
    galaxyCanvas.width = window.innerWidth;
    galaxyCanvas.height = window.innerHeight;
  };

  const createClusters = () => {
    clusters.length = 0;
    const clusterCount = 6;
    for (let i = 0; i < clusterCount; i++) {
      clusters.push({
        x: window.innerWidth * (0.12 + 0.14 * i) + (Math.random() - 0.5) * 80,
        y: window.innerHeight * (0.2 + 0.11 * i) + (Math.random() - 0.5) * 100,
        radius: 22 + Math.random() * 20,
        hue: 170 + i * 20,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() * 0.008 + 0.002) * (i % 2 === 0 ? 1 : -1)
      });
    }
  };

  const createStars = () => {
    stars.length = 0;
    const count = Math.max(220, Math.round((window.innerWidth * window.innerHeight) / 60000));
    for (let i = 0; i < count; i++) {
      stars.push(createStar(galaxyCanvas.width, galaxyCanvas.height));
    }
  };

  const createParticles = () => {
    particles.length = 0;
    const count = Math.max(260, Math.round((window.innerWidth * window.innerHeight) / 26000));
    for (let i = 0; i < count; i++) {
      const clusterIndex = i % clusters.length;
      const orbitRadius = 32 + Math.random() * 300;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 1.6 + 0.5;
      const speed = 0.004 + Math.random() * 0.012;
      const alpha = Math.random() * 0.5 + 0.15;
      const hue = clusters[clusterIndex].hue + Math.random() * 42 - 16;
      const drift = Math.random() * Math.PI * 2;
      particles.push(createParticle(clusterIndex, orbitRadius, angle, radius, speed, alpha, hue, drift));
    }
  };

  const render = () => {
    const time = performance.now();
    ctx.clearRect(0, 0, galaxyCanvas.width, galaxyCanvas.height);
    ctx.fillStyle = "rgba(4, 8, 22, 0.18)";
    ctx.fillRect(0, 0, galaxyCanvas.width, galaxyCanvas.height);

    stars.forEach((star) => {
      updateStar(star, time);
      drawStar(ctx, star);
    });

    clusters.forEach((cluster) => {
      cluster.rotation += cluster.spin;
      const glow = ctx.createRadialGradient(cluster.x, cluster.y, 0, cluster.x, cluster.y, cluster.radius * 5);
      glow.addColorStop(0, `hsla(${cluster.hue}, 94%, 76%, 0.24)`);
      glow.addColorStop(1, "transparent");
      ctx.save();
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cluster.x, cluster.y, cluster.radius * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = `hsla(${cluster.hue}, 94%, 80%, 0.12)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cluster.x, cluster.y, cluster.radius * 2.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    particles.forEach((particle) => {
      updateParticle(particle, clusters, mouse);
      drawParticle(ctx, particle, clusters);
    });

    requestAnimationFrame(render);
  };

  galaxyCanvas.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });

  galaxyCanvas.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
  });

  window.addEventListener("resize", () => {
    resize();
    createClusters();
    createStars();
    createParticles();
  });

  resize();
  createClusters();
  createStars();
  createParticles();
  render();
};

const getProgress = () => {
  const stored = localStorage.getItem("placementProgress");
  return stored ? { ...defaultProgress, ...JSON.parse(stored) } : { ...defaultProgress };
};

const saveProgress = (progress) => {
  localStorage.setItem("placementProgress", JSON.stringify(progress));
  renderDashboard();
};

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("placementTheme", theme);
  const isDark = theme === "dark";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeLabel.textContent = isDark ? "Dark mode" : "Light mode";
};

const createProgressItem = (topic) => {
  const wrapper = document.createElement("div");
  wrapper.className = "dashboard-item";
  wrapper.innerHTML = `
    <div class="metric-row">
      <strong>${topic.title}</strong>
      <span>${topic.progress}%</span>
    </div>
    <div class="progress-bar"><span style="width:${topic.progress}%"></span></div>
  `;
  return wrapper;
};

const renderDashboard = async () => {
  const response = await fetch(api.dashboard);
  const data = await response.json();
  const progress = getProgress();
  const codingTotal = Number(challengeCountEl.dataset.total || 3);
  const codingPercent = Math.round((progress.codingSolved.length / codingTotal) * 100);
  const resumePercent = progress.resumeAnalyzed ? 100 : 35;
  const interviewPercent = Math.min(100, progress.interviewsGenerated * 35);
  const readiness = Math.round((progress.aptitudeScore + codingPercent + resumePercent + interviewPercent) / 4);
  const topics = [
    { title: "Aptitude accuracy", progress: progress.aptitudeScore },
    { title: "Coding completion", progress: codingPercent },
    { title: "Resume readiness", progress: resumePercent },
    { title: "Interview practice", progress: interviewPercent }
  ];

  heroScoreEl.textContent = `${readiness}%`;
  heroStreakEl.textContent = progress.streak;
  dashboardEl.innerHTML = `
    <div class="stat-card">
      <span>Placement readiness</span>
      <strong>${readiness}%</strong>
      <small>${data.nextStep}</small>
    </div>
    <div class="stat-card">
      <span>Quiz best score</span>
      <strong>${progress.aptitudeScore}%</strong>
      <small>${progress.aptitudeAnswered} aptitude questions attempted</small>
    </div>
    <div class="stat-card">
      <span>Coding solved</span>
      <strong>${progress.codingSolved.length}/${codingTotal}</strong>
      <small>Mark challenges solved as you practice</small>
    </div>
  `;

  topics.forEach((topic) => dashboardEl.appendChild(createProgressItem(topic)));
};

const loadAptitudeQuiz = async () => {
  const response = await fetch(api.aptitude);
  aptitudeQuestions = await response.json();
  selectedAnswers = {};

  quizListEl.innerHTML = "";
  aptitudeQuestions.forEach((question, index) => {
    const item = document.createElement("article");
    item.className = "quiz-item";
    item.innerHTML = `
      <div class="question-title">
        <span>Q${index + 1}</span>
        <strong>${question.question}</strong>
      </div>
      <div class="option-grid">
        ${question.options.map((option, optionIndex) => `
          <label class="option-tile">
            <input type="radio" name="question-${question.id}" value="${optionIndex}" />
            <span>${option}</span>
          </label>
        `).join("")}
      </div>
    `;
    item.addEventListener("change", (event) => {
      selectedAnswers[question.id] = Number(event.target.value);
      quizStatusEl.textContent = `${Object.keys(selectedAnswers).length} answered`;
    });
    quizListEl.appendChild(item);
  });
};

const submitQuiz = () => {
  const correct = aptitudeQuestions.filter((question) => selectedAnswers[question.id] === question.answer).length;
  const score = Math.round((correct / aptitudeQuestions.length) * 100);
  const progress = getProgress();
  progress.aptitudeScore = Math.max(progress.aptitudeScore, score);
  progress.aptitudeAnswered += Object.keys(selectedAnswers).length;
  saveProgress(progress);

  quizResultEl.innerHTML = `
    <strong>${correct}/${aptitudeQuestions.length} correct · ${score}%</strong>
    <span>${score >= 70 ? "Strong sprint. Review the explanations and keep speed-building." : "Good start. Revisit ratios, percentages, and pattern logic before the next attempt."}</span>
  `;
};

const loadCodingChallenges = async () => {
  const response = await fetch(api.coding);
  const challenges = await response.json();
  const progress = getProgress();
  challengeCountEl.textContent = `${challenges.length} challenges`;
  challengeCountEl.dataset.total = challenges.length;
  codingListEl.innerHTML = "";

  challenges.forEach((challenge) => {
    const solved = progress.codingSolved.includes(challenge.id);
    const item = document.createElement("article");
    item.className = "challenge-card";
    item.innerHTML = `
      <div class="challenge-topline">
        <span>${challenge.difficulty}</span>
        <button class="ghost-button solve-button" type="button" data-id="${challenge.id}">${solved ? "Solved" : "Mark solved"}</button>
      </div>
      <h3>${challenge.title}</h3>
      <p>${challenge.prompt}</p>
      <div class="tag-list">
        ${challenge.tags.map((tag) => `<span>${tag}</span>`).join("")}
      </div>
      <details>
        <summary>Approach hint</summary>
        <p>${challenge.hint}</p>
      </details>
    `;
    codingListEl.appendChild(item);
  });

  document.querySelectorAll(".solve-button").forEach((button) => {
    button.addEventListener("click", () => {
      const currentProgress = getProgress();
      const id = Number(button.dataset.id);

      if (currentProgress.codingSolved.includes(id)) {
        currentProgress.codingSolved = currentProgress.codingSolved.filter((solvedId) => solvedId !== id);
        button.textContent = "Mark solved";
      } else {
        currentProgress.codingSolved.push(id);
        button.textContent = "Solved";
      }

      saveProgress(currentProgress);
    });
  });

  renderDashboard();
};

const appendChatMessage = (text, sender) => {
  const message = document.createElement("div");
  message.className = `chat-item ${sender}`;
  message.textContent = text;
  chatLog.appendChild(message);
  chatLog.scrollTop = chatLog.scrollHeight;
};

resumeFileInput.addEventListener("change", async () => {
  const file = resumeFileInput.files[0];
  if (!file) return;

  resumeFileNameEl.textContent = file.name;

  if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
    resumeTextEl.value = await file.text();
  } else {
    resumeTextEl.placeholder = "PDF/DOC uploaded. Paste extracted resume text here so the analyzer can review the content.";
  }
});

resumeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  feedbackEl.textContent = "Analyzing resume against placement criteria...";

  const formData = new FormData(resumeForm);
  const payload = {
    role: formData.get("role"),
    skills: formData.get("skills"),
    resumeText: formData.get("resumeText"),
    fileName: resumeFileInput.files[0]?.name || "Pasted resume"
  };

  try {
    const response = await fetch(api.resumeFeedback, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    feedbackEl.textContent = data.feedback;
    const progress = getProgress();
    progress.resumeAnalyzed = true;
    saveProgress(progress);
  } catch (error) {
    feedbackEl.textContent = "Unable to analyze the resume. Check your network or server.";
  }
});

interviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  interviewOutputEl.textContent = "Generating interview set...";
  const formData = new FormData(interviewForm);
  const role = formData.get("role")?.trim();
  const topic = formData.get("topic")?.trim();
  const level = formData.get("level")?.trim() || "Entry level";

  if (!role || !topic) {
    interviewOutputEl.textContent = "Please enter a role and topic focus before generating questions.";
    return;
  }

  try {
    const response = await fetch(api.interview, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, topic, level })
    });

    if (!response.ok) {
      const errorText = await response.text();
      interviewOutputEl.textContent = `Server error ${response.status}: ${errorText}`;
      return;
    }

    const data = await response.json();
    const questions = Array.isArray(data.questions)
      ? data.questions
      : String(data.questions).split(/\n+/).map((line) => line.trim()).filter(Boolean);

    if (questions.length === 0) {
      interviewOutputEl.textContent = "No questions were generated. Please try again.";
    } else {
      interviewOutputEl.innerHTML = `<ol>${questions.map((question) => `<li>${question}</li>`).join("")}</ol>`;
      const progress = getProgress();
      progress.interviewsGenerated += 1;
      saveProgress(progress);
    }
  } catch (error) {
    interviewOutputEl.textContent = "Unable to generate interview questions right now. Please check your connection and try again.";
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = chatForm.elements["message"];
  const message = input.value.trim();
  if (!message) return;

  appendChatMessage(message, "user");
  input.value = "";
  appendChatMessage("Thinking...", "bot");

  try {
    const response = await fetch(api.aiChat, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await response.json();
    const botMessages = chatLog.querySelectorAll(".chat-item.bot");
    botMessages[botMessages.length - 1].textContent = data.answer;
  } catch (error) {
    const botMessages = chatLog.querySelectorAll(".chat-item.bot");
    botMessages[botMessages.length - 1].textContent = "Unable to reach the AI assistant. Try again later.";
  }
});

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme || "dark";
  setTheme(current === "dark" ? "light" : "dark");
});

resetProgressButton.addEventListener("click", () => {
  localStorage.removeItem("placementProgress");
  quizResultEl.textContent = "";
  renderDashboard();
  loadCodingChallenges();
});

$("#submit-quiz").addEventListener("click", submitQuiz);

setTheme(localStorage.getItem("placementTheme") || "dark");
renderDashboard();
loadAptitudeQuiz();
loadCodingChallenges();
initGalaxyCanvas();
