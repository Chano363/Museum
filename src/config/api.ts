const isDevelopment = import.meta.env.DEV

function getBackendUrlFromQuery(): string {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('backend') || ''
}

const queryBackendUrl = !isDevelopment ? getBackendUrlFromQuery() : ''

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    queryBackendUrl ||
    (isDevelopment ? 'http://localhost:5000' : '')

export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 
    import.meta.env.VITE_API_BASE_URL || 
    queryBackendUrl ||
    (isDevelopment ? 'http://localhost:5000' : '')

console.log('API_BASE_URL:', API_BASE_URL)
console.log('WS_BASE_URL:', WS_BASE_URL)

if (!isDevelopment && !queryBackendUrl && !import.meta.env.VITE_API_BASE_URL) {
    console.warn('⚠️ No backend URL specified. Please add ?backend=https://your-backend-url to the URL.')
}