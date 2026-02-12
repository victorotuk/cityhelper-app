"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // Smooth scroll for "how it works" button
  var moreInfoButton = document.getElementById("more-info-button");
  var whySection = document.getElementById("why-section");

  if (moreInfoButton && whySection) {
    moreInfoButton.addEventListener("click", function () {
      whySection.scrollIntoView({ behavior: "smooth" });
    });
  }
  
  // Add scroll-triggered fade-in for sections
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Observe sections for scroll animations
  const sections = document.querySelectorAll('.how-section, .vibe-section, .not-section, .final-section');
  sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(section);
  });
});
