/**
 * OmniSuite Main Application Coordinator
 * Handles routing, view transitions, and interactive mouse-tracking card glows.
 */

document.addEventListener('DOMContentLoaded', () => {
  const views = {
    dashboard: document.getElementById('dashboard-view'),
    calculator: document.getElementById('calculator-view'),
    todo: document.getElementById('todo-view'),
    counter: document.getElementById('counter-view')
  };

  const backButton = document.getElementById('back-to-dashboard');
  const currentViewLabel = document.getElementById('current-view-label');
  const cards = document.querySelectorAll('.utility-card');
  let activeView = 'dashboard';

  // Instantiate Sub-Applications
  const calculatorApp = new Calculator();
  const todoApp = new TodoList();
  const counterApp = new Counter();

  /**
   * Switch active views with transition effects
   * @param {string} targetViewName 
   */
  function navigateTo(targetViewName) {
    if (!views[targetViewName] || activeView === targetViewName) return;

    const currentViewEl = views[activeView];
    const targetViewEl = views[targetViewName];

    // Smooth exit transition
    currentViewEl.style.opacity = '0';
    currentViewEl.style.transform = 'translateY(15px)';

    setTimeout(() => {
      currentViewEl.classList.remove('active');
      
      // Setup and activate target
      targetViewEl.classList.add('active');
      
      // Update label and back button visibility
      if (targetViewName === 'dashboard') {
        backButton.classList.add('hidden');
        currentViewLabel.textContent = 'Dashboard';
      } else {
        backButton.classList.remove('hidden');
        const viewTitles = {
          calculator: 'Calculator',
          todo: 'Focus To-Do',
          counter: 'Interactive Counter'
        };
        currentViewLabel.textContent = viewTitles[targetViewName] || targetViewName;
      }

      // Re-layout Lucide icons inside newly exposed views
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }

      // Smooth enter transition
      setTimeout(() => {
        targetViewEl.style.opacity = '1';
        targetViewEl.style.transform = 'translateY(0)';
      }, 50);

      activeView = targetViewName;
    }, 250);
  }

  // Dashboard card click listener
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const target = card.getAttribute('data-target');
      navigateTo(target);
    });

    // Premium radial hover effect coordinates calculation
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // Back button listener
  backButton.addEventListener('click', () => {
    navigateTo('dashboard');
  });

  // Hotkey support for going back (Escape)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeView !== 'dashboard') {
      // Don't trigger if user is focused inside an input
      if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        navigateTo('dashboard');
      }
    }
  });

  // Set initial transition styles
  Object.values(views).forEach(view => {
    if (!view.classList.contains('active')) {
      view.style.opacity = '0';
      view.style.transform = 'translateY(15px)';
    } else {
      view.style.opacity = '1';
      view.style.transform = 'translateY(0)';
    }
  });
});
