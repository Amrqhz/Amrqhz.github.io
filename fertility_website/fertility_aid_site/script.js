/**
 * Fertility AId - Complete JavaScript with Translation System
 * ==========================================================
 */

// Translation dictionary with proper structure
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
        lightMode: 'Light Mode',
        sectionTitle: "Learning Center",
        sectionSubtitle: "Evidence-based insights and expert guidance for your fertility journey",
        searchPlaceholder: "Search articles...",
        filterAll: "All",
        filterMenstrual: "Menstrual Health",
        filterNutrition: "Nutrition",
        filterPregnancy: "Pregnancy",
        filterHormones: "Hormones",
        article1Title: "Understanding Your Menstrual Cycle: A Complete Guide",
        article1Excerpt: "Learn about the four phases of your menstrual cycle and how hormonal changes affect your body, mood, and fertility throughout the month.",
        article1Category: "Menstrual Health",
        article1Author: "Dr. Rooshan Mirzaei",
        article1Tooltip: "Dr. Rooshan Mirzaei\nSpecialist in Gynecology\n15+ years experience",
        article1Date: "March 15, 2024",
        article1Reading: "8 min read",
        article2Title: "Essential Nutrients for Preconception Health",
        article2Excerpt: "Discover the key vitamins, minerals, and nutrients that support fertility and prepare your body for a healthy pregnancy.",
        article2Category: "Nutrition",
        article2Author: "Sarah Ahmad",
        article2Tooltip: "Sarah Ahmad\nRegistered Dietitian\nFertility Nutrition Specialist",
        article2Date: "March 12, 2024",
        article2Reading: "6 min read",
        article3Title: "Nutrition During First Trimester: What to Eat and Avoid",
        article3Excerpt: "A comprehensive guide to proper nutrition during early pregnancy, including safe foods, essential supplements, and foods to avoid.",
        article3Category: "Pregnancy",
        article3Author: "Dr. Lisa Kim",
        article3Tooltip: "Dr. Lisa Kim\nObstetrician & Gynecologist\nBoard Certified",
        article3Date: "March 10, 2024",
        article3Reading: "10 min read",
        article4Title: "Hormonal Balance and Fertility: Key Connections",
        article4Excerpt: "Understand how hormones like estrogen, progesterone, and insulin affect your fertility and learn natural ways to support hormonal balance.",
        article4Category: "Hormones",
        article4Author: "Dr. Michael Roberts",
        article4Tooltip: "Dr. Michael Roberts\nReproductive Endocrinologist\nFertility Specialist",
        article4Date: "March 8, 2024",
        article4Reading: "7 min read",
        article5Title: "Tracking Ovulation: Methods and Best Practices",
        article5Excerpt: "Learn various methods to track ovulation, from basal body temperature to ovulation predictor kits, and find what works best for you.",
        article5Category: "Menstrual Health",
        article5Author: "Dr. Emily Martinez",
        article5Tooltip: "Dr. Emily Martinez\nReproductive Health Specialist\nWomen's Health Expert",
        article5Date: "March 5, 2024",
        article5Reading: "9 min read",
        article6Title: "Mediterranean Diet for Fertility: Benefits and Guidelines",
        article6Excerpt: "Explore how the Mediterranean diet can boost fertility in both men and women, with practical meal planning tips and recipes.",
        article6Category: "Nutrition",
        article6Author: "Sarah Ahmad",
        article6Tooltip: "Sarah Ahmad\nRegistered Dietitian\nFertility Nutrition Specialist",
        article6Date: "March 3, 2024",
        article6Reading: "12 min read",
        disclaimerTitle: "Medical Disclaimer",
        disclaimerText: "The information provided in our learning center is for educational purposes only and should not replace professional medical advice. Always consult with your healthcare provider before making any decisions about your health or treatment."
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
        lightMode: 'حالت روشن',
        sectionTitle: "مرکز یادگیری",
        sectionSubtitle: "بینش‌های مبتنی بر شواهد و راهنمایی تخصصی برای سفر باروری شما",
        searchPlaceholder: "جستجوی مقالات...",
        filterAll: "همه",
        filterMenstrual: "سلامت قاعدگی",
        filterNutrition: "تغذیه",
        filterPregnancy: "بارداری",
        filterHormones: "هورمون‌ها",
        article1Title: "درک چرخه قاعدگی: راهنمای کامل",
        article1Excerpt: "درباره چهار مرحله چرخه قاعدگی و اینکه تغییرات هورمونی چگونه بر بدن، خلق‌وخو و باروری شما در طول ماه تأثیر می‌گذارد بیاموزید.",
        article1Category: "سلامت قاعدگی",
        article1Author: "دکتر روشان میرزایی",
        article1Tooltip: "دکتر روشان میرزایی\nمتخصص زنان و زایمان\nبیش از ۱۵ سال تجربه",
        article1Date: "۱۵ مارس ۲۰۲۴",
        article1Reading: "۸ دقیقه مطالعه",
        article2Title: "مواد مغذی ضروری برای سلامت پیش از بارداری",
        article2Excerpt: "ویتامین‌ها، مواد معدنی و عناصر کلیدی که از باروری حمایت کرده و بدن شما را برای بارداری سالم آماده می‌کنند، کشف کنید.",
        article2Category: "تغذیه",
        article2Author: "سارا احمد",
        article2Tooltip: "سارا احمد\nکارشناس تغذیه\nمتخصص تغذیه باروری",
        article2Date: "۱۲ مارس ۲۰۲۴",
        article2Reading: "۶ دقیقه مطالعه",
        article3Title: "تغذیه در سه ماهه اول بارداری: چه بخوریم و چه نخوریم",
        article3Excerpt: "راهنمای جامع تغذیه مناسب در اوایل بارداری، شامل غذاهای ایمن، مکمل‌های ضروری و مواد غذایی ممنوعه.",
        article3Category: "بارداری",
        article3Author: "دکتر لیسا کیم",
        article3Tooltip: "دکتر لیسا کیم\nمتخصص زنان و زایمان\nدارای بورد تخصصی",
        article3Date: "۱۰ مارس ۲۰۲۴",
        article3Reading: "۱۰ دقیقه مطالعه",
        article4Title: "تعادل هورمونی و باروری: ارتباطات کلیدی",
        article4Excerpt: "بیاموزید چگونه هورمون‌هایی مانند استروژن، پروژسترون و انسولین بر باروری تأثیر می‌گذارند و روش‌های طبیعی حمایت از تعادل هورمونی را بشناسید.",
        article4Category: "هورمون‌ها",
        article4Author: "دکتر مایکل رابرتز",
        article4Tooltip: "دکتر مایکل رابرتز\nمتخصص غدد تولیدمثل\nکارشناس باروری",
        article4Date: "۸ مارس ۲۰۲۴",
        article4Reading: "۷ دقیقه مطالعه",
        article5Title: "ردیابی تخمک‌گذاری: روش‌ها و بهترین شیوه‌ها",
        article5Excerpt: "روش‌های مختلف ردیابی تخمک‌گذاری، از دمای پایه بدن تا کیت‌های پیش‌بینی تخمک‌گذاری را بیاموزید و بهترین گزینه برای خود را پیدا کنید.",
        article5Category: "سلامت قاعدگی",
        article5Author: "دکتر امیلی مارتینز",
        article5Tooltip: "دکتر امیلی مارتینز\nمتخصص سلامت باروری\nکارشناس سلامت زنان",
        article5Date: "۵ مارس ۲۰۲۴",
        article5Reading: "۹ دقیقه مطالعه",
        article6Title: "رژیم مدیترانه‌ای برای باروری: مزایا و دستورالعمل‌ها",
        article6Excerpt: "کشف کنید که چگونه رژیم مدیترانه‌ای می‌تواند باروری در زنان و مردان را افزایش دهد، همراه با نکات عملی برای برنامه‌ریزی وعده‌ها و دستور پخت‌ها.",
        article6Category: "تغذیه",
        article6Author: "سارا احمد",
        article6Tooltip: "سارا احمد\nکارشناس تغذیه\nمتخصص تغذیه باروری",
        article6Date: "۳ مارس ۲۰۲۴",
        article6Reading: "۱۲ دقیقه مطالعه",
        disclaimerTitle: "سلب مسئولیت پزشکی",
        disclaimerText: "اطلاعات ارائه‌شده در مرکز یادگیری ما صرفاً برای اهداف آموزشی است و نباید جایگزین مشاوره پزشکی حرفه‌ای شود. همیشه قبل از تصمیم‌گیری درباره سلامت یا درمان خود با پزشک مشورت کنید."
    }
};

// Global variables for search and filter functionality
let currentCategory = 'all';
let searchTerm = '';

/**
 * Theme Toggle Functionality
 */
function toggleTheme() {
    const html = document.documentElement;
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    const themeText = document.querySelector('.theme-text');
    
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeToggleButton(newTheme, themeIcon, themeText);
}

function updateThemeToggleButton(theme, themeIcon, themeText) {
    const currentLang = getCurrentLanguage();
    const t = translations[currentLang];
    
    if (theme === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = t.lightMode;
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = t.darkMode;
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const html = document.documentElement;
    const themeIcon = document.querySelector('.theme-icon');
    const themeText = document.querySelector('.theme-text');
    
    html.setAttribute('data-theme', savedTheme);
    
    if (themeIcon && themeText) {
        updateThemeToggleButton(savedTheme, themeIcon, themeText);
    }
}

/**
 * Language Toggle Functionality
 */
function toggleLanguage() {
    const html = document.documentElement;
    const languageFlag = document.querySelector('.language-flag');
    const languageText = document.querySelector('.language-text');
    
    const currentLang = html.getAttribute('data-lang') || 'en';
    const newLang = currentLang === 'en' ? 'fa' : 'en';
    
    html.setAttribute('data-lang', newLang);
    localStorage.setItem('language', newLang);
    
    updateLanguageToggleButton(newLang, languageFlag, languageText);
    updatePageContent(newLang);
    
    // Update theme button text based on new language
    const currentTheme = getCurrentTheme();
    const themeIcon = document.querySelector('.theme-icon');
    const themeText = document.querySelector('.theme-text');
    updateThemeToggleButton(currentTheme, themeIcon, themeText);
}

function updateLanguageToggleButton(lang, languageFlag, languageText) {
    if (lang === 'fa') {
        languageFlag.textContent = '🇺🇸';
        languageText.textContent = 'English';
    } else {
        languageFlag.textContent = '🇮🇷';
        languageText.textContent = 'فارسی';
    }
}

function loadLanguage() {
    const savedLanguage = localStorage.getItem('language') || 'en';
    const html = document.documentElement;
    const languageFlag = document.querySelector('.language-flag');
    const languageText = document.querySelector('.language-text');
    
    html.setAttribute('data-lang', savedLanguage);
    
    if (languageFlag && languageText) {
        updateLanguageToggleButton(savedLanguage, languageFlag, languageText);
    }
    
    updatePageContent(savedLanguage);
}

/**
 * Translation System
 */
function updatePageContent(lang) {
    const t = translations[lang];
    
    // Update all elements with data-key attributes
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        if (t[key]) {
            // Handle tooltips differently (they use innerHTML for line breaks)
            if (key.includes('Tooltip')) {
                element.innerHTML = t[key].replace(/\n/g, '<br>');
            } else {
                element.textContent = t[key];
            }
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-key-placeholder]').forEach(element => {
        const key = element.getAttribute('data-key-placeholder');
        if (t[key]) {
            element.placeholder = t[key];
        }
    });

    // Update page title
    document.title = t.title;
}

/**
 * Search and Filter Functionality
 */
function setupSearchAndFilter() {
    const searchInput = document.getElementById('searchInput');
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchTerm = e.target.value.toLowerCase();
            filterArticles();
        });
    }

    // Filter tabs functionality
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            currentCategory = this.getAttribute('data-category');
            filterArticles();
        });
    });
}

function filterArticles() {
    const articles = document.querySelectorAll('.article-card');
    
    articles.forEach(article => {
        const category = article.getAttribute('data-category');
        const title = article.querySelector('.article-title').textContent.toLowerCase();
        const excerpt = article.querySelector('.article-excerpt').textContent.toLowerCase();
        const categoryText = article.querySelector('.article-category').textContent.toLowerCase();
        
        // Check if article matches search term
        const matchesSearch = searchTerm === '' || 
            title.includes(searchTerm) || 
            excerpt.includes(searchTerm) || 
            categoryText.includes(searchTerm);
        
        // Check if article matches category filter
        const matchesCategory = currentCategory === 'all' || category === currentCategory;
        
        // Show or hide article based on filters
        if (matchesSearch && matchesCategory) {
            article.style.display = 'block';
            article.style.animation = 'fadeIn 0.3s ease-in';
        } else {
            article.style.display = 'none';
        }
    });
}

/**
 * Email Copy Functionality
 */
function setupEmailCopy() {
    const emailElement = document.querySelector('.copyable-email');
    
    if (!emailElement) return;
    
    emailElement.addEventListener('click', function() {
        const email = this.getAttribute('data-email');
        
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
            fallbackCopyText(email);
        }
    });
}

function showCopyFeedback(emailElement) {
    const originalText = emailElement.textContent;
    const currentLang = getCurrentLanguage();
    
    const copiedText = currentLang === 'fa' ? 'کپی شد!' : 'Copied!';
    emailElement.textContent = copiedText;
    emailElement.style.opacity = '0.6';
    
    setTimeout(function() {
        emailElement.textContent = originalText;
        emailElement.style.opacity = '';
    }, 1000);
}

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
 * Smooth Scroll to Top
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Image Slideshow Functionality
 */
function setupImageSlideshow() {
    const imageItems = document.querySelectorAll('.image-item');
    
    imageItems.forEach(item => {
        const img = item.querySelector('img');
        const placeholder = item.querySelector('.image-placeholder');
        
        if (img) {
            img.addEventListener('error', function() {
                this.style.display = 'none';
                if (placeholder) {
                    placeholder.style.display = 'flex';
                }
            });
        }
    });
}

/**
 * Utility Functions
 */
function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}

function getCurrentLanguage() {
    return document.documentElement.getAttribute('data-lang') || 'en';
}

/**
 * System Theme Detection
 */
function setupSystemThemeDetection() {
    if (!localStorage.getItem('theme')) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            localStorage.setItem('theme', 'dark');
        }
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('theme-manually-set')) {
            const newTheme = e.matches ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            loadTheme();
        }
    });
}

/**
 * Animation styles for filtered articles
 */
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Initialize Everything
 */
function init() {
    console.log('Fertility AId: Initializing...');
    
    // Add animation styles
    addAnimationStyles();
    
    // Setup system theme detection
    setupSystemThemeDetection();
    
    // Load saved preferences
    loadLanguage();
    loadTheme();
    
    // Setup interactive features
    setupSearchAndFilter();
    setupEmailCopy();
    setupImageSlideshow();
    
    console.log('Fertility AId: All systems initialized successfully');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Make functions available globally for onclick handlers
window.toggleTheme = toggleTheme;
window.toggleLanguage = toggleLanguage;
window.scrollToTop = scrollToTop;