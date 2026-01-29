# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=e5]:
    - generic [ref=e6]:
      - img [ref=e9]
      - heading "Council Portal" [level=2] [ref=e13]
      - paragraph [ref=e14]: Sign in to manage your council's public notices
    - generic [ref=e15]:
      - generic [ref=e16]:
        - generic [ref=e18]:
          - img [ref=e19]
          - generic [ref=e21]: The email or password you entered is incorrect. Please try again.
        - generic [ref=e22]:
          - generic [ref=e23]: Email Address
          - textbox "Email Address" [ref=e24]: ottoclarke@icloud.com
        - generic [ref=e25]:
          - generic [ref=e26]:
            - generic [ref=e27]: Password
            - link "Forgot password?" [ref=e28] [cursor=pointer]:
              - /url: /forgot-password
          - textbox "Password" [ref=e29]: password123
        - button "Sign In" [ref=e30] [cursor=pointer]:
          - img [ref=e31] [cursor=pointer]
          - text: Sign In
      - paragraph [ref=e35]:
        - text: Need access?
        - link "Contact support" [ref=e36] [cursor=pointer]:
          - /url: mailto:support@civicnotices.co.uk
    - generic [ref=e37]:
      - link "← Back to Public Portal" [ref=e38] [cursor=pointer]:
        - /url: /
      - link "Not a council? Sign in here" [ref=e39] [cursor=pointer]:
        - /url: /auth/sign-in
    - paragraph [ref=e41]: © 2026 Civic Notices. All rights reserved.
```