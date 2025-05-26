/**
 * TRACE AI Extension - Content Script
 * Enhanced with improved form analysis and user-friendly messaging
 * Injected into web pages to analyze forms for security vulnerabilities
 */

// Global variables for dynamic form detection
let mutationObserver = null;
let lastAnalysisResults = null;
let periodicScanInterval = null;

// Initialize when DOM is ready with enhanced error handling for dynamic content
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTraceAI);
} else {
    initializeTraceAI();
}

/**
 * Initialize TRACE AI analysis on the current page with robust error handling
 * Enhanced to handle dynamic content loading (SPAs, AJAX forms, etc.)
 */
function initializeTraceAI() {
    try {
        console.log('TRACE AI: Content script loaded and initializing...');
        
        // Listen for messages from popup with enhanced response handling
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            try {
                if (request.action === 'getPageAnalysis') {
                    // Always perform fresh analysis when popup requests it
                    const analysis = performPageAnalysis();
                    sendResponse(analysis);
                }
            } catch (error) {
                console.error('TRACE AI: Error processing message:', error);
                sendResponse({
                    error: 'Analysis failed',
                    formsFound: 0,
                    forms: [],
                    privacyPolicyLinks: []
                });
            }
        });
        
        // Setup dynamic form detection system
        setupDynamicFormDetection();
        
        // Perform initial analysis with error handling
        performPageAnalysis();
        
        // Setup periodic scanning for dynamic content (common in SPAs)
        setupPeriodicScanning();
        
    } catch (error) {
        console.error('TRACE AI: Initialization failed:', error);
    }
}

/**
 * Setup dynamic form detection using MutationObserver
 * Watches for forms that are added to the DOM after initial page load
 */
function setupDynamicFormDetection() {
    try {
        // Create mutation observer to watch for new forms
        mutationObserver = new MutationObserver(function(mutations) {
            let formsAdded = false;
            
            mutations.forEach(function(mutation) {
                // Check if any added nodes contain forms
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node is a form or contains forms
                        const hasTraditionalForm = node.tagName === 'FORM' || node.querySelector('form');
                        
                        // Check for form-like structures
                        const hasInputs = node.querySelectorAll && node.querySelectorAll('input, textarea, select').length > 0;
                        const hasFormClasses = node.className && (
                            node.className.toLowerCase().includes('form') ||
                            node.id && node.id.toLowerCase().includes('form')
                        );
                        
                        if (hasTraditionalForm || hasInputs || hasFormClasses) {
                            formsAdded = true;
                        }
                    }
                });
            });
            
            // If new forms were detected, re-analyze the page
            if (formsAdded) {
                console.log('TRACE AI: New forms detected via MutationObserver, re-analyzing...');
                setTimeout(() => {
                    performPageAnalysis();
                }, 500); // Small delay to ensure forms are fully rendered
            }
        });
        
        // Start observing changes to the entire document
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('TRACE AI: MutationObserver setup complete for dynamic form detection');
        
    } catch (error) {
        console.error('TRACE AI: Failed to setup MutationObserver:', error);
    }
}

/**
 * Setup periodic scanning to catch forms loaded with delays
 * Common in SPAs that load content after API calls
 */
function setupPeriodicScanning() {
    try {
        let scanCount = 0;
        const maxScans = 10; // Limit to prevent infinite scanning
        
        periodicScanInterval = setInterval(function() {
            scanCount++;
            
            // Count both traditional forms and form-like structures
            const traditionalFormCount = document.querySelectorAll('form').length;
            const formLikeCount = detectFormLikeStructures().length;
            const currentFormCount = traditionalFormCount + formLikeCount;
            
            const previousFormCount = lastAnalysisResults ? lastAnalysisResults.formsFound : 0;
            
            // If form count changed or we haven't found any forms yet, re-analyze
            if (currentFormCount !== previousFormCount || currentFormCount === 0) {
                console.log(`TRACE AI: Periodic scan ${scanCount}: ${currentFormCount} forms found (was ${previousFormCount})`);
                console.log(`  - Traditional forms: ${traditionalFormCount}, Form-like: ${formLikeCount}`);
                performPageAnalysis();
            }
            
            // Stop periodic scanning after max attempts or when forms are found
            if (scanCount >= maxScans || (currentFormCount > 0 && scanCount >= 3)) {
                clearInterval(periodicScanInterval);
                console.log('TRACE AI: Periodic scanning completed');
            }
        }, 2000); // Scan every 2 seconds
        
    } catch (error) {
        console.error('TRACE AI: Failed to setup periodic scanning:', error);
    }
}

/**
 * Perform comprehensive page analysis for security vulnerabilities
 * Enhanced to handle dynamic content and store results for comparison
 * @returns {Object} Analysis results
 */
function performPageAnalysis() {
    // Look for traditional forms
    const traditionalForms = document.querySelectorAll('form');
    
    // Also look for form-like structures (common in SPAs)
    const formLikeStructures = detectFormLikeStructures();
    
    // Combine traditional forms and form-like structures
    const allForms = [...traditionalForms, ...formLikeStructures];
    
    const privacyPolicyLinks = detectPrivacyPolicyLinks();
    
    const analysis = {
        formsFound: allForms.length,
        traditionalForms: traditionalForms.length,
        formLikeStructures: formLikeStructures.length,
        forms: [],
        privacyPolicyLinks: privacyPolicyLinks,
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href,
        dynamicContent: {
            hasDynamicContent: checkForDynamicContent(),
            framework: detectFramework()
        }
    };
    
    console.log(`TRACE AI: Found ${allForms.length} form(s) on page: ${window.location.href}`);
    console.log(`  - Traditional <form> elements: ${traditionalForms.length}`);
    console.log(`  - Form-like structures: ${formLikeStructures.length}`);
    
    // Log additional info for debugging dynamic content issues
    if (allForms.length === 0) {
        console.log('TRACE AI: No forms detected. Checking for dynamic content indicators...');
        logDynamicContentIndicators();
    }
    
    // Analyze each form
    allForms.forEach((form, index) => {
        const formAnalysis = analyzeForm(form, index);
        analysis.forms.push(formAnalysis);
    });
    
    // Store results for comparison in future scans
    lastAnalysisResults = analysis;
    
    return analysis;
}

/**
 * Detect form-like structures that might not use traditional <form> tags
 * Common in modern SPAs where forms are custom components
 * @returns {Array} Array of form-like elements
 */
function detectFormLikeStructures() {
    const formLikeElements = [];
    
    // Look for containers that have multiple input elements (likely forms)
    const potentialContainers = [
        ...document.querySelectorAll('div'),
        ...document.querySelectorAll('section'),
        ...document.querySelectorAll('main'),
        ...document.querySelectorAll('[class*="form"]'),
        ...document.querySelectorAll('[id*="form"]'),
        ...document.querySelectorAll('[data-testid*="form"]'),
        ...document.querySelectorAll('[role="form"]')
    ];
    
    potentialContainers.forEach(container => {
        // Skip if this container is already inside a traditional form
        if (container.closest('form')) {
            return;
        }
        
        // Count input elements in this container
        const inputs = container.querySelectorAll('input, textarea, select');
        const submitButtons = container.querySelectorAll('button[type="submit"], input[type="submit"], button[class*="submit"], [class*="submit"][role="button"]');
        
        // Consider it a form-like structure if it has:
        // - 2 or more inputs, OR
        // - 1 or more inputs AND a submit button, OR
        // - Contains common form-related class names/IDs
        const hasMultipleInputs = inputs.length >= 2;
        const hasInputWithSubmit = inputs.length >= 1 && submitButtons.length > 0;
        
        // Robust check for className and id
        const classNameString = typeof container.className === 'string' ? container.className : '';
        const idString = typeof container.id === 'string' ? container.id : '';

        const hasFormClasses = classNameString.toLowerCase().includes('form') || 
                              idString.toLowerCase().includes('form');
        
        if (hasMultipleInputs || hasInputWithSubmit || hasFormClasses) {
            // Make sure we don't add nested containers
            const isNestedInFormLike = formLikeElements.some(existing => 
                existing.contains(container) || container.contains(existing)
            );
            
            if (!isNestedInFormLike) {
                // Add a marker to identify this as a form-like structure
                container.setAttribute('data-trace-ai-form-like', 'true');
                formLikeElements.push(container);
            }
        }
    });
    
    console.log(`TRACE AI: Detected ${formLikeElements.length} form-like structures`);
    
    return formLikeElements;
}

/**
 * Check for indicators that the page uses dynamic content loading
 * @returns {boolean} True if dynamic content indicators are found
 */
function checkForDynamicContent() {
    // Check for common SPA frameworks and dynamic loading indicators
    const indicators = [
        document.querySelector('[data-reactroot]'),
        document.querySelector('[ng-app]'),
        document.querySelector('[v-app]'),
        document.querySelector('#app'),
        document.querySelector('#root'),
        document.querySelector('.app'),
        document.querySelector('[data-app]'),
        window.React,
        window.Angular,
        window.Vue,
        window.angular,
        document.querySelector('script[src*="react"]'),
        document.querySelector('script[src*="angular"]'),
        document.querySelector('script[src*="vue"]')
    ];
    
    return indicators.some(indicator => indicator);
}

/**
 * Attempt to detect the JavaScript framework being used
 * @returns {string} Detected framework or 'unknown'
 */
function detectFramework() {
    if (window.React || document.querySelector('[data-reactroot]') || document.querySelector('script[src*="react"]')) {
        return 'React';
    }
    if (window.Angular || window.angular || document.querySelector('[ng-app]') || document.querySelector('script[src*="angular"]')) {
        return 'Angular';
    }
    if (window.Vue || document.querySelector('[v-app]') || document.querySelector('script[src*="vue"]')) {
        return 'Vue';
    }
    if (document.querySelector('[data-app]') || document.querySelector('#app') || document.querySelector('#root')) {
        return 'SPA (Unknown Framework)';
    }
    return 'Static/Unknown';
}

/**
 * Log detailed information about dynamic content indicators for debugging
 */
function logDynamicContentIndicators() {
    const framework = detectFramework();
    const hasDynamic = checkForDynamicContent();
    
    console.log('TRACE AI: Dynamic content analysis:');
    console.log(`  - Framework detected: ${framework}`);
    console.log(`  - Has dynamic indicators: ${hasDynamic}`);
    console.log(`  - Page ready state: ${document.readyState}`);
    console.log(`  - Total DOM elements: ${document.querySelectorAll('*').length}`);
    console.log(`  - Script tags: ${document.querySelectorAll('script').length}`);
    console.log(`  - Inputs found: ${document.querySelectorAll('input').length}`);
    console.log(`  - Textareas found: ${document.querySelectorAll('textarea').length}`);
    console.log(`  - Select elements found: ${document.querySelectorAll('select').length}`);
    
    // Check for common form-related elements that might indicate forms are coming
    const formIndicators = [
        document.querySelectorAll('[class*="form"]'),
        document.querySelectorAll('[id*="form"]'),
        document.querySelectorAll('[class*="input"]'),
        document.querySelectorAll('[class*="field"]'),
        document.querySelectorAll('button[type="submit"]'),
        document.querySelectorAll('button[class*="submit"]')
    ];
    
    formIndicators.forEach((elements, index) => {
        if (elements.length > 0) {
            console.log(`  - Form indicator ${index + 1}: ${elements.length} elements found`);
        }
    });
}

/**
 * Analyze individual form for security issues
 * @param {HTMLFormElement} form - Form element to analyze
 * @param {number} index - Form index on page
 * @returns {Object} Form analysis results
 */
function analyzeForm(form, index) {
    const formData = {
        index: index,
        action: form.action || window.location.href,
        method: form.method || 'GET',
        htmlContent: form.outerHTML, // Add the form's outerHTML
        inputs: [],
        issues: [],
        securityChecks: {
            isInsecureSubmission: false,
            hasPasswordInInsecureForm: false,
            inputCount: 0,
            sensitiveFieldCount: 0,
            hasExcessiveDataRequest: false,
            formPurpose: 'unknown',
            suspiciousFields: []
        }
    };
    
    // Analyze form inputs
    const inputs = form.querySelectorAll('input, textarea, select');
    formData.securityChecks.inputCount = inputs.length;
    
    inputs.forEach(input => {
        const inputData = {
            type: input.type || 'text',
            name: input.name || '',
            id: input.id || '',
            required: input.required || false,
            isSensitive: isSensitiveField(input),
            placeholder: input.placeholder || '',
            label: getFieldLabel(input)
        };
        
        if (inputData.isSensitive) {
            formData.securityChecks.sensitiveFieldCount++;
        }
        
        formData.inputs.push(inputData);
    });
    
    // Determine form purpose using heuristics
    formData.securityChecks.formPurpose = determineFormPurpose(form, formData.inputs);
    
    // Perform security checks
    formData.securityChecks.isInsecureSubmission = isInsecureSubmission(form);
    formData.securityChecks.hasPasswordInInsecureForm = 
        formData.securityChecks.isInsecureSubmission && hasPasswordFields(form);
    
    // Check for excessive data requests
    const excessiveDataAnalysis = analyzeExcessiveDataRequest(form, formData.inputs, formData.securityChecks.formPurpose);
    formData.securityChecks.hasExcessiveDataRequest = excessiveDataAnalysis.isExcessive;
    formData.securityChecks.suspiciousFields = excessiveDataAnalysis.suspiciousFields;
    
    // Generate security issues based on checks
    if (formData.securityChecks.isInsecureSubmission) {
        formData.issues.push({
            type: 'insecure_submission',
            severity: 'high',
            title: 'Insecure Form Submission',
            description: 'This form submits data over an unencrypted connection (HTTP), making your information vulnerable to interception.'
        });
    }
    
    if (formData.securityChecks.hasPasswordInInsecureForm) {
        formData.issues.push({
            type: 'password_insecure_form',
            severity: 'critical',
            title: 'Password on Insecure Form',
            description: 'This form asks for a password but transmits it over an unencrypted connection. Your password could be stolen!'
        });
    }
    
    if (formData.securityChecks.hasExcessiveDataRequest) {
        formData.issues.push({
            type: 'excessive_data_request',
            severity: 'warning',
            title: 'Suspicious Data Request',
            description: `This form is asking for more information than typically needed. Consider if all requested information is necessary.`,
            suspiciousFields: formData.securityChecks.suspiciousFields,
            formPurpose: formData.securityChecks.formPurpose,
            formHtml: form.outerHTML // Also pass it here for direct access in the issue if needed
        });
    }
    
    console.log(`TRACE AI: Form ${index + 1} analysis:`, formData);
    
    return formData;
}

/**
 * Check if form submission would be insecure (HTTP)
 * @param {HTMLFormElement} form - Form to check
 * @returns {boolean} True if submission is insecure
 */
function isInsecureSubmission(form) {
    const actionUrl = form.action || window.location.href;
    const currentProtocol = window.location.protocol;
    
    // Check if form action uses HTTP or if current page is HTTP
    return actionUrl.startsWith('http://') || currentProtocol === 'http:';
}

/**
 * Check if form contains password fields
 * @param {HTMLFormElement} form - Form to check
 * @returns {boolean} True if form has password fields
 */
function hasPasswordFields(form) {
    const passwordInputs = form.querySelectorAll('input[type="password"]');
    return passwordInputs.length > 0;
}

/**
 * Check if an input field is considered sensitive
 * @param {HTMLInputElement} input - Input element to check
 * @returns {boolean} True if field is sensitive
 */
function isSensitiveField(input) {
    const sensitiveTypes = ['password', 'email'];
    const sensitiveNames = ['ssn', 'social', 'credit', 'card', 'cvv', 'phone', 'address', 'birth', 'income', 'salary'];
    
    // Check input type
    if (sensitiveTypes.includes(input.type.toLowerCase())) {
        return true;
    }
    
    // Check name and id attributes for sensitive keywords
    const nameId = (input.name + ' ' + input.id).toLowerCase();
    return sensitiveNames.some(keyword => nameId.includes(keyword));
}

/**
 * Get the label text for a form field
 * @param {HTMLInputElement} input - Input element
 * @returns {string} Label text or empty string
 */
function getFieldLabel(input) {
    const MAX_LABEL_LENGTH = 150; // Define a reasonable max length for a label

    // Try to find associated label
    if (input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label && label.textContent && label.textContent.trim().length > 0 && label.textContent.trim().length <= MAX_LABEL_LENGTH) {
            return label.textContent.trim();
        }
    }

    // Try parent label
    const parentLabel = input.closest('label');
    if (parentLabel && parentLabel.textContent && parentLabel.textContent.trim().length > 0 && parentLabel.textContent.trim().length <= MAX_LABEL_LENGTH) {
        // Check if the input is actually a child of this label, or the label is for this input
        // This helps avoid grabbing a label that wraps a large section containing the input indirectly.
        if (parentLabel.contains(input) || (input.id && parentLabel.getAttribute('for') === input.id)) {
            return parentLabel.textContent.trim();
        }
    }

    // Try previous sibling if it's a label
    let sibling = input.previousElementSibling;
    if (sibling && sibling.tagName.toLowerCase() === 'label' && sibling.textContent && sibling.textContent.trim().length > 0 && sibling.textContent.trim().length <= MAX_LABEL_LENGTH) {
        // Check if this label is 'for' this input if input has an id
        if (input.id && sibling.getAttribute('for') === input.id) {
            return sibling.textContent.trim();
        }
        // If input has no id, and previous sibling is a label, it's a common pattern (though less explicit)
        if (!input.id) {
            return sibling.textContent.trim();
        }
    }
    
    // Fallback to placeholder (if it's not too long)
    if (input.placeholder && input.placeholder.trim().length > 0 && input.placeholder.trim().length <= MAX_LABEL_LENGTH) {
        return input.placeholder.trim();
    }

    // Fallback to name (usually short, good identifier)
    if (input.name && input.name.trim().length > 0 && input.name.trim().length <= MAX_LABEL_LENGTH) { // Name is usually short
        return input.name.trim();
    }
    
    return ''; // Return empty string if no suitable label is found
}

/**
 * Determine the likely purpose of a form using heuristic analysis
 * @param {HTMLFormElement} form - Form element to analyze
 * @param {Array} inputs - Array of input data
 * @returns {string} Likely form purpose
 */
function determineFormPurpose(form, inputs) {
    const formText = (form.textContent || '').toLowerCase();
    const formAction = (form.action || '').toLowerCase();
    const pageTitle = document.title.toLowerCase();
    const pageUrl = window.location.href.toLowerCase();
    
    // Combine all text for analysis
    const combinedText = `${formText} ${formAction} ${pageTitle} ${pageUrl}`;
    
    // Check for common form types
    if (combinedText.includes('login') || combinedText.includes('sign in') || 
        inputs.some(input => input.type === 'password' && !combinedText.includes('register'))) {
        return 'login';
    }
    
    if (combinedText.includes('register') || combinedText.includes('sign up') || combinedText.includes('create account')) {
        return 'registration';
    }
    
    if (combinedText.includes('newsletter') || combinedText.includes('subscribe') || 
        (inputs.length === 1 && inputs[0].type === 'email')) {
        return 'newsletter';
    }
    
    if (combinedText.includes('contact') || combinedText.includes('feedback') || combinedText.includes('support')) {
        return 'contact';
    }
    
    if (combinedText.includes('checkout') || combinedText.includes('payment') || combinedText.includes('billing')) {
        return 'payment';
    }
    
    if (combinedText.includes('search')) {
        return 'search';
    }
    
    if (combinedText.includes('survey') || combinedText.includes('feedback') || combinedText.includes('review')) {
        return 'survey';
    }
    
    // Default based on number of fields
    if (inputs.length <= 2) return 'simple';
    if (inputs.length <= 5) return 'standard';
    return 'complex';
}

/**
 * Analyze if a form is requesting excessive data for its purpose
 * @param {HTMLFormElement} form - Form element
 * @param {Array} inputs - Array of input data
 * @param {string} formPurpose - Determined form purpose
 * @returns {Object} Analysis result with suspicious fields
 */
function analyzeExcessiveDataRequest(form, inputs, formPurpose) {
    const suspiciousFields = [];
    let isExcessive = false;
    
    // Define expected fields for each form type
    const expectedFields = {
        'login': ['email', 'username', 'password'],
        'newsletter': ['email', 'name'],
        'contact': ['name', 'email', 'message', 'phone'],
        'search': ['query', 'search'],
        'simple': ['email', 'name'],
        'standard': ['name', 'email', 'phone', 'message', 'company'],
        'registration': ['name', 'email', 'password', 'username', 'phone'],
        'payment': ['name', 'email', 'address', 'city', 'zip', 'card', 'cvv'],
        'survey': ['name', 'email', 'age', 'location', 'opinion'],
        'complex': [] // Allow more fields for complex forms
    };
    
    // Fields that are rarely necessary for most forms
    const highlyUnusualFields = ['ssn', 'social', 'income', 'salary', 'birth', 'mother', 'maiden'];
    
    // Check for highly unusual fields first
    inputs.forEach(input => {
        const fieldText = `${input.name} ${input.id} ${input.label} ${input.placeholder}`.toLowerCase();
        
        if (highlyUnusualFields.some(unusual => fieldText.includes(unusual))) {
            suspiciousFields.push({
                field: input.name || input.id || 'unnamed field',
                reason: 'Requests highly sensitive personal information',
                severity: 'high',
                label: input.label || input.placeholder || input.name
            });
            isExcessive = true;
        }
    });
    
    // Check field count against form purpose
    const expected = expectedFields[formPurpose] || [];
    const sensitiveCount = inputs.filter(input => input.isSensitive).length;
    
    // Heuristic rules for excessive data
    if (formPurpose === 'newsletter' && inputs.length > 3) {
        suspiciousFields.push({
            field: 'form complexity',
            reason: 'Newsletter signup forms typically only need email and name',
            severity: 'medium'
        });
        isExcessive = true;
    }
    
    if (formPurpose === 'login' && inputs.length > 4) {
        suspiciousFields.push({
            field: 'form complexity',
            reason: 'Login forms should only ask for username/email and password',
            severity: 'medium'
        });
        isExcessive = true;
    }
    
    if (formPurpose === 'contact' && sensitiveCount > 2) {
        suspiciousFields.push({
            field: 'sensitive data',
            reason: 'Contact forms typically only need basic contact information',
            severity: 'medium'
        });
        isExcessive = true;
    }
    
    // Check for payment info on non-payment forms
    if (formPurpose !== 'payment' && formPurpose !== 'registration') {
        const hasPaymentFields = inputs.some(input => {
            const fieldText = `${input.name} ${input.id} ${input.label}`.toLowerCase();
            return fieldText.includes('card') || fieldText.includes('cvv') || fieldText.includes('billing');
        });
        
        if (hasPaymentFields) {
            suspiciousFields.push({
                field: 'payment information',
                reason: 'This form is asking for payment details but doesn\'t appear to be a payment form',
                severity: 'high'
            });
            isExcessive = true;
        }
    }
    
    return { isExcessive, suspiciousFields };
}

/**
 * Detect privacy policy links on the current page
 * @returns {Array} Array of privacy policy link objects
 */
function detectPrivacyPolicyLinks() {
    const policyLinks = [];
    const links = document.querySelectorAll('a[href]');
    
    // Common privacy policy link text patterns
    const policyPatterns = [
        /privacy\s*policy/i,
        /privacy\s*statement/i,
        /privacy\s*notice/i,
        /data\s*policy/i,
        /privacy/i
    ];
    
    // Common privacy policy URL patterns
    const urlPatterns = [
        /privacy[_-]?policy/i,
        /privacy[_-]?statement/i,
        /privacy[_-]?notice/i,
        /privacy/i,
        /policy/i
    ];
    
    links.forEach((link, index) => {
        const linkText = link.textContent.trim();
        const linkHref = link.href;
        const linkTitle = link.title || '';
        
        // Check if link text matches privacy policy patterns
        const textMatches = policyPatterns.some(pattern => pattern.test(linkText));
        
        // Check if URL matches privacy policy patterns
        const urlMatches = urlPatterns.some(pattern => pattern.test(linkHref));
        
        // Check title attribute
        const titleMatches = policyPatterns.some(pattern => pattern.test(linkTitle));
        
        // If any pattern matches and it's not a fragment link
        if ((textMatches || urlMatches || titleMatches) && !linkHref.startsWith('#')) {
            policyLinks.push({
                text: linkText,
                url: linkHref,
                title: linkTitle,
                index: index
            });
        }
    });
    
    console.log(`TRACE AI: Found ${policyLinks.length} privacy policy link(s)`, policyLinks);
    return policyLinks;
}

/**
 * Cleanup function to properly dispose of observers and intervals
 * Called when the content script is unloaded or page changes
 */
function cleanupTraceAI() {
    try {
        // Clean up mutation observer
        if (mutationObserver) {
            mutationObserver.disconnect();
            mutationObserver = null;
            console.log('TRACE AI: MutationObserver cleaned up');
        }
        
        // Clean up periodic scanning interval
        if (periodicScanInterval) {
            clearInterval(periodicScanInterval);
            periodicScanInterval = null;
            console.log('TRACE AI: Periodic scanning interval cleaned up');
        }
        
    } catch (error) {
        console.error('TRACE AI: Error during cleanup:', error);
    }
}

// Setup cleanup when page unloads
window.addEventListener('beforeunload', cleanupTraceAI);
window.addEventListener('unload', cleanupTraceAI);

// Also cleanup if content script is re-injected
if (window.traceAIInitialized) {
    console.log('TRACE AI: Re-injection detected, cleaning up previous instance');
    cleanupTraceAI();
}

// Mark as initialized to detect re-injection
window.traceAIInitialized = true;

console.log('TRACE AI: Content script fully loaded with dynamic form detection capabilities');

function isFormLike(node) {
    // Heuristic to determine if a node is form-like (e.g., a div acting as a form)
    if (!node || typeof node.matches !== 'function') return false;

    // Check for common form-related attributes or structure
    const hasFormRole = node.getAttribute('role') === 'form';
    const hasAriaForm = node.hasAttribute('aria-form'); // Common in some frameworks
    const hasFormTagParent = node.closest('form'); // If it's inside a real form, less likely to be a standalone form-like div

    // Check for class names, ensuring className is a string
    const classNameString = typeof node.className === 'string' ? node.className : '';
    const hasFormClass = classNameString.toLowerCase().includes('form') ||
                         classNameString.toLowerCase().includes('contact') || // common for contact sections
                         classNameString.toLowerCase().includes('apply') || // common for job application sections
                         classNameString.toLowerCase().includes('application'); // common for job application sections


    // Check for common form-related IDs, ensuring id is a string
    const idString = typeof node.id === 'string' ? node.id : '';
    const hasFormId = idString.toLowerCase().includes('form') ||
                      idString.toLowerCase().includes('contact') ||
                      idString.toLowerCase().includes('apply') ||
                      idString.toLowerCase().includes('application');

    // Check for presence of input-like elements and a potential submit button
    const inputs = node.querySelectorAll('input, textarea, select, [contenteditable]');
    const buttons = node.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]');
    
    let hasSubmitLikeButton = false;
    buttons.forEach(button => {
        const buttonText = (button.textContent || button.value || '').toLowerCase();
        const buttonClass = (typeof button.className === 'string' ? button.className : '').toLowerCase();
        if (button.type === 'submit' || 
            buttonText.includes('submit') || buttonText.includes('apply') || buttonText.includes('send') || buttonText.includes('contact') ||
            buttonClass.includes('submit') || buttonClass.includes('apply') || buttonClass.includes('send') || buttonClass.includes('contact')) {
            hasSubmitLikeButton = true;
        }
    });

    // More refined conditions:
    // 1. Explicit form role or ARIA attribute
    if (hasFormRole || hasAriaForm) return true;

    // 2. Has form-like class/ID AND at least one input (and not inside a real form already)
    if ((hasFormClass || hasFormId) && inputs.length > 0 && !hasFormTagParent) return true;
    
    // 3. Has multiple inputs (e.g., >=2) AND a submit-like button (and not inside a real form)
    if (inputs.length >= 2 && hasSubmitLikeButton && !hasFormTagParent) return true;

    // 4. Has at least one input AND a very clearly named submit-like button (and not inside a real form)
    //    This is a bit more lenient for simpler "forms" like a search bar with a button.
    if (inputs.length >= 1 && hasSubmitLikeButton && !hasFormTagParent) {
        // Add more checks if needed to avoid being too greedy
        return true;
    }
    
    return false;
}
