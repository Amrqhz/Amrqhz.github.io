/**
 * Fertility AId - Theme Toggle and Interactive Features
 * ====================================================
 */

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
    const html = document.documentElement;
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    const themeText = document.querySelector('.theme-text');
    
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Apply new theme
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button text and icon
    updateThemeToggleButton(newTheme, themeIcon, themeText);
}

let currentSlideIndex = 0;
const totalSlides = 4;

function showSlide(index) {
    const sliderWrapper = document.getElementById('sliderWrapper');
    const dots = document.querySelectorAll('.dot');
    
    // Ensure index is within bounds
    if (index >= totalSlides) currentSlideIndex = 0;
    else if (index < 0) currentSlideIndex = totalSlides - 1;
    else currentSlideIndex = index;
    
    // Move slider
    const translateX = -currentSlideIndex * 100;
    sliderWrapper.style.transform = `translateX(${translateX}%)`;
    
    // Update dots
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlideIndex);
    });
}

function changeSlide(direction) {
    showSlide(currentSlideIndex + direction);
}

function currentSlide(index) {
    showSlide(index - 1);
}

// Auto-slide functionality (optional)
function autoSlide() {
    changeSlide(1);
}

// Uncomment the line below if you want auto-sliding every 5 seconds
// setInterval(autoSlide, 5000);

// Touch/swipe support for mobile
let startX = 0;
let endX = 0;

document.getElementById('sliderWrapper').addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
});

document.getElementById('sliderWrapper').addEventListener('touchend', (e) => {
    endX = e.changedTouches[0].clientX;
    handleSwipe();
});

function handleSwipe() {
    const threshold = 50;
    const diff = startX - endX;
    
    if (Math.abs(diff) > threshold) {
        if (diff > 0) {
            changeSlide(1); // Swipe left - next slide
        } else {
            changeSlide(-1); // Swipe right - previous slide
        }
    }
}

/**
 * Update theme toggle button appearance
 * @param {string} theme - Current theme ('light' or 'dark')
 * @param {Element} themeIcon - Theme icon element
 * @param {Element} themeText - Theme text element
 */
function updateThemeToggleButton(theme, themeIcon, themeText) {
    const currentLang = getCurrentLanguage();
    
    if (theme === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = currentLang === 'fa' ? 'حالت روشن' : 'Light Mode';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = currentLang === 'fa' ? 'حالت تاریک' : 'Dark Mode';
    }
}

/**
 * Load saved theme preference or default to light theme
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const html = document.documentElement;
    const themeIcon = document.querySelector('.theme-icon');
    const themeText = document.querySelector('.theme-text');
    
    // Apply saved theme
    html.setAttribute('data-theme', savedTheme);
    
    // Update button appearance
    updateThemeToggleButton(savedTheme, themeIcon, themeText);
}

/**
 * Toggle between English and Persian languages
 */
function toggleLanguage() {
    const html = document.documentElement;
    const languageToggle = document.querySelector('.language-toggle');
    const languageFlag = document.querySelector('.language-flag');
    const languageText = document.querySelector('.language-text');
    
    const currentLang = html.getAttribute('data-lang') || 'en';
    const newLang = currentLang === 'en' ? 'fa' : 'en';
    
    // Apply new language
    html.setAttribute('data-lang', newLang);
    localStorage.setItem('language', newLang);
    
    // Update button appearance
    updateLanguageToggleButton(newLang, languageFlag, languageText);
    
    // Update all translatable content
    updatePageContent(newLang);
    
    // Update theme button text based on new language
    const currentTheme = getCurrentTheme();
    const themeIcon = document.querySelector('.theme-icon');
    const themeText = document.querySelector('.theme-text');
    updateThemeToggleButton(currentTheme, themeIcon, themeText);
}

/**
 * Update language toggle button appearance
 * @param {string} lang - Current language ('en' or 'fa')
 * @param {Element} languageFlag - Language flag element
 * @param {Element} languageText - Language text element
 */
function updateLanguageToggleButton(lang, languageFlag, languageText) {
    if (lang === 'fa') {
        languageFlag.textContent = '🇺🇸';
        languageText.textContent = 'English';
    } else {
        languageFlag.textContent = '🇮🇷';
        languageText.textContent = 'فارسی';
    }
}

/**
 * Load saved language preference or default to English
 */
function loadLanguage() {
    const savedLanguage = localStorage.getItem('language') || 'en';
    const html = document.documentElement;
    const languageFlag = document.querySelector('.language-flag');
    const languageText = document.querySelector('.language-text');
    
    // Apply saved language
    html.setAttribute('data-lang', savedLanguage);
    
    // Update button appearance
    updateLanguageToggleButton(savedLanguage, languageFlag, languageText);
    
    // Update all content
    updatePageContent(savedLanguage);
}

/**
 * Translation dictionary
 */
const translations = {
    en: {
        title: 'Fertility AId',
        contact: 'Contact',
        backToTop: 'Back to top',
        email: 'Email',
        subscribe: 'Subscribe',
        privacyPolicy: 'Our privacy policy',
        ethicsStandards: 'Ethics & standards',
        copyright: 'Fertility AId ©2025',
        designedBy: 'Designed by amrqhz',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode'
    },
    fa: {
        title: 'بــــاروریــــار',
        contact: 'تماس',
        backToTop: 'بازگشت به بالا',
        email: 'ایمیل',
        subscribe: 'اشتراک',
        privacyPolicy: 'سیاست حفظ حریم خصوصی ما',
        ethicsStandards: 'اخلاق و استانداردها',
        copyright: 'باروریار ©۲۰۲۵',
        designedBy: 'طراحی شده توسط amrqhz',
        darkMode: 'حالت تاریک',
        lightMode: 'حالت روشن'
    }
};

/**
 * Update page content based on selected language
 * @param {string} lang - Language code ('en' or 'fa')
 */
function updatePageContent(lang) {
    const t = translations[lang];
    
    // Update title
    const titleElement = document.querySelector('.article-header__head-title');
    if (titleElement) {
        titleElement.textContent = t.title;
    }
    
    // Update page title
    document.title = t.title;
    
    // Update footer contact title
    const contactTitle = document.querySelector('.site-footer__title-text');
    if (contactTitle) {
        contactTitle.textContent = t.contact;
    }
    
    // Update back to top button
    const backToTopButton = document.querySelector('.site-footer__title-back span:last-child');
    if (backToTopButton) {
        backToTopButton.textContent = t.backToTop;
    }
    
    // Update footer links titles
    const linksTitles = document.querySelectorAll('.site-footer__links-title');
    linksTitles.forEach((title, index) => {
        if (index === 0) {
            title.textContent = t.email;
        } else if (index === 1) {
            title.textContent = t.subscribe;
        }
    });
    
    // Update footer navigation links
    const navLinks = document.querySelectorAll('.site-footer__nav a');
    navLinks.forEach((link, index) => {
        if (index === 0) {
            link.textContent = t.privacyPolicy;
        } else if (index === 1) {
            link.textContent = t.ethicsStandards;
        }
    });
    
    // Update copyright
    const copyright = document.querySelector('.site-footer__baseline-copyright');
    if (copyright) {
        copyright.textContent = t.copyright;
    }
    
    // Update "Designed by" text
    const designedBy = document.querySelector('.site-footer__baseline a');
    if (designedBy) {
        designedBy.textContent = t.designedBy;
    }
}

/**
 * Setup email copy functionality
 */
function setupEmailCopy() {
    const emailElement = document.querySelector('.copyable-email');
    
    if (!emailElement) return;
    
    emailElement.addEventListener('click', function() {
        const email = this.getAttribute('data-email');
        
        // Try to copy email to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(email).then(
                function() {
                    showCopyFeedback(emailElement);
                },
                function(err) {
                    console.error('Failed to copy email: ', err);
                    fallbackCopyText(email);
                }
            );
        } else {
            // Fallback for older browsers
            fallbackCopyText(email);
        }
    });
}

/**
 * Show visual feedback when email is copied
 * @param {Element} emailElement - Email element that was clicked
 */
function showCopyFeedback(emailElement) {
    const originalText = emailElement.textContent;
    const originalColor = emailElement.style.color;
    const currentLang = getCurrentLanguage();
    
    // Show "Copied!" feedback in appropriate language
    const copiedText = currentLang === 'fa' ? 'کپی شد!' : 'Copied!';
    emailElement.textContent = copiedText;
    emailElement.style.opacity = '0.6';
    
    // Reset after 1 second
    setTimeout(function() {
        emailElement.textContent = originalText;
        emailElement.style.opacity = '';
        emailElement.style.color = originalColor;
    }, 1000);
}

/**
 * Fallback copy method for older browsers
 * @param {string} text - Text to copy
 */
function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        const emailElement = document.querySelector('.copyable-email');
        showCopyFeedback(emailElement);
    } catch (err) {
        console.error('Fallback copy failed: ', err);
    }
    
    document.body.removeChild(textArea);
}

/**
 * Smooth scroll to top of page
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Setup system theme detection (optional enhancement)
 */
function setupSystemThemeDetection() {
    // Check if user prefers dark mode by default
    if (!localStorage.getItem('theme')) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            localStorage.setItem('theme', 'dark');
        }
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        // Only auto-switch if user hasn't manually set a preference
        if (!localStorage.getItem('theme-manually-set')) {
            const newTheme = e.matches ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            loadTheme();
        }
    });
}

/**
 * Mark theme as manually set when user toggles
 */
function markThemeAsManuallySet() {
    localStorage.setItem('theme-manually-set', 'true');
}

/**
 * Initialize all functionality when DOM is loaded
 */
function init() {
    // Setup system theme detection first
    setupSystemThemeDetection();
    
    // Load saved language first (affects theme button text)
    loadLanguage();
    
    // Load saved theme
    loadTheme();
    
    // Setup interactive features
    setupEmailCopy();
    
    // Add manual theme setting flag to toggle function
    const originalToggleTheme = window.toggleTheme;
    window.toggleTheme = function() {
        markThemeAsManuallySet();
        originalToggleTheme();
    };
    
    console.log('Fertility AId: All systems initialized');
}

/**
 * Additional utility functions
 */

/**
 * Get current theme
 * @returns {string} Current theme ('light' or 'dark')
 */
function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}

/**
 * Get current language
 * @returns {string} Current language ('en' or 'fa')
 */
function getCurrentLanguage() {
    return document.documentElement.getAttribute('data-lang') || 'en';
}

/**
 * Set theme programmatically
 * @param {string} theme - Theme to set ('light' or 'dark')
 */
function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
        console.error('Invalid theme. Use "light" or "dark"');
        return;
    }
    
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeIcon = document.querySelector('.theme-icon');
    const themeText = document.querySelector('.theme-text');
    
    if (themeIcon && themeText) {
        updateThemeToggleButton(theme, themeIcon, themeText);
    }
}

/**
 * Set language programmatically
 * @param {string} lang - Language to set ('en' or 'fa')
 */
function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'fa') {
        console.error('Invalid language. Use "en" or "fa"');
        return;
    }
    
    document.documentElement.setAttribute('data-lang', lang);
    localStorage.setItem('language', lang);
    
    const languageFlag = document.querySelector('.language-flag');
    const languageText = document.querySelector('.language-text');
    
    if (languageFlag && languageText) {
        updateLanguageToggleButton(lang, languageFlag, languageText);
    }
    
    updatePageContent(lang);
    
    // Update theme button text for new language
    const currentTheme = getCurrentTheme();
    const themeIcon = document.querySelector('.theme-icon');
    const themeText = document.querySelector('.theme-text');
    updateThemeToggleButton(currentTheme, themeIcon, themeText);
}

/**
 * Reset theme to system preference
 */
function resetToSystemTheme() {
    localStorage.removeItem('theme');
    localStorage.removeItem('theme-manually-set');
    setupSystemThemeDetection();
    loadTheme();
}

/**
 * Reset language to English
 */
function resetLanguage() {
    localStorage.removeItem('language');
    loadLanguage();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Make functions available globally
window.toggleTheme = toggleTheme;
window.toggleLanguage = toggleLanguage;
window.scrollToTop = scrollToTop;

// Export functions for potential external use
window.FertilityAId = {
    getCurrentTheme,
    getCurrentLanguage,
    setTheme,
    setLanguage,
    resetToSystemTheme,
    resetLanguage,
    toggleTheme,
    toggleLanguage
};

// Image slideshow functionality
document.addEventListener('DOMContentLoaded', function() {
    // Set up image rotation for all tiles
    const tiles = document.querySelectorAll('.tile');
    
    tiles.forEach(tile => {
        const slides = tile.querySelectorAll('.slide');
        let currentSlide = 0;
        
        // Initial setup - first slide should be active
        slides[0].classList.add('active');
        
        // Change slide every 5 seconds
        setInterval(() => {
            // Remove active class from current slide
            slides[currentSlide].classList.remove('active');
            
            // Move to next slide or back to first slide
            currentSlide = (currentSlide + 1) % slides.length;
            
            // Add active class to new current slide
            slides[currentSlide].classList.add('active');
        }, 5000);
    });
});
