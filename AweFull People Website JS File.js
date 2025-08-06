// Smooth Scroll Functionality
document.querySelectorAll('nav a, .footer-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
    });
});

// Dynamic Copyright Year
const copyright = document.querySelector('.copyright');
const currentYear = new Date().getFullYear();
copyright.textContent = `© ${currentYear} Those AweFull People. All rights reserved.`;

// Button Click Functionality for Media Section
document.querySelectorAll('.button-grid button').forEach(button => {
    button.addEventListener('click', () => {
        const url = button.getAttribute('data-url');
        if (url) {
            window.open(url, '_blank');
        } else {
            alert('Please add a valid URL to this button.');
        }
    });
});