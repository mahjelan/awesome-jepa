import React, { useEffect } from 'react';

const Privacy: React.FC = () => {
    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo(0, 0);

        // Override global App.css styles that interfere with static pages
        document.documentElement.style.display = 'block';
        document.documentElement.style.height = 'auto';
        document.body.style.display = 'block';

        return () => {
            // Restore original styles when leaving page
            document.documentElement.style.display = '';
            document.documentElement.style.height = '';
            document.body.style.display = '';
        };
    }, []);

    return (
        <div style={{
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            lineHeight: "1.6",
            margin: "0",
            padding: "20px",
            color: "#333",
            backgroundColor: "#f9f9f9",
            minHeight: "100vh",
            paddingTop: "40px",
            paddingBottom: "40px",
            position: "relative",
            width: "100%",
            boxSizing: "border-box",
            overflowX: "hidden",
            overflowY: "auto"
        }}>
            <div style={{
                background: "white",
                padding: window.innerWidth <= 768 ? "20px" : "30px",
                borderRadius: "10px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                maxWidth: "800px",
                margin: "0 auto",
                overflow: "visible",
                display: "block",
                position: "relative",
                zIndex: 1,
                width: "100%",
                boxSizing: "border-box"
            }}>
                <h1 style={{
                    color: "#774caf",
                    borderBottom: "3px solid #4a90e2",
                    paddingBottom: "10px",
                    marginTop: "0",
                    fontSize: window.innerWidth <= 768 ? "24px" : "32px"
                }}>
                    Privacy Policy for Algorythm
                </h1>
                <p style={{ color: "#666", fontStyle: "italic" }}>
                    Last updated: January 15, 2025
                </p>

                <div style={{
                    backgroundColor: "#e3f2fd",
                    padding: "15px",
                    borderLeft: "4px solid #1976d2",
                    margin: "20px 0"
                }}>
                    <strong>Quick Summary:</strong> Algorythm analyzes YouTube trending content using YouTube API Services. We
                    only access your YouTube data with your permission, don't store personal information permanently, and use Google's secure
                    authentication. This privacy policy explains how we handle your data in compliance with Google's requirements.
                </div>

                <div style={{
                    backgroundColor: "#e3f2fd",
                    padding: "15px",
                    borderLeft: "4px solid #1976d2",
                    margin: "20px 0"
                }}>
                    <strong>YouTube API Services:</strong> This application uses YouTube API Services to access and analyze
                    YouTube content. By using this application, you acknowledge that we use YouTube API Services and that
                    your use of YouTube data through our service is governed by the{' '}
                    <a href="https://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a> in addition to
                    this policy. We are required to notify you that this application uses YouTube API Services.
                </div>

                <h2 style={{ color: "#4a90e2", marginTop: "30px", display: "block", visibility: "visible", opacity: 1 }}>1. Information We Collect and Access</h2>

                <h3>1.1 YouTube API Data</h3>
                <p><strong>Through YouTube API Services, we access:</strong></p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li><strong>Video metadata:</strong> Titles, descriptions, thumbnails, view counts, and publication dates</li>
                    <li><strong>Channel information:</strong> Channel names, subscriber counts, and basic channel metadata</li>
                    <li><strong>Search results:</strong> YouTube search results based on trending topics and keywords</li>
                    <li><strong>Public video statistics:</strong> Like counts, comment counts, and engagement metrics</li>
                    <li><strong>Trending data:</strong> Information about currently trending videos and topics</li>
                </ul>

                <h3>1.2 Google Account Information</h3>
                <p><strong>When you authenticate with Google OAuth, we temporarily access:</strong></p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li><strong>Basic profile information:</strong> Your email address and name for authentication purposes</li>
                    <li><strong>YouTube account permissions:</strong> Authorization to access YouTube data on your behalf</li>
                    <li><strong>OAuth tokens:</strong> Secure tokens that allow API access without storing your password</li>
                </ul>

                <h3>1.3 Device and Browser Information</h3>
                <p><strong>We store and access information on your device including:</strong></p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li><strong>Local storage data:</strong> Authentication tokens, user preferences, and session information</li>
                    <li><strong>Browser cookies:</strong> Session cookies for maintaining your login state</li>
                    <li><strong>Temporary cache:</strong> Cached API responses and video analysis results</li>
                    <li><strong>Application settings:</strong> Theme preferences, search history, and user interface settings</li>
                    <li><strong>Session data:</strong> Information about your current app session and usage patterns</li>
                </ul>

                <div style={{
                    backgroundColor: "#e3f2fd",
                    padding: "15px",
                    borderLeft: "4px solid #1976d2",
                    margin: "20px 0"
                }}>
                    <strong>Device Storage and Cookies:</strong> We access and store this information directly on your device through your
                    browser. This application stores, accesses, and collects information directly and indirectly on or from
                    users' devices, including by placing, accessing, or recognizing cookies or similar technology on users'
                    devices or browsers. Third parties (including us) may access this information through cookies, local storage,
                    and similar technologies placed on your device.
                </div>

                <h2 style={{ color: "#4a90e2", marginTop: "30px", display: "block", visibility: "visible", opacity: 1 }}>2. How We Use, Process, and Share Your Information</h2>

                <h3>2.1 How We Use Your Information</h3>
                <p><strong>We use the information we collect and access to:</strong></p>
                <ol style={{ paddingLeft: "20px" }}>
                    <li><strong>Authenticate your access</strong> to YouTube API Services through Google OAuth</li>
                    <li><strong>Search and retrieve</strong> YouTube trending content and video metadata</li>
                    <li><strong>Display video information</strong> including titles, thumbnails, and statistics</li>
                    <li><strong>Generate AI-powered analysis</strong> of video trends and content patterns</li>
                    <li><strong>Personalize your experience</strong> by saving preferences and search history locally</li>
                    <li><strong>Maintain your session</strong> and provide continuous access during your visit</li>
                    <li><strong>Improve app functionality</strong> based on usage patterns and user interactions</li>
                </ol>

                <h3>2.2 How We Process Your Information</h3>
                <p><strong>Data processing occurs through:</strong></p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li><strong>Client-side processing:</strong> Most data analysis happens directly in your browser</li>
                    <li><strong>API calls:</strong> Secure requests to YouTube API Services and AI services</li>
                    <li><strong>Temporary caching:</strong> Short-term storage of API responses for performance</li>
                    <li><strong>Local storage:</strong> Browser-based storage of preferences and session data</li>
                </ul>

                <h3>2.3 How We Share Your Information</h3>
                <p><strong>Internal sharing:</strong></p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li>Information is processed within the application's client-side code</li>
                    <li>No internal sharing with other services or departments (single-purpose app)</li>
                </ul>

                <p><strong>External sharing with third parties:</strong></p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li><strong>Google/YouTube:</strong> API requests containing search queries and authentication tokens</li>
                    <li><strong>OpenAI (when AI features are used):</strong> Video titles and descriptions for content analysis</li>
                    <li><strong>No other third parties:</strong> We do not share your data with advertisers, marketers, or other external services</li>
                </ul>

                <div style={{
                    backgroundColor: "#e3f2fd",
                    padding: "15px",
                    borderLeft: "4px solid #1976d2",
                    margin: "20px 0"
                }}>
                    <strong>Important:</strong> We do NOT store your personal information on our servers. All data processing
                    happens in your browser or through secure, authorized API calls to Google and OpenAI services.
                </div>

                <h2 style={{ color: "#4a90e2", marginTop: "30px", display: "block", visibility: "visible", opacity: 1 }}>3. YouTube Data Refresh and Storage Policy</h2>

                <p><strong>In compliance with YouTube API Services policies, we:</strong></p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li><strong>Refresh YouTube data every 30 minutes</strong> to ensure current information</li>
                    <li><strong>Delete cached YouTube data after 24 hours</strong> maximum storage time</li>
                    <li><strong>Clear all YouTube data when you close the application</strong></li>
                    <li><strong>Do not permanently store YouTube content or metadata</strong> on our servers</li>
                    <li><strong>Only cache data temporarily</strong> in your browser for performance during your session</li>
                </ul>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>4. Data Storage and Security</h2>
                <p>We implement reasonable security measures to protect your information. However, no method of transmission over
                    the Internet is 100% secure. Data stored locally on your device is subject to your device's security settings.
                </p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li>All API communications use HTTPS encryption</li>
                    <li>OAuth tokens are stored securely in browser local storage</li>
                    <li>We do not store passwords or sensitive credentials</li>
                    <li>Session data is cleared when you log out or close the browser</li>
                </ul>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>5. Your Rights and Choices</h2>
                <p><strong>You have the right to:</strong></p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li><strong>Access the data we store about you:</strong> View and export your local storage data</li>
                    <li><strong>Request deletion of your data:</strong> Clear your browser cache and local storage</li>
                    <li><strong>Opt-out of cookies:</strong> Manage cookies through your browser settings</li>
                    <li><strong>Revoke API access:</strong> Remove application permissions from your Google Account settings</li>
                    <li><strong>Clear local storage data:</strong> Use browser developer tools or clear browsing data</li>
                    <li><strong>Stop using the Service:</strong> You can stop using the application at any time</li>
                </ul>

                <div style={{
                    backgroundColor: "#e3f2fd",
                    padding: "15px",
                    borderLeft: "4px solid #1976d2",
                    margin: "20px 0"
                }}>
                    <strong>How to Revoke Access:</strong> To revoke this application's access to your YouTube data, visit your{' '}
                    <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google Account Permissions page</a>
                    {' '}and remove Algorythm from the list of connected apps.
                </div>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>6. Children's Privacy</h2>
                <p>This Service is not intended for children under 13 years of age. We do not knowingly collect personal
                    information from children under 13. If you are a parent or guardian and believe your child has provided us
                    with personal information, please contact us immediately.</p>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>7. Third-Party Services</h2>

                <h3>7.1 YouTube API Services</h3>
                <p>This Service uses YouTube API Services. Your use of YouTube content through our Service is subject to:</p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li><a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube Terms of Service</a></li>
                    <li><a href="http://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
                </ul>

                <h3>7.2 Third-Party Access to Your Device</h3>
                <div style={{
                    backgroundColor: "#e3f2fd",
                    padding: "15px",
                    borderLeft: "4px solid #1976d2",
                    margin: "20px 0"
                }}>
                    <strong>Important:</strong> Third parties may access or collect information from your device. When you use this
                    Service, the following third parties may place, access, or recognize cookies or similar technology on your device:
                </div>
                <ul style={{ paddingLeft: "20px" }}>
                    <li><strong>YouTube/Google:</strong> For video playback, API services, and authentication</li>
                    <li><strong>Analytics services:</strong> For usage statistics and performance monitoring</li>
                    <li><strong>OpenAI (when AI features are enabled):</strong> For content analysis</li>
                </ul>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>8. Cookies and Similar Technologies</h2>
                <p><strong>This application uses cookies and similar technologies including:</strong></p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li><strong>Essential cookies:</strong> Required for authentication and core functionality</li>
                    <li><strong>Preference cookies:</strong> Store your settings and preferences</li>
                    <li><strong>Session cookies:</strong> Maintain your login state during your visit</li>
                    <li><strong>Local storage:</strong> Store authentication tokens and cached data</li>
                </ul>

                <p><strong>Managing Cookies:</strong> You can control and delete cookies through your browser settings. However,
                    disabling cookies may affect the functionality of the Service and prevent you from using certain features.
                </p>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>9. Changes to Privacy Policy</h2>
                <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
                    revision date. We encourage you to review this Privacy Policy periodically for any changes. Continued use of
                    the Service after changes constitutes acceptance of the updated policy.</p>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>10. International Data Transfers</h2>
                <p>Your information may be transferred to and processed in countries other than your country of residence. These
                    countries may have data protection laws that are different from the laws of your country. By using the Service,
                    you consent to the transfer of your information to these countries.</p>

                <div style={{
                    backgroundColor: "#f3e5f5",
                    padding: "15px",
                    borderRadius: "5px",
                    marginTop: "20px"
                }}>
                    <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>11. Contact Information</h2>
                    <p>If you have any questions about this Privacy Policy, our data practices, or need to exercise your privacy
                        rights, please contact us:</p>
                    <p>
                        <strong>Primary Contact:</strong><br />
                        Email: matthewlos@mahjelan.com<br />
                        Application: Algorythm - YouTube Trending Content Analysis<br />
                        Response Time: We will respond to all privacy-related inquiries within 30 days
                    </p>

                    <p><strong>For YouTube API or Google-related privacy concerns:</strong><br />
                        Please also refer to <a href="http://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>
                        {' '}and <a href="https://support.google.com/policies/contact/general_privacy_form" target="_blank" rel="noopener noreferrer">Google's Privacy Contact Form</a>.
                    </p>

                    <p><strong>Data Subject Rights:</strong><br />
                        If you wish to request access, correction, or deletion of your data, or have other privacy concerns,
                        contact us at the email address above with "Privacy Request" in the subject line.
                    </p>
                </div>

                <hr style={{ margin: "30px 0", border: "1px solid #ddd" }} />

                <div style={{
                    backgroundColor: "#e3f2fd",
                    padding: "15px",
                    borderLeft: "4px solid #1976d2",
                    margin: "20px 0"
                }}>
                    <h3>Summary of Key Points</h3>
                    <ul style={{ fontSize: "14px", paddingLeft: "20px" }}>
                        <li><strong>We use YouTube API Services</strong> - see <a href="http://www.google.com/policies/privacy"
                            target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
                        <li><strong>We store cookies and data on your device</strong> for functionality and performance</li>
                        <li><strong>Third parties (including YouTube/Google)</strong> may access information on your device</li>
                        <li><strong>You can control cookies</strong> through your browser settings</li>
                        <li><strong>Your use of YouTube content</strong> is subject to YouTube's terms and Google's privacy policy</li>
                        <li><strong>We do not permanently store your personal data</strong> on our servers</li>
                        <li><strong>You can revoke access</strong> at any time through your Google Account settings</li>
                    </ul>
                </div>

                <hr style={{ margin: "30px 0", border: "1px solid #ddd" }} />

                <p style={{ textAlign: "center", color: "#666", fontSize: "14px" }}>
                    This privacy policy was last updated on January 15, 2025<br />
                    Algorythm - YouTube Trending Content Analysis Tool<br />
                    © 2025 Algorythm. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Privacy;

