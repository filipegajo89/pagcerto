// Atualizar ano automaticamente
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Animação suave ao scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Adicionar classe quando scrollar (para efeitos futuros)
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 100) {
    document.querySelector('header').style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
  } else {
    document.querySelector('header').style.boxShadow = '';
  }
  
  lastScroll = currentScroll;
});
