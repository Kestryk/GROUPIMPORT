# Component Documentation

Each component document follows the same structure:

- purpose;
- expected HTML;
- SCSS mixins;
- public tokens;
- variants;
- accessibility notes;
- Moodle integration notes;
- JavaScript orchestration notes where the component moves dynamically;
- extraction status from EasyStud.

The kit is intentionally mixin-first. Plugins own their selectors and include
EasyEdu component styles under plugin-specific roots.

Loading migrations must also read [Loading and skeletons](loading.md) and
[Navigation Skeleton](navigation-skeleton.md). Those contracts keep loading
surfaces decorative and preserve the consumer-owned lifecycle and geometry.
