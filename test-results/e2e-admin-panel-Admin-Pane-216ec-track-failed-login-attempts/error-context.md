# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=e5]:
    - generic [ref=e6]:
      - img [ref=e8]
      - heading "Admin Portal" [level=1] [ref=e10]
      - paragraph [ref=e11]: Secure administrative access
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: Email Address
        - textbox "Email Address" [ref=e16]:
          - /placeholder: admin@civicnotices.co.uk
          - text: admin@civicnotices.co.uk
      - generic [ref=e17]:
        - generic [ref=e18]: Password
        - textbox "Password" [ref=e19]:
          - /placeholder: Enter your password
          - text: wrongpassword
      - generic [ref=e20]:
        - checkbox "Remember this device" [ref=e21]
        - generic [ref=e22]: Remember this device
      - button "Sign In" [ref=e23] [cursor=pointer]:
        - img [ref=e24]
        - generic [ref=e26]: Sign In
    - generic [ref=e27]:
      - paragraph [ref=e28]: Civic Notices Admin Portal • Enterprise Security
      - paragraph [ref=e29]: All login attempts are logged and monitored
```