// Shared scrolling utilities for consistent navigation behavior

export const scrollToDemoSection = () => {
  const el = document.getElementById("interactive-demo");
  if (!el) return;

  // Calculate position to show the demo section with input area visible
  const rect = el.getBoundingClientRect();
  const absoluteTop = window.scrollY + rect.top;
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const elementHeight = rect.height;

  // Enhanced responsive scrolling logic to ensure input area and mic button are fully visible
  let target;
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  const isDesktop = viewportWidth >= 1024;

  if (isMobile) {
    // Mobile: scroll to show demo with more room for input
    // Add significant bottom padding so input doesn't get hidden by mobile keyboard
    target = Math.max(0, absoluteTop - 60);
  } else if (isTablet) {
    // Tablet: scroll to center the demo better
    target = Math.max(0, absoluteTop - (viewportHeight - elementHeight - 80) / 2);
  } else {
    // Desktop: scroll to show demo nicely centered
    target = Math.max(0, absoluteTop - (viewportHeight - elementHeight - 100) / 2);
  }

  window.scrollTo({ top: target, behavior: 'smooth' });

  // Secondary check: ensure input area is visible after scroll completes
  const checkInputVisibility = () => {
    const demoSection = document.getElementById('interactive-demo');
    if (!demoSection) return;

    // Find the input container within the demo
    const inputArea = demoSection.querySelector('input[placeholder="Ask Bzik anything..."]');
    if (inputArea) {
      const inputRect = inputArea.getBoundingClientRect();
      const isInputVisible = inputRect.bottom > 0 && inputRect.top < viewportHeight;
      
      if (!isInputVisible) {
        console.log("📍 Input not visible, adjusting scroll");
        // Scroll to ensure input and mic button are visible
        const scrollBuffer = isMobile ? 100 : 80; // Extra space for mobile keyboard
        const additionalScroll = inputRect.bottom - viewportHeight + scrollBuffer;
        
        if (additionalScroll > 0) {
          window.scrollBy({
            top: additionalScroll,
            behavior: 'smooth'
          });
        }
      } else {
        console.log("✅ Input area is visible");
      }
    }
  };

  // Check visibility after scroll animation completes (smooth scroll is ~300-500ms)
  setTimeout(checkInputVisibility, 600);
};

