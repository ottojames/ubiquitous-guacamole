// Optional: capture console errors during runs
Cypress.on('window:before:load', (win) => {
  const orig = win.console.error;
  (win as any).__consoleErrors = [];
  win.console.error = (...args: any[]) => {
    (win as any).__consoleErrors.push(args);
    orig.apply(win.console, args as any);
  };
});

