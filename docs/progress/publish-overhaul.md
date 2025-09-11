# /publish overhaul progress

- [x] Compliance engine scaffolding – `schemas/rules/*`
 - [x] Authority packs (Bristol, Southwark) – `src/data/authorityPacks/*.json`
- [x] Activities grid quick actions – `src/components/publish/ActivitiesHoursGrid.tsx`
- [x] Notice type schemas – `schemas/noticeTypes/{premises-licence,gvol,traffic-order}.schema.ts`
- [x] Notice type rules – `schemas/rules/{premises-licence,gvol,traffic-order}.rules.ts`
- [x] Templates – `templates/{premises-licence,gvol,traffic-order}.template.ts`
- [x] Form panels – `src/components/publish/{PremisesForm,GVOLForm,TrafficForm}.tsx`
- [x] Authority pack wiring – `src/lib/authorityPacks.ts`, `src/components/publish/ApplicantPanel.tsx`
- [x] Address autocomplete with UPRN – `src/components/AddressAutocomplete.tsx`
- [x] Autosave with draft link – `src/components/publish/ApplicantPanel.tsx`
- [x] Right rail cards – `src/components/publish/RightRail/*`
- [x] Proof artefacts – `src/lib/proofs/proof.ts`
- [x] OCR dual-view upload – `src/components/publish/UploadDropzone.tsx`
- [x] Accessibility error summary – `src/components/publish/ErrorSummary.tsx`, `GVOLForm.tsx`, `TrafficForm.tsx`
- [x] Documentation & progress log – `docs/progress/publish-overhaul.md`
- [x] Publish page wiring – `src/pages/publish/index.tsx`

## 2024-xx updates

- [x] Grid layout and right rail cards – `src/pages/publish/index.tsx`
- [x] Notice form switching test – `src/components/__tests__/NoticeTypeSelect.test.tsx`
