## Toasts Manager

React toasts manager library.

### Usage:

#### Import:

```javascript
import ToastsManager, { Toast } from 'toasts-manager';

ReactDOM.render(
  <div>
    ...
    <ToastsManager renderToast={({ type, text, onClose }) => (
      <Toast onClick={onClose}>
        {type}: {text}
      </Toast>
    )} />
  </div>,
  document.getElementById('root')
)
```

#### ToastsManager props:

* **anchor** - values: ["left", "right"] default: "left"

#### Show standard info/warn/error toasts:

```javascript
// Show toast rendered by renderToast function with params type = 'info' and text
ToastsManager.info('Post sent success');

// Show toast rendered by renderToast function with params type = 'warn' and text
ToastsManager.warn('Comments depth exceeded');

// Show toast rendered by renderToast function with params type = 'error' and text
ToastsManager.error('Network Error');
```

#### Use with custom component:

```javascript
import ToastsManager, { Toast } from 'toasts-manager';

ToastsManager.show(({ onClose }) => (
  <Toast>
    CUSTOM INNER HTML
    <button type="button" onClick={onClose}>
      DISMISS
    </button>
  </Toast>
));
```
