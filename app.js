const body = document.body;
const toggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");
function setMenu(open) {
  body.classList.toggle("menu-open", open);
  toggle?.setAttribute("aria-expanded", String(open));
  toggle?.setAttribute("aria-label", open ? "Закрити меню" : "Відкрити меню");
  menu?.setAttribute("aria-hidden", String(!open));
}
toggle?.addEventListener("click", () =>
  setMenu(!body.classList.contains("menu-open")),
);
menu
  ?.querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", () => setMenu(false)));

const animated = document.querySelectorAll(
  ".reveal,.reveal-image,.hero__title",
);
const observer = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }),
  { threshold: 0.12 },
);
animated.forEach((el) => observer.observe(el));

let previousY = window.scrollY;
const header = document.querySelector("[data-header]");
window.addEventListener(
  "scroll",
  () => {
    const y = window.scrollY;
    if (!body.classList.contains("menu-open") && header)
      header.style.transform =
        y > previousY && y > 160 ? "translateY(-100%)" : "translateY(0)";
    previousY = y;
  },
  { passive: true },
);

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.querySelectorAll(".stat__number[data-count]").forEach((el) => {
  const io = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      const target = Number(el.dataset.count);
      if (reduced) {
        el.textContent = target;
        io.disconnect();
        return;
      }
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / 1100, 1),
          v = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(target * v);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      }
      requestAnimationFrame(tick);
      io.disconnect();
    },
    { threshold: 0.55 },
  );
  io.observe(el);
});

const contact = document.querySelector("[data-contact-dialog]"),
  memo = document.querySelector("[data-memo-dialog]");
function openModal(el) {
  document.querySelectorAll(".service-modal.is-open").forEach(closeModal);
  el?.classList.add("is-open");
  el?.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");
}
function closeModal(el) {
  el?.classList.remove("is-open");
  el?.setAttribute("aria-hidden", "true");
  if (!document.querySelector(".service-modal.is-open"))
    body.classList.remove("modal-open");
}
document
  .querySelectorAll("[data-contact-open]")
  .forEach((b) => b.addEventListener("click", () => openModal(contact)));
document
  .querySelectorAll("[data-memo-open]")
  .forEach((b) => b.addEventListener("click", () => openModal(memo)));
document
  .querySelectorAll("[data-contact-close]")
  .forEach((b) => b.addEventListener("click", () => closeModal(contact)));
document
  .querySelectorAll("[data-memo-close]")
  .forEach((b) => b.addEventListener("click", () => closeModal(memo)));

// ===== SERVICE MODALS: "Читати більше" =====
const serviceModalButtons = document.querySelectorAll("[data-service-modal]");

serviceModalButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const modalName = button.dataset.serviceModal;
    const modal = document.querySelector(
      `[data-service-dialog="${modalName}"]`,
    );
    openModal(modal);
  });
});

document.querySelectorAll("[data-service-close]").forEach((button) => {
  button.addEventListener("click", () => {
    closeModal(button.closest(".service-modal"));
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    setMenu(false);
    document.querySelectorAll(".service-modal.is-open").forEach(closeModal);
  }
});

// Card carousels: use positions relative to the scroll container (not offsetParent).
(() => {
  const configs = [
    [".relations__grid", ".relation-card", "relations"],
    [".life-cases__grid", ".life-case", "situations"],
    ['[data-price-track="consultations"]', ".consult-card", "consultations"],
    ['[data-price-track="online-groups"]', ".consult-card", "online-groups"]
  ];
  configs.forEach(([selector, slideSelector, name]) => {
    const track = document.querySelector(selector);
    const nav = document.querySelector(`[data-carousel-nav="${name}"]`);
    if (!track || !nav) return;
    const slides = [...track.querySelectorAll(slideSelector)];
    const prev = nav.querySelector(".mobile-carousel-arrow--prev");
    const next = nav.querySelector(".mobile-carousel-arrow--next");
    const current = nav.querySelector(".mobile-carousel-count span");
    const total = nav.querySelector(".mobile-carousel-count b");
    if (!slides.length || !prev || !next || !current || !total) return;
    total.textContent = String(slides.length).padStart(2, "0");
    const positions = () => {
      const trackRect = track.getBoundingClientRect();
      return slides.map(s => s.getBoundingClientRect().left - trackRect.left + track.scrollLeft);
    };
    let index = 0;
    let scrollingByButton = false;
    let releaseTimer;
    const nearest = () => {
      const pos = positions();
      let best = 0;
      pos.forEach((p, i) => {
        if (Math.abs(p - track.scrollLeft) < Math.abs(pos[best] - track.scrollLeft)) best = i;
      });
      return best;
    };
    const update = () => {
      if (!scrollingByButton) index = nearest();
      current.textContent = String(index + 1).padStart(2, "0");
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      prev.disabled = track.scrollLeft <= 1 && index === 0;
      next.disabled = track.scrollLeft >= maxScroll - 2;
    };
    const go = direction => {
      index = Math.max(0, Math.min(slides.length - 1, nearest() + direction));
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      const target = Math.min(maxScroll, positions()[index]);
      scrollingByButton = true;
      clearTimeout(releaseTimer);
      track.scrollTo({left: target, behavior: reduced ? "instant" : "smooth"});
      current.textContent = String(index + 1).padStart(2, "0");
      releaseTimer = setTimeout(() => {scrollingByButton = false; update();}, 450);
    };
    prev.addEventListener("click", () => go(-1));
    next.addEventListener("click", () => go(1));
    track.addEventListener("scroll", update, {passive: true});
    window.addEventListener("resize", update, {passive: true});
    update();
  });
})();

// ===== CERTIFICATES LIGHTBOX =====
const certificateDialog = document.querySelector("[data-certificate-dialog]");
const certificateImage = document.querySelector("[data-certificate-image]");

document.querySelectorAll("[data-certificate-open]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!certificateDialog || !certificateImage) return;
    certificateImage.src = button.dataset.certificateOpen;
    certificateDialog.classList.add("is-open");
    certificateDialog.setAttribute("aria-hidden", "false");
    document.body.classList.add("certificate-open");
  });
});

document.querySelectorAll("[data-certificate-close]").forEach((button) => {
  button.addEventListener("click", () => {
    certificateDialog?.classList.remove("is-open");
    certificateDialog?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("certificate-open");
  });
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    certificateDialog?.classList.contains("is-open")
  ) {
    certificateDialog.classList.remove("is-open");
    certificateDialog.setAttribute("aria-hidden", "true");
    document.body.classList.remove("certificate-open");
  }
});

// ===== CERTIFICATES SLIDER — SAME NAV STYLE AS OTHER CAROUSELS =====
(() => {
  const certificates = document.querySelector("[data-certificates]");
  if (!certificates) return;

  const viewport = certificates.querySelector("[data-cert-viewport]");
  const track = certificates.querySelector("[data-cert-track]");
  const slides = Array.from(track.querySelectorAll(".certificate"));
  const controls = certificates.querySelector(
    '[data-carousel-nav="certificates"]',
  );
  if (!viewport || !track || !slides.length || !controls) return;

  const prev = controls.querySelector(".mobile-carousel-arrow--prev");
  const next = controls.querySelector(".mobile-carousel-arrow--next");
  const current = controls.querySelector(".mobile-carousel-count span");
  const total = controls.querySelector(".mobile-carousel-count b");

  let index = 0;
  total.textContent = String(slides.length).padStart(2, "0");

  const gap = () => parseFloat(getComputedStyle(track).gap) || 0;
  const step = () => slides[0].getBoundingClientRect().width + gap();
  const trackWidth = () =>
    slides.reduce(
      (sum, slide) => sum + slide.getBoundingClientRect().width,
      0,
    ) +
    gap() * (slides.length - 1);
  const maxTranslate = () =>
    Math.max(0, trackWidth() - viewport.getBoundingClientRect().width);
  const maxIndex = () => (step() ? Math.ceil(maxTranslate() / step()) : 0);

  function update() {
    index = Math.max(0, Math.min(index, maxIndex()));
    const translate = Math.min(index * step(), maxTranslate());
    track.style.transform = `translate3d(-${translate}px,0,0)`;
    current.textContent = String(Math.min(index + 1, slides.length)).padStart(
      2,
      "0",
    );
    prev.disabled = index === 0;
    next.disabled = translate >= maxTranslate() - 1;
  }

  prev.addEventListener("click", () => {
    index -= 1;
    update();
  });
  next.addEventListener("click", () => {
    index += 1;
    update();
  });

  let startX = 0;
  viewport.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
    },
    { passive: true },
  );
  viewport.addEventListener(
    "touchend",
    (e) => {
      const dx = startX - e.changedTouches[0].clientX;
      if (Math.abs(dx) < 45) return;
      index += dx > 0 ? 1 : -1;
      update();
    },
    { passive: true },
  );

  window.addEventListener("resize", update, { passive: true });
  update();
})();
const reviewsTrack = document.querySelector(".reviews__track");
const reviewsPrev = document.querySelector(".reviews__arrow--prev");
const reviewsNext = document.querySelector(".reviews__arrow--next");
const reviewsCurrent = document.querySelector("[data-reviews-current]");
const reviewCards = [...document.querySelectorAll(".review-card")];

function getReviewStep() {
  if (!reviewCards.length) return 0;

  const gap = parseFloat(getComputedStyle(reviewsTrack).columnGap) || 0;

  return reviewCards[0].getBoundingClientRect().width + gap;
}

function updateReviewsCounter() {
  const step = getReviewStep();

  if (!step) return;

  const index = Math.round(reviewsTrack.scrollLeft / step);

  reviewsCurrent.textContent = String(index + 1).padStart(2, "0");
}

reviewsNext?.addEventListener("click", () => {
  reviewsTrack.scrollBy({
    left: getReviewStep(),
    behavior: "smooth",
  });
});

reviewsPrev?.addEventListener("click", () => {
  reviewsTrack.scrollBy({
    left: -getReviewStep(),
    behavior: "smooth",
  });
});

reviewsTrack?.addEventListener("scroll", updateReviewsCounter, {
  passive: true,
});

// ========================================
// CONTACT FORM → TELEGRAM
// УВАГА: BOT TOKEN буде видимий у браузері
// ========================================

const telegramContactForm = document.querySelector("#telegramContactForm");
const contactFormStatus = document.querySelector("#contactFormStatus");

// Telegram
const TELEGRAM_BOT_TOKEN = "8760941538:AAFTin_PPenOC_oVNOx1_ROdUtUU8P_hSdU";
const TELEGRAM_CHAT_ID = "5216191335";

telegramContactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = telegramContactForm.querySelector(
    'button[type="submit"]',
  );

  const formData = new FormData(telegramContactForm);

  const name = formData.get("name")?.trim();
  const contact = formData.get("contact")?.trim();
  const method = formData.get("method")?.trim();
  const message = formData.get("message")?.trim();

  if (!name || !contact) {
    contactFormStatus.textContent = "Будь ласка, вкажіть ім’я та контакт.";
    return;
  }

  const telegramMessage = `
🔔 НОВА ЗАЯВКА ІЗ САЙТУ

👤 Ім’я:
${name}

📱 Контакт:
${contact}

💬 Зручний спосіб зв’язку:
${method || "Не вказано"}

📝 Запит:
${message || "Не вказано"}
  `.trim();

  contactFormStatus.textContent = "Надсилаємо...";

  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: telegramMessage,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.description || "Telegram API error");
    }

    contactFormStatus.textContent = "Дякуємо! Ваш контакт успішно надіслано 🤍";

    telegramContactForm.reset();
  } catch (error) {
    console.error("Telegram error:", error);

    contactFormStatus.textContent = "Не вдалося надіслати. Спробуйте ще раз.";
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
});

const mobileGroups = document.querySelector(".mobile-nav-dropdown");
const mobileGroupsTrigger = document.querySelector(
  ".mobile-nav-dropdown__trigger",
);

mobileGroupsTrigger?.addEventListener("click", () => {
  const isOpen = mobileGroups.classList.toggle("is-open");

  mobileGroupsTrigger.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", () => {
    setMenu(false);
    document.querySelectorAll(".service-modal.is-open").forEach(closeModal);
  });
});
window.addEventListener("hashchange", () => setMenu(false));
