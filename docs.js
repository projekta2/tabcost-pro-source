// docs.js - Funcionalidad de idioma y scroll para TabCost docs
(function() {
  // Get elements
  const enContent = document.getElementById('content-en');
  const esContent = document.getElementById('content-es');
  const footnoteSpan = document.getElementById('footnote')?.querySelector('span');
  const langBtns = document.querySelectorAll('.lang-btn');
  
  // Default language: English
  let currentLang = localStorage.getItem('tabcost_docs_lang') || 'en';
  
  function setLanguage(lang) {
    if (!enContent || !esContent) return;
    if (lang === 'en') {
      enContent.style.display = 'block';
      esContent.style.display = 'none';
      if (footnoteSpan) {
        footnoteSpan.innerHTML = 'Version 1.5.3 · Last update: May 2026 · TabCost does not store or transmit any personal data. Everything is local.';
      }
      document.documentElement.lang = 'en';
    } else {
      enContent.style.display = 'none';
      esContent.style.display = 'block';
      if (footnoteSpan) {
        footnoteSpan.innerHTML = 'Versión 1.5.3 · Última actualización: mayo 2026 · TabCost no almacena ni transmite ningún dato personal. Todo es local.';
      }
      document.documentElement.lang = 'es';
    }
    // Update active class on buttons
    langBtns.forEach(btn => {
      if (btn.getAttribute('data-lang') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    localStorage.setItem('tabcost_docs_lang', lang);
    currentLang = lang;
  }
  
  // Add click handlers
  langBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const lang = btn.getAttribute('data-lang');
      if (lang !== currentLang) {
        setLanguage(lang);
      }
    });
  });
  
  // Initialize with saved language
  setLanguage(currentLang);
  
  // Smooth scroll to top
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();