# Mobile and accessibility verification checklist

Status: automated checks added; manual device and assistive-technology verification remains open.
Scope: `/streaming` catalog, series detail dialog, player dialog and fixed mobile navigation.

## Automated coverage

- [x] Dialog receives focus when opened.
- [x] Tab and Shift+Tab remain inside the active dialog.
- [x] Escape closes the dialog and returns focus to the invoking control.
- [x] Episode lists support Arrow Up/Down, Home and End.
- [x] The active episode is announced through `aria-current="step"`.
- [x] Catalog and detail dialog stay within a 320px viewport width.
- [x] Search, genre filters, persistent favorites and mobile filter-state announcements have Playwright coverage.
- [x] Small footer and brand microcopy colors adjusted to improve computed contrast.
- [x] Detail dialog remains usable in an 844×390 landscape viewport.
- [x] Close, episode and fixed-navigation controls have minimum 44px target sizing in CSS.

## Manual checks before closing issue #5

- [ ] Android Chrome at 320px, 360px and 390px widths: inspect header, bottom navigation, poster cards, detail dialog and player.
- [ ] Android landscape at 844×390: open detail and player dialogs, scroll to the final episode, close without losing the page position.
- [ ] Verify safe-area insets on a device with gesture navigation; ensure fixed navigation does not cover the final content.
- [ ] TalkBack: confirm dialog title, close control, current episode, countdown status and player controls are announced in a useful order.
- [ ] VoiceOver/Safari iOS: repeat dialog entry/exit, episode navigation and safe-area checks.
- [ ] Desktop keyboard-only: verify visible focus, logical order and no focus escape while either dialog is open.
- [ ] Reduced motion: enable the OS/browser preference and confirm cinematic entrance effects are suppressed.
- [ ] Contrast: manually verify muted metadata, inactive navigation and small labels against their actual backgrounds.
- [ ] Confirm no horizontal page overflow in the catalog, detail dialog or player at 320px and in landscape.

## Evidence boundary

CI and DOM assertions verify implemented keyboard behavior, catalog filtering/favorites and viewport bounds. The tiny footer and brand microcopy colors were adjusted after computed contrast checks. They do not establish full WCAG conformance, actual-device rendering, safe-area behavior on physical hardware, screen-reader announcement quality or visual contrast compliance. Capture current screenshots and complete the manual checks before closing issue #5.
