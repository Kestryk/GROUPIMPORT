// Generic EasyEdu guide foundation for Moodle plugins.
//
// Plugins should copy this module into their AMD source folder and configure
// selectors, paths and labels from plugin-specific PHP/Mustache data.

const DEFAULTS = {
  storageKey: 'easyedu.guide.seen',
  firstVisit: false,
  targets: {},
  paths: {},
  unlockPaths: [],
  labels: {
    close: 'Close',
    next: 'Next',
    previous: 'Previous',
    start: 'Start guided path',
    hint: 'Choose a step. The guide opens the right area and keeps this checklist visible.',
    complete: 'Everything is ready. Return to the guide when you want to review another topic.',
    guidedPath: 'Guided path',
    visited: 'visited',
    completeStepFirst: 'Complete "{$a}" first'
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
  checklistMessage: '[data-easyedu-guide-checklist-message]',
  checklistMinimize: '[data-easyedu-guide-checklist-minimize]',
  checklistReturn: '[data-easyedu-guide-checklist-return]',
  checklistSubtitle: '[data-easyedu-guide-checklist-subtitle]',
  checklistTitle: '[data-easyedu-guide-checklist-title]',
  interfaceReturn: '[data-easyedu-guide-interface-return]',
  interfaceReturnButton: '[data-easyedu-guide-interface-return-button]',
  interfaceReturnDismiss: '[data-easyedu-guide-interface-return-dismiss]',
  highlight: '[data-easyedu-guide-highlight]'
};

const HIGHLIGHT_TARGET_CLASS = 'is-easyedu-guide-highlight-target';

const mergeConfig = config => Object.assign({}, DEFAULTS, config || {}, {
  labels: Object.assign({}, DEFAULTS.labels, (config && config.labels) || {}),
  targets: Object.assign({}, DEFAULTS.targets, (config && config.targets) || {}),
  paths: Object.assign({}, DEFAULTS.paths, (config && config.paths) || {}),
  unlockPaths: Array.isArray(config && config.unlockPaths) ? config.unlockPaths : DEFAULTS.unlockPaths
});

const getStorage = () => {
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
};

const getStateKey = config => `${config.storageKey}.checklist`;

const loadGuideState = config => {
  const storage = getStorage();
  if (!storage) {
    return {};
  }

  try {
    return JSON.parse(storage.getItem(getStateKey(config)) || '{}') || {};
  } catch (error) {
    return {};
  }
};

const saveGuideState = (config, state) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(getStateKey(config), JSON.stringify(state || {}));
};

const getCompletedSteps = (config, pathName) => {
  const state = loadGuideState(config);
  const completed = state.completed && state.completed[pathName];

  return Array.isArray(completed) ? completed : [];
};

const isStepComplete = (config, pathName, step, index) => {
  const stepId = step && step.id ? step.id : String(index);

  return getCompletedSteps(config, pathName).includes(stepId);
};

const saveChecklistProgress = (root, config, pathName, activeIndex = 0) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  const state = loadGuideState(config);
  const completed = {};

  Object.keys(state.completed || {}).forEach(key => {
    completed[key] = Array.isArray(state.completed[key]) ? state.completed[key] : [];
  });

  if (checklist) {
    completed[pathName] = Array.from(checklist.querySelectorAll('[data-easyedu-guide-step-id].is-complete'))
      .map(item => item.getAttribute('data-easyedu-guide-step-id'))
      .filter(Boolean);
  }

  saveGuideState(config, {
    path: pathName,
    activeIndex,
    completed,
    slideIndex: Number(root.getAttribute('data-easyedu-guide-current-slide') || 0)
  });
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

const clearHighlightAutoHideTimer = root => {
  if (root.easyeduGuideHighlightAutoHideTimer) {
    window.clearTimeout(root.easyeduGuideHighlightAutoHideTimer);
    root.easyeduGuideHighlightAutoHideTimer = null;
  }
};

const clearHighlightedTarget = root => {
  clearHighlightAutoHideTimer(root);
  if (root.easyeduGuideCurrentTarget) {
    root.easyeduGuideCurrentTarget.classList.remove(HIGHLIGHT_TARGET_CLASS);
  }
  root.easyeduGuideCurrentTarget = null;
};

const updateHighlight = (root, target) => {
  const highlight = createHighlight(root);
  if (!target) {
    highlight.hidden = true;
    clearHighlightedTarget(root);
    return;
  }

  const rect = target.getBoundingClientRect();
  if (root.easyeduGuideCurrentTarget && root.easyeduGuideCurrentTarget !== target) {
    root.easyeduGuideCurrentTarget.classList.remove(HIGHLIGHT_TARGET_CLASS);
  }
  root.easyeduGuideCurrentTarget = target;
  target.classList.add(HIGHLIGHT_TARGET_CLASS);
  highlight.hidden = false;
  highlight.style.height = `${Math.max(rect.height, 1)}px`;
  highlight.style.left = `${rect.left}px`;
  highlight.style.top = `${rect.top}px`;
  highlight.style.width = `${Math.max(rect.width, 1)}px`;
};

const scheduleHighlightAutoHide = (root, delay = 9000) => {
  clearHighlightAutoHideTimer(root);
  root.easyeduGuideHighlightAutoHideTimer = window.setTimeout(() => {
    const highlight = root.querySelector(SELECTORS.highlight);
    if (highlight) {
      highlight.hidden = true;
    }
    clearHighlightedTarget(root);
  }, delay);
};

const scheduleHighlightRefresh = (root, target, shouldDock = true) => {
  if (!target) {
    refreshActiveHighlight(root, shouldDock);
    return;
  }

  [0, 160, 360, 720, 1100].forEach(delay => {
    window.setTimeout(() => {
      if (shouldDock) {
        dockChecklistAwayFromTarget(root, target);
      }
      updateHighlight(root, target);
    }, delay);
  });
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

const showInterfaceReturn = root => {
  const returnPanel = root.querySelector(SELECTORS.interfaceReturn);
  if (returnPanel) {
    if (root.easyeduGuideReturnTimer) {
      window.clearTimeout(root.easyeduGuideReturnTimer);
    }
    root.easyeduGuideInterfaceHighlightActive = true;
    returnPanel.hidden = false;
    root.easyeduGuideReturnTimer = window.setTimeout(() => {
      if (root.easyeduGuideInterfaceHighlightActive) {
        returnPanel.hidden = true;
        root.easyeduGuideInterfaceHighlightActive = false;
        updateHighlight(root, null);
      }
    }, 12000);
  }
};

const hideInterfaceReturn = (root, clearHighlight = false) => {
  const returnPanel = root.querySelector(SELECTORS.interfaceReturn);
  if (root.easyeduGuideReturnTimer) {
    window.clearTimeout(root.easyeduGuideReturnTimer);
    root.easyeduGuideReturnTimer = null;
  }
  root.easyeduGuideInterfaceHighlightActive = false;
  if (returnPanel) {
    returnPanel.hidden = true;
  }
  if (clearHighlight) {
    updateHighlight(root, null);
  }
};

const scrollToTarget = (root, target, options = {}) => {
  if (!target) {
    return;
  }

  dockChecklistAwayFromTarget(root, target);

  target.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest'
  });

  scheduleHighlightRefresh(root, target);
  if (options.autoHideHighlight) {
    scheduleHighlightAutoHide(root, options.autoHideDelay || 9000);
  }
};

const resolveStepHighlightTarget = (config, step) => {
  if (!step) {
    return null;
  }

  return resolveTarget(config, step.highlightTarget || step.showTarget || step.target);
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

const isRequirementMet = (config, requirement) => {
  if (!requirement) {
    return true;
  }

  return !!resolveTarget(config, requirement);
};

const formatLabel = (template, value) => String(template || '')
  .replace('{$a}', value || '')
  .replace('__step__', value || '');

const getStepIdentifier = (step, index) => step.id || String(index);

const getRequiredStep = (steps, requiredStepId) => steps.find((step, index) => getStepIdentifier(step, index) === requiredStepId);

const getLockedStepRequirement = (config, steps, step) => {
  if (step.requiresStep) {
    const requiredStep = getRequiredStep(steps, step.requiresStep);
    return (requiredStep && requiredStep.title) || step.requiresStep;
  }

  return step.requiresLabel || '';
};

const isChecklistComplete = list => {
  const steps = Array.from(list.querySelectorAll('[data-easyedu-guide-step-id]'));
  const actionable = steps.filter(step => !step.classList.contains('is-locked'));

  return actionable.length > 0 && actionable.every(step => step.classList.contains('is-complete'));
};

const getSlideRequirement = (root, index) => {
  const navItem = root.querySelector(`${SELECTORS.navItem}[data-easyedu-guide-nav-item="${index}"]`);
  const slide = root.querySelector(`${SELECTORS.slide}[data-easyedu-guide-slide="${index}"]`);

  return (navItem && navItem.getAttribute('data-easyedu-guide-requires')) ||
    (slide && slide.getAttribute('data-easyedu-guide-requires')) ||
    '';
};

const syncSlideLocks = (root, config) => {
  const slides = Array.from(root.querySelectorAll(SELECTORS.slide));

  root.querySelectorAll(SELECTORS.navItem).forEach((item, index) => {
    const requirement = item.getAttribute('data-easyedu-guide-requires') ||
      (slides[index] ? slides[index].getAttribute('data-easyedu-guide-requires') : '');
    const locked = requirement ? !isRequirementMet(config, requirement) : false;

    item.classList.toggle('is-locked', locked);
    item.setAttribute('aria-disabled', locked ? 'true' : 'false');
    if (locked) {
      item.setAttribute('tabindex', '-1');
    } else {
      item.removeAttribute('tabindex');
    }
  });
};

const isSlideLocked = (root, config, index) => {
  const requirement = getSlideRequirement(root, index);

  return requirement ? !isRequirementMet(config, requirement) : false;
};

const findAvailableSlideIndex = (root, config, requestedIndex, direction = 0) => {
  const total = getSlideCount(root);
  if (total <= 0) {
    return 0;
  }

  const start = Math.max(0, Math.min(requestedIndex, total - 1));
  if (!isSlideLocked(root, config, start)) {
    return start;
  }

  const forward = direction < 0 ? -1 : 1;
  for (let index = start + forward; index >= 0 && index < total; index += forward) {
    if (!isSlideLocked(root, config, index)) {
      return index;
    }
  }

  const backward = forward * -1;
  for (let index = start + backward; index >= 0 && index < total; index += backward) {
    if (!isSlideLocked(root, config, index)) {
      return index;
    }
  }

  return start;
};

const hasAvailableSlide = (root, config, currentIndex, direction) => {
  const total = getSlideCount(root);
  for (let index = currentIndex + direction; index >= 0 && index < total; index += direction) {
    if (!isSlideLocked(root, config, index)) {
      return true;
    }
  }

  return false;
};

const updateNavScrollButtons = root => {
  const nav = root.querySelector(SELECTORS.nav);
  const previous = root.querySelector(SELECTORS.navPrevious);
  const next = root.querySelector(SELECTORS.navNext);
  if (!nav || (!previous && !next)) {
    return;
  }

  const maxScroll = Math.max(0, nav.scrollWidth - nav.clientWidth - 1);
  if (previous) {
    previous.disabled = nav.scrollLeft <= 1;
  }
  if (next) {
    next.disabled = nav.scrollLeft >= maxScroll;
  }
};

const formatProgressLabel = (template, current, total) => {
  if (!template) {
    return `${current}/${total}`;
  }

  return template
    .replace('{$a->current}', String(current))
    .replace('{$a->total}', String(total))
    .replace('__current__', String(current))
    .replace('__total__', String(total));
};

const setActiveSlide = (root, index, config, options = {}) => {
  if (config) {
    syncSlideLocks(root, config);
  }

  const slides = Array.from(root.querySelectorAll(SELECTORS.slide));
  const direction = index < getActiveSlideIndex(root) ? -1 : 1;
  const safeIndex = config && !options.allowLocked ?
    findAvailableSlideIndex(root, config, index, direction) :
    Math.max(0, Math.min(index, slides.length - 1));
  const current = safeIndex + 1;
  const total = slides.length;

  slides.forEach((slide, slideIndex) => {
    const locked = config ? isSlideLocked(root, config, slideIndex) : false;
    slide.hidden = slideIndex !== safeIndex;
    slide.classList.toggle('is-active', slideIndex === safeIndex);
    slide.classList.toggle('is-locked', locked);
    slide.classList.toggle('is-locked-active', locked && slideIndex === safeIndex);
  });

  root.querySelectorAll(SELECTORS.navItem).forEach((item, itemIndex) => {
    item.classList.toggle('is-active', itemIndex === safeIndex);
    item.setAttribute('aria-current', itemIndex === safeIndex ? 'step' : 'false');
  });

  if (config) {
    root.querySelectorAll(SELECTORS.previous).forEach(button => {
      button.disabled = !hasAvailableSlide(root, config, safeIndex, -1);
    });
    root.querySelectorAll(SELECTORS.next).forEach(button => {
      button.disabled = !hasAvailableSlide(root, config, safeIndex, 1);
    });
  }

  root.querySelectorAll('[data-easyedu-guide-progress-label]').forEach(label => {
    label.textContent = formatProgressLabel(label.getAttribute('data-progress-label') || '', current, total);
  });

  root.querySelectorAll('[data-easyedu-guide-progress-bar]').forEach(progressBar => {
    progressBar.style.width = total > 0 ? ((current / total) * 100) + '%' : '0%';
    progressBar.setAttribute('aria-valuenow', String(current));
    progressBar.setAttribute('aria-valuemax', String(total));
  });

  root.setAttribute('data-easyedu-guide-current-slide', String(safeIndex));
  scrollActiveNavItemIntoView(root);
  window.setTimeout(() => updateNavScrollButtons(root), 80);
};

const openModal = (root, config) => {
  const modal = root.querySelector(SELECTORS.modal);
  if (!modal) {
    return;
  }

  hideInterfaceReturn(root, true);
  modal.hidden = false;
  modal.classList.add('is-open');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('tabindex', '-1');
  modal.focus({preventScroll: true});

  const storage = getStorage();
  if (storage) {
    storage.setItem(config.storageKey, '1');
  }
  syncSlideLocks(root, config);
  setActiveSlide(root, getActiveSlideIndex(root), config);
  window.setTimeout(() => updateNavScrollButtons(root), 80);
};

const closeModal = (root, preserveHighlight = false) => {
  const modal = root.querySelector(SELECTORS.modal);
  if (!modal) {
    return;
  }

  modal.classList.remove('is-open');
  modal.hidden = true;
  if (!preserveHighlight) {
    hideInterfaceReturn(root);
    updateHighlight(root, null);
  }
};

const getPathLabel = (pathName, config) => {
  const pathConfig = config.pathLabels && config.pathLabels[pathName];
  if (pathConfig) {
    return pathConfig;
  }

  return pathName
    .split(/[-_]+/)
    .filter(Boolean)
    .join(' ');
};

const updateChecklistHeader = (root, config, activeStep = null) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  if (!checklist) {
    return;
  }

  const pathName = checklist.getAttribute('data-easyedu-guide-path') || '';
  const steps = config.paths[pathName] || [];
  const items = Array.from(checklist.querySelectorAll('[data-easyedu-guide-step-id]'));
  const activeItem = checklist.querySelector('[data-easyedu-guide-step-index].is-active');
  const activeIndex = activeItem ? Number(activeItem.getAttribute('data-easyedu-guide-step-index') || 0) : 0;
  const step = activeStep || steps[activeIndex] || steps[0] || {};
  const completeCount = items.filter(item => item.classList.contains('is-complete')).length;
  const title = root.querySelector(SELECTORS.checklistTitle);
  const subtitle = root.querySelector(SELECTORS.checklistSubtitle);

  if (title) {
    title.textContent = `${config.labels.guidedPath || 'Guided path'}: ${step.title || getPathLabel(pathName, config)}`;
  }
  if (subtitle) {
    subtitle.textContent = `${completeCount}/${steps.length} ${config.labels.visited || 'visited'}`;
  }
};

const renderChecklist = (root, config, pathName) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  const list = root.querySelector(SELECTORS.checklistItems);
  const message = root.querySelector(SELECTORS.checklistMessage);
  const steps = config.paths[pathName] || [];

  if (!checklist || !list || steps.length === 0) {
    return;
  }

  checklist.hidden = false;
  hideInterfaceReturn(root, true);
  checklist.classList.remove('is-complete', 'is-minimized', 'is-docked-left', 'is-docked-right');
  checklist.classList.toggle('is-unlock-path', config.unlockPaths.includes(pathName));
  checklist.classList.toggle('has-guided-feedback', steps.some(step => !!step.feedback));
  checklist.setAttribute('data-easyedu-guide-path', pathName);
  list.innerHTML = '';

  steps.forEach((step, index) => {
    const stepComplete = isStepComplete(config, pathName, step, index);
    const dependencyMissing = step.requiresStep ? !getCompletedSteps(config, pathName).includes(step.requiresStep) : false;
    const locked = (step.requires ? !isRequirementMet(config, step.requires) : false) || dependencyMissing;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'easyedu-guide-checklist__item easyedu-guided-panel__step';
    item.classList.toggle('is-locked', locked);
    item.classList.toggle('is-complete', stepComplete);
    item.disabled = locked;
    item.setAttribute('data-easyedu-guide-step-id', step.id || String(index));
    item.setAttribute('data-easyedu-guide-step-index', String(index));
    item.setAttribute('aria-disabled', locked ? 'true' : 'false');
    if (locked) {
      item.setAttribute('data-easyedu-guide-lock-message', getLockedStepRequirement(config, steps, step));
    }
    if (step.feedback) {
      item.setAttribute('data-easyedu-guide-feedback', step.feedback);
    }
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
    if (locked && (step.requiresLabel || step.requiresStepLabel || step.requiresStep)) {
      const requirement = document.createElement('small');
      requirement.className = 'easyedu-guide-checklist__requirement';
      requirement.textContent = getLockedStepRequirement(config, steps, step);
      label.appendChild(requirement);
    }
    item.append(marker, label);
    list.appendChild(item);
  });

  const state = loadGuideState(config);
  const preferredItem = state.path === pathName ?
    list.querySelector(`[data-easyedu-guide-step-index="${Number(state.activeIndex || 0)}"]:not(.is-locked)`) :
    null;
  const firstItem = preferredItem ||
    list.querySelector('[data-easyedu-guide-step-index]:not(.is-complete):not(.is-locked)') ||
    list.querySelector('[data-easyedu-guide-step-index]:not(.is-locked)');
  if (firstItem) {
    firstItem.classList.add('is-active');
    firstItem.setAttribute('aria-current', 'step');
  }

  if (message) {
    const allComplete = isChecklistComplete(list);
    const activeStepIndex = firstItem ? Number(firstItem.getAttribute('data-easyedu-guide-step-index') || 0) : 0;
    const activeStep = steps[activeStepIndex] || steps[0] || {};
    const completeMessage = message.getAttribute('data-complete-message') || config.labels.complete;
    const initialText = allComplete ? completeMessage : (activeStep.feedback || config.labels.hint || config.labels.complete);
    const icon = message.querySelector('.fa');
    const text = message.querySelector('span:last-child');
    checklist.classList.toggle('is-complete', allComplete);
    message.classList.toggle('is-complete', allComplete);
    if (icon) {
      icon.classList.toggle('fa-check-circle', allComplete);
      icon.classList.toggle('fa-location-arrow', !allComplete);
    }
    if (text) {
      text.textContent = initialText;
    }
  }

  saveChecklistProgress(root, config, pathName, firstItem ? Number(firstItem.getAttribute('data-easyedu-guide-step-index') || 0) : 0);
  updateChecklistHeader(root, config, firstItem ? steps[Number(firstItem.getAttribute('data-easyedu-guide-step-index') || 0)] : (steps[0] || null));
};

const updateChecklistMessage = (root, config, activeStep) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  const message = root.querySelector(SELECTORS.checklistMessage);
  if (!checklist || !message) {
    return;
  }

  const items = Array.from(checklist.querySelectorAll('[data-easyedu-guide-step-id]'));
  const complete = isChecklistComplete(checklist);
  const icon = message.querySelector('.fa');
  const text = message.querySelector('span:last-child');
  const completeMessage = message.getAttribute('data-complete-message') || config.labels.complete;
  const activeMessage = activeStep && activeStep.feedback ? activeStep.feedback : (config.labels.hint || '');

  checklist.classList.toggle('is-complete', complete);
  message.classList.toggle('is-complete', complete);
  if (icon) {
    icon.classList.toggle('fa-location-arrow', !complete);
    icon.classList.toggle('fa-check-circle', complete);
  }
  if (text) {
    text.textContent = complete ? completeMessage : activeMessage;
  }
  updateChecklistHeader(root, config, activeStep || null);
};

const setActiveChecklistStep = (root, config, index) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  if (!checklist) {
    return null;
  }
  const pathName = checklist.getAttribute('data-easyedu-guide-path') || '';
  const steps = config.paths[pathName] || [];
  const safeIndex = Math.max(0, Math.min(index, steps.length - 1));
  checklist.querySelectorAll('[data-easyedu-guide-step-index]').forEach(item => {
    const active = Number(item.getAttribute('data-easyedu-guide-step-index') || 0) === safeIndex;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-current', active ? 'step' : 'false');
  });
  saveChecklistProgress(root, config, pathName, safeIndex);
  updateChecklistMessage(root, config, steps[safeIndex]);
  return steps[safeIndex] || null;
};

const markChecklistStepComplete = (root, config, stepIdOrIndex, activeStep) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  if (!checklist) {
    return;
  }
  const pathName = checklist.getAttribute('data-easyedu-guide-path') || '';
  const selector = `[data-easyedu-guide-step-id="${stepIdOrIndex}"], ` +
    `[data-easyedu-guide-step-index="${stepIdOrIndex}"]`;
  const item = checklist.querySelector(selector);
  if (item) {
    item.classList.add('is-complete');
  }
  const active = checklist.querySelector('[data-easyedu-guide-step-index].is-active');
  const activeIndex = active ? Number(active.getAttribute('data-easyedu-guide-step-index') || 0) : 0;
  const steps = config.paths[pathName] || [];
  saveChecklistProgress(root, config, pathName, Math.min(activeIndex + 1, Math.max(steps.length - 1, 0)));
  renderChecklist(root, config, pathName);
  updateChecklistMessage(root, config, activeStep || null);
};

const runStepOpenAction = (root, config, step, callback) => {
  if (!step || !step.open) {
    callback();
    return;
  }

  const openControl = resolveTarget(config, step.open);
  if (openControl) {
    openControl.click();
  }

  window.setTimeout(callback, Number(step.openDelay || 450));
};

const completeStep = (root, config, pathName, stepIdOrIndex) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  if (!checklist || checklist.getAttribute('data-easyedu-guide-path') !== pathName) {
    return;
  }

  const selector = `[data-easyedu-guide-step-id="${stepIdOrIndex}"], [data-easyedu-guide-step-index="${stepIdOrIndex}"]`;
  const item = checklist.querySelector(selector);
  if (item) {
    item.classList.add('is-complete');
  }

  const active = checklist.querySelector('[data-easyedu-guide-step-index].is-active');
  const activeIndex = active ? Number(active.getAttribute('data-easyedu-guide-step-index') || 0) : 0;
  const steps = config.paths[pathName] || [];
  saveChecklistProgress(root, config, pathName, Math.min(activeIndex + 1, Math.max(steps.length - 1, 0)));
  checklist.classList.toggle('is-complete', isChecklistComplete(checklist));
  updateChecklistMessage(root, config, active ? {
    feedback: active.getAttribute('data-easyedu-guide-feedback') || ''
  } : null);
};

const refreshActiveHighlight = (root, shouldDock = false) => {
  const highlight = root.querySelector(SELECTORS.highlight);
  if (!highlight || highlight.hidden || !root.easyeduGuideCurrentTarget) {
    return;
  }

  if (shouldDock) {
    dockChecklistAwayFromTarget(root, root.easyeduGuideCurrentTarget);
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
  nav.addEventListener('scroll', () => updateNavScrollButtons(root), {passive: true});
  nav.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    nav.scrollBy({
      left: event.deltaY,
      behavior: 'auto'
    });
    updateNavScrollButtons(root);
  }, {passive: false});
  window.addEventListener('resize', () => updateNavScrollButtons(root));
  updateNavScrollButtons(root);
};

const bindHighlightAutoRefresh = root => {
  if (root.dataset.easyeduGuideHighlightRefreshBound === '1') {
    return;
  }
  root.dataset.easyeduGuideHighlightRefreshBound = '1';

  const refresh = event => {
    if (event && event.type === 'scroll') {
      window.requestAnimationFrame(() => refreshActiveHighlight(root));
      return;
    }

    scheduleHighlightRefresh(root, root.easyeduGuideCurrentTarget, false);
  };

  window.addEventListener('scroll', refresh, true);
  window.addEventListener('resize', refresh);
  document.addEventListener('transitionend', refresh, true);
  document.addEventListener('animationend', refresh, true);
  document.addEventListener('shown.bs.modal', refresh, true);
  document.addEventListener('hidden.bs.modal', refresh, true);

  if (window.MutationObserver) {
    const observer = new MutationObserver(mutations => {
      if (!root.easyeduGuideCurrentTarget) {
        return;
      }
      const highlight = root.querySelector(SELECTORS.highlight);
      if (highlight && mutations.every(mutation => mutation.target === highlight || highlight.contains(mutation.target))) {
        return;
      }
      window.requestAnimationFrame(() => scheduleHighlightRefresh(root, root.easyeduGuideCurrentTarget, false));
    });
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true
    });
    root.easyeduGuideHighlightObserver = observer;
  }
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
      setActiveSlide(root, Number(root.getAttribute('data-easyedu-guide-current-slide') || 0) + 1, config);
      return;
    }

    const previous = event.target.closest(SELECTORS.previous);
    if (previous && root.contains(previous)) {
      event.preventDefault();
      setActiveSlide(root, Number(root.getAttribute('data-easyedu-guide-current-slide') || 0) - 1, config);
      return;
    }

    const navItem = event.target.closest(SELECTORS.navItem);
    if (navItem && root.contains(navItem)) {
      event.preventDefault();
      syncSlideLocks(root, config);
      setActiveSlide(root, Number(navItem.getAttribute('data-easyedu-guide-nav-item') || 0), config, {
        allowLocked: navItem.classList.contains('is-locked')
      });
      return;
    }

    const targetButton = event.target.closest(SELECTORS.showTarget);
    if (targetButton && root.contains(targetButton)) {
      event.preventDefault();
      const target = resolveTarget(config, targetButton.getAttribute('data-easyedu-guide-show-target'));
      closeModal(root, true);
      scrollToTarget(root, target);
      showInterfaceReturn(root);
      return;
    }

    const startPath = event.target.closest(SELECTORS.startPath);
    if (startPath && root.contains(startPath)) {
      event.preventDefault();
      syncSlideLocks(root, config);
      renderChecklist(root, config, startPath.getAttribute('data-easyedu-guide-start-path'));
      closeModal(root);
      return;
    }

    const checklistItem = event.target.closest('[data-easyedu-guide-step-index]');
    if (checklistItem && root.contains(checklistItem)) {
      event.preventDefault();
      if (checklistItem.classList.contains('is-locked')) {
        return;
      }
      const checklist = root.querySelector(SELECTORS.checklist);
      const pathName = checklist ? checklist.getAttribute('data-easyedu-guide-path') : '';
      const stepIndex = Number(checklistItem.getAttribute('data-easyedu-guide-step-index') || 0);
      const step = setActiveChecklistStep(root, config, stepIndex);
      runStepOpenAction(root, config, step, () => {
        const target = resolveStepHighlightTarget(config, step);
        scrollToTarget(root, target);
        if (step && (step.completeOnClick || step.completeOn)) {
          updateChecklistMessage(root, config, step);
          return;
        }
        markChecklistStepComplete(root, config, step && step.id ? step.id : stepIndex, step);
      });
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
      setActiveSlide(root, activeIndex + 1, config);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActiveSlide(root, activeIndex - 1, config);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveSlide(root, 0, config);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveSlide(root, slideCount - 1, config);
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
    completeStep(root, config, event.detail.path, event.detail.step);
  });

  document.addEventListener('easyedu:guide-refresh-highlight', event => {
    const detail = event.detail || {};
    if (detail.root) {
      const targetRoot = typeof detail.root === 'string' ? document.querySelector(detail.root) : detail.root;
      if (targetRoot && targetRoot !== root) {
        return;
      }
    }

    const target = detail.target ? resolveTarget(config, detail.target) : root.easyeduGuideCurrentTarget;
    scheduleHighlightRefresh(root, target, detail.dock !== false);
  });

  Object.keys(config.paths).forEach(pathName => {
    config.paths[pathName].forEach((step, index) => {
      if (step.completeOnClick && step.target) {
        document.addEventListener('click', event => {
          const target = resolveTarget(config, step.target);
          if (!target || (event.target !== target && !target.contains(event.target))) {
            return;
          }

          const state = loadGuideState(config);
          const checklist = root.querySelector(SELECTORS.checklist);
          const currentPath = checklist && !checklist.hidden ?
            checklist.getAttribute('data-easyedu-guide-path') :
            (state.path || '');
          if (currentPath !== pathName) {
            return;
          }
          const completed = Object.assign({}, state.completed || {});
          const pathCompleted = Array.isArray(completed[pathName]) ? completed[pathName].slice() : [];
          const stepId = step.id || String(index);
          if (!pathCompleted.includes(stepId)) {
            pathCompleted.push(stepId);
          }
          completed[pathName] = pathCompleted;
          saveGuideState(config, {
            path: pathName,
            activeIndex: Math.min(index + 1, Math.max((config.paths[pathName] || []).length - 1, 0)),
            completed,
            slideIndex: Number(root.getAttribute('data-easyedu-guide-current-slide') || 0)
          });
          completeStep(root, config, pathName, stepId);
        }, true);
      }
      if (!step.completeOn) {
        return;
      }
      document.addEventListener(step.completeOn, () => completeStep(root, config, pathName, step.id || index));
    });
  });

  const minimize = root.querySelector(SELECTORS.checklistMinimize);
  if (minimize) {
    minimize.addEventListener('click', () => {
      const checklist = root.querySelector(SELECTORS.checklist);
      if (checklist) {
        const minimized = !checklist.classList.contains('is-minimized');
        checklist.classList.toggle('is-minimized', minimized);
        minimize.setAttribute('aria-expanded', minimized ? 'false' : 'true');
        const icon = minimize.querySelector('.fa');
        if (icon) {
          icon.classList.toggle('fa-minus', !minimized);
          icon.classList.toggle('fa-expand', minimized);
        }
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
      hideInterfaceReturn(root, true);
    });
  }

  const returnFromInterface = root.querySelector(SELECTORS.interfaceReturnButton);
  if (returnFromInterface) {
    returnFromInterface.addEventListener('click', event => {
      event.preventDefault();
      hideInterfaceReturn(root, true);
      openModal(root, config);
    });
  }

  const dismissInterfaceReturn = root.querySelector(SELECTORS.interfaceReturnDismiss);
  if (dismissInterfaceReturn) {
    dismissInterfaceReturn.addEventListener('click', event => {
      event.preventDefault();
      hideInterfaceReturn(root, true);
    });
  }

  const returnToGuide = root.querySelector(SELECTORS.checklistReturn);
  if (returnToGuide) {
    returnToGuide.addEventListener('click', () => {
      const checklist = root.querySelector(SELECTORS.checklist);
      if (checklist) {
        checklist.hidden = true;
      }
      hideInterfaceReturn(root, true);
      openModal(root, config);
    });
  }

  bindHighlightAutoRefresh(root);
};

export const init = (rootOrSelector, rawConfig) => {
  const root = typeof rootOrSelector === 'string' ? document.querySelector(rootOrSelector) : rootOrSelector;

  if (!root) {
    return;
  }

  const config = mergeConfig(rawConfig);
  syncSlideLocks(root, config);
  const state = loadGuideState(config);
  const restoredSlideIndex = Number(state.slideIndex);
  setActiveSlide(root, Number.isFinite(restoredSlideIndex) ? restoredSlideIndex : 0, config, {
    allowLocked: Number.isFinite(restoredSlideIndex)
  });
  bindGuide(root, config);
  if (state.path && config.paths[state.path]) {
    renderChecklist(root, config, state.path);
  }

  const storage = getStorage();
  const seen = storage && storage.getItem(config.storageKey) === '1';
  if (config.firstVisit && !seen) {
    openModal(root, config);
  }
};

export default init;
