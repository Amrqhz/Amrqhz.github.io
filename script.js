// Read more toggle
const btn = document.getElementById("readMoreBtn");
const moreText = document.getElementById("moreText");
if (btn && moreText) {
    const label = btn.querySelector(".label");
    btn.addEventListener("click", () => {
        const isOpen = moreText.classList.toggle("open");
        btn.setAttribute("aria-expanded", String(isOpen));
        label.textContent = isOpen ? "read less" : "read more";
    });
}

// Tab switching
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        const targetTab = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        tabContents.forEach(content => {
            content.classList.remove("active");
            if (content.id === targetTab) content.classList.add("active");
        });
    });
});

// Active nav link highlighting
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("section[id]");
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => link.classList.remove("active"));
            const activeLink = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
            if (activeLink) activeLink.classList.add("active");
        }
    });
}, { rootMargin: "-40% 0px -55% 0px" });
sections.forEach(s => observer.observe(s));