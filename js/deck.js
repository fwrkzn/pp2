/**
 * Zerosix Slide Deck: per-slide transitions & element choreography
 */

(function () {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  let current = 0;
  let isTransitioning = false;

  const fullscreenBtn = document.getElementById("fullscreen");
  const deck = document.getElementById("deck");

  const DURATIONS = {
    hook: 700,
    timeline: 600,
    doubt: 750,
    questions: 650,
    vision: 800,
    compare: 700,
    glass: 650,
    build: 700,
    closing: 850,
  };

  // Longest element entrance per slide (delay + duration)
  const CHOREOGRAPHY = {
    hook: 2800,
    timeline: 1900,
    doubt: 3450,
    questions: 1550,
    vision: 3550,
    compare: 3350,
    glass: 1700,
    build: 2150,
    closing: 2400,
  };

  let ambientTimer = null;

  function getDuration(slide) {
    return DURATIONS[slide.dataset.transition] || 800;
  }

  function getChoreography(slide) {
    return CHOREOGRAPHY[slide.dataset.transition] || 2000;
  }

  function clearSlideClasses(slide) {
    slide.classList.remove(
      "is-active", "is-entering", "ambient-active", "play-animations",
      "enter-fwd", "enter-back"
    );
  }

  function scheduleAmbient(slide) {
    clearTimeout(ambientTimer);
    const delay = getChoreography(slide);
    ambientTimer = setTimeout(() => {
      if (slide.classList.contains("is-active")) {
        slide.classList.add("ambient-active");
      }
    }, delay);
  }

  function replayElements(slide) {
    slide.classList.remove("play-animations");
    void slide.offsetWidth;
    slide.classList.add("play-animations");
  }

  function updateTitle() {
    document.title = `Zerosix, slide ${current + 1}/${total}`;
  }

  function goTo(index, direction = 1) {
    if (isTransitioning || index < 0 || index >= total || index === current) return;
    isTransitioning = true;

    const outgoing = slides[current];
    const incoming = slides[index];
    const fwd = direction > 0;
    const enterDur = getDuration(incoming);

    // Instant cut — no exit animation, only entrance on incoming
    clearSlideClasses(outgoing);
    clearSlideClasses(incoming);

    const enterClass = fwd ? "enter-fwd" : "enter-back";
    incoming.classList.add("is-active", "is-entering", enterClass);
    replayElements(incoming);
    scheduleAmbient(incoming);

    current = index;
    updateTitle();
    history.replaceState(null, "", `#${current + 1}`);

    setTimeout(() => {
      incoming.classList.remove("is-entering", "enter-fwd", "enter-back");
      isTransitioning = false;
    }, enterDur);
  }

  function next() {
    if (current < total - 1) goTo(current + 1, 1);
  }

  function prev() {
    if (current > 0) goTo(current - 1, -1);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0, -1);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(total - 1, 1);
    } else if (e.key === "f" || e.key === "F") {
      toggleFullscreen();
    }
  });

  deck.addEventListener("click", (e) => {
    if (e.target.closest(".fullscreen-btn")) return;
    const rect = deck.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    if (x < third) prev();
    else if (x > third * 2) next();
  });

  let touchStartX = 0;
  deck.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  deck.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
  }, { passive: true });

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  fullscreenBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFullscreen();
  });

  let wheelTimeout;
  deck.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) < 30) return;
    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => {
      e.deltaY > 0 ? next() : prev();
    }, 50);
  }, { passive: true });

  // Init
  const hash = parseInt(location.hash.replace("#", ""), 10);
  slides.forEach((s, i) => clearSlideClasses(s));

  if (hash >= 1 && hash <= total) {
    current = hash - 1;
  }

  requestAnimationFrame(() => {
    const slide = slides[current];
    slide.classList.add("is-active", "is-entering", "enter-fwd", "play-animations");
    scheduleAmbient(slide);
    setTimeout(() => {
      slide.classList.remove("is-entering", "enter-fwd");
    }, getDuration(slide));
    updateTitle();
  });
})();