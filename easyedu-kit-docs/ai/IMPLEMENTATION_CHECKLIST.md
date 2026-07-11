# EasyEdu UI Implementation Checklist

Use this checklist for every UI task in EasyEdu plugins.

## 1. Discovery

- [ ] Confirm the target repository and Moodle version.
- [ ] Run `git status --short --branch`.
- [ ] Read `ai/MOODLE_PLUGIN_RULES.md` when the target is a Moodle plugin.
- [ ] Inspect existing kit docs and component matrix.
- [ ] Read any matching plugin mapping in `docs/examples/` before copying UI
      between EasyEdu plugins.
- [ ] Identify matching components/tokens/mixins.
- [ ] Read the component's "Import Audit Checklist" when it exists.
- [ ] Identify missing kit behaviour before touching the plugin.
- [ ] When another plugin is the visual reference, capture computed styles and
      perform an inverse audit before recreating its appearance.

## 2. Kit-first decision

- [ ] Reuse existing kit component exactly when available.
- [ ] If the target behaviour is missing, add it to the kit first.
- [ ] Document the component contract in `docs/components/`.
- [ ] Add or update the component import checklist when the behaviour is easy
      to misimplement across plugins.
- [ ] Update `ai/COMPONENT_CONTRACT.md` for fragile or high-value behaviours.
- [ ] Update `CHANGELOG.md`.

## 3. Plugin integration

- [ ] Copy/sync only the required kit parts into the plugin.
- [ ] Keep plugin-specific selectors and data in the plugin.
- [ ] Keep shared style/interaction rules in the kit.
- [ ] Avoid local overrides unless they are explicitly documented as plugin
      context adaptations.
- [ ] Preserve ids, `data-*`, DOM order, draggable rows and modal interaction
      classes while adopting visual surfaces.
- [ ] Keep overflow and sticky offsets plugin-owned unless the component
      contract explicitly owns them.
- [ ] For top admin navigation, use `admin-primary-nav`; keep labels on one
      line and do not restyle the guide launcher as a nav action.
- [ ] For in-view status/toggle actions, use `admin-secondary-actions`, not the
      primary navigation component.

## 4. Guide-specific checklist

- [ ] If visual parity is requested, complete `ai/GUIDE_PARITY_CHECKLIST.md`.
- [ ] Use the kit guide highlight engine, not a local selector implementation.
- [ ] Use viewport-fixed highlights.
- [ ] Use `easyedu:guide-refresh-highlight` after UI transitions.
- [ ] Keep return-to-guide panel behaviour from the kit.
- [ ] Keep locked slides and unlock paths using the kit contract.
- [ ] Avoid long badges in navigation cards.
- [ ] Put explanations in locked slide content, not in compact badges.

## 5. Validation

- [ ] Compile SCSS.
- [ ] Check JS syntax.
- [ ] Run `git diff --check`.
- [ ] Run `.\scripts\audit-kit.ps1 -FailOnNewWarning` in the kit when kit files
      changed.
- [ ] Run plugin PHP lint where plugin files changed.
- [ ] Run `.\scripts\audit-moodle-rules.ps1 -PluginRoot <plugin>` for Moodle
      plugins when practical.
- [ ] If asked or necessary, use browser/headless checks for visual parity.
- [ ] Confirm production packages exclude AI/docs/test-only files where needed.

## 6. Final report

Report:

- files changed in the kit;
- files changed in plugins;
- verification commands;
- what remains intentionally not tested;
- whether the kit was committed/pushed.
