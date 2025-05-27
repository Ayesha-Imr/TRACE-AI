# Privacy Policy for TRACE AI Browser Extension

**Last Updated:** May 27, 2025

Thank you for using TRACE AI ("we," "us," "our"). This Privacy Policy explains how we handle information when you use our browser extension. TRACE AI is designed with your privacy and security as a priority.

## 1. Information We Process

TRACE AI processes the following types of information solely to provide its security and privacy analysis features:

*   **Web Page Content:**
    *   **Form HTML:** The HTML structure and content of web forms on the active web page you are viewing. This may include data you have typed into the form fields if the analysis occurs after you have entered such data.
    *   **Privacy Policy URLs:** URLs identified as linking to privacy policies on the active web page.
    *   **Privacy Policy Text:** If you initiate a scan, the text content of the privacy policy (fetched by our backend from the provided URL or extracted from the page).
    *   **General Page Context:** Limited surrounding text or page structure may be implicitly considered by the AI during analysis to understand the context of a form or policy.

*   **Technical Information (Standard for Web Requests):**
    *   **IP Address:** When the extension communicates with our backend service (`https://trace-ai.onrender.com`), your IP address is processed as part of the standard internet communication. This is used by our hosting provider for operational and security logging but is not used by TRACE AI to personally identify or track you.

## 2. How We Use Information

The information processed by TRACE AI is used exclusively for the following purposes:

*   **To Provide Security and Privacy Analysis:**
    *   To detect insecure form submissions (HTTP).
    *   To identify password fields in insecure forms.
    *   To analyze form HTML for potentially excessive or unusual data requests using AI.
    *   To analyze the text of privacy policies for concerning clauses using AI.
*   **To Provide Explanations:** To generate AI-powered explanations of the detected risks in simple, non-technical language.
*   **To Improve Our Service:** Anonymized and aggregated data about the types of risks detected (e.g., number of insecure forms found, but not the content of those forms) may be used to improve the extension's functionality and accuracy. We do not use your personal data from forms for this purpose.

## 3. Data Sharing and Third Parties

*   **Backend Service:** Information like form HTML and privacy policy text/URLs is sent to our secure backend API hosted on Render (`https://trace-ai.onrender.com`) for processing.
*   **AI Provider (Google Gemini):** Our backend service uses the Google Gemini API to perform the advanced analysis and generate explanations. The data sent to Google Gemini (form HTML snippets, privacy policy text) is processed according to Google's API terms and privacy policies. We only send the minimum data necessary for the analysis.
*   **No Sale of Data:** We do not sell, rent, or trade your personal information or the content analyzed by the extension to any third parties for marketing or other purposes.
*   **No Unrelated Purposes:** We do not use or transfer user data for purposes that are unrelated to TRACE AI's single purpose of providing web form and privacy policy security/privacy analysis.
*   **No Creditworthiness Determination:** We do not use or transfer user data to determine creditworthiness or for lending purposes.

## 4. Data Retention and Security

*   **Ephemeral Processing:** Data sent to our backend (form HTML, privacy policy text) is processed ephemerally to provide the analysis. We do not store this specific content on our servers long-term after the analysis is complete and the result is returned to your extension.
*   **API Keys:** Your `GOOGLE_API_KEY` is stored securely as an environment variable on our backend server and is not accessible to the client-side extension.
*   **Secure Communication:** Communication between your browser extension and our backend API, and between our backend and the Google Gemini API, is encrypted using HTTPS.

## 5. User Control

TRACE AI operates on the active tab and analyzes content based on your interaction with the extension (e.g., opening the popup, clicking "Scan Policy"). You control which pages are analyzed by navigating the web.

## 6. Children's Privacy

TRACE AI is not intended for use by children under the age of 13 (or the relevant age in your jurisdiction), and we do not knowingly collect personal information from children.

## 7. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.

## 8. Contact Us

If you have any questions about this Privacy Policy, please contact us at: 
ayesha.ml2002@gmail.com