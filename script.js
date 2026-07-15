const menuButton = document.querySelector(".menu-button");
const siteNav = document.querySelector(".site-nav");
const siteHeader = document.querySelector(".site-header");
const navLinks = document.querySelectorAll(".site-nav a");
const navPill = document.querySelector(".nav-pill");
const sections = document.querySelectorAll("main section[id]");
const themeToggle = document.querySelector(".theme-toggle");
const themeIcon = document.querySelector(".theme-icon");
const themeLabel = document.querySelector(".theme-label");
const root = document.documentElement;

function clearNavHighlight() {
  navLinks.forEach((link) => {
    link.classList.remove("active");
    link.removeAttribute("aria-current");
  });
  if (navPill) {
    navPill.style.opacity = "0";
  }
}

function positionNavPill() {
  if (!navPill) return;

  // The hero sits above the first navigable section, so no section should be
  // highlighted while the page is at the very top.
  if (window.scrollY < 80) {
    clearNavHighlight();
    return;
  }

  const activeLink = document.querySelector(".site-nav a.active");
  if (!activeLink) {
    navPill.style.opacity = "0";
    return;
  }

  const navRect = siteNav.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();

  navPill.style.width = `${linkRect.width}px`;
  navPill.style.transform = `translateX(${linkRect.left - navRect.left}px)`;
  navPill.style.opacity = "1";
}

let savedTheme = null;

try {
  savedTheme = localStorage.getItem("aeris-theme");
} catch (error) {
  savedTheme = null;
}

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);

  if (theme === "dark") {
    themeIcon.textContent = "☀";
    themeLabel.textContent = "Light";
    themeToggle.setAttribute("aria-label", "Switch to light mode");
  } else {
    themeIcon.textContent = "☾";
    themeLabel.textContent = "Dark";
    themeToggle.setAttribute("aria-label", "Switch to dark mode");
  }
}

applyTheme(savedTheme || "dark");

themeToggle.addEventListener("click", () => {
  const currentTheme = root.getAttribute("data-theme");
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  applyTheme(nextTheme);
  try {
    localStorage.setItem("aeris-theme", nextTheme);
  } catch (error) {
    // The selected theme still applies for the current page if storage is unavailable.
  }
});

const detailDialog = document.querySelector("#detail-dialog");
const detailDialogTitle = document.querySelector("#detail-dialog-title");
const detailDialogCopy = document.querySelector("#detail-dialog-copy");
const detailButtons = document.querySelectorAll("[data-detail]");

const detailContent = {
  workflow: {
    title: "Guided MIP and MEP testing",
    copy: "The clinician selects MIP or MEP, follows the instructions for that test, completes repeated breathing efforts, and reviews the result. Aeris keeps the journey consistent and clearly shows when three attempts meet the 10% repeatability criterion."
  },
  results: {
    title: "Clear results and repeatability checks",
    copy: "The result screen combines the pressure curve, measured result, predicted comparison, repeatability outcome, attempt count, and test time. This gives the clinician a complete view of the test in one place."
  }
};

function closeDetailDialog() {
  if (!detailDialog) return;
  detailDialog.hidden = true;
  document.body.classList.remove("dialog-open");
}

detailButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const content = detailContent[button.dataset.detail];
    if (!content || !detailDialog) return;

    detailDialogTitle.textContent = content.title;
    detailDialogCopy.textContent = content.copy;
    detailDialog.hidden = false;
    document.body.classList.add("dialog-open");
    detailDialog.querySelector(".detail-dialog-close").focus();
  });
});

detailDialog?.querySelectorAll("[data-close-dialog]").forEach((element) => {
  element.addEventListener("click", closeDetailDialog);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && detailDialog && !detailDialog.hidden) {
    closeDetailDialog();
  }
});

// Navigation remains visible at every screen size, so no mobile menu state is needed.
let clickedNavSection = null;
let clickedNavReleaseTimer = null;

const desktopNavQuery = window.matchMedia("(min-width: 981px)");

function getDocumentTop(element) {
  let top = 0;
  let current = element;

  while (current) {
    top += current.offsetTop;
    current = current.offsetParent;
  }

  return top;
}

function getSectionContentMarker(section) {
  return section.querySelector(".section-heading") || section;
}

function getSectionTrackingTop(section) {
  // Track the visible section heading on every display size. This prevents the
  // previous section from remaining visible behind the translucent phone nav.
  return getDocumentTop(getSectionContentMarker(section)) - window.scrollY;
}

function getDesktopContentGap() {
  if (window.innerWidth >= 2200) return 64;
  return 48;
}

const sectionDesktopOffsets = {
  overview: -45,
  client: -45,
  brief: -45,
  development: -45,
  product: -35,
  team: 0
};

function getSectionDesktopOffset(sectionId) {
  return sectionDesktopOffsets[sectionId] ?? 0;
}

function releaseClickedNavSection() {
  if (!clickedNavSection) return;
  clickedNavSection = null;
  window.clearTimeout(clickedNavReleaseTimer);
  requestNavUpdate();
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const sectionId = link.getAttribute("href")?.slice(1);
    const targetSection = sectionId ? document.getElementById(sectionId) : null;

    siteNav.classList.remove("open");
    document.body.classList.remove("menu-open");

    if (!targetSection || !siteHeader) return;

    event.preventDefault();

    const headerBottom = siteHeader.getBoundingClientRect().bottom;
    const targetTop = targetSection.getBoundingClientRect().top + window.scrollY;
    let scrollTop = Math.max(0, targetTop - headerBottom - 10);

    // Align the visible heading rather than the padded section edge. Phones use
    // a compact gap below the two-row navbar, while desktop keeps its existing
    // per-section offsets. Team retains the bottom-of-page clamping behaviour.
    if (sectionId !== "team") {
      const contentTop = getDocumentTop(getSectionContentMarker(targetSection));
      const sectionGap = desktopNavQuery.matches
        ? getDesktopContentGap() + getSectionDesktopOffset(sectionId)
        : 18;
      scrollTop = Math.max(0, contentTop - headerBottom - sectionGap);
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    clickedNavSection = sectionId;
    setActiveNav(sectionId);
    positionNavPill();

    history.replaceState(null, "", `#${sectionId}`);
    window.scrollTo({
      top: scrollTop,
      behavior: reducedMotion ? "auto" : "smooth"
    });

    window.clearTimeout(clickedNavReleaseTimer);
    clickedNavReleaseTimer = window.setTimeout(releaseClickedNavSection, reducedMotion ? 80 : 1400);
  });
});

window.addEventListener("wheel", releaseClickedNavSection, { passive: true });
window.addEventListener("touchstart", releaseClickedNavSection, { passive: true });

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

function setActiveNav(sectionId) {
  let changed = false;

  navLinks.forEach((link) => {
    const shouldBeActive = link.getAttribute("href") === `#${sectionId}`;
    if (link.classList.contains("active") !== shouldBeActive) {
      changed = true;
    }
    link.classList.toggle("active", shouldBeActive);
    if (shouldBeActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if (changed) positionNavPill();
}

function updateActiveSection() {
  if (clickedNavSection) {
    setActiveNav(clickedNavSection);
    return;
  }

  const headerBottom = siteHeader?.getBoundingClientRect().bottom ?? 0;
  const sectionBoundary = headerBottom + (desktopNavQuery.matches ? getDesktopContentGap() + 8 : 24);
  const firstSection = sections[0];
  const lastSection = sections[sections.length - 1];
  const pageBottom = window.scrollY + window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const isAtPageBottom = pageBottom >= documentHeight - 12;

  // The final section may be too short to reach the header boundary. Once the
  // page reaches the bottom, keep the final navigation item selected.
  if (lastSection && isAtPageBottom) {
    setActiveNav(lastSection.id);
    return;
  }

  if (!firstSection || getSectionTrackingTop(firstSection) > sectionBoundary) {
    clearNavHighlight();
    return;
  }

  let activeSection = firstSection;

  sections.forEach((section) => {
    const sectionOffset = desktopNavQuery.matches ? getSectionDesktopOffset(section.id) : 0;
    if (getSectionTrackingTop(section) <= sectionBoundary + sectionOffset) {
      activeSection = section;
    }
  });

  setActiveNav(activeSection.id);
}

let scrollFrame = null;

function requestNavUpdate() {
  if (scrollFrame !== null) return;

  scrollFrame = window.requestAnimationFrame(() => {
    updateActiveSection();
    positionNavPill();
    scrollFrame = null;
  });
}

window.addEventListener("resize", requestNavUpdate);
window.addEventListener("scroll", requestNavUpdate, { passive: true });
window.addEventListener("load", () => window.setTimeout(requestNavUpdate, 60));

const linkedinProfileLinks = document.querySelectorAll('.team-card a[href*="linkedin.com/in/"]');
const userAgent = navigator.userAgent || "";
const isAndroidDevice = /Android/i.test(userAgent);
const isAppleMobileDevice =
  /iPhone|iPad|iPod/i.test(userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

linkedinProfileLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const profileUrl = new URL(link.href);

    if (isAndroidDevice) {
      event.preventDefault();
      const intentTarget = `${profileUrl.host}${profileUrl.pathname}${profileUrl.search}`;
      const fallbackUrl = encodeURIComponent(profileUrl.href);
      window.location.href = `intent://${intentTarget}#Intent;scheme=https;package=com.linkedin.android;S.browser_fallback_url=${fallbackUrl};end`;
      return;
    }

    if (isAppleMobileDevice) {
      event.preventDefault();
      window.location.href = profileUrl.href;
    }
  });
});

const developmentDropdowns = document.querySelectorAll(".timeline-item details");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function closedDetailsHeight(details, summary) {
  const styles = window.getComputedStyle(details);
  return (
    summary.getBoundingClientRect().height +
    Number.parseFloat(styles.paddingTop) +
    Number.parseFloat(styles.paddingBottom)
  );
}

developmentDropdowns.forEach((details) => {
  const summary = details.querySelector("summary");
  const content = details.querySelector(".timeline-content");
  let heightAnimation = null;
  let contentAnimation = null;
  let targetOpen = details.open;

  if (!summary || !content) return;

  details.classList.add("has-animated-dropdown");
  details.classList.toggle("is-expanded", details.open);
  summary.setAttribute("aria-expanded", String(details.open));

  function finish(open) {
    details.open = open;
    targetOpen = open;
    details.classList.toggle("is-expanded", open);
    summary.setAttribute("aria-expanded", String(open));
    details.classList.remove("is-animating");
    details.style.height = "";
    details.style.overflow = "";
    content.style.opacity = "";
    content.style.transform = "";
    heightAnimation = null;
    contentAnimation = null;
  }

  function toggleDropdown(open) {
    targetOpen = open;

    if (reducedMotionQuery.matches || typeof details.animate !== "function") {
      heightAnimation?.cancel();
      contentAnimation?.cancel();
      finish(open);
      return;
    }

    const wasOpen = details.open;
    const currentHeight = details.getBoundingClientRect().height;
    const contentStyles = window.getComputedStyle(content);
    const currentOpacity = !wasOpen && open ? "0" : contentStyles.opacity;
    const currentTransform = !wasOpen && open
      ? "translateY(-4px)"
      : contentStyles.transform === "none"
        ? "translateY(0)"
        : contentStyles.transform;

    heightAnimation?.cancel();
    contentAnimation?.cancel();

    if (open && !details.open) {
      details.open = true;
    }

    const endHeight = open
      ? details.scrollHeight
      : closedDetailsHeight(details, summary);

    details.classList.add("is-animating");
    details.classList.toggle("is-expanded", open);
    details.style.overflow = "hidden";
    details.style.height = `${currentHeight}px`;
    summary.setAttribute("aria-expanded", String(open));

    heightAnimation = details.animate(
      {
        height: [`${currentHeight}px`, `${endHeight}px`]
      },
      {
        duration: 360,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)"
      }
    );

    contentAnimation = content.animate(
      [
        { opacity: currentOpacity, transform: currentTransform },
        open
          ? { opacity: 1, transform: "translateY(0)" }
          : { opacity: 0, transform: "translateY(-3px)" }
      ],
      {
        duration: open ? 280 : 190,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "both"
      }
    );

    heightAnimation.addEventListener(
      "finish",
      () => {
        if (targetOpen === open) finish(open);
      },
      { once: true }
    );
  }

  summary.addEventListener("click", (event) => {
    event.preventDefault();
    toggleDropdown(!targetOpen);
  });
});
