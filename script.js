

  const btn = document.getElementById("readMoreBtn");
  const moreText = document.getElementById("moreText");
  const label = btn.querySelector(".label");

  btn.addEventListener("click", () => {
    const isOpen = moreText.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(isOpen));
    label.textContent = isOpen ? "Read less" : "Read more";
  });

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

// Tab switching functionality
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === targetTab) {
                content.classList.add('active');
            }
        });
    });
});

// Theme toggle (placeholder functionality)
const themeToggle = document.querySelector('.theme-toggle');
themeToggle.addEventListener('click', () => {
    themeToggle.textContent = themeToggle.textContent === '☀' ? '🌙' : '☀';
});

// Book card click handler
const bookCards = document.querySelectorAll('.book-card');
bookCards.forEach(card => {
    card.addEventListener('click', () => {
        const title = card.querySelector('.book-title').textContent;
        alert(`You clicked on: ${title}\n\nThis would link to a detailed review page.`);
    });
});


