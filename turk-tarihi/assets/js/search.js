document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('[data-search-input]');
    if (!input) {
        return;
    }

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            input.value = '';
        }
    });
});

