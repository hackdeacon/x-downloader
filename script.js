// ========================================
// DOM Elements
// ========================================
const urlInput = document.getElementById('twitterUrl');
const downloadBtn = document.getElementById('downloadBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const videoPreview = document.getElementById('videoPreview');
const previewVideo = document.getElementById('previewVideo');
const videoTitle = document.getElementById('videoTitle');
const videoAuthor = document.getElementById('videoAuthor');
const qualityButtons = document.getElementById('qualityButtons');

// ========================================
// State Management
// ========================================
let inputDebounceTimer = null;

// ========================================
// Event Listeners
// ========================================
downloadBtn.addEventListener('click', handleDownload);
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleDownload();
    }
});

// 使用防抖优化输入事件处理
urlInput.addEventListener('input', () => {
    clearTimeout(inputDebounceTimer);
    inputDebounceTimer = setTimeout(() => {
        hideError();
    }, 150);
});

// ========================================
// Main Functions
// ========================================

/**
 * Handle download button click
 */
async function handleDownload() {
    const url = urlInput.value.trim();

    // Validate URL
    if (!url) {
        showError('Please enter a Twitter video URL');
        return;
    }

    if (!isValidTwitterUrl(url)) {
        showError('Please enter a valid Twitter video URL');
        return;
    }

    // Show loading state
    showLoading();
    hideError();
    hideVideoPreview();

    try {
        // Fetch video data
        const videoData = await fetchVideoData(url);

        if (!videoData) {
            throw new Error('Unable to fetch video information');
        }

        // Display video preview
        displayVideoPreview(videoData);

        hideLoading();
    } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to fetch video, please check the URL');
        console.error('Error:', error);
    }
}

/**
 * Validate Twitter URL
 */
function isValidTwitterUrl(url) {
    const twitterPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
    return twitterPattern.test(url);
}

/**
 * Fetch video data from backend API
 */
async function fetchVideoData(url) {
    const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
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
    // Rough estimate: bitrate * 10 seconds / 8 bits per byte
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
    // Set video source through proxy (use highest quality for preview)
    const videoUrl = videoData.qualities[0].url;
    const proxyUrl = `/api/download?url=${encodeURIComponent(videoUrl)}`;
    previewVideo.src = proxyUrl;

    // Set video metadata
    videoTitle.textContent = videoData.title;
    videoAuthor.textContent = videoData.author;

    // Generate quality buttons (使用 DocumentFragment 减少重排)
    const fragment = document.createDocumentFragment();
    videoData.qualities.forEach((quality, index) => {
        const button = createQualityButton(quality);
        // Add staggered animation delay
        button.style.animation = `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s both`;
        fragment.appendChild(button);
    });
    qualityButtons.innerHTML = '';
    qualityButtons.appendChild(fragment);

    // Show preview section with smooth animation
    videoPreview.classList.remove('hidden');
    videoPreview.style.opacity = '0';
    videoPreview.style.transform = 'translateY(20px)';

    requestAnimationFrame(() => {
        videoPreview.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        videoPreview.style.opacity = '1';
        videoPreview.style.transform = 'translateY(0)';
    });

    // Scroll to preview smoothly
    setTimeout(() => {
        videoPreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 200);
}

/**
 * Create quality button
 */
function createQualityButton(quality) {
    const button = document.createElement('button');
    button.className = 'quality-btn';
    button.textContent = quality.quality;

    button.addEventListener('click', () => {
        downloadVideo(quality.url, quality.quality);
    });

    return button;
}

/**
 * Download video through backend proxy
 */
function downloadVideo(url, quality) {
    showSuccessToast(`Preparing ${quality} download...`);

    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}`;
    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = `twitter-video-${quality}-${Date.now()}.mp4`;
    a.target = '_blank';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
        showSuccessToast(`${quality} download started`);
    }, 500);
}

/**
 * Show success toast
 */
function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    // 使用 setTimeout 0 代替 requestAnimationFrame，减少复杂度
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Fade out and remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 2500);
}

// ========================================
// UI Helper Functions
// ========================================

/**
 * Show loading spinner
 */
function showLoading() {
    loadingSpinner.classList.remove('hidden');
    downloadBtn.disabled = true;

    // 合并样式操作以减少重排
    requestAnimationFrame(() => {
        loadingSpinner.style.cssText = 'opacity: 1; transform: scale(1); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);';
        downloadBtn.style.cssText = 'opacity: 0.6; cursor: not-allowed;';
    });
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    loadingSpinner.style.cssText = 'opacity: 0; transform: scale(0.9); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);';
    downloadBtn.style.cssText = 'opacity: 1; cursor: pointer;';
    downloadBtn.disabled = false;

    setTimeout(() => {
        loadingSpinner.classList.add('hidden');
        loadingSpinner.style.cssText = '';
    }, 300);
}

/**
 * Show error message
 */
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

/**
 * Hide error message
 */
function hideError() {
    errorMessage.classList.add('hidden');
}

/**
 * Hide video preview
 */
function hideVideoPreview() {
    videoPreview.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    videoPreview.style.opacity = '0';
    videoPreview.style.transform = 'translateY(20px)';
    setTimeout(() => {
        videoPreview.classList.add('hidden');
        videoPreview.style.opacity = '';
        videoPreview.style.transform = '';
        videoPreview.style.transition = '';
    }, 400);
}

// ========================================
// Theme Management
// ========================================

/**
 * Initialize theme based on system preference
 */
function initializeTheme() {
    // Get system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');

    // Listen for system theme changes and update in real-time
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        setTheme(e.matches ? 'dark' : 'light');
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// ========================================
// Initialize
// ========================================

/**
 * Enable animations after initial page load
 * This prevents the initial render from triggering transitions
 */
function enableAnimations() {
    document.body.classList.remove('no-animations');
    document.body.classList.add('animations-enabled');

    // 简化动画触发，避免过多的 DOM 查询
    const logo = document.querySelector('.logo');
    const inputSection = document.querySelector('.input-section');

    if (logo) {
        logo.style.animation = 'slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    if (inputSection) {
        inputSection.style.animation = 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }
}

// Initialize theme
initializeTheme();

// Enable animations after DOM is ready (简化逻辑)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableAnimations);
} else {
    enableAnimations();
}

console.log('Twitter Demo initialized');
