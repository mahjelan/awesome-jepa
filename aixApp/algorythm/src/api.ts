const apiRequest = async (endpoint: string, method: string, body: any, customHeaders?: any) => {
    const headers: any = {
        'Content-Type': 'application/json',
        ...customHeaders,
    };

    const fetchOptions: RequestInit = {
        method,
        headers,
    };

    // Only add body for non-GET/HEAD requests and when body is not null
    if (body !== null && method !== 'GET' && method !== 'HEAD') {
        fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, fetchOptions);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        
        // Check for quota exceeded errors
        const isQuotaExceeded = response.status === 403 && (
            errorMessage.toLowerCase().includes('quota') ||
            errorMessage.toLowerCase().includes('quotaexceeded') ||
            errorMessage.toLowerCase().includes('quota exceeded') ||
            errorMessage.toLowerCase().includes('queries per day')
        );
        
        if (isQuotaExceeded) {
            console.error("YouTube quota exceeded error detected:", errorMessage);
            throw new Error("YouTube quota exceeded - please come back tomorrow!");
        }
        
        throw new Error(
            `API request failed: ${response.status} - ${errorMessage}`
        );
    }

    return response.json();
};

export default apiRequest;
