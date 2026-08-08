/* ==========================================================================
   Sushant Kulkarni Portfolio - Interactive JavaScript Engine
   Features: Particle Canvas, 3D Tilt Glare, Ask Sushant AI Chatbot, Audio FX
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // --- Global References ---
  const navbar = document.querySelector(".navbar");
  const mobileToggle = document.querySelector(".mobile-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");
  const revealElements = document.querySelectorAll(".reveal");
  const skillTabs = document.querySelectorAll(".tab-btn");
  const skillCards = document.querySelectorAll(".skill-card-item");
  const copyEmailBtn = document.getElementById("copyEmailBtn");
  const contactForm = document.getElementById("contactForm");
  const toast = document.getElementById("toastNotification");

  // Web Audio Synth Helper
  let audioEnabled = true;
  const audioCtx = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;

  const playBeep = (freq = 600, duration = 0.05, type = "sine") => {
    if (!audioEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === "suspended") audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Ignore audio errors if context blocked
    }
  };

  // Audio Toggle Button
  const audioToggleBtn = document.getElementById("audioToggleBtn");
  audioToggleBtn?.addEventListener("click", () => {
    audioEnabled = !audioEnabled;
    const icon = audioToggleBtn.querySelector("i");
    if (icon) {
      icon.className = audioEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
    }
    showToast(audioEnabled ? "Sci-Fi UI Audio FX Enabled" : "Sci-Fi UI Audio FX Muted");
    if (audioEnabled) playBeep(800, 0.08);
  });

  // --- Sticky Navbar Scroll Effect ---
  const handleScroll = () => {
    if (window.scrollY > 40) {
      navbar?.classList.add("scrolled");
    } else {
      navbar?.classList.remove("scrolled");
    }

    // Active Section Tracking
    const sections = document.querySelectorAll("section[id]");
    const scrollY = window.pageYOffset;

    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute("id");
      const link = document.querySelector(`.nav-menu a[href*=${sectionId}]`);

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        link?.classList.add("active");
      } else {
        link?.classList.remove("active");
      }
    });
  };

  window.addEventListener("scroll", handleScroll);
  handleScroll();

  // --- Mobile Navigation Toggle ---
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      playBeep(500, 0.05);
      const icon = mobileToggle.querySelector("i");
      if (icon) {
        icon.className = navMenu.classList.contains("active") ? "fa-solid fa-xmark" : "fa-solid fa-bars";
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active");
        const icon = mobileToggle.querySelector("i");
        if (icon) icon.className = "fa-solid fa-bars";
      });
    });
  }

  // --- Intersection Observer for Scroll Reveals ---
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    },
    { root: null, threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  // --- Interactive Skills Filter Tabs ---
  if (skillTabs.length > 0 && skillCards.length > 0) {
    skillTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        playBeep(700, 0.04);
        skillTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        const filterValue = tab.getAttribute("data-filter");

        skillCards.forEach((card) => {
          const category = card.getAttribute("data-category");
          if (filterValue === "all" || category === filterValue) {
            card.style.display = "block";
            setTimeout(() => {
              card.style.opacity = "1";
              card.style.transform = "translateY(0)";
            }, 50);
          } else {
            card.style.opacity = "0";
            card.style.transform = "translateY(20px)";
            setTimeout(() => {
              card.style.display = "none";
            }, 300);
          }
        });
      });
    });
  }

  // --- Toast Notification Helper ---
  const showToast = (message, isError = false) => {
    if (!toast) return;
    const toastMsg = toast.querySelector(".toast-message");
    const toastIcon = toast.querySelector(".toast-icon");

    if (toastMsg) toastMsg.textContent = message;
    if (toastIcon) {
      toastIcon.className = isError
        ? "toast-icon fa-solid fa-circle-exclamation"
        : "toast-icon fa-solid fa-circle-check";
      toastIcon.style.color = isError ? "var(--accent-amber)" : "var(--accent-cyan)";
    }

    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3500);
  };

  // --- Copy Email to Clipboard ---
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      playBeep(900, 0.08);
      const email = "sushant.kulkarni841@gmail.com";
      try {
        await navigator.clipboard.writeText(email);
        showToast("Email address copied to clipboard!");
      } catch (err) {
        showToast("Failed to copy email automatically.", true);
      }
    });
  }

  // --- Contact Form Handler ---
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      playBeep(850, 0.1);
      const name = document.getElementById("senderName")?.value || "";
      const email = document.getElementById("senderEmail")?.value || "";
      const subject = document.getElementById("msgSubject")?.value || "Portfolio Contact";
      const message = document.getElementById("senderMsg")?.value || "";

      if (!name || !email || !message) {
        showToast("Please complete all required fields.", true);
        return;
      }

      const mailtoUrl = `mailto:sushant.kulkarni841@gmail.com?subject=${encodeURIComponent(
        subject + " - from " + name
      )}&body=${encodeURIComponent("Sender Email: " + email + "\n\n" + message)}`;

      window.location.href = mailtoUrl;
      showToast("Opening email client to send message!");
      contactForm.reset();
    });
  }

  // ==========================================================================
  // 1. REACTION PARTICLE CANVAS ENGINE
  // ==========================================================================
  const canvas = document.getElementById("particleCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const numParticles = Math.min(Math.floor(window.innerWidth / 18), 70);
    const mouse = { x: null, y: null, radius: 140 };

    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener("mouseleave", () => {
      mouse.x = null;
      mouse.y = null;
    });

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.radius = Math.random() * 2 + 1;
        this.color = Math.random() > 0.5 ? "rgba(0, 242, 254, " : "rgba(79, 172, 254, ";
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const angle = Math.atan2(dy, dx);
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= Math.cos(angle) * force * 1.5;
            this.y -= Math.sin(angle) * force * 1.5;
          }
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color + "0.6)";
        ctx.fill();
      }
    }

    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }

    const animateParticles = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 242, 254, ${0.25 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animateParticles);
    };

    animateParticles();
  }

  // ==========================================================================
  // 2. 3D TILT & HOLOGRAPHIC GLARE EFFECT
  // ==========================================================================
  const tiltCards = document.querySelectorAll(".glass-card, .profile-card");

  tiltCards.forEach((card) => {
    // Check if card is inside Work Experience section to minimize tilt
    const isExperienceCard = card.classList.contains("timeline-content") || card.closest(".timeline");
    const maxDegree = isExperienceCard ? 1.5 : 8; // Subtle 1.5 deg tilt for experience cards

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxDegree;
      const rotateY = ((x - centerX) / centerX) * maxDegree;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;

      const glare = card.querySelector(".card-glare");
      if (glare) {
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.12), transparent 60%)`;
      }
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
    });
  });

  // ==========================================================================
  // 3. ASK SUSHANT AI CHATBOT & KNOWLEDGE ENGINE
  // ==========================================================================
  const aiWidgetTrigger = document.getElementById("aiWidgetTrigger");
  const aiModal = document.getElementById("aiModal");
  const closeAiModal = document.getElementById("closeAiModal");
  const chatBody = document.getElementById("chatBody");
  const chatInput = document.getElementById("chatInput");
  const sendChatBtn = document.getElementById("sendChatBtn");

  const toggleAiModal = () => {
    playBeep(800, 0.06);
    aiModal?.classList.toggle("open");
    if (aiModal?.classList.contains("open")) {
      chatInput?.focus();
    }
  };

  aiWidgetTrigger?.addEventListener("click", toggleAiModal);
  closeAiModal?.addEventListener("click", toggleAiModal);

  // Resume Knowledge Base Q&A Map
  const knowledgeBase = [
    {
      keywords: ["rag", "retrieval", "vector", "pinecone", "chromadb", "weaviate", "neo4j", "llama-index"],
      answer: "Sushant has built production-grade multi-stage RAG pipelines and autonomous agentic workflows using LangChain, LangGraph, Pinecone, ChromaDB, Weaviate, LlamaIndex, and Neo4j graph database for dynamic tool-use and semantic search."
    },
    {
      keywords: ["fine-tuning", "lora", "medical", "whisper", "scribing", "accuracy"],
      answer: "Sushant implemented LoRA fine-tuning on open-source LLMs and Whisper models (400K+ parameters) for medical clinical note parsing, boosting domain extraction accuracy from 89% to 96% across 10,000+ healthcare conversations!"
    },
    {
      keywords: ["backend", "nestjs", "fastapi", "node", "express", "microservices", "scale", "performance"],
      answer: "Sushant is an expert in NestJS, Python (FastAPI), Node.js, Express.js, WebSockets, Kafka, Redis caching, and AWS serverless primitives, maintaining 99.9% uptime and sub-second response times under high concurrency."
    },
    {
      keywords: ["proctoring", "vision", "opencv", "insightface", "face", "biometric"],
      answer: "For live technical interview assessments, Sushant integrated OpenCV and InsightFace biometric proctoring pipelines for real-time facial verification and multi-face tracking with >90% accuracy."
    },
    {
      keywords: ["hire", "why", "lead", "experience", "role", "strength"],
      answer: "Sushant brings 3+ years of battle-tested experience designing 0-to-1 production AI systems, leading technical teams, optimizing API token costs via Pydantic routing, and maintaining 99.9% availability."
    },
    {
      keywords: ["contact", "email", "phone", "linkedin", "reach", "location"],
      answer: "You can reach Sushant at sushant.kulkarni841@gmail.com or +917775062359. He is located in Pune, India, and open to AI & Backend engineering roles!"
    }
  ];

  const getAiResponse = (query) => {
    const q = query.toLowerCase();
    for (const kb of knowledgeBase) {
      if (kb.keywords.some((kw) => q.includes(kw))) {
        return kb.answer;
      }
    }
    return "Sushant is an AI Engineer & Backend Developer with 3+ years of experience specializing in LLMs, RAG, LoRA fine-tuning, NestJS, FastAPI, Python, and AWS microservices. Feel free to ask about his projects, skills, or experience!";
  };

  const appendChatMessage = (sender, text) => {
    if (!chatBody) return;
    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-msg ${sender}`;

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.textContent = text;

    msgDiv.appendChild(bubble);
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  };

  const handleUserMessage = (text) => {
    if (!text.trim()) return;
    appendChatMessage("user", text);
    playBeep(600, 0.03);

    if (chatInput) chatInput.value = "";

    setTimeout(() => {
      const response = getAiResponse(text);
      appendChatMessage("bot", response);
      playBeep(900, 0.05);
    }, 400);
  };

  sendChatBtn?.addEventListener("click", () => {
    if (chatInput) handleUserMessage(chatInput.value);
  });

  chatInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleUserMessage(chatInput.value);
    }
  });

  // Preset Prompt Chips
  document.addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("prompt-chip")) {
      const prompt = e.target.getAttribute("data-prompt") || e.target.textContent;
      handleUserMessage(prompt);
    }
  });
});
