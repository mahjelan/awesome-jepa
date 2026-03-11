import React, { useEffect } from 'react';

const Terms: React.FC = () => {
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
                    fontSize: window.innerWidth <= 768 ? "24px" : "32px"
                }}>
                    Terms of Service for Algorythm
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
                    <strong>Quick Summary:</strong> By using Algorythm, you agree to use the service responsibly, respect
                    YouTube's terms, and understand that we provide analysis tools for trending content. The service is provided
                    "as-is" for educational and research purposes.
                </div>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>1.</span> Acceptance of Terms
                </h2>

                <p>By accessing or using Algorythm ("the Service", "the App"), you agree to be bound by these Terms of Service
                    ("Terms"). If you do not agree to these Terms, please do not use the Service.</p>

                <p>These Terms constitute a legally binding agreement between you ("User", "you") and the operators of Algorythm
                    ("we", "us", "our").</p>

                <div style={{
                    backgroundColor: "#e3f2fd",
                    padding: "15px",
                    borderLeft: "4px solid #1976d2",
                    margin: "20px 0"
                }}>
                    <strong>YouTube Terms of Service Agreement:</strong> By using Algorythm, you are agreeing to be bound by the{' '}
                    <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube Terms of Service</a>.
                    This application uses YouTube API Services and your use of YouTube content through our service
                    is subject to YouTube's terms and policies. You acknowledge that you have read and agree to comply with
                    all applicable YouTube terms and conditions.
                </div>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>2.</span> Description of Service
                </h2>

                <p>Algorythm is a web application that provides:</p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li>Analysis of YouTube trending videos and content</li>
                    <li>AI-powered content summaries and insights</li>
                    <li>Search and discovery tools for trending reels</li>
                    <li>Content categorization and clustering</li>
                    <li>Data visualization of YouTube trends</li>
                </ul>

                <div style={{
                    backgroundColor: "#fff3cd",
                    padding: "15px",
                    borderLeft: "4px solid #ffc107",
                    margin: "20px 0",
                    borderRadius: "5px"
                }}>
                    <strong>Educational Purpose:</strong> This service is designed for educational, research, and analytical
                    purposes. It is not intended for commercial content creation or competitive analysis.
                </div>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>3.</span> Use of YouTube API Services
                </h2>
                <p>This Service integrates with YouTube API Services to provide video content. You acknowledge that:</p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li>All video content is sourced from YouTube and is subject to YouTube's terms and conditions</li>
                    <li>You must comply with YouTube's policies regarding content usage and distribution</li>
                    <li>YouTube may revoke access to content at any time</li>
                    <li>This Service does not own or control the video content displayed</li>
                    <li>Your interactions with YouTube videos are governed by YouTube's Terms of Service</li>
                </ul>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>4.</span> User Conduct
                </h2>
                <p><strong>You agree not to:</strong></p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
                    <li>Attempt to circumvent any security measures or access controls</li>
                    <li>Interfere with the proper functioning of the Service or disrupt other users' access</li>
                    <li>Violate any applicable laws, regulations, or third-party rights</li>
                    <li>Infringe upon the intellectual property rights of others, including YouTube content creators</li>
                    <li>Use automated systems (bots, scrapers) to access the Service without authorization</li>
                    <li>Reverse engineer, decompile, or attempt to extract the source code</li>
                    <li>Misrepresent your identity or affiliation with any person or entity</li>
                </ul>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>5.</span> User Accounts and Authentication
                </h2>
                <p>To access certain features, you may need to authenticate using Google OAuth. By doing so:</p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li>You authorize us to access your YouTube data as specified in our Privacy Policy</li>
                    <li>You are responsible for maintaining the security of your Google Account</li>
                    <li>You agree to notify us immediately of any unauthorized access</li>
                    <li>You can revoke access at any time through your Google Account settings</li>
                </ul>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>6.</span> Intellectual Property Rights
                </h2>

                <h3>6.1 Our Intellectual Property</h3>
                <p>The Service, including its original content (excluding YouTube content), features, and functionality, is owned
                    by us and is protected by international copyright, trademark, patent, trade secret, and other intellectual
                    property laws.</p>

                <h3>6.2 YouTube Content</h3>
                <p>All YouTube video content, thumbnails, titles, descriptions, and metadata remain the property of their
                    respective copyright holders. We do not claim any ownership rights to YouTube content displayed through the
                    Service.</p>

                <h3>6.3 User-Generated Content</h3>
                <p>Any search queries, preferences, or analysis you generate through the Service remain your property. However, we
                    may use aggregated, anonymized data for improving the Service.</p>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>7.</span> Disclaimer of Warranties
                </h2>
                <div style={{
                    backgroundColor: "#fff3cd",
                    padding: "15px",
                    borderLeft: "4px solid #ffc107",
                    margin: "20px 0",
                    borderRadius: "5px"
                }}>
                    <strong>Important:</strong> THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
                    IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                    OR NON-INFRINGEMENT.
                </div>
                <p>We do not warrant that:</p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li>The Service will be uninterrupted, secure, or error-free</li>
                    <li>The results obtained from the Service will be accurate or reliable</li>
                    <li>The quality of any products, services, information, or other material obtained through the Service will
                        meet your expectations</li>
                    <li>Any errors in the Service will be corrected</li>
                </ul>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>8.</span> Limitation of Liability
                </h2>
                <div style={{
                    backgroundColor: "#fff3cd",
                    padding: "15px",
                    borderLeft: "4px solid #ffc107",
                    margin: "20px 0",
                    borderRadius: "5px"
                }}>
                    <strong>Liability Cap:</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY
                    INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF
                    PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                </div>
                <ul style={{ paddingLeft: "20px" }}>
                    <li>Your access to or use of (or inability to access or use) the Service</li>
                    <li>Any conduct or content of any third party on the Service</li>
                    <li>Any content obtained from the Service</li>
                    <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                </ul>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>9.</span> Indemnification
                </h2>
                <p>You agree to defend, indemnify, and hold harmless Algorythm, its operators, affiliates, and partners from and
                    against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees and costs,
                    arising out of or in any way connected with:</p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li>Your access to or use of the Service</li>
                    <li>Your violation of these Terms</li>
                    <li>Your violation of any third-party right, including any intellectual property right</li>
                    <li>Your violation of any applicable law or regulation</li>
                </ul>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>10.</span> Changes to Terms
                </h2>
                <p>We reserve the right to modify or replace these Terms of Service at any time at our sole discretion. If a
                    revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.</p>
                <p>What constitutes a material change will be determined at our sole discretion. By continuing to access or use the
                    Service after those revisions become effective, you agree to be bound by the revised terms.</p>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>11.</span> Termination
                </h2>
                <p>We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any
                    reason whatsoever, including without limitation if you breach these Terms.</p>
                <p>Upon termination:</p>
                <ul style={{ paddingLeft: "20px" }}>
                    <li>Your right to use the Service will immediately cease</li>
                    <li>You must cease all use of the Service</li>
                    <li>Any provisions of these Terms which by their nature should survive termination shall survive</li>
                </ul>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>12.</span> Governing Law
                </h2>
                <p>These Terms shall be governed and construed in accordance with applicable laws, without regard to its conflict
                    of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver
                    of those rights.</p>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>13.</span> Dispute Resolution
                </h2>
                <p>If you have any concerns or disputes about the Service, you agree to first try to resolve the dispute informally
                    by contacting us. We will attempt to resolve disputes through good-faith negotiations.</p>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>14.</span> Severability
                </h2>
                <p>If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and
                    interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law,
                    and the remaining provisions will continue in full force and effect.</p>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>15.</span> Entire Agreement
                </h2>
                <p>These Terms, together with our Privacy Policy and any other legal notices published by us on the Service,
                    constitute the entire agreement between you and us concerning the Service and supersede all prior agreements and
                    understandings.</p>

                <h2 style={{ color: "#4a90e2", marginTop: "30px" }}>
                    <span style={{ color: "#774caf", fontWeight: "bold" }}>16.</span> Contact Information
                </h2>
                <div style={{
                    backgroundColor: "#f3e5f5",
                    padding: "15px",
                    borderRadius: "5px",
                    marginTop: "20px"
                }}>
                    <p>If you have any questions about these Terms of Service, need technical support, or have legal concerns,
                        please contact us:</p>
                    <p>
                        <strong>Primary Contact:</strong><br />
                        Email: matthewlosit@gmail.com<br />
                        Application: Algorythm - YouTube Trending Content Analysis<br />
                        Response Time: We will respond to all inquiries within 5 business days
                    </p>

                    <p><strong>For YouTube-related issues:</strong><br />
                        Please refer to <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube Terms of Service</a>
                        {' '}and <a href="https://support.google.com/youtube/" target="_blank" rel="noopener noreferrer">YouTube Support</a> for
                        platform-specific concerns.
                    </p>

                    <p><strong>Legal and Compliance:</strong><br />
                        For legal matters, terms violations, or compliance issues, contact us at the email address above
                        with "Legal Matter" in the subject line.
                    </p>
                </div>

                <hr style={{ margin: "30px 0", border: "1px solid #ddd" }} />

                <div style={{ textAlign: "center", color: "#666", fontSize: "14px" }}>
                    <p><strong>By using Algorythm, you acknowledge that you have read, understood, and agree to be bound by
                        these Terms of Service.</strong></p>
                    <p>© 2025 Algorythm. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Terms;

