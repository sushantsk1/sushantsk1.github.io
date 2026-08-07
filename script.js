/* ==========================================================================
   Sushant Kulkarni Portfolio - Interactive JavaScript Engine
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // --- Elements & References ---
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
  handleScroll(); // Initial check

  // --- Mobile Navigation Toggle ---
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      const icon = mobileToggle.querySelector("i");
      if (icon) {
        icon.className = navMenu.classList.contains("active") ? "fa-solid fa-xmark" : "fa-solid fa-bars";
      }
    });

    // Close menu when link is clicked
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active");
        const icon = mobileToggle.querySelector("i");
        if (icon) icon.className = "fa-solid fa-bars";
      });
    });
  }

  // --- Intersection Observer for Scroll Reveals ---
  const observerOptions = {
    root: null,
    threshold: 0.12,
    rootMargin: "0px 0px -50px 0px",
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach((el) => revealObserver.observe(el));

  // --- Skills Filter Tabs ---
  if (skillTabs.length > 0 && skillCards.length > 0) {
    skillTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        // Remove active class from all tabs
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
      const email = "sushant.kulkarni841@gmail.com";
      try {
        await navigator.clipboard.writeText(email);
        showToast("Email address copied to clipboard!");
      } catch (err) {
        showToast("Failed to copy email automatically.", true);
      }
    });
  }

  // --- Contact Form Submission Handler ---
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("senderName")?.value || "";
      const email = document.getElementById("senderEmail")?.value || "";
      const subject = document.getElementById("msgSubject")?.value || "Portfolio Contact";
      const message = document.getElementById("senderMsg")?.value || "";

      if (!name || !email || !message) {
        showToast("Please complete all required fields.", true);
        return;
      }

      // Construct mailto URL as fallthrough
      const mailtoUrl = `mailto:sushant.kulkarni841@gmail.com?subject=${encodeURIComponent(
        subject + " - from " + name
      )}&body=${encodeURIComponent("Sender Email: " + email + "\n\n" + message)}`;

      window.location.href = mailtoUrl;
      showToast("Opening email client to send message!");
      contactForm.reset();
    });
  }
});
