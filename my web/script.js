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
