## Toasts Manager

React toasts manager library.

### Usage:

#### Import:

```javascript
import ToastsManager from 'toasts-manager';
```

#### Show standard info/warn/error toasts:

```javascript
// Show toast with success icon and text
ToastsManager.info('Post sent success');

// Show toast with warning icon and text
ToastsManager.warn('Comments depth exceeded');

// Show toast with error icon and text
ToastsManager.error('Network Error');
```

#### Use with custom component:

```javascript
import { ToastsManager, Toast } from 'toasts-manager';

ToastsManager.show(({ onClose }) => (
  <Toast>
    CUSTOM INNER HTML
    <button type="button" onClick={onClose}>
      DISMISS
    </button>
  </Toast>
));
```
