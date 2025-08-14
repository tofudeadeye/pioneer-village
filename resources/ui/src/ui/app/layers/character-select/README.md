# Character Select Layer

This layer handles the character selection screen where players can choose an existing character or create a new one.

## SCSS Module Conversion Pattern

This layer has been converted from styled-components to SCSS modules and serves as an example for converting other layers.

### Key Conversion Points

1. **File Structure**
   - `index.tsx` - React component
   - `styles.module.scss` - SCSS module with all styles

2. **Class Naming Convention**
   - Use **camelCase** for class names (e.g., `createCharacter`, `characterLabel`)
   - This provides better TypeScript integration with the styles object

3. **Theme Variables**
   - Use CSS custom properties from theme: `var(--theme-text-primary)`
   - Import theme and mixins at the top of SCSS file

4. **Mixins Usage**
   - Leverage existing mixins for common patterns:
     - `@include hover` - Hover states
     - `@include focus` - Focus states for accessibility  
     - `@include active` - Active/pressed states
     - `@include disabled` - Disabled states
     - `@include transition()` - Smooth transitions
     - `@include textShadow()` - Text shadow effects

5. **Viewport-Based Sizing**
   - This layer uses a custom `uiSizeVH()` function for viewport-based scaling
   - This ensures UI elements scale properly across different screen resolutions

6. **Component Improvements**
   - Semantic HTML: Use `<button>` elements instead of `<div>` for interactive elements
   - Accessibility: Add ARIA labels and proper roles
   - Keyboard navigation: Include focus states

7. **SCSS Organization**
   ```scss
   // 1. Imports
   @import '../../styles/theme.module.scss';
   @import '../../styles/mixins.module.scss';
   
   // 2. Functions (if needed)
   @function uiSizeVH($size) { ... }
   
   // 3. Variables
   $zIndexCharacters: 10;
   
   // 4. Components
   .componentName { ... }
   
   // 5. Responsive adjustments
   @include mobile { ... }
   ```

8. **TypeScript Integration**
   ```tsx
   import styles from './styles.module.scss';
   
   // Use with conditionalClass helper for conditional classes
   className={conditionalClass(styles.characterLabel, {
     [styles.positioned]: !!character.pos,
   })}
   ```

## Component Features

- Character list display with hover effects
- Create new character button with decorative background
- Positioned labels that overlay on 3D character models
- Responsive design for mobile and desktop
- Keyboard navigation support
- Escape key handling to close UI
