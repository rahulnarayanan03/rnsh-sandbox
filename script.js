const menuButton = document.querySelector(".menu-button");
const siteNav = document.querySelector(".site-nav");
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

  // Compact layouts use the link background as the active indicator rather
  // than the moving pill. Keep the active class intact on phones and tablets.
  if (window.innerWidth <= 980) {
    navPill.style.opacity = "0";
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

const savedTheme = localStorage.getItem("aeris-theme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";

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

applyTheme(savedTheme || preferredTheme);

themeToggle.addEventListener("click", () => {
  const currentTheme = root.getAttribute("data-theme");
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  applyTheme(nextTheme);
  localStorage.setItem("aeris-theme", nextTheme);
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

menuButton.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  menuButton.classList.toggle("active", isOpen);
  menuButton.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("menu-open", isOpen);
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    siteNav.classList.remove("open");
    menuButton.classList.remove("active");
    menuButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  });
});

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
  const headerBottom = document
    .querySelector(".site-header")
    ?.getBoundingClientRect().bottom ?? 0;
  const sectionBoundary = headerBottom + 24;
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

  if (!firstSection || firstSection.getBoundingClientRect().top > sectionBoundary) {
    clearNavHighlight();
    return;
  }

  let activeSection = firstSection;

  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= sectionBoundary) {
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
