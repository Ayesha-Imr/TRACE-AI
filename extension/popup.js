/**
 * TRACE AI Extension - Popup Script
 * Handles the popup interface and communication with content script
 * Enhanced with improved UX, error handling, and user feedback
 */

document.addEventListener('DOMContentLoaded', function() {
    initializePopup();
});

/**
 * Initialize the popup interface with enhanced UX
 */
function initializePopup() {
    // Request current tab information from content script
    requestPageAnalysis();
    
    // Add refresh button event listener with enhanced UX
    setupRefreshButton();
    
    // Add keyboard shortcuts for accessibility
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Setup refresh button with enhanced interactions
 */
function setupRefreshButton() {
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            performRefresh();
        });
        
        // Enhanced hover effects with improved accessibility
        refreshButton.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-1px)';
            this.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.4)';
        });
        
        refreshButton.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 6px rgba(25, 118, 210, 0.3)';
        });
        
        // Add focus styles for keyboard navigation
        refreshButton.addEventListener('focus', function() {
            this.style.outline = '2px solid #1976d2';
            this.style.outlineOffset = '2px';
        });
        
        refreshButton.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
    }
}

/**
 * Handle keyboard shortcuts for accessibility
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboardShortcuts(event) {
    // Ctrl+R or F5 to refresh analysis
    if ((event.ctrlKey && event.key === 'r') || event.key === 'F5') {
        event.preventDefault();
        performRefresh();
    }
}

/**
 * Perform refresh with improved visual feedback
 */
function performRefresh() {
    const alertsContainer = document.getElementById('alerts-container');
    const statusElement = document.getElementById('status');
    const refreshContainer = document.getElementById('refresh-container');
    
    // Add sophisticated fade out effect
    alertsContainer.style.transition = 'opacity 0.3s ease';
    alertsContainer.style.opacity = '0.5';
    
    // Update status with enhanced loading message
    statusElement.innerHTML = '<div class="loading">🔍 Re-scanning page for security risks...</div>';
    statusElement.className = 'status';
    refreshContainer.style.display = 'none';
    
    // Request fresh analysis with enhanced timing
    setTimeout(() => {
        alertsContainer.innerHTML = '';
        alertsContainer.style.opacity = '1';
        requestPageAnalysis();
    }, 300);
}

/**
 * Request page analysis from the content script
 */
function requestPageAnalysis() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            // Send message to content script to get page analysis
            chrome.tabs.sendMessage(tabs[0].id, {action: 'getPageAnalysis'}, function(response) {
                if (chrome.runtime.lastError) {
                    // Content script might not be ready yet, try injecting it
                    injectContentScriptAndRetry(tabs[0].id);
                    return;
                }
                
                if (response) {
                    displayAnalysisResults(response);
                } else {
                    displayStatus('Unable to analyze page. Please refresh and try again.');
                }
            });
        }
    });
}

/**
 * Inject content script and retry analysis with enhanced error handling
 * @param {number} tabId - Tab ID to inject script into
 */
function injectContentScriptAndRetry(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content_script.js']
    }, function() {
        if (chrome.runtime.lastError) {
            const errorMessage = chrome.runtime.lastError.message;
            
            // Enhanced error messages for better user experience
            if (errorMessage.includes('chrome://') || errorMessage.includes('chrome-extension://')) {
                displayEnhancedStatus('🚫 Cannot analyze Chrome system pages', 
                    'Please visit a regular website to use TRACE AI security analysis.', 'info');
            } else if (errorMessage.includes('file://')) {
                displayEnhancedStatus('📁 Cannot analyze local files', 
                    'Please visit a website (http:// or https://) for security analysis.', 'info');
            } else if (errorMessage.includes('chrome-devtools://')) {
                displayEnhancedStatus('🛠️ Cannot analyze developer tools', 
                    'Please visit a regular website to use TRACE AI.', 'info');
            } else {
                displayEnhancedStatus('⚠️ Page analysis unavailable', 
                    'This page type cannot be analyzed. Try visiting a regular website.', 'warning');
            }
            return;
        }
        
        // Wait for script initialization with enhanced feedback
        displayEnhancedStatus('🔄 Initializing security scanner...', 
            'Setting up analysis tools for this page.', 'info');
        
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {action: 'getPageAnalysis'}, function(response) {
                if (chrome.runtime.lastError) {
                    displayEnhancedStatus('⚠️ Analysis failed', 
                        'Unable to complete security scan. Please refresh the page and try again.', 'warning');
                    return;
                }
                
                if (response) {
                    displayAnalysisResults(response);
                } else {
                    displayEnhancedStatus('✅ No forms found', 
                        'This page contains no forms to analyze for security issues.', 'success');
                }
            });
        }, 200);
    });
}

/**
 * Display analysis results in the popup with enhanced UX
 * @param {Object} analysis - Analysis results from content script
 */
function displayAnalysisResults(analysis) {
    const statusElement = document.getElementById('status');
    const alertsContainer = document.getElementById('alerts-container');
    const refreshContainer = document.getElementById('refresh-container');
    
    // Clear previous alerts with animation
    alertsContainer.style.transition = 'opacity 0.2s ease';
    alertsContainer.style.opacity = '0';
    
    setTimeout(() => {
        alertsContainer.innerHTML = '';
        alertsContainer.style.opacity = '1';
        
        // Count total issues with enhanced categorization
        let totalIssues = 0;
        let criticalIssues = 0;
        let highIssues = 0;
        let mediumIssues = 0;
        
        analysis.forms.forEach(form => {
            totalIssues += form.issues.length;
            form.issues.forEach(issue => {
                if (issue.severity === 'critical') criticalIssues++;
                else if (issue.severity === 'high') highIssues++;
                else if (issue.severity === 'medium') mediumIssues++;
            });
        });
        
        // Update status with enhanced messaging
        if (analysis.formsFound === 0) {
            displayEnhancedStatus('No forms detected', 
                'This page contains no forms to analyze for security issues.', 'info');
        } else if (totalIssues === 0) {
            displayEnhancedStatus('✓ All forms secure', 
                `Excellent! All ${analysis.formsFound} form(s) on this page use secure practices.`, 'success');
        } else {
            const severityText = criticalIssues > 0 ? 'critical' : 
                               highIssues > 0 ? 'high' : 'medium';
            displayEnhancedStatus(`${totalIssues} security issue(s) found`, 
                `Found ${totalIssues} issue(s) in ${analysis.formsFound} form(s). Review recommendations below.`, 
                criticalIssues > 0 ? 'danger' : 'warning');
        }
        
        // Display alerts for each form with issues
        analysis.forms.forEach((form, index) => {
            if (form.issues.length > 0) {
                // Create enhanced form header
                const formHeader = document.createElement('div');
                formHeader.style.cssText = `
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: var(--text-primary);
                    padding: 8px 12px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-radius: var(--border-radius-sm);
                    border-left: 3px solid var(--primary-color);
                `;
                formHeader.textContent = `Form ${index + 1} (${form.issues.length} issue${form.issues.length > 1 ? 's' : ''}):`;
                alertsContainer.appendChild(formHeader);
                
                // Display each issue with enhanced styling
                form.issues.forEach(issue => {
                    const alertType = issue.severity === 'critical' ? 'danger' : 
                                   issue.severity === 'high' ? 'warning' : 'info';
                    
                    const alert = createEnhancedAlert(alertType, issue.title, issue.description, issue);
                    alertsContainer.appendChild(alert);
                });
            }
        });
        
        // Display privacy policy scanning options if links are found
        if (analysis.privacyPolicyLinks && analysis.privacyPolicyLinks.length > 0) {
            displayPrivacyPolicySection(analysis.privacyPolicyLinks);
        }

        // If no issues found but forms exist, show positive message
        if (analysis.formsFound > 0 && totalIssues === 0) {
            const safeAlert = createEnhancedAlert('success', 
                'All Forms Secure ✓', 
                'Great! All forms on this page use secure submission methods and follow security best practices.'
            );
            alertsContainer.appendChild(safeAlert);
        }
        
        // Show refresh button after analysis
        refreshContainer.style.display = 'block';
    }, 200);
}

/**
 * Display status message
 * @param {string} message - Status message to display
 */
function displayStatus(message) {
    const statusElement = document.getElementById('status');
    statusElement.innerHTML = message;
}

/**
 * Display enhanced status message with better visual feedback
 * @param {string} title - Status title
 * @param {string} message - Detailed status message
 * @param {string} type - Status type (info, warning, success, danger)
 */
function displayEnhancedStatus(title, message, type = 'info') {
    const statusElement = document.getElementById('status');
    const refreshContainer = document.getElementById('refresh-container');
    
    // Choose appropriate styling based on type
    const icons = {
        'info': 'ℹ️',
        'warning': '⚠️',
        'success': '✅',
        'danger': '🚨'
    };
    
    const icon = icons[type] || 'ℹ️';
    
    statusElement.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 8px;">
            <span style="font-size: 16px;">${icon}</span>
            <div>
                <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">${message}</div>
            </div>
        </div>
    `;
    
    // Apply appropriate styling
    statusElement.className = `status ${type === 'success' ? 'safe' : type === 'warning' ? 'warning' : ''}`;
    
    // Show refresh button for completed states
    if (type !== 'info' || title.includes('Initializing')) {
        refreshContainer.style.display = 'block';
    }
}

/**
 * Create an enhanced alert element with improved design and feedback
 * @param {string} type - Alert type (info, warning, danger, success)
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Object} issue - Full issue object for handling explanations
 * @returns {HTMLElement} Alert element
 */
function createEnhancedAlert(type, title, message, issue = null) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    // Enhanced icons for better visual communication
    const icons = {
        'danger': '🚨',
        'warning': '⚠️',
        'info': 'ℹ️',
        'success': '✅'
    };
    
    const titleElement = document.createElement('strong');
    titleElement.innerHTML = `<span class="alert-icon">${icons[type] || 'ℹ️'}</span>${title}`;
    
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.cssText = `
        margin-top: 6px;
        line-height: 1.5;
        color: inherit;
    `;
    
    alert.appendChild(titleElement);
    alert.appendChild(messageElement);
    
    // Add AI explanation button for security issues with enhanced styling
    if (issue && (issue.type === 'insecure_submission' || issue.type === 'password_insecure_form' || issue.type === 'excessive_data_request')) {
        const explainButton = document.createElement('button');
        explainButton.className = 'explain-button';
        explainButton.innerHTML = '🤖 Explain This Risk';
        
        // Store issue data for context-aware explanations
        if (issue.type === 'excessive_data_request') {
            alert.dataset.formPurpose = issue.formPurpose || 'unknown';
            alert.dataset.formHtml = issue.formHtml || ''; // Store form HTML
        }
        
        explainButton.addEventListener('click', function() {
            requestExplanation(issue.type, explainButton);
        });
        
        // Enhanced accessibility
        explainButton.setAttribute('aria-label', `Get AI explanation for ${title}`);
        explainButton.setAttribute('tabindex', '0');
        
        alert.appendChild(explainButton);
    }
    
    // Add entry animation
    alert.style.opacity = '0';
    alert.style.transform = 'translateY(10px)';
    setTimeout(() => {
        alert.style.transition = 'all 0.3s ease';
        alert.style.opacity = '1';
        alert.style.transform = 'translateY(0)';
    }, 50);
    
    return alert;
}

/**
 * Request AI explanation for a security issue
 * @param {string} issueType - Type of security issue
 * @param {HTMLElement} button - Button that was clicked
 */
async function requestExplanation(issueType, button) {
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    button.style.opacity = '0.7';
    
    try {
        const backendUrl = 'http://localhost:8000'; // Backend URL - TODO: Make this configurable
        let endpoint, requestBody;
        
        if (issueType === 'insecure_submission') {
            endpoint = '/explain/insecure_submission';
            requestBody = {};
        } else if (issueType === 'password_insecure_form') {
            endpoint = '/explain/password_insecure_form';
            requestBody = {};
        } else if (issueType === 'excessive_data_request') {
            // Get form purpose and suspicious fields from the issue data
            const issueElement = button.closest('.alert');
            const formPurpose = issueElement.dataset.formPurpose || 'unknown';
            const formHtml = issueElement.dataset.formHtml || ''; // Retrieve form HTML
            
            endpoint = '/explain/data_request_concern';
            requestBody = {
                form_purpose: formPurpose,
                form_html: formHtml // Send form HTML instead of suspiciousField
            };
        } else {
            throw new Error('Unknown issue type');
        }
        
        const response = await fetch(`${backendUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.explanation) {
            displayExplanation(button, data.explanation);
        } else {
            throw new Error(data.error || 'No explanation received from AI service');
        }
        
    } catch (error) {
        console.error('Error requesting explanation:', error);
        displayExplanationError(button, error.message, originalText);
    }
}

/**
 * Display AI explanation with enhanced UX and feedback mechanism
 * @param {HTMLElement} button - Button element
 * @param {string} explanation - AI explanation text
 */
function displayExplanation(button, explanation) {
    // Create enhanced explanation element
    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'ai-explanation';
    
    explanationDiv.innerHTML = `
        <div class="robot-icon">🤖</div>
        <div style="flex: 1;">
            <strong style="color: var(--primary-color); margin-bottom: 6px; display: block;">AI Security Explanation:</strong>
            <div style="color: var(--text-primary); line-height: 1.5; margin-bottom: 8px;">${explanation}</div>
            <div class="feedback-buttons">
                <button class="feedback-btn positive" data-feedback="positive" title="This explanation was helpful">
                    👍 Helpful
                </button>
                <button class="feedback-btn negative" data-feedback="negative" title="This explanation needs improvement">
                    👎 Not helpful
                </button>
                <span class="feedback-text">Was this explanation helpful?</span>
            </div>
        </div>
    `;
    
    // Add fade-in animation
    explanationDiv.style.opacity = '0';
    explanationDiv.style.transform = 'translateY(10px)';
    
    // Insert explanation after the button
    button.parentNode.insertBefore(explanationDiv, button.nextSibling);
    
    // Animate in
    setTimeout(() => {
        explanationDiv.style.transition = 'all 0.4s ease';
        explanationDiv.style.opacity = '1';
        explanationDiv.style.transform = 'translateY(0)';
    }, 10);
    
    // Add feedback button listeners
    const feedbackButtons = explanationDiv.querySelectorAll('.feedback-btn');
    feedbackButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            handleFeedback(this.dataset.feedback, explanationDiv);
        });
    });
    
    // Hide the explain button with smooth transition
    button.style.transition = 'all 0.3s ease';
    button.style.opacity = '0';
    button.style.transform = 'scale(0.9)';
    setTimeout(() => {
        button.style.display = 'none';
    }, 300);
}

/**
 * Handle user feedback on AI explanations
 * @param {string} feedback - Feedback type ('positive' or 'negative')
 * @param {HTMLElement} explanationDiv - Explanation container
 */
function handleFeedback(feedback, explanationDiv) {
    const feedbackButtons = explanationDiv.querySelector('.feedback-buttons');
    const feedbackText = explanationDiv.querySelector('.feedback-text');
    
    // Update UI to show feedback was received
    if (feedback === 'positive') {
        feedbackText.innerHTML = '<span style="color: var(--success-color);">✓ Thank you! Your feedback helps improve our AI.</span>';
    } else {
        feedbackText.innerHTML = '<span style="color: var(--warning-color);">✓ Thank you! We\'ll work on improving our explanations.</span>';
    }
    
    // Hide feedback buttons
    const buttons = feedbackButtons.querySelectorAll('.feedback-btn');
    buttons.forEach(btn => {
        btn.style.display = 'none';
    });
    
    // Store feedback for future improvements (could be sent to analytics)
    console.log(`TRACE AI Feedback: ${feedback} for AI explanation`);
    
    // Add subtle celebration animation for positive feedback
    if (feedback === 'positive') {
        explanationDiv.style.animation = 'subtle-glow 0.5s ease';
    }
}

/**
 * Display enhanced error when AI explanation fails
 * @param {HTMLElement} button - Button element
 * @param {string} errorMessage - Error message
 * @param {string} originalText - Original button text
 */
function displayExplanationError(button, errorMessage, originalText) {
    // Update button appearance
    button.innerHTML = '🤖 AI Unavailable';
    button.disabled = true;
    button.style.opacity = '0.6';
    button.style.background = 'linear-gradient(135deg, #757575 0%, #9e9e9e 100%)';
    button.style.cursor = 'not-allowed';
    
    // Create helpful error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        margin-top: 8px;
        padding: 10px;
        background: linear-gradient(135deg, #ffecb3 0%, #fff8e1 100%);
        border: 1px solid #ffc107;
        border-radius: var(--border-radius-sm);
        font-size: 12px;
        color: #e65100;
    `;
    
    // Provide context-aware error message
    let userFriendlyMessage = '';
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyMessage = 'AI service is temporarily unavailable. Please check your internet connection and try again.';
    } else if (errorMessage.includes('500') || errorMessage.includes('timeout')) {
        userFriendlyMessage = 'Our AI service is experiencing high demand. Please try again in a moment.';
    } else {
        userFriendlyMessage = 'AI explanation is temporarily unavailable. The security risk information above can still help guide your decision.';
    }
    
    errorDiv.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 6px;">
            <span>⚠️</span>
            <div>
                <strong style="display: block; margin-bottom: 4px;">AI Service Unavailable</strong>
                <div>${userFriendlyMessage}</div>
            </div>
        </div>
    `;
    
    button.parentNode.insertBefore(errorDiv, button.nextSibling);
    
    // Add retry button for network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        const retryButton = document.createElement('button');
        retryButton.innerHTML = '🔄 Retry';
        retryButton.style.cssText = `
            margin-top: 6px;
            padding: 4px 8px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: var(--border-radius-sm);
            font-size: 11px;
            cursor: pointer;
        `;
        
        retryButton.addEventListener('click', function() {
            // Reset button and retry
            button.style.display = 'none';
            errorDiv.remove();
            retryButton.remove();
            
            // Re-create and trigger the original button
            const newButton = button.cloneNode(true);
            newButton.disabled = false;
            newButton.style.opacity = '1';
            newButton.style.background = 'linear-gradient(135deg, var(--primary-color) 0%, #42a5f5 100%)';
            newButton.innerHTML = originalText;
            button.parentNode.insertBefore(newButton, button.nextSibling);
            
            // Re-add the click listener
            const issueType = button.closest('.alert').querySelector('[data-form-purpose]') ? 'excessive_data_request' : 
                            originalText.includes('Password') ? 'password_insecure_form' : 'insecure_submission';
            
            newButton.addEventListener('click', function() {
                requestExplanation(issueType, newButton);
            });
        });
        
        errorDiv.appendChild(retryButton);
    }
}

/**
 * Display enhanced privacy policy scanning section
 * @param {Array} privacyPolicyLinks - Array of detected privacy policy links
 */
function displayPrivacyPolicySection(privacyPolicyLinks) {
    const alertsContainer = document.getElementById('alerts-container');
    
    // Create enhanced privacy policy section
    const policySection = document.createElement('div');
    policySection.className = 'policy-section';
    policySection.style.cssText = `
        margin-top: 16px;
        padding: 16px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-sm);
    `;
    
    const sectionTitle = document.createElement('h4');
    sectionTitle.innerHTML = '🔍 Privacy Policy Scanner';
    sectionTitle.style.cssText = `
        margin: 0 0 8px 0;
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    const sectionDescription = document.createElement('p');
    sectionDescription.innerHTML = `Found <strong>${privacyPolicyLinks.length}</strong> privacy policy link${privacyPolicyLinks.length > 1 ? 's' : ''}. Get AI-powered analysis of potential privacy concerns:`;
    sectionDescription.style.cssText = `
        margin: 0 0 12px 0;
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.4;
    `;
    
    policySection.appendChild(sectionTitle);
    policySection.appendChild(sectionDescription);
    
    // Add enhanced scan interface for each privacy policy link
    privacyPolicyLinks.forEach((link, index) => {
        const linkDiv = document.createElement('div');
        linkDiv.style.cssText = `
            margin-bottom: 10px;
            padding: 12px;
            background: var(--card-background);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-sm);
            transition: all 0.2s ease;
        `;
        
        // Add hover effect
        linkDiv.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-1px)';
            this.style.boxShadow = getComputedStyle(this).getPropertyValue('--shadow-md');
        });
        
        linkDiv.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        
        const linkHeader = document.createElement('div');
        linkHeader.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        `;
        
        const linkInfo = document.createElement('div');
        linkInfo.innerHTML = `
            <div style="font-weight: 500; font-size: 13px; color: var(--text-primary); margin-bottom: 2px;">
                Privacy Policy ${privacyPolicyLinks.length > 1 ? `#${index + 1}` : ''}
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); word-break: break-all;">
                ${link.url}
            </div>
        `;
        
        const scanButton = document.createElement('button');
        scanButton.innerHTML = '🤖 Scan Policy';
        scanButton.style.cssText = `
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 500;
            background: linear-gradient(135deg, #6f42c1 0%, #8e24aa 100%);
            color: white;
            border: none;
            border-radius: var(--border-radius-sm);
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(111, 66, 193, 0.3);
        `;
        
        scanButton.addEventListener('click', function() {
            scanPrivacyPolicy(link.url, scanButton, linkDiv);
        });
        
        // Enhanced hover effects
        scanButton.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-1px)';
            this.style.boxShadow = '0 4px 8px rgba(111, 66, 193, 0.4)';
        });
        
        scanButton.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 4px rgba(111, 66, 193, 0.3)';
        });
        
        linkHeader.appendChild(linkInfo);
        linkHeader.appendChild(scanButton);
        linkDiv.appendChild(linkHeader);
        policySection.appendChild(linkDiv);
    });
    
    // Add entry animation
    policySection.style.opacity = '0';
    policySection.style.transform = 'translateY(10px)';
    alertsContainer.appendChild(policySection);
    
    setTimeout(() => {
        policySection.style.transition = 'all 0.3s ease';
        policySection.style.opacity = '1';
        policySection.style.transform = 'translateY(0)';
    }, 100);
}

/**
 * Scan a privacy policy for red flags using AI with enhanced UX
 * @param {string} policyUrl - URL of the privacy policy to scan
 * @param {HTMLElement} button - Button that triggered the scan
 * @param {HTMLElement} container - Container to display results in
 */
async function scanPrivacyPolicy(policyUrl, button, container) {
    const originalText = button.innerHTML;
    
    // Enhanced loading state
    button.innerHTML = '🔍 <span class="loading-dots">Scanning</span>';
    button.disabled = true;
    button.style.opacity = '0.7';
    button.style.cursor = 'not-allowed';
    
    // Add progress indicator
    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = `
        margin-top: 8px;
        padding: 8px;
        background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
        border-radius: var(--border-radius-sm);
        font-size: 12px;
        color: var(--text-secondary);
        text-align: center;
    `;
    progressDiv.innerHTML = '⏳ Analyzing privacy policy... This may take 10-15 seconds.';
    container.appendChild(progressDiv);
    
    try {
        const backendUrl = 'http://localhost:8000';
        
        const response = await fetch(`${backendUrl}/analyze_privacy_policy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                policy_url: policyUrl
            })
        });
        
        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.explanation) {
            progressDiv.remove();
            displayEnhancedPolicyAnalysis(container, data.explanation);
            button.style.display = 'none';
        } else {
            throw new Error(data.error || 'Failed to analyze privacy policy');
        }
        
    } catch (error) {
        console.error('Error scanning privacy policy:', error);
        progressDiv.remove();
        displayEnhancedPolicyError(container, error.message, originalText, button);
    }
}

/**
 * Display privacy policy analysis results
 * @param {HTMLElement} container - Container to display results in
 * @param {string} analysis - AI analysis results
 */
function displayPolicyAnalysis(container, analysis) {
    const analysisDiv = document.createElement('div');
    analysisDiv.style.cssText = `
        margin-top: 8px;
        padding: 12px;
        background-color: #e3f2fd;
        border: 1px solid #1976d2;
        border-radius: 6px;
        font-size: 13px;
        line-height: 1.5;
    `;
    
    analysisDiv.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="color: #1976d2; font-weight: bold; margin-right: 6px;">🤖</span>
            <strong style="color: #1976d2;">AI Policy Analysis:</strong>
        </div>
        <div style="color: #0d47a1;">${analysis}</div>
    `;
    
    container.appendChild(analysisDiv);
}

/**
 * Display enhanced privacy policy analysis results
 * @param {HTMLElement} container - Container to display results in
 * @param {string} analysis - AI analysis results
 */
function displayEnhancedPolicyAnalysis(container, analysis) {
    const analysisDiv = document.createElement('div');
    analysisDiv.style.cssText = `
        margin-top: 10px;
        padding: 14px;
        background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%);
        border: 1px solid var(--success-color);
        border-radius: var(--border-radius);
        font-size: 13px;
        line-height: 1.6;
        box-shadow: var(--shadow-sm);
    `;
    
    analysisDiv.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="color: var(--success-color); font-size: 16px; margin-right: 8px;">🤖</span>
            <strong style="color: var(--success-color); font-size: 14px;">AI Privacy Policy Analysis:</strong>
        </div>
        <div style="color: var(--text-primary); margin-bottom: 10px;">${analysis}</div>
        <div class="feedback-buttons">
            <button class="feedback-btn positive" data-feedback="positive" title="This analysis was helpful">
                👍 Helpful
            </button>
            <button class="feedback-btn negative" data-feedback="negative" title="This analysis needs improvement">
                👎 Not helpful
            </button>
            <span class="feedback-text">Was this analysis helpful?</span>
        </div>
    `;
    
    // Add fade-in animation
    analysisDiv.style.opacity = '0';
    analysisDiv.style.transform = 'translateY(10px)';
    container.appendChild(analysisDiv);
    
    setTimeout(() => {
        analysisDiv.style.transition = 'all 0.4s ease';
        analysisDiv.style.opacity = '1';
        analysisDiv.style.transform = 'translateY(0)';
    }, 50);
    
    // Add feedback listeners
    const feedbackButtons = analysisDiv.querySelectorAll('.feedback-btn');
    feedbackButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            handlePolicyFeedback(this.dataset.feedback, analysisDiv);
        });
    });
}

/**
 * Display error when privacy policy scanning fails
 * @param {HTMLElement} container - Container to display error in
 * @param {string} errorMessage - Error message
 * @param {string} originalText - Original button text
 * @param {HTMLElement} button - Button element
 */
function displayEnhancedPolicyError(container, errorMessage, originalText, button) {
    // Reset button
    button.innerHTML = '🤖 Scan Failed';
    button.disabled = true;
    button.style.opacity = '0.6';
    button.style.background = 'linear-gradient(135deg, #757575 0%, #9e9e9e 100%)';
    
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        margin-top: 10px;
        padding: 12px;
        background: linear-gradient(135deg, #ffebee 0%, #fce4ec 100%);
        border: 1px solid var(--danger-color);
        border-radius: var(--border-radius);
        font-size: 12px;
        color: var(--danger-color);
    `;
    
    // Provide context-aware error message
    let userFriendlyMessage = '';
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyMessage = 'Unable to access the privacy policy. The link may be broken or require authentication.';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('504')) {
        userFriendlyMessage = 'Privacy policy analysis timed out. The document may be too large or the server is busy.';
    } else if (errorMessage.includes('403') || errorMessage.includes('401')) {
        userFriendlyMessage = 'Access denied to privacy policy. The document may be protected or require login.';
    } else {
        userFriendlyMessage = 'Failed to analyze privacy policy. Please try again or review the policy manually.';
    }
    
    errorDiv.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 8px;">
            <span style="font-size: 14px;">⚠️</span>
            <div>
                <strong style="display: block; margin-bottom: 6px;">Privacy Policy Analysis Failed</strong>
                <div style="margin-bottom: 8px;">${userFriendlyMessage}</div>
                <div style="font-size: 11px; color: var(--text-secondary); font-style: italic;">
                    💡 Tip: You can still review the privacy policy manually to understand how your data will be used.
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(errorDiv);
}

/**
 * Handle user feedback on privacy policy analysis
 * @param {string} feedback - Feedback type ('positive' or 'negative')
 * @param {HTMLElement} analysisDiv - Analysis container
 */
function handlePolicyFeedback(feedback, analysisDiv) {
    const feedbackButtons = analysisDiv.querySelector('.feedback-buttons');
    const feedbackText = analysisDiv.querySelector('.feedback-text');
    
    // Update UI to show feedback was received
    if (feedback === 'positive') {
        feedbackText.innerHTML = '<span style="color: var(--success-color);">✓ Thank you! Your feedback helps improve our privacy analysis.</span>';
    } else {
        feedbackText.innerHTML = '<span style="color: var(--warning-color);">✓ Thank you! We\'ll work on improving our privacy policy analysis.</span>';
    }
    
    // Hide feedback buttons
    const buttons = feedbackButtons.querySelectorAll('.feedback-btn');
    buttons.forEach(btn => {
        btn.style.display = 'none';
    });
    
    // Store feedback for analytics
    console.log(`TRACE AI Privacy Feedback: ${feedback} for privacy policy analysis`);
}
