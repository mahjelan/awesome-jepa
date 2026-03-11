declare const google: any;

import './App.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Define the response type
interface GoogleAuthResponse {
    error?: string; // Optional error property
    // Add other properties as needed based on the API response
}

const Auth: React.FC = () => {
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        const currentOrigin = window.location.origin;
        const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

        // Polling for the Google API to load
        const checkGoogleApi = setInterval(() => {
            console.log("Checking if Google API is loaded...");
            if (typeof google !== 'undefined') {
                clearInterval(checkGoogleApi);
                initGoogleApi();
            } else {
                console.log("Waiting for Google API to load...");
            }
        }, 100); // Check every 100ms

        const initGoogleApi = () => {
            console.log("Initializing Google API...");
            console.log("OAuth origin:", window.location.origin);
            console.log("Using GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);
            if (!GOOGLE_CLIENT_ID) {
                displayError('Missing GOOGLE_CLIENT_ID. Define it in your environment (e.g. .env).');
                return;
            }
            const client = google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/youtube.readonly',
                callback: (resp: GoogleAuthResponse) => {
                    if (resp.error) {
                        // Handle specific OAuth errors for public users
                        if (resp.error === 'access_denied') {
                            displayError('Access denied. Please approve the permissions to continue.');
                        } else if (resp.error === 'popup_blocked_by_browser') {
                            displayError('Popup blocked. Please allow popups for this site and try again.');
                        } else if (resp.error === 'org_internal') {
                            displayError('This app is currently in testing mode. Please contact the developer for access, or the developer needs to publish the app in Google Cloud Console.');
                        } else {
                            displayError(`Authentication failed: ${resp.error}`);
                        }
                        return;
                    }
                    console.log("🎉 Auth successful, token received");
                    localStorage.setItem('youtubeAuthToken', JSON.stringify(resp)); // Store token
                    navigate('/new'); // Redirect to the NewPage component
                },
                error_callback: (error: any) => {
                    console.error('OAuth error:', error);
                    displayError('Authentication error occurred. Please try again.');
                }
            });

            setTokenClient(client); // Set the token client
        };

        return () => clearInterval(checkGoogleApi); // Cleanup interval on unmount
    }, [navigate]);

    const authenticate = () => {
        console.log("Requesting new token with consent");
        setErrorMessage(''); // Hide any previous error messages
        if (tokenClient) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            displayError("Token client is not initialized. Please refresh the page.");
        }
    };

    const displayError = (message: string) => {
        setErrorMessage(message);
    };

    return (
        <><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <div id="auth-container" style={{ textAlign: 'center' }}>
                <header style={{
                    padding: "20px 0",
                    marginBottom: "30px",
                    textAlign: "center"
                }}>
                    <h1 style={{
                        fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
                        fontSize: "42px",
                        fontWeight: "600",
                        color: "#333",
                        margin: "0",
                        letterSpacing: "-0.5px",
                        background: "linear-gradient(90deg, #774caf 0%, #4a90e2 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}>
                        Algorythms
                    </h1>
                    <p style={{
                        fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
                        fontSize: "16px",
                        color: "#666",
                        margin: "10px 0 0 0"
                    }}>
                    </p>
                </header>

                <h2>Please log in to continue</h2>
                <div style={{
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    padding: '15px',
                    margin: '20px 0',
                    fontSize: '14px',
                    color: '#856404'
                }}>
                    <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                        ⚠️ App Currently in Testing Mode
                    </p>
                    <p style={{ margin: '0 0 10px 0' }}>
                        If you see "Access blocked" or "verification not completed":
                    </p>
                    <ul style={{ margin: '0', paddingLeft: '20px' }}>
                        <li>Contact the developer to add you as a test user, OR</li>
                        <li>The developer needs to publish the app in Google Cloud Console</li>
                    </ul>
                </div>
                <button id="auth-button" style={{ backgroundColor: '#4285F4', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', transition: 'background-color 0.3s' }} onClick={authenticate}>
                    Login with Google
                </button>
                {errorMessage && <div id="error-message" style={{ color: '#f44336', marginTop: '10px' }}>{errorMessage}</div>} {/* Error message container */}
            </div>
        </div><a href="https://algorythms.ca/privacy-policy.html" target="_blank" rel="noopener noreferrer" style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#4285F4',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
            textDecoration: 'none'
        }}>
                Privacy Policy
            </a></>
    );
};

export function App() {
    return (
        <>
            <Auth />
        </>
    );
}

export default Auth;