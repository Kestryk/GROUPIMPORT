// Generic EasyEdu guide foundation for Moodle plugins.
//
// Plugins should copy this module into their AMD source folder and configure
// selectors, paths and labels from plugin-specific PHP/Mustache data.

const DEFAULTS = {
  storageKey: 'easyedu.guide.seen',
  firstVisit: false,
  targets: {},
  paths: {},
  labels: {
    close: 'Close',
    next: 'Next',
    previous: 'Previous',
    start: 'Start guided path',
    complete: 'Everything is ready. Return to the guide when you want to review another topic.'
  }
};

const SELECTORS = {
  open: '[data-easyedu-guide-open]',
  close: '[data-easyedu-guide-close]',
  modal: '[data-easyedu-guide-modal]',
  slide: '[data-easyedu-guide-slide]',
  nav: '[data-easyedu-guide-nav]',
  navItem: '[data-easyedu-guide-nav-item]',
  navNext: '[data-easyedu-guide-nav-next]',
  navPrevious: '[data-easyedu-guide-nav-previous]',
  next: '[data-easyedu-guide-next]',
  previous: '[data-easyedu-guide-previous]',
  showTarget: '[data-easyedu-guide-show-target]',
  startPath: '[data-easyedu-guide-start-path]',
  checklist: '[data-easyedu-guide-checklist]',
  checklistClose: '[data-easyedu-guide-checklist-close]',
  checklistItems: '[data-easyedu-guide-checklist-items]',
  checklistMinimize: '[data-easyedu-guide-checklist-minimize]',
  checklistReturn: '[data-easyedu-guide-checklist-return]',
  highlight: '[data-easyedu-guide-highlight]'
};

const mergeConfig = config => Object.assign({}, DEFAULTS, config || {}, {
  labels: Object.assign({}, DEFAULTS.labels, (config && config.labels) || {}),
  targets: Object.assign({}, DEFAULTS.targets, (config && config.targets) || {}),
  paths: Object.assign({}, DEFAULTS.paths, (config && config.paths) || {})
});

const getStorage = () => {
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
};

const resolveTarget = (config, keyOrSelector) => {
  if (!keyOrSelector) {
    return null;
  }

  const selector = config.targets[keyOrSelector] || keyOrSelector;
  try {
    return document.querySelector(selector);
  } catch (error) {
    return null;
  }
};

const createHighlight = root => {
  let highlight = root.querySelector(SELECTORS.highlight);
  if (highlight) {
    return highlight;
  }

  highlight = document.createElement('div');
  highlight.setAttribute('data-easyedu-guide-highlight', '1');
  highlight.className = 'easyedu-guide-highlight';
  highlight.hidden = true;
  root.appendChild(highlight);
  return highlight;
};

const updateHighlight = (root, target) => {
  const highlight = createHighlight(root);
  if (!target) {
    highlight.hidden = true;
    root.easyeduGuideCurrentTarget = null;
    return;
  }

  const rect = target.getBoundingClientRect();
  root.easyeduGuideCurrentTarget = target;
  highlight.hidden = false;
  highlight.style.height = `${Math.max(rect.height, 1)}px`;
  highlight.style.left = `${rect.left + window.scrollX}px`;
  highlight.style.top = `${rect.top + window.scrollY}px`;
  highlight.style.width = `${Math.max(rect.width, 1)}px`;
};

const dockChecklistAwayFromTarget = (root, target) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  if (!checklist || checklist.hidden || !target) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const viewportMiddle = window.innerWidth / 2;
  const dockRight = rect.left < viewportMiddle;

  checklist.classList.toggle('is-docked-right', dockRight);
  checklist.classList.toggle('is-docked-left', !dockRight);
};

const scrollToTarget = (root, target) => {
  if (!target) {
    return;
  }

  dockChecklistAwayFromTarget(root, target);

  target.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  });

  window.setTimeout(() => updateHighlight(root, target), 320);
  window.setTimeout(() => updateHighlight(root, target), 700);
  window.setTimeout(() => updateHighlight(root, target), 1150);
};

const scrollActiveNavItemIntoView = root => {
  const active = root.querySelector(`${SELECTORS.navItem}.is-active`);
  if (active) {
    active.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }
};

const getActiveSlideIndex = root => Number(root.getAttribute('data-easyedu-guide-current-slide') || 0);

const getSlideCount = root => root.querySelectorAll(SELECTORS.slide).length;

const setActiveSlide = (root, index) => {
  const slides = Array.from(root.querySelectorAll(SELECTORS.slide));
  const safeIndex = Math.max(0, Math.min(index, slides.length - 1));

  slides.forEach((slide, slideIndex) => {
    slide.hidden = slideIndex !== safeIndex;
    slide.classList.toggle('is-active', slideIndex === safeIndex);
  });

  root.querySelectorAll(SELECTORS.navItem).forEach((item, itemIndex) => {
    item.classList.toggle('is-active', itemIndex === safeIndex);
    item.setAttribute('aria-current', itemIndex === safeIndex ? 'step' : 'false');
  });

  root.setAttribute('data-easyedu-guide-current-slide', String(safeIndex));
  scrollActiveNavItemIntoView(root);
};

const openModal = (root, config) => {
  const modal = root.querySelector(SELECTORS.modal);
  if (!modal) {
    return;
  }

  modal.hidden = false;
  modal.classList.add('is-open');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('tabindex', '-1');
  modal.focus({preventScroll: true});

  const storage = getStorage();
  if (storage) {
    storage.setItem(config.storageKey, '1');
  }
};

const closeModal = root => {
  const modal = root.querySelector(SELECTORS.modal);
  if (!modal) {
    return;
  }

  modal.classList.remove('is-open');
  modal.hidden = true;
  updateHighlight(root, null);
};

const renderChecklist = (root, config, pathName) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  const list = root.querySelector(SELECTORS.checklistItems);
  const steps = config.paths[pathName] || [];

  if (!checklist || !list || steps.length === 0) {
    return;
  }

  checklist.hidden = false;
  checklist.classList.remove('is-docked-left', 'is-docked-right');
  checklist.classList.toggle('has-guided-feedback', steps.some(step => !!step.feedback));
  checklist.setAttribute('data-easyedu-guide-path', pathName);
  list.innerHTML = '';

  steps.forEach((step, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'easyedu-guide-checklist__item easyedu-guided-panel__step';
    item.setAttribute('data-easyedu-guide-step-id', step.id || String(index));
    item.setAttribute('data-easyedu-guide-step-index', String(index));
    const marker = document.createElement('span');
    marker.className = 'easyedu-guide-checklist__marker easyedu-guided-panel__index';
    marker.textContent = String(index + 1);
    const label = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = step.title || '';
    label.appendChild(title);
    if (step.description) {
      const description = document.createElement('small');
      description.textContent = step.description;
      label.appendChild(description);
    }
    item.append(marker, label);
    list.appendChild(item);
  });
};

const completeStep = (root, pathName, stepIdOrIndex) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  if (!checklist || checklist.getAttribute('data-easyedu-guide-path') !== pathName) {
    return;
  }

  const selector = `[data-easyedu-guide-step-id="${stepIdOrIndex}"], [data-easyedu-guide-step-index="${stepIdOrIndex}"]`;
  const item = checklist.querySelector(selector);
  if (item) {
    item.classList.add('is-complete');
  }

  const items = Array.from(checklist.querySelectorAll('[data-easyedu-guide-step-id]'));
  checklist.classList.toggle('is-complete', items.length > 0 && items.every(step => step.classList.contains('is-complete')));
};

const refreshActiveHighlight = root => {
  const highlight = root.querySelector(SELECTORS.highlight);
  if (!highlight || highlight.hidden || !root.easyeduGuideCurrentTarget) {
    return;
  }

  updateHighlight(root, root.easyeduGuideCurrentTarget);
};

const isModalOpen = root => {
  const modal = root.querySelector(SELECTORS.modal);
  return !!modal && !modal.hidden && modal.classList.contains('is-open');
};

const isTypingTarget = target => {
  if (!target) {
    return false;
  }

  const tagName = target.tagName ? target.tagName.toLowerCase() : '';
  return target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'select' ||
    tagName === 'textarea';
};

const moveNav = (root, direction) => {
  const nav = root.querySelector(SELECTORS.nav);
  if (!nav) {
    return;
  }

  nav.scrollBy({
    left: direction * Math.max(nav.clientWidth * 0.75, 160),
    behavior: 'smooth'
  });
};

const bindNavWheel = root => {
  const nav = root.querySelector(SELECTORS.nav);
  if (!nav || nav.dataset.easyeduGuideWheelBound === '1') {
    return;
  }
  nav.dataset.easyeduGuideWheelBound = '1';
  nav.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    nav.scrollBy({
      left: event.deltaY,
      behavior: 'auto'
    });
  }, {passive: false});
};

const bindGuide = (root, config) => {
  root.addEventListener('click', event => {
    const open = event.target.closest(SELECTORS.open);
    if (open && root.contains(open)) {
      event.preventDefault();
      openModal(root, config);
      return;
    }

    const navNext = event.target.closest(SELECTORS.navNext);
    if (navNext && root.contains(navNext)) {
      event.preventDefault();
      moveNav(root, 1);
      return;
    }

    const navPrevious = event.target.closest(SELECTORS.navPrevious);
    if (navPrevious && root.contains(navPrevious)) {
      event.preventDefault();
      moveNav(root, -1);
      return;
    }

    const close = event.target.closest(SELECTORS.close);
    if (close && root.contains(close)) {
      event.preventDefault();
      closeModal(root);
      return;
    }

    const next = event.target.closest(SELECTORS.next);
    if (next && root.contains(next)) {
      event.preventDefault();
      setActiveSlide(root, Number(root.getAttribute('data-easyedu-guide-current-slide') || 0) + 1);
      return;
    }

    const previous = event.target.closest(SELECTORS.previous);
    if (previous && root.contains(previous)) {
      event.preventDefault();
      setActiveSlide(root, Number(root.getAttribute('data-easyedu-guide-current-slide') || 0) - 1);
      return;
    }

    const navItem = event.target.closest(SELECTORS.navItem);
    if (navItem && root.contains(navItem)) {
      event.preventDefault();
      setActiveSlide(root, Number(navItem.getAttribute('data-easyedu-guide-nav-item') || 0));
      return;
    }

    const targetButton = event.target.closest(SELECTORS.showTarget);
    if (targetButton && root.contains(targetButton)) {
      event.preventDefault();
      const target = resolveTarget(config, targetButton.getAttribute('data-easyedu-guide-show-target'));
      closeModal(root);
      scrollToTarget(root, target);
      return;
    }

    const startPath = event.target.closest(SELECTORS.startPath);
    if (startPath && root.contains(startPath)) {
      event.preventDefault();
      renderChecklist(root, config, startPath.getAttribute('data-easyedu-guide-start-path'));
      closeModal(root);
      return;
    }

    const checklistItem = event.target.closest('[data-easyedu-guide-step-index]');
    if (checklistItem && root.contains(checklistItem)) {
      event.preventDefault();
      const checklist = root.querySelector(SELECTORS.checklist);
      const pathName = checklist ? checklist.getAttribute('data-easyedu-guide-path') : '';
      const steps = config.paths[pathName] || [];
      const step = steps[Number(checklistItem.getAttribute('data-easyedu-guide-step-index') || 0)];
      const target = step ? resolveTarget(config, step.target) : null;
      scrollToTarget(root, target);
    }
  });

  root.addEventListener('keydown', event => {
    if (!isModalOpen(root) || isTypingTarget(event.target)) {
      return;
    }

    const activeIndex = getActiveSlideIndex(root);
    const slideCount = getSlideCount(root);
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActiveSlide(root, activeIndex + 1);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActiveSlide(root, activeIndex - 1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveSlide(root, 0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveSlide(root, slideCount - 1);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal(root);
    }
  });

  bindNavWheel(root);

  document.addEventListener('easyedu:guide-step-complete', event => {
    if (!event.detail) {
      return;
    }
    completeStep(root, event.detail.path, event.detail.step);
  });

  Object.keys(config.paths).forEach(pathName => {
    config.paths[pathName].forEach((step, index) => {
      if (!step.completeOn) {
        return;
      }
      document.addEventListener(step.completeOn, () => completeStep(root, pathName, step.id || index));
    });
  });

  const minimize = root.querySelector(SELECTORS.checklistMinimize);
  if (minimize) {
    minimize.addEventListener('click', () => {
      const checklist = root.querySelector(SELECTORS.checklist);
      if (checklist) {
        checklist.classList.toggle('is-minimized');
      }
    });
  }

  const closeChecklist = root.querySelector(SELECTORS.checklistClose);
  if (closeChecklist) {
    closeChecklist.addEventListener('click', () => {
      const checklist = root.querySelector(SELECTORS.checklist);
      if (checklist) {
        checklist.hidden = true;
      }
      updateHighlight(root, null);
    });
  }

  const returnToGuide = root.querySelector(SELECTORS.checklistReturn);
  if (returnToGuide) {
    returnToGuide.addEventListener('click', () => {
      const checklist = root.querySelector(SELECTORS.checklist);
      if (checklist) {
        checklist.hidden = true;
      }
      updateHighlight(root, null);
      openModal(root, config);
    });
  }

  window.addEventListener('scroll', () => window.requestAnimationFrame(() => refreshActiveHighlight(root)), true);
  window.addEventListener('resize', () => window.requestAnimationFrame(() => refreshActiveHighlight(root)));
};

export const init = (rootOrSelector, rawConfig) => {
  const root = typeof rootOrSelector === 'string' ? document.querySelector(rootOrSelector) : rootOrSelector;

  if (!root) {
    return;
  }

  const config = mergeConfig(rawConfig);
  setActiveSlide(root, 0);
  bindGuide(root, config);

  const storage = getStorage();
  const seen = storage && storage.getItem(config.storageKey) === '1';
  if (config.firstVisit && !seen) {
    openModal(root, config);
  }
};

export default init;
