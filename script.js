const modeToggle = document.getElementById('modeToggle');
const body = document.body;

modeToggle?.addEventListener('click', () => {
  body.classList.toggle('light-mode');
  modeToggle.textContent = body.classList.contains('light-mode') ? 'Dark' : 'Light';
});

// Reveal observer for smooth section fade-in
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// Typing effect for hero heading
const typedEl = document.getElementById('typed');
if (typedEl) {
  const text = typedEl.dataset.text || '';
  let i = 0;
  const speed = 24;
  const type = () => {
    if (i <= text.length) {
      typedEl.textContent = text.slice(0, i);
      i++;
      setTimeout(type, speed);
    }
  };
  type();
}

// Stats counter when visible
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const els = entry.target.querySelectorAll('strong[data-target]');
      els.forEach((el) => {
        if (el.dataset.counted) return;
        const target = parseFloat(el.dataset.target);
        const isFloat = `${target}`.includes('.') || el.dataset.float === 'true';
        let current = 0;
        const duration = 1200;
        const start = performance.now();
        const step = (t) => {
          const p = Math.min((t - start) / duration, 1);
          const value = Math.round(target * p * (isFloat ? 10 : 1)) / (isFloat ? 10 : 1);
          el.textContent = isFloat ? value.toFixed(1) : value;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        el.dataset.counted = 'true';
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.35 });

const statsWrap = document.getElementById('stats');
if (statsWrap) statsObserver.observe(statsWrap);

// Interactive particle grid and AI systems
const canvas = document.getElementById('bgCanvas');
const audioButton = document.getElementById('audioActivate');
const voiceButton = document.getElementById('voiceToggle');
const assistantInput = document.getElementById('assistantInput');
const assistantSend = document.getElementById('assistantSend');
const assistantTranscript = document.getElementById('assistantTranscript');
const scanEyeBtn = document.getElementById('scanEyeBtn');
const scanStatus = document.getElementById('scanStatus');
const predictionText = document.getElementById('predictionText');
const storySteps = document.querySelectorAll('.story-step');
let audioContext;
let audioEnabled = false;
let recognition;
const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
const particles = [];
let w = 0;
let h = 0;
const settings = {
  speed: 0.7,
  maxDist: 130,
  burstSize: 10,
  particleLimit: 340,
};
let lastScrollTime = 0;
const predictions = [
  'Cyborg AI adoption is primed to accelerate.',
  'Next-gen neural launch will ignite early users.',
  'Predictive analytics see a 67% conversion spike.',
  'Holographic systems activate in 3, 2, 1...',
];
const commandMap = {
  'launch ai': 'Initializing AI core systems…',
  'scan eye': 'Scanning retina for biometric access…',
  'wake robot': 'Robot awakens and begins self-calibration.',
  'activate network': 'Neural network layers powering online.',
};

function createParticle(x, y, vx, vy, r, alpha = 0.18) {
  return { x, y, vx, vy, r, alpha, baseAlpha: alpha };
}

function startAudio() {
  if (audioEnabled) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  audioEnabled = true;
}

function playTone(freq, duration = 0.12) {
  if (!audioEnabled || !audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();
  osc.stop(audioContext.currentTime + duration + 0.02);
}

function updatePrediction() {
  if (!predictionText) return;
  const next = predictions[Math.floor(Math.random() * predictions.length)];
  predictionText.textContent = next;
}

function setAssistantText(message) {
  if (!assistantTranscript) return;
  assistantTranscript.textContent = message;
}

function processCommand(command) {
  const normalized = command.trim().toLowerCase();
  if (!normalized) {
    setAssistantText('Awaiting a command from the mind interface…');
    return;
  }

  if (commandMap[normalized]) {
    setAssistantText(commandMap[normalized]);
    if (normalized === 'scan eye') {
      triggerScanSequence();
    }
    if (normalized.includes('launch') || normalized.includes('activate')) {
      triggerLaunchSequence();
    }
    return;
  }

  setAssistantText('Command unclear. Say “wake robot”, “scan eye”, or “launch AI”.');
}

function triggerScanSequence() {
  if (!scanStatus || !scanEyeBtn) return;
  scanStatus.textContent = 'Biometric scan in progress…';
  scanEyeBtn.classList.add('active-scan');
  setTimeout(() => {
    scanStatus.textContent = 'Eye authenticated. Neural entry granted.';
    scanEyeBtn.classList.remove('active-scan');
  }, 2200);
}

function triggerLaunchSequence() {
  storySteps.forEach((step, index) => {
    if (index === 0) step.classList.add('active');
  });
  setTimeout(() => {
    storySteps[1]?.classList.add('active');
  }, 1400);
  setTimeout(() => {
    storySteps[2]?.classList.add('active');
  }, 2600);
  setTimeout(() => {
    storySteps[3]?.classList.add('active');
  }, 3600);
}

function initVoice() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    setAssistantText('Voice commands are not supported in this browser.');
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const spoken = event.results[0][0].transcript;
    setAssistantText(`Heard: ${spoken}`);
    processCommand(spoken);
  };

  recognition.onerror = () => {
    setAssistantText('Voice recognition failed. Please try again.');
  };

  recognition.onend = () => {
    voiceButton?.classList.remove('listening');
  };
}

function updateStoryOnScroll() {
  const story = document.getElementById('story');
  if (!story) return;
  const rect = story.getBoundingClientRect();
  const progress = Math.min(Math.max((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0), 1);
  storySteps.forEach((step, index) => {
    if (progress > index * 0.22) {
      step.classList.add('active');
    }
  });
}

function initStage() {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const count = Math.round((w * h) / 45000);
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(
      Math.random() * w,
      Math.random() * h,
      (Math.random() - 0.5) * settings.speed,
      (Math.random() - 0.5) * settings.speed,
      Math.random() * 2.2 + 0.6
    ));
  }

  window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    updatePrediction();
  });

  window.addEventListener('click', (event) => {
    if (!canvas) return;
    startAudio();
    playTone(210 + Math.random() * 360, 0.16);
    for (let i = 0; i < settings.burstSize; i++) {
      const angle = Math.random() * Math.PI * 2;
      particles.push(createParticle(
        event.clientX,
        event.clientY,
        Math.cos(angle) * (2.6 + Math.random() * 1.4),
        Math.sin(angle) * (2.6 + Math.random() * 1.4),
        Math.random() * 2.6 + 0.9,
        0.95
      ));
    }
    updatePrediction();
  });

  audioButton?.addEventListener('click', () => {
    startAudio();
    audioButton.textContent = 'Music Active';
    audioButton.disabled = true;
  });

  voiceButton?.addEventListener('click', () => {
    if (!recognition) initVoice();
    if (!recognition) return;
    voiceButton.classList.add('listening');
    recognition.start();
    setAssistantText('Listening for voice command…');
  });

  assistantSend?.addEventListener('click', () => {
    processCommand(assistantInput?.value || '');
    if (assistantInput) assistantInput.value = '';
  });

  if (scanEyeBtn) {
    scanEyeBtn.addEventListener('click', () => {
      triggerScanSequence();
    });
  }

  window.addEventListener('scroll', () => {
    const now = performance.now();
    const position = window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1);
    settings.speed = 0.6 + position * 1.5;
    updateStoryOnScroll();
    if (audioEnabled && now - lastScrollTime > 150) {
      playTone(240 + position * 520, 0.1);
      lastScrollTime = now;
    }
  });

  function render() {
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(8, 12, 34, 0.2)');
    grad.addColorStop(1, 'rgba(2, 3, 10, 0.16)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < 180) {
        const force = (180 - dist) / 180 * 0.12;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;

      if (p.x < -30) p.x = w + 30;
      if (p.x > w + 30) p.x = -30;
      if (p.y < -30) p.y = h + 30;
      if (p.y > h + 30) p.y = -30;

      p.alpha = Math.min(1, p.baseAlpha + Math.max(0, 0.15 - dist / 1200));
      ctx.beginPath();
      ctx.fillStyle = `rgba(96,214,255,${p.alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let a = 0; a < particles.length; a++) {
      for (let b = a + 1; b < particles.length; b++) {
        const A = particles[a];
        const B = particles[b];
        const dx = A.x - B.x;
        const dy = A.y - B.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < settings.maxDist) {
          ctx.strokeStyle = `rgba(96,214,255,${(1 - d / settings.maxDist) * 0.1})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(B.x, B.y);
          ctx.stroke();
        }
      }
    }

    if (particles.length > settings.particleLimit) {
      particles.splice(0, particles.length - settings.particleLimit);
    }

    requestAnimationFrame(render);
  }

  render();
}

initStage();

// Smooth scroll for nav links
document.querySelectorAll('nav a[href^="#"]').forEach(a => a.addEventListener('click', (e) => {
  e.preventDefault();
  const target = document.querySelector(a.getAttribute('href'));
  if (target) target.scrollIntoView({ behavior: 'smooth' });
}));