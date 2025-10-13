/// <reference types="cypress" />

describe('Publishing Wizard – stability & routing', () => {
  beforeEach(() => {
    // Clear storage to ensure clean state where needed
    cy.window({ log: false }).then((win) => {
      try {
        win.sessionStorage.clear();
        win.localStorage.clear();
      } catch {}
    });
  });

  it('Step 1 → Step 2 clean transition (no Step 1 bleed)', () => {
    cy.visit('/publish/step-1');

    // Select the first available notice type
    cy.get('[data-testid^="notice-option-"]').first().click();

    // Click Continue
    cy.get('[data-testid="notice-step-continue"]').click();

    // Land on Step 2
    cy.url().should('include', '/publish/step-2');

    // Step 2 heading visible
    cy.contains('h2', /upload your notice/i).should('be.visible');
    // Step 1 heading not present
    cy.contains('h2', /confirm your notice type/i).should('not.exist');
  });

  it('Double-click Continue is idempotent (no flicker/loop)', () => {
    cy.visit('/publish/step-1');

    cy.get('[data-testid^="notice-option-"]').first().click();

    cy.get('[data-testid="notice-step-continue"]').dblclick();

    cy.url().should('include', '/publish/step-2');
    cy.contains('h2', /upload your notice/i).should('be.visible');
  });

  it('Guard redirects once to Step 1 if prerequisites missing', () => {
    cy.visit('/publish/step-2');

    // Redirects once to step 1
    cy.url().should('include', '/publish/step-1');

    // Toast or inline guard message is visible
    cy.contains(/choose a notice type|start at step 1/i).should('be.visible');
  });
});

