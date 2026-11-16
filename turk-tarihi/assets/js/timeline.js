document.addEventListener('DOMContentLoaded', () => {
    const timeline = document.querySelector('[data-timeline]');
    if (!timeline || !('IntersectionObserver' in window)) {
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.2 });

    timeline.querySelectorAll('.timeline-item').forEach((item) => observer.observe(item));
});

