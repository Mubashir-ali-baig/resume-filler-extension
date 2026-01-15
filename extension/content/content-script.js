// Content script to read website content

// Find currently open/visible modals
function findOpenModals() {
  const allModals = findModals();
  const openModals = [];

  allModals.forEach((modal) => {
    if (isModalOpen(modal)) {
      openModals.push(modal);
    }
  });

  return openModals;
}

// Find the most recently opened modal (latest/most prominent)
function findLatestOpenModal() {
  const openModals = findOpenModals();

  if (openModals.length === 0) {
    return null;
  }

  if (openModals.length === 1) {
    return openModals[0];
  }

  // Determine the "latest" modal by prioritizing:
  // 1. Modals with form fields (most likely to be the active one)
  // 2. Highest z-index (most prominent/on top)
  // 3. Modals that contain focused elements
  // 4. Most recent DOM order (if z-index is same)
  // 5. Largest dimensions (if both same)

  let latestModal = openModals[0];
  let highestZIndex = getZIndex(openModals[0]);
  let highestScore = 0;

  // Helper function to calculate modal "importance" score
  const calculateModalScore = (modal) => {
    let score = 0;
    const rect = modal.getBoundingClientRect();

    // Check for form fields (high priority)
    const hasFormFields =
      modal.querySelector(
        "textarea, input[type='text'], input[type='email'], input:not([type])"
      ) !== null;
    if (hasFormFields) {
      score += 1000; // High priority for modals with form fields
    }

    // Check if modal contains focused element
    const activeElement = document.activeElement;
    if (activeElement && modal.contains(activeElement)) {
      score += 500; // High priority if contains focused element
    }

    // Check z-index
    const zIndex = getZIndex(modal);
    score += zIndex;

    // Check size (larger modals are often more important)
    const area = rect.width * rect.height;
    score += Math.min(area / 10000, 100); // Cap at 100 points

    // Check if modal is centered in viewport (often indicates it's the active one)
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    const modalCenterX = rect.left + rect.width / 2;
    const modalCenterY = rect.top + rect.height / 2;
    const distanceFromCenter = Math.sqrt(
      Math.pow(modalCenterX - viewportCenterX, 2) +
        Math.pow(modalCenterY - viewportCenterY, 2)
    );
    const maxDistance = Math.sqrt(
      Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)
    );
    score += (1 - distanceFromCenter / maxDistance) * 50; // Up to 50 points for being centered

    return score;
  };

  // Calculate score for first modal
  highestScore = calculateModalScore(latestModal);
  highestZIndex = getZIndex(latestModal);

  // Find modal with highest score
  openModals.forEach((modal) => {
    const score = calculateModalScore(modal);
    const zIndex = getZIndex(modal);
    const rect = modal.getBoundingClientRect();
    const latestRect = latestModal.getBoundingClientRect();

    if (score > highestScore) {
      latestModal = modal;
      highestScore = score;
      highestZIndex = zIndex;
    } else if (score === highestScore) {
      // If same score, use z-index as tiebreaker
      if (zIndex > highestZIndex) {
        latestModal = modal;
        highestZIndex = zIndex;
      } else if (zIndex === highestZIndex) {
        // If same z-index, prefer larger modal
        const latestArea = latestRect.width * latestRect.height;
        const currentArea = rect.width * rect.height;

        if (currentArea > latestArea) {
          latestModal = modal;
        } else if (currentArea === latestArea) {
          // If same size, prefer the one that appears later in DOM (more recent)
          const allElements = Array.from(document.querySelectorAll("*"));
          const latestIndex = allElements.indexOf(latestModal);
          const currentIndex = allElements.indexOf(modal);

          if (currentIndex > latestIndex) {
            latestModal = modal;
          }
        }
      }
    }
  });

  return latestModal;
}

// Get effective z-index of an element (including parents)
function getZIndex(element) {
  if (!element) return 0;

  const style = window.getComputedStyle(element);
  let zIndex = parseInt(style.zIndex);

  // If z-index is auto or 0, check parent
  if (isNaN(zIndex) || zIndex === 0) {
    const parent = element.parentElement;
    if (parent && parent !== document.body) {
      return getZIndex(parent);
    }
  }

  return isNaN(zIndex) ? 0 : zIndex;
}

// Check if a modal is currently open/visible
function isModalOpen(modal) {
  if (!modal) return false;

  const style = window.getComputedStyle(modal);
  const rect = modal.getBoundingClientRect();

  // First, check obvious hidden states
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  // Check if modal has meaningful dimensions (is rendered and visible)
  if (rect.width === 0 && rect.height === 0) {
    return false;
  }

  // Check if modal is in viewport (at least partially visible)
  const isInViewport =
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0;

  // Check common modal open indicators
  const classList = modal.classList?.toString().toLowerCase() || "";
  const hasOpenClass =
    classList.includes("show") ||
    classList.includes("open") ||
    classList.includes("active") ||
    classList.includes("visible") ||
    classList.includes("displayed") ||
    classList.includes("in") ||
    classList.includes("fade-in") ||
    classList.includes("slide-in");

  // Check aria-hidden attribute (should be false or not present for open modals)
  const ariaHidden = modal.getAttribute("aria-hidden");
  const isAriaVisible = ariaHidden !== "true";

  // Check aria-modal attribute
  const ariaModal = modal.getAttribute("aria-modal");
  const hasAriaModal = ariaModal === "true";

  // Check z-index (open modals usually have high z-index, but be more lenient)
  const zIndex = getZIndex(modal);
  const hasHighZIndex = zIndex > 100; // Lowered threshold from 1000 to 100

  // Check opacity (but be lenient - during transitions it might be 0 temporarily)
  const opacity = parseFloat(style.opacity);
  const isOpaque = !isNaN(opacity) && opacity > 0;

  // Check if modal has pointer-events (interactive modals usually do)
  const pointerEvents = style.pointerEvents;
  const isInteractive = pointerEvents !== "none";

  // More lenient detection: Modal is likely open if:
  // 1. It's in the viewport AND has dimensions AND
  // 2. (has open class OR aria-modal=true OR (aria-hidden is not true AND has high z-index) OR (is opaque AND is interactive))
  // This allows for modals that might not have all indicators but are clearly visible

  const hasBasicVisibility = isInViewport && rect.width > 0 && rect.height > 0;

  if (!hasBasicVisibility) {
    return false;
  }

  // If it has explicit open indicators, it's definitely open
  if (hasOpenClass || hasAriaModal) {
    return true;
  }

  // If aria-hidden is explicitly false and has high z-index, it's likely open
  if (ariaHidden === "false" && hasHighZIndex) {
    return true;
  }

  // If it's opaque, interactive, and has high z-index, it's likely open
  if (isOpaque && isInteractive && hasHighZIndex) {
    return true;
  }

  // If aria-hidden is not true (null or false) and modal is in viewport with reasonable size, consider it open
  // This catches modals that might not have explicit indicators but are clearly visible
  if (isAriaVisible && rect.width > 100 && rect.height > 100 && isInViewport) {
    return true;
  }

  return false;
}

// Extract text content from page (prioritize latest open modal)
function extractPageText() {
  // First, check if there's a latest open modal
  const latestModal = findLatestOpenModal();

  // If there's a latest modal, extract content only from it
  if (latestModal) {
    // Create a temporary clone to avoid modifying the original
    const clone = latestModal.cloneNode(true);

    // Remove script and style elements from clone
    const scripts = clone.querySelectorAll("script, style, noscript");
    scripts.forEach((el) => el.remove());

    // Extract text from modal
    const text = clone.innerText || clone.textContent || "";

    if (text.trim().length > 0) {
      // Clean up text (remove excessive whitespace)
      const cleanedText = text
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n")
        .trim();

      return cleanedText;
    }
  }

  // No open modals, extract from main page content
  // Remove script and style elements
  const scripts = document.querySelectorAll("script, style, noscript");
  scripts.forEach((el) => el.remove());

  // Get main content areas (prioritize semantic HTML)
  const mainContent =
    document.querySelector("main") ||
    document.querySelector("article") ||
    document.querySelector('[role="main"]') ||
    document.body;

  // Extract text
  const text = mainContent.innerText || mainContent.textContent || "";

  // Clean up text (remove excessive whitespace)
  const cleanedText = text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();

  return cleanedText;
}

// Find all modal/dialog elements (including hidden ones)
function findModals() {
  const modalSelectors = [
    '[role="dialog"]',
    '[role="alertdialog"]',
    ".modal",
    ".modal-dialog",
    ".modal-content",
    '[class*="modal"]',
    '[id*="modal"]',
    '[class*="dialog"]',
    '[id*="dialog"]',
    '[class*="popup"]',
    '[id*="popup"]',
    '[class*="overlay"]',
    '[class*="drawer"]',
    '[class*="panel"]',
    // LinkedIn and common framework patterns
    "[data-modal]",
    "[data-dialog]",
    '[aria-modal="true"]',
    // LinkedIn-specific patterns
    '[class*="artdeco-modal"]',
    '[class*="scaffold-finite-scroll"]',
    '[class*="application"]',
    '[class*="apply"]',
  ];

  const modals = new Set();

  modalSelectors.forEach((selector) => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        // Walk up the DOM to find the actual modal container
        let modal = el;
        while (modal && modal !== document.body) {
          if (
            modal.classList &&
            (modal.classList.toString().toLowerCase().includes("modal") ||
              modal.classList.toString().toLowerCase().includes("dialog") ||
              modal.classList.toString().toLowerCase().includes("popup") ||
              modal.getAttribute("role") === "dialog" ||
              modal.getAttribute("aria-modal") === "true")
          ) {
            modals.add(modal);
            break;
          }
          modal = modal.parentElement;
        }
      });
    } catch (e) {
      // Ignore invalid selectors
    }
  });

  return Array.from(modals);
}

// Extract form fields information (prioritize latest open modal)
function extractFormFields() {
  const formFields = [];

  // Find all modals and the latest open modal
  const modals = findModals();
  const openModals = findOpenModals();
  const latestModal = findLatestOpenModal();

  console.log(
    `[Resume Filler] Found ${modals.length} total modal(s), ${
      openModals.length
    } open modal(s), latest open: ${latestModal ? "yes" : "no"}`
  );

  if (latestModal) {
    console.log(
      `[Resume Filler] Latest modal:`,
      latestModal,
      `Classes: ${latestModal.className}`,
      `Z-index: ${getZIndex(latestModal)}`
    );
  }

  // If there's a latest modal, only get fields from that modal
  // Otherwise, get all fields from the page
  let textareas, textInputs;
  const fieldsInModals = new Set();
  const fieldsInLatestModal = new Set();

  if (latestModal) {
    // Only get fields from the latest modal
    // Include more input types that might be in forms - be very comprehensive
    textareas = latestModal.querySelectorAll("textarea");
    textInputs = latestModal.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="search"], input[type="number"], input[type="password"], input:not([type]), input[type=""], input'
    );

    console.log(
      `[Resume Filler] Before filtering: ${textareas.length} textarea(s) and ${textInputs.length} input(s) found in modal`
    );

    // Filter out hidden/disabled fields (but be lenient)
    const visibleTextareas = Array.from(textareas).filter(
      (field) => isElementVisible(field) && !field.disabled && !field.readOnly
    );
    const visibleTextInputs = Array.from(textInputs).filter(
      (field) => isElementVisible(field) && !field.disabled && !field.readOnly
    );

    console.log(
      `[Resume Filler] After filtering: ${visibleTextareas.length} visible textarea(s) and ${visibleTextInputs.length} visible input(s) in latest modal`
    );

    // If no fields found in modal, log for debugging
    if (visibleTextareas.length === 0 && visibleTextInputs.length === 0) {
      console.warn(
        `[Resume Filler] No visible fields found in modal. Checking all inputs in modal for debugging:`,
        Array.from(textInputs).map((input) => ({
          type: input.type,
          name: input.name,
          id: input.id,
          visible: isElementVisible(input),
          disabled: input.disabled,
          readOnly: input.readOnly,
          display: window.getComputedStyle(input).display,
          rect: input.getBoundingClientRect(),
        }))
      );
    }

    textareas = visibleTextareas;
    textInputs = visibleTextInputs;

    // Mark all fields as being in the latest modal
    [...textareas, ...textInputs].forEach((field) => {
      fieldsInLatestModal.add(field);
      fieldsInModals.add(field);
    });
  } else {
    // No open modal detected, get all fields from page
    // Use comprehensive selectors to catch all possible input types
    textareas = document.querySelectorAll("textarea");
    textInputs = document.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="search"], input[type="number"], input[type="password"], input:not([type]), input[type=""], input'
    );

    console.log(
      `[Resume Filler] No modal detected. Found ${textareas.length} textarea(s) and ${textInputs.length} input(s) on page`
    );

    // Filter out hidden/disabled/readonly fields (but be lenient)
    textareas = Array.from(textareas).filter(
      (field) => isElementVisible(field) && !field.disabled && !field.readOnly
    );
    textInputs = Array.from(textInputs).filter(
      (field) => isElementVisible(field) && !field.disabled && !field.readOnly
    );

    console.log(
      `[Resume Filler] After filtering: ${textareas.length} visible textarea(s) and ${textInputs.length} visible input(s)`
    );

    // Track which fields are in any modal (for reference)
    modals.forEach((modal) => {
      const modalTextareas = modal.querySelectorAll("textarea");
      const modalInputs = modal.querySelectorAll(
        'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="search"], input[type="number"], input[type="password"], input:not([type]), input[type=""], input'
      );
      [...modalTextareas, ...modalInputs].forEach((field) => {
        if (isElementVisible(field) && !field.disabled && !field.readOnly) {
          fieldsInModals.add(field);
        }
      });
    });
  }

  // Fallback: If no fields found and we have a latest modal, try searching more broadly
  if (latestModal && textareas.length === 0 && textInputs.length === 0) {
    console.log(
      `[Resume Filler] No fields found in modal, trying broader search within modal...`
    );
    // Try searching for any input-like elements
    const allInputs = latestModal.querySelectorAll("input, textarea");
    console.log(
      `[Resume Filler] Found ${allInputs.length} total input/textarea elements in modal (including hidden)`
    );

    // Be more lenient - include fields that might be slightly hidden
    const lenientFields = Array.from(allInputs).filter((field) => {
      const style = window.getComputedStyle(field);
      const rect = field.getBoundingClientRect();
      // Only exclude if completely hidden or disabled
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        !field.disabled &&
        !field.readOnly &&
        (rect.width > 0 || rect.height > 0)
      );
    });

    console.log(
      `[Resume Filler] Found ${lenientFields.length} fields with lenient filtering`
    );

    // Separate textareas and inputs
    textareas = lenientFields.filter((f) => f.tagName === "TEXTAREA");
    textInputs = lenientFields.filter(
      (f) =>
        f.tagName === "INPUT" &&
        f.type !== "checkbox" &&
        f.type !== "radio" &&
        f.type !== "submit" &&
        f.type !== "button" &&
        f.type !== "hidden"
    );

    [...textareas, ...textInputs].forEach((field) => {
      fieldsInLatestModal.add(field);
      fieldsInModals.add(field);
    });
  }

  // Final fallback: If still no fields, search entire document but prioritize visible form areas
  if (textareas.length === 0 && textInputs.length === 0) {
    console.log(
      `[Resume Filler] Still no fields found. Searching entire document...`
    );
    // Look for form elements or common form containers
    const forms = document.querySelectorAll("form");
    const formContainers = document.querySelectorAll(
      '[role="form"], [class*="form"], [class*="application"], [class*="apply"]'
    );

    const searchContainers =
      forms.length > 0 ? Array.from(forms) : Array.from(formContainers);

    if (searchContainers.length > 0) {
      console.log(
        `[Resume Filler] Found ${searchContainers.length} form container(s)`
      );
      searchContainers.forEach((container) => {
        const containerTextareas = container.querySelectorAll("textarea");
        const containerInputs = container.querySelectorAll(
          'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="search"], input[type="number"], input:not([type]), input[type=""]'
        );

        const visibleContainerTextareas = Array.from(containerTextareas).filter(
          (field) =>
            isElementVisible(field) && !field.disabled && !field.readOnly
        );
        const visibleContainerInputs = Array.from(containerInputs).filter(
          (field) =>
            isElementVisible(field) && !field.disabled && !field.readOnly
        );

        if (
          visibleContainerTextareas.length > 0 ||
          visibleContainerInputs.length > 0
        ) {
          console.log(
            `[Resume Filler] Found ${visibleContainerTextareas.length} textarea(s) and ${visibleContainerInputs.length} input(s) in form container`
          );
          textareas = visibleContainerTextareas;
          textInputs = visibleContainerInputs;
        }
      });
    }
  }

  // Final logging before processing
  console.log(
    `[Resume Filler] Processing ${textareas.length} textarea(s) and ${textInputs.length} input(s)`
  );

  // Process textareas
  textareas.forEach((textarea, index) => {
    const label = findLabel(textarea);
    const placeholder = textarea.placeholder || "";
    const name = textarea.name || textarea.id || `textarea-${index}`;
    const isInModal = fieldsInModals.has(textarea);
    const isInLatestModal = fieldsInLatestModal.has(textarea);
    const isVisible = isElementVisible(textarea);

    // Create unique identifier for field
    const fieldId = `field-${index}-textarea-${Date.now()}`;
    if (!textarea.dataset.resumeFillerId) {
      textarea.dataset.resumeFillerId = fieldId;
    }

    formFields.push({
      type: "textarea",
      name: name,
      label: label,
      placeholder: placeholder,
      value: textarea.value || "",
      fieldId: textarea.dataset.resumeFillerId,
      selector: generateFieldSelector(textarea),
      element: textarea,
      inModal: isInModal,
      inLatestModal: isInLatestModal,
      visible: isVisible,
    });
  });

  // Process text inputs
  textInputs.forEach((input, index) => {
    const label = findLabel(input);
    const placeholder = input.placeholder || "";
    const name = input.name || input.id || `input-${index}`;
    const isInModal = fieldsInModals.has(input);
    const isInLatestModal = fieldsInLatestModal.has(input);
    const isVisible = isElementVisible(input);

    // Create unique identifier for field
    const fieldId = `field-${index}-input-${Date.now()}`;
    if (!input.dataset.resumeFillerId) {
      input.dataset.resumeFillerId = fieldId;
    }

    formFields.push({
      type: "input",
      name: name,
      label: label,
      placeholder: placeholder,
      value: input.value || "",
      fieldId: input.dataset.resumeFillerId,
      selector: generateFieldSelector(input),
      element: input,
      inModal: isInModal,
      inLatestModal: isInLatestModal,
      visible: isVisible,
    });
  });

  return formFields;
}

// Generate a unique selector for a field
function generateFieldSelector(element) {
  // Try ID first
  if (element.id) {
    return `#${element.id}`;
  }

  // Try name attribute
  if (element.name) {
    const nameSelector = `[name="${element.name}"]`;
    // If multiple elements have same name, add type
    const sameName = document.querySelectorAll(nameSelector);
    if (sameName.length > 1) {
      return `${nameSelector}[type="${element.type || "text"}"]`;
    }
    return nameSelector;
  }

  // Try data attribute
  if (element.dataset.resumeFillerId) {
    return `[data-resume-filler-id="${element.dataset.resumeFillerId}"]`;
  }

  // Fallback: use tag name and index
  const tagName = element.tagName.toLowerCase();
  const allSameTag = document.querySelectorAll(tagName);
  const index = Array.from(allSameTag).indexOf(element);
  return `${tagName}:nth-of-type(${index + 1})`;
}

// Fill a form field by selector
function fillField(selector, text) {
  try {
    const field = document.querySelector(selector);
    if (!field) {
      return { success: false, error: `Field not found: ${selector}` };
    }

    // Check if it's a textarea or input
    if (
      field.tagName.toLowerCase() === "textarea" ||
      field.tagName.toLowerCase() === "input"
    ) {
      // Set the value
      field.value = text;

      // Trigger input events to ensure form validation and change handlers fire
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));

      // Focus the field briefly to show it was filled
      field.focus();
      setTimeout(() => field.blur(), 100);

      return { success: true, message: "Field filled successfully" };
    }

    return { success: false, error: "Element is not a fillable field" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Fill multiple fields
function fillFields(fieldsToFill) {
  const results = [];

  fieldsToFill.forEach(({ selector, text }) => {
    const result = fillField(selector, text);
    results.push({ selector, ...result });
  });

  return results;
}

// Check if element is visible (not hidden by CSS)
function isElementVisible(element) {
  if (!element) return false;

  // Check if element is in DOM
  if (!element.isConnected) return false;

  const style = window.getComputedStyle(element);

  // Check obvious hidden states
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  // Check opacity (but be lenient - during transitions it might be temporarily 0)
  const opacity = parseFloat(style.opacity);
  // Don't reject based on opacity alone - many forms use opacity transitions

  // Check if element has dimensions (is rendered)
  const rect = element.getBoundingClientRect();

  // Be more lenient - allow elements that have at least some dimension
  if (rect.width === 0 && rect.height === 0) {
    return false;
  }

  // Check if element is in viewport (at least partially visible)
  // Be lenient - allow elements that are slightly off-screen
  const isInViewport =
    rect.top < window.innerHeight + 100 && // Allow 100px buffer
    rect.bottom > -100 && // Allow 100px buffer
    rect.left < window.innerWidth + 100 &&
    rect.right > -100;

  // Element is visible if it has dimensions and is roughly in viewport
  // Also check that it's not completely transparent (unless it's transitioning)
  const isOpaque = isNaN(opacity) || opacity > 0 || style.transition !== "none";

  return isInViewport && isOpaque;
}

// Find label for an input element
function findLabel(element) {
  // Try id-based label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent.trim();
  }

  // Try parent label
  if (element.parentElement && element.parentElement.tagName === "LABEL") {
    return element.parentElement.textContent.trim();
  }

  // Try aria-label
  if (element.getAttribute("aria-label")) {
    return element.getAttribute("aria-label");
  }

  // Try placeholder
  if (element.placeholder) {
    return element.placeholder;
  }

  // Try previous sibling text
  const prevSibling = element.previousElementSibling;
  if (prevSibling && prevSibling.textContent) {
    const text = prevSibling.textContent.trim();
    if (text.length < 100) return text;
  }

  return "";
}

// Extract job description (if present)
function extractJobDescription() {
  // Common selectors for job descriptions
  const selectors = [
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[id*="job-description"]',
    '[id*="jobDescription"]',
    '[class*="description"]',
    'section[aria-label*="description" i]',
    'div[role="article"]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.innerText || element.textContent || "";
      if (text.length > 100) {
        // Likely a job description if substantial
        return text.trim();
      }
    }
  }

  return null;
}

// Main scan function
function scanPage() {
  try {
    const modals = findModals(); // Find all modals for stats
    const openModals = findOpenModals(); // Find currently open modals
    const latestModal = findLatestOpenModal(); // Find the latest/most prominent modal
    const pageText = extractPageText();
    const formFields = extractFormFields();
    const jobDescription = extractJobDescription();

    // Determine if we're showing modal content or page content
    const isShowingModalContent = latestModal !== null;

    return {
      success: true,
      data: {
        text: pageText,
        formFields: formFields.map((field) => ({
          type: field.type,
          name: field.name,
          label: field.label,
          placeholder: field.placeholder,
          selector: field.selector,
          fieldId: field.fieldId,
          currentValue: field.value,
          inModal: field.inModal || false,
          inLatestModal: field.inLatestModal || false,
          visible: field.visible !== undefined ? field.visible : true,
        })),
        modalsFound: modals.length,
        openModalsFound: openModals.length,
        latestModalFound: latestModal !== null,
        isModalContent: isShowingModalContent,
        jobDescription: jobDescription,
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Scan error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scanPage") {
    const result = scanPage();
    sendResponse(result);
    return true; // Indicates we will send a response asynchronously
  }

  if (request.action === "fillField") {
    const { selector, text } = request;
    const result = fillField(selector, text);
    sendResponse(result);
    return true;
  }

  if (request.action === "fillFields") {
    const { fields } = request;
    const results = fillFields(fields);
    sendResponse({ success: true, results });
    return true;
  }
});

// Watch for dynamically added modals
let modalObserver = null;

function setupModalWatcher() {
  // Watch for new modals being added to the DOM
  modalObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          // Element node
          // Check if the added node is a modal or contains modals
          const isModal =
            node.matches &&
            (node.matches('[role="dialog"]') ||
              node.matches('[role="alertdialog"]') ||
              node.classList?.toString().toLowerCase().includes("modal") ||
              node.classList?.toString().toLowerCase().includes("dialog"));

          if (isModal) {
            console.log("New modal detected:", node);
          }

          // Also check if it contains modals
          const modals =
            node.querySelectorAll &&
            node.querySelectorAll(
              '[role="dialog"], [role="alertdialog"], .modal, [class*="modal"]'
            );
          if (modals && modals.length > 0) {
            console.log(
              `Found ${modals.length} modal(s) in newly added content`
            );
          }
        }
      });
    });
  });

  // Start observing
  modalObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Initialize modal watcher when script loads
if (document.body) {
  setupModalWatcher();
} else {
  // Wait for body to be available
  document.addEventListener("DOMContentLoaded", setupModalWatcher);
}

// Log that content script is loaded
console.log("Resume Filler content script loaded - Modal detection enabled");
