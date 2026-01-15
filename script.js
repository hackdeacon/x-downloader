// ========================================
// DOM Elements
// ========================================
const elements = {
    urlInput: document.getElementById('twitterUrl'),
    downloadBtn: document.getElementById('downloadBtn'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    videoPreview: document.getElementById('videoPreview'),
    previewVideo: document.getElementById('previewVideo'),
    videoTitle: document.getElementById('videoTitle'),
    videoAuthor: document.getElementById('videoAuthor'),
    qualityButtons: document.getElementById('qualityButtons')
};

// ========================================
// Constants
// ========================================
const TWITTER_URL_PATTERN = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
const ANIMATION_TIMING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const DEBOUNCE_DELAY = 150;

// ========================================
// State
// ========================================
let debounceTimer = null;

// ========================================
// Event Listeners
// ========================================
elements.downloadBtn.addEventListener('click', handleDownload);
elements.urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleDownload();
});
elements.urlInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(hideError, DEBOUNCE_DELAY);
});

// ========================================
// Main Functions
// ========================================

/**
 * Handle download button click
 */
async function handleDownload() {
    const url = elements.urlInput.value.trim();

    if (!url) {
        showError('Please enter a Twitter video URL');
        return;
    }

    if (!TWITTER_URL_PATTERN.test(url)) {
        showError('Please enter a valid Twitter video URL');
        return;
    }

    showLoading();
    hideError();
    hideVideoPreview();

    try {
        const videoData = await fetchVideoData(url);
        if (!videoData) {
            throw new Error('Unable to fetch video information');
        }
        displayVideoPreview(videoData);
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to fetch video, please check the URL');
        console.error('Error:', error);
    }
}

/**
 * Fetch video data from backend API
 */
async function fetchVideoData(url) {
    const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ url })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch video');
    }

    const result = await response.json();
    if (!result.success || !result.data) {
        throw new Error('Invalid response from server');
    }

    const data = result.data;
    return {
        title: data.title || 'Twitter Video',
        author: data.author || '@TwitterUser',
        authorName: data.authorName || '',
        duration: data.duration || '0:00',
        thumbnail: data.thumbnail || '',
        qualities: data.qualities.map(q => ({
            quality: q.quality,
            size: formatFileSize(q.bitrate),
            url: q.url,
            bitrate: q.bitrate
        }))
    };
}

/**
 * Format bitrate to file size estimate
 */
function formatFileSize(bitrate) {
    if (!bitrate) return 'Unknown';
    const bytes = (bitrate * 10) / 8;
    if (bytes >= 1000000) {
        return `~${(bytes / 1000000).toFixed(1)} MB/10s`;
    }
    return `~${(bytes / 1000).toFixed(0)} KB/10s`;
}

/**
 * Display video preview
 */
function displayVideoPreview(videoData) {
    const videoUrl = videoData.qualities[0].url;
    elements.previewVideo.src = `/api/download?url=${encodeURIComponent(videoUrl)}`;
    elements.videoTitle.textContent = videoData.title;
    elements.videoAuthor.textContent = videoData.author;

    const fragment = document.createDocumentFragment();
    videoData.qualities.forEach((quality, index) => {
        const button = createQualityButton(quality);
        button.style.animation = `fadeInUp 0.4s ${ANIMATION_TIMING} ${index * 0.05}s both`;
        fragment.appendChild(button);
    });
    elements.qualityButtons.innerHTML = '';
    elements.qualityButtons.appendChild(fragment);

    elements.videoPreview.classList.remove('hidden');
    elements.videoPreview.style.opacity = '0';
    elements.videoPreview.style.transform = 'translateY(20px)';

    requestAnimationFrame(() => {
        elements.videoPreview.style.transition = `all 0.5s ${ANIMATION_TIMING}`;
        elements.videoPreview.style.opacity = '1';
        elements.videoPreview.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        elements.videoPreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 200);
}

/**
 * Create quality button
 */
function createQualityButton(quality) {
    const button = document.createElement('button');
    button.className = 'quality-btn';
    button.textContent = quality.quality;
    button.addEventListener('click', () => downloadVideo(quality.url, quality.quality));
    return button;
}

/**
 * Download video through backend proxy
 */
function downloadVideo(url, quality) {
    showSuccessToast(`Preparing ${quality} download...`);

    const a = document.createElement('a');
    a.href = `/api/download?url=${encodeURIComponent(url)}`;
    a.download = `twitter-video-${quality}-${Date.now()}.mp4`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => showSuccessToast(`${quality} download started`), 500);
}

/**
 * Show success toast
 */
function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}

// ========================================
// UI Helper Functions
// ========================================

function showLoading() {
    elements.loadingSpinner.classList.remove('hidden');
    elements.downloadBtn.disabled = true;
    requestAnimationFrame(() => {
        elements.loadingSpinner.style.cssText = `opacity: 1; transform: scale(1); transition: all 0.3s ${ANIMATION_TIMING};`;
        elements.downloadBtn.style.cssText = 'opacity: 0.6; cursor: not-allowed;';
    });
}

function hideLoading() {
    elements.loadingSpinner.style.cssText = `opacity: 0; transform: scale(0.9); transition: all 0.3s ${ANIMATION_TIMING};`;
    elements.downloadBtn.style.cssText = 'opacity: 1; cursor: pointer;';
    elements.downloadBtn.disabled = false;
    setTimeout(() => {
        elements.loadingSpinner.classList.add('hidden');
        elements.loadingSpinner.style.cssText = '';
    }, 300);
}

function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.classList.remove('hidden');
}

function hideError() {
    elements.errorMessage.classList.add('hidden');
}

function hideVideoPreview() {
    elements.videoPreview.style.transition = `all 0.4s ${ANIMATION_TIMING}`;
    elements.videoPreview.style.opacity = '0';
    elements.videoPreview.style.transform = 'translateY(20px)';
    setTimeout(() => {
        elements.videoPreview.classList.add('hidden');
        elements.videoPreview.style.cssText = '';
    }, 400);
}

// ========================================
// Theme Management
// ========================================

const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

function initializeTheme() {
    setTheme(darkModeQuery.matches ? 'dark' : 'light');
    darkModeQuery.addEventListener('change', (e) => setTheme(e.matches ? 'dark' : 'light'));
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// ========================================
// Initialize
// ========================================

function enableAnimations() {
    document.body.classList.remove('no-animations');
    document.body.classList.add('animations-enabled');

    const logo = document.querySelector('.logo');
    const inputSection = document.querySelector('.input-section');

    if (logo) logo.style.animation = `slideDown 0.6s ${ANIMATION_TIMING}`;
    if (inputSection) inputSection.style.animation = `fadeInUp 0.5s ${ANIMATION_TIMING}`;
}

initializeTheme();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableAnimations);
} else {
    enableAnimations();
}
