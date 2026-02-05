document.addEventListener('DOMContentLoaded', () => {
  // Dashboard Navigation Active States
  const navLinks = document.querySelectorAll('.sidebar-link');
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Mobile Sidebar Toggle (For future implementation)
  const setupMobileToggle = () => {
    const toggleBtn = document.getElementById('mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
        sidebar.classList.toggle('block');
      });
    }
  };

  setupMobileToggle();
});
