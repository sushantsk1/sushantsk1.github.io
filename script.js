/* Portfolio interactions. The page remains readable without JavaScript. */
'use strict';
const menuToggle = document.querySelector('.mobile-toggle');
const menu = document.querySelector('#nav-menu');
const mobileLayout = window.matchMedia('(max-width: 900px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const navLinks = [...document.querySelectorAll('.nav-link')];
const faq = document.querySelector('#portfolio-faq');
const faqTrigger = document.querySelector('#faq-trigger');
const toast = document.querySelector('#toast');
let toastTimeout;

function notify(message) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 4000);
}
function setMenu(open, returnFocus = false) {
  const isOpen = open && mobileLayout.matches;
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  menu.classList.toggle('open', isOpen);
  menu.inert = mobileLayout.matches && !isOpen;
  if (returnFocus) menuToggle.focus();
}
document.documentElement.classList.add('js');
setMenu(false);
menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('click', event => {
  if (!event.target.closest('.nav-container')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') setMenu(false, true);
});
document.querySelector('.nav-container').addEventListener('focusout', event => {
  if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setMenu(false);
});
mobileLayout.addEventListener('change', () => setMenu(false));

// Progressive enhancement: reveal only content below the first screen.
const revealElements = [...document.querySelectorAll('.reveal')];
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });
  revealElements.forEach(element => {
    if (element.getBoundingClientRect().top > window.innerHeight) {
      element.classList.add('reveal-pending');
      observer.observe(element);
    }
  });
  document.addEventListener('focusin', event => event.target.closest('.reveal-pending')?.classList.remove('reveal-pending'));
  reducedMotion.addEventListener('change', event => {
    if (event.matches) revealElements.forEach(element => element.classList.remove('reveal-pending'));
  });
}
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        const active = link.hash === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -70% 0px' });
  document.querySelectorAll('main > section').forEach(section => sectionObserver.observe(section));
}

// No delayed hiding: rapid filter changes always show the selected category.
const filters = [...document.querySelectorAll('.filter-btn')];
const skillCards = [...document.querySelectorAll('.skill-card')];
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(filter => {
    const selected = filter === button;
    filter.classList.toggle('active', selected);
    filter.setAttribute('aria-pressed', String(selected));
  });
  let visibleCount = 0;
  skillCards.forEach(card => {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
    if (!card.hidden) {
      visibleCount++;
      card.classList.remove('reveal-pending');
    }
  });
  document.querySelector('#skills-status').textContent = `${visibleCount} skill groups shown for ${button.textContent}.`;
}));

document.querySelector('#copy-email').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('sushant.kulkarni841@gmail.com');
    notify('Email address copied.');
  } catch {
    notify('Please select the email address above to copy it, or use the email link.');
  }
});
document.querySelector('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = String(data.get('name')).trim();
  const email = String(data.get('email')).trim();
  const subject = String(data.get('subject')).trim();
  const message = String(data.get('message')).trim();
  const status = document.querySelector('#form-status');
  if (!name || !email || !subject || !message) {
    status.textContent = 'Please add a name, email, subject, and message.';
    return;
  }
  const body = `From: ${name}\nEmail: ${email}\n\n${message}`;
  window.location.href = `mailto:sushant.kulkarni841@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  status.textContent = 'Your email app was requested. Your message stays here if you need to copy it. You can also email sushant.kulkarni841@gmail.com directly.';
});
document.querySelector('#open-email-draft').disabled = false;

// Native dialog provides modal semantics, focus containment, and Escape support.
if (typeof faq.showModal === 'function') {
  faqTrigger.hidden = false;
  faqTrigger.addEventListener('click', () => {
    setMenu(false);
    faq.showModal();
    faqTrigger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('dialog-open');
  });
  document.querySelector('#faq-close').addEventListener('click', () => faq.close());
  faq.addEventListener('close', () => {
    faqTrigger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('dialog-open');
  });
  faq.addEventListener('click', event => {
    if (event.target === faq) {
      const rect = faq.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) faq.close();
    }
    const link = event.target.closest('a');
    if (link?.getAttribute('href').startsWith('#')) {
      faq.close();
      const target = document.querySelector(link.getAttribute('href'));
      target?.classList.remove('reveal-pending');
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  });
}
document.querySelector('#year').textContent = String(new Date().getFullYear());
