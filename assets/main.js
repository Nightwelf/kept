// Kept Memories site: language switch, the story in the phone, reveal on scroll.
(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Language ----------

  const head = {
    ru: {
      title: "Kept Memories — воспоминания из фото на телефоне",
      description:
        "Каждое утро — воспоминание из фото, которые уже лежат на телефоне: этот день, поездки, лучшее за месяц. Без облака: фото не покидают телефон.",
    },
    en: {
      title: "Kept Memories — memories from the photos on your phone",
      description:
        "Every morning, a memory from the photos already on your phone: this day, trips, best shots. No cloud: your photos never leave the phone.",
    },
  };

  const setLang = (lang) => {
    root.lang = lang;
    document.title = head[lang].title;
    document.querySelector('meta[name="description"]').content = head[lang].description;
    for (const button of document.querySelectorAll("[data-set-lang]")) {
      button.setAttribute("aria-pressed", String(button.dataset.setLang === lang));
    }
    try {
      localStorage.setItem("kept-lang", lang);
    } catch {
      // Private mode: the choice just isn't remembered.
    }
  };

  for (const button of document.querySelectorAll("[data-set-lang]")) {
    button.addEventListener("click", () => setLang(button.dataset.setLang));
  }
  setLang(root.lang === "en" ? "en" : "ru");

  // ---------- Live dates in the story ----------

  const now = new Date();
  for (const el of document.querySelectorAll("[data-ago]")) {
    const day = new Date(now);
    day.setFullYear(now.getFullYear() - Number(el.dataset.ago));
    const date = new Intl.DateTimeFormat(el.lang, { day: "numeric", month: "long", year: "numeric" })
      .format(day)
      .replace(/\s?г\.$/, "");
    el.textContent = el.lang === "ru" ? `В этот день · ${date}` : `On this day · ${date}`;
  }
  for (const el of document.querySelectorAll("[data-month]")) {
    const month = new Date(now.getFullYear(), now.getMonth() + Number(el.dataset.month), 1);
    const lang = el.closest("[lang]").lang;
    el.textContent = new Intl.DateTimeFormat(lang, { month: "long" }).format(month);
  }

  // ---------- The story: 5 s a frame, tap left/right, hover holds ----------

  const story = document.querySelector("[data-story]");
  if (story) {
    const slides = [...story.querySelectorAll(".slide")];
    const bars = [...story.querySelectorAll(".bars i")];
    let current = 0;

    const show = (index) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === current));
      bars.forEach((bar, i) => {
        bar.classList.toggle("is-done", i < current);
        bar.classList.remove("is-active");
      });
      void bars[current].offsetWidth; // restart the progress animation
      bars[current].classList.add("is-active");
    };

    for (const bar of bars) bar.addEventListener("animationend", () => show(current + 1));
    story.addEventListener("click", (event) => {
      const box = story.getBoundingClientRect();
      show(event.clientX - box.left < box.width / 3 ? current - 1 : current + 1);
    });
  }

  // ---------- Tilt the phone after the pointer ----------

  const visual = document.querySelector(".visual");
  if (visual && story && !reduceMotion && matchMedia("(pointer: fine)").matches) {
    visual.addEventListener("pointermove", (event) => {
      const box = visual.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      story.style.setProperty("--ry", `${x * 10}deg`);
      story.style.setProperty("--rx", `${y * -8}deg`);
    });
    visual.addEventListener("pointerleave", () => {
      story.style.removeProperty("--ry");
      story.style.removeProperty("--rx");
    });
  }

  // ---------- Header shadow and reveal on scroll ----------

  const header = document.querySelector(".header");
  const onScroll = () => header.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const revealed = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    for (const el of revealed) el.classList.add("is-in");
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  for (const el of revealed) observer.observe(el);
})();
