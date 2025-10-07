# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - search "Search statutory notices by address" [ref=e6]:
        - generic [ref=e7]:
          - generic [ref=e8]:
            - generic [ref=e9]: Enter an address or postcode
            - textbox "Enter an address or postcode" [ref=e10]: zzzx unknown place 123
          - button "Search" [ref=e11] [cursor=pointer]
        - paragraph [ref=e12]: Pick an address to view statutory notices nearby.
      - generic [ref=e13]:
        - button "Premises Licence" [ref=e14] [cursor=pointer]
        - button "Traffic Order" [ref=e15] [cursor=pointer]
        - button "Planning" [ref=e16] [cursor=pointer]
        - button "Open" [ref=e17] [cursor=pointer]
        - button "Closed" [ref=e18] [cursor=pointer]
        - generic [ref=e19]:
          - generic [ref=e20]:
            - generic [ref=e21]: Start date
            - textbox "Start date" [ref=e22]
          - generic [ref=e23]: to
          - generic [ref=e24]:
            - generic [ref=e25]: End date
            - textbox "End date" [ref=e26]
        - button "Map view" [ref=e27] [cursor=pointer]
  - main [ref=e28]:
    - generic [ref=e29]:
      - paragraph [ref=e30]:
        - text: Search failed for
        - strong [ref=e31]: zzzx unknown place 123
        - text: . Search failed (HTTP 500)
      - generic [ref=e32]:
        - button "Retry" [ref=e33] [cursor=pointer]
        - button "Broaden search" [ref=e34] [cursor=pointer]
        - button "Clear filters" [ref=e35] [cursor=pointer]
    - paragraph [ref=e36]: No notices found for “zzzx unknown place 123”.
```