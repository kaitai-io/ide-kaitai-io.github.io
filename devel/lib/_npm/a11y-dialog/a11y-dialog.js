(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.A11yDialog = factory());
})(this, (function () { 'use strict';

  const not = {
    inert: ':not([inert]):not([inert] *)',
    negTabIndex: ':not([tabindex^="-"])',
    disabled: ':not(:disabled)',
  };

  var focusableSelectors = [
    `a[href]${not.inert}${not.negTabIndex}`,
    `area[href]${not.inert}${not.negTabIndex}`,
    `input:not([type="hidden"]):not([type="radio"])${not.inert}${not.negTabIndex}${not.disabled}`,
    `input[type="radio"]${not.inert}${not.negTabIndex}${not.disabled}`,
    `select${not.inert}${not.negTabIndex}${not.disabled}`,
    `textarea${not.inert}${not.negTabIndex}${not.disabled}`,
    `button${not.inert}${not.negTabIndex}${not.disabled}`,
    `details${not.inert} > summary:first-of-type${not.negTabIndex}`,
    // Discard until Firefox supports `:has()`
    // See: https://github.com/KittyGiraudel/focusable-selectors/issues/12
    // `details:not(:has(> summary))${not.inert}${not.negTabIndex}`,
    `iframe${not.inert}${not.negTabIndex}`,
    `audio[controls]${not.inert}${not.negTabIndex}`,
    `video[controls]${not.inert}${not.negTabIndex}`,
    `[contenteditable]${not.inert}${not.negTabIndex}`,
    `[tabindex]${not.inert}${not.negTabIndex}`,
  ];

  /**
   * Set the focus to the first element with `autofocus` with the element or the
   * element itself.
   */
  function focus(el) {
      (el.querySelector('[autofocus]') || el).focus();
  }
  /**
   * Get the first and last focusable elements within a given element.
   */
  function getFocusableEdges(el) {
      // Check for a focusable element within the subtree of the given element.
      const firstEl = findFocusableEl(el, true);
      // Only if we find the first element do we need to look for the last one. If
      // there’s no last element, we set `lastEl` as a reference to `firstEl` so
      // that the returned array is still always of length 2.
      const lastEl = firstEl ? findFocusableEl(el, false) || firstEl : null;
      return [firstEl, lastEl];
  }
  /**
   * Find the first focusable element inside the given element if `forward` is
   * truthy or the last focusable element otherwise.
   */
  function findFocusableEl(el, forward) {
      // If we’re walking forward, check if this element is focusable, and return it
      // immediately if it is.
      if (forward && isFocusable(el))
          return el;
      // We should only search the subtree of this element if it can have focusable
      // children.
      if (canHaveFocusableChildren(el)) {
          // Start walking the DOM tree, looking for focusable elements.
          // Case 1: If this element has a shadow root, search it recursively.
          if (el.shadowRoot) {
              // Descend into this subtree.
              let next = getNextChildEl(el.shadowRoot, forward);
              // Traverse the siblings, searching the subtree of each one for focusable
              // elements.
              while (next) {
                  const focusableEl = findFocusableEl(next, forward);
                  if (focusableEl)
                      return focusableEl;
                  next = getNextSiblingEl(next, forward);
              }
          }
          // Case 2: If this element is a slot for a Custom Element, search its
          // assigned elements recursively.
          else if (el.localName === 'slot') {
              const assignedElements = el.assignedElements({
                  flatten: true,
              });
              if (!forward)
                  assignedElements.reverse();
              for (const assignedElement of assignedElements) {
                  const focusableEl = findFocusableEl(assignedElement, forward);
                  if (focusableEl)
                      return focusableEl;
              }
          }
          // Case 3: this is a regular Light DOM element. Search its subtree.
          else {
              // Descend into this subtree.
              let next = getNextChildEl(el, forward);
              // Traverse siblings, searching the subtree of each one
              // for focusable elements.
              while (next) {
                  const focusableEl = findFocusableEl(next, forward);
                  if (focusableEl)
                      return focusableEl;
                  next = getNextSiblingEl(next, forward);
              }
          }
      }
      // If we’re walking backward, we want to check the element’s entire subtree
      // before checking the element itself. If this element is focusable, return
      // it.
      if (!forward && isFocusable(el))
          return el;
      return null;
  }
  function getNextChildEl(el, forward) {
      return forward ? el.firstElementChild : el.lastElementChild;
  }
  function getNextSiblingEl(el, forward) {
      return forward ? el.nextElementSibling : el.previousElementSibling;
  }
  /**
   * Determine if an element is hidden from the user.
   */
  const isHidden = (el) => {
      // Browsers hide all non-<summary> descendants of closed <details> elements
      // from user interaction, but those non-<summary> elements may still match our
      // focusable-selectors and may still have dimensions, so we need a special
      // case to ignore them.
      if (el.matches('details:not([open]) *') &&
          !el.matches('details>summary:first-of-type'))
          return true;
      // If this element has no painted dimensions, it's hidden.
      return !(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  };
  /**
   * Determine if an element is focusable and has user-visible painted dimensions.
   */
  const isFocusable = (el) => {
      // A shadow host that delegates focus will never directly receive focus,
      // even with `tabindex=0`. Consider our <fancy-button> custom element, which
      // delegates focus to its shadow button:
      //
      // <fancy-button tabindex="0">
      //  #shadow-root
      //  <button><slot></slot></button>
      // </fancy-button>
      //
      // The browser acts as as if there is only one focusable element – the shadow
      // button. Our library should behave the same way.
      if (el.shadowRoot?.delegatesFocus)
          return false;
      return el.matches(focusableSelectors.join(',')) && !isHidden(el);
  };
  /**
   * Determine if an element can have focusable children. Useful for bailing out
   * early when walking the DOM tree.
   * @example
   * This div is inert, so none of its children can be focused, even though they
   * meet our criteria for what is focusable. Once we check the div, we can skip
   * the rest of the subtree.
   * ```html
   * <div inert>
   *   <button>Button</button>
   *   <a href="#">Link</a>
   * </div>
   * ```
   */
  function canHaveFocusableChildren(el) {
      // The browser will never send focus into a Shadow DOM if the host element
      // has a negative tabindex. This applies to both slotted Light DOM Shadow DOM
      // children
      if (el.shadowRoot && el.getAttribute('tabindex') === '-1')
          return false;
      // Elemments matching this selector are either hidden entirely from the user,
      // or are visible but unavailable for interaction. Their descentants can never
      // receive focus.
      return !el.matches(':disabled,[hidden],[inert]');
  }
  /**
   * Get the active element, accounting for Shadow DOM subtrees.
   * @author Cory LaViska
   * @see: https://www.abeautifulsite.net/posts/finding-the-active-element-in-a-shadow-root/
   */
  function getActiveEl(root = document) {
      const activeEl = root.activeElement;
      if (!activeEl)
          return null;
      // If there’s a shadow root, recursively find the active element within it.
      // If the recursive call returns null, return the active element
      // of the top-level Document.
      if (activeEl.shadowRoot)
          return getActiveEl(activeEl.shadowRoot) || document.activeElement;
      // If not, we can just return the active element
      return activeEl;
  }
  /**
   * Trap the focus inside the given element
   */
  function trapTabKey(el, event) {
      const [firstFocusableEl, lastFocusableEl] = getFocusableEdges(el);
      // If there are no focusable children in the dialog, prevent the user from
      // tabbing out of it
      if (!firstFocusableEl)
          return event.preventDefault();
      const activeEl = getActiveEl();
      // If the SHIFT key is pressed while tabbing (moving backwards) and the
      // currently focused item is the first one, move the focus to the last
      // focusable item from the dialog element
      if (event.shiftKey && activeEl === firstFocusableEl) {
          // @ts-ignore: we know that `lastFocusableEl` is not null here
          lastFocusableEl.focus();
          event.preventDefault();
      }
      // If the SHIFT key is not pressed (moving forwards) and the currently focused
      // item is the last one, move the focus to the first focusable item from the
      // dialog element
      else if (!event.shiftKey && activeEl === lastFocusableEl) {
          firstFocusableEl.focus();
          event.preventDefault();
      }
  }
  /**
   * Find the closest element to the given element matching the given selector,
   * accounting for Shadow DOM subtrees.
   * @author Louis St-Amour
   * @see: https://stackoverflow.com/a/56105394
   */
  function closest(selector, base) {
      function from(el) {
          if (!el || el === document || el === window)
              return null;
          // Reading the `assignedSlot` property from the element (as suggested by the
          // aforementioned StackOverflow answer) is not enough, because it does not
          // take into consideration elements nested deeply within a <slot>. For these
          // elements, the `assignedSlot` property is `null` as it is only specified
          // for top-level elements within a <slot>. To still find the closest <slot>,
          // we walk up the tree looking for the `assignedSlot` property.
          const slot = findAssignedSlot(el);
          if (slot)
              el = slot;
          return (el.closest(selector) ||
              from(el.getRootNode().host));
      }
      return from(base);
  }
  function findAssignedSlot(node) {
      return (node.assignedSlot ||
          (node.parentNode ? findAssignedSlot(node.parentNode) : null));
  }

  const SCOPE = 'data-a11y-dialog';
  class A11yDialog {
      $el;
      id;
      previouslyFocused;
      shown;
      constructor(element) {
          this.$el = element;
          this.id = this.$el.getAttribute(SCOPE) || this.$el.id;
          this.previouslyFocused = null;
          this.shown = false;
          this.maintainFocus = this.maintainFocus.bind(this);
          this.bindKeypress = this.bindKeypress.bind(this);
          this.handleTriggerClicks = this.handleTriggerClicks.bind(this);
          this.show = this.show.bind(this);
          this.hide = this.hide.bind(this);
          this.$el.setAttribute('aria-hidden', 'true');
          this.$el.setAttribute('aria-modal', 'true');
          this.$el.setAttribute('tabindex', '-1');
          if (!this.$el.hasAttribute('role')) {
              this.$el.setAttribute('role', 'dialog');
          }
          document.addEventListener('click', this.handleTriggerClicks, true);
      }
      /**
       * Destroy the current instance (after making sure the dialog has been hidden)
       * and remove all associated listeners from dialog openers and closers
       */
      destroy() {
          // Dispatch a `destroy` event
          const destroyEvent = this.fire('destroy');
          // If the event was prevented, do not continue with the normal behavior
          if (destroyEvent.defaultPrevented)
              return this;
          // Hide the dialog to avoid destroying an open instance
          this.hide();
          // Remove the click event delegates for our openers and closers
          document.removeEventListener('click', this.handleTriggerClicks, true);
          // Clone and replace the dialog element to prevent memory leaks caused by
          // event listeners that the author might not have cleaned up.
          this.$el.replaceWith(this.$el.cloneNode(true));
          return this;
      }
      /**
       * Show the dialog element, trap the current focus within it, listen for some
       * specific key presses and fire all registered callbacks for `show` event
       */
      show(event) {
          // If the dialog is already open, abort
          if (this.shown)
              return this;
          // Dispatch a `show` event
          const showEvent = this.fire('show', event);
          // If the event was prevented, do not continue with the normal behavior
          if (showEvent.defaultPrevented)
              return this;
          // Keep a reference to the currently focused element to be able to restore
          // it later
          this.shown = true;
          this.$el.removeAttribute('aria-hidden');
          this.previouslyFocused = getActiveEl();
          // Due to a long lasting bug in Safari, clicking an interactive element
          // (like a <button>) does *not* move the focus to that element, which means
          // `document.activeElement` is whatever element is currently focused (like
          // an <input>), or the <body> element otherwise. We can work around that
          // problem by checking whether the focused element is the <body>, and if it,
          // store the click event target.
          // See: https://bugs.webkit.org/show_bug.cgi?id=22261
          if (this.previouslyFocused?.tagName === 'BODY' && event?.target) {
              this.previouslyFocused = event.target;
          }
          // Set the focus to the dialog element
          // See: https://github.com/KittyGiraudel/a11y-dialog/pull/583
          if (event?.type === 'focus') {
              this.maintainFocus();
          }
          else {
              focus(this.$el);
          }
          // Bind a focus event listener to the body element to make sure the focus
          // stays trapped inside the dialog while open, and start listening for some
          // specific key presses (TAB and ESC)
          document.body.addEventListener('focus', this.maintainFocus, true);
          this.$el.addEventListener('keydown', this.bindKeypress, true);
          return this;
      }
      /**
       * Hide the dialog element, restore the focus to the previously active
       * element, stop listening for some specific key presses and fire all
       * registered callbacks for `hide` event
       */
      hide(event) {
          // If the dialog is already closed, abort
          if (!this.shown)
              return this;
          // Dispatch a `hide` event
          const hideEvent = this.fire('hide', event);
          // If the event was prevented, do not continue with the normal behavior
          if (hideEvent.defaultPrevented)
              return this;
          this.shown = false;
          this.$el.setAttribute('aria-hidden', 'true');
          // Remove the focus event listener to the body element and stop listening
          // for specific key presses
          document.body.removeEventListener('focus', this.maintainFocus, true);
          this.$el.removeEventListener('keydown', this.bindKeypress, true);
          // Ensure the previously focused element (if any) has a `focus` method
          // before attempting to call it to account for SVG elements
          // See: https://github.com/KittyGiraudel/a11y-dialog/issues/108
          this.previouslyFocused?.focus?.();
          return this;
      }
      /**
       * Register a new callback for the given event type
       */
      on(type, handler, options) {
          this.$el.addEventListener(type, handler, options);
          return this;
      }
      /**
       * Unregister an existing callback for the given event type
       */
      off(type, handler, options) {
          this.$el.removeEventListener(type, handler, options);
          return this;
      }
      /**
       * Dispatch and return a custom event from the DOM element associated with
       * this dialog; this allows authors to listen for and respond to the events
       * in their own code
       */
      fire(type, event) {
          const customEvent = new CustomEvent(type, {
              detail: event,
              cancelable: true,
          });
          this.$el.dispatchEvent(customEvent);
          return customEvent;
      }
      /**
       * Add a delegated event listener for when elememts that open or close the
       * dialog are clicked, and call `show` or `hide`, respectively
       */
      handleTriggerClicks(event) {
          // We need to retrieve the click target while accounting for Shadow DOM.
          // When within a web component, `event.target` is the shadow root (e.g.
          // `<my-dialog>`), so we need to use `event.composedPath()` to get the click
          // target
          // See: https://github.com/KittyGiraudel/a11y-dialog/issues/582
          const target = event.composedPath()[0];
          const opener = closest(`[${SCOPE}-show="${this.id}"]`, target);
          const explicitCloser = closest(`[${SCOPE}-hide="${this.id}"]`, target);
          const implicitCloser = closest(`[${SCOPE}-hide]`, target) &&
              closest('[aria-modal="true"]', target) === this.$el;
          // We use `closest(..)` (instead of `matches(..)`) so that clicking an
          // element nested within a dialog opener does cause the dialog to open, and
          // we use our custom `closest(..)` function so that it can cross shadow
          // boundaries
          // See: https://github.com/KittyGiraudel/a11y-dialog/issues/712
          if (opener)
              this.show(event);
          if (explicitCloser || implicitCloser)
              this.hide(event);
      }
      /**
       * Private event handler used when listening to some specific key presses
       * (namely ESC and TAB)
       */
      bindKeypress(event) {
          // This is an escape hatch in case there are nested open dialogs, so that
          // only the top most dialog gets interacted with (`closest` is basically
          // `Element.prototype.closest()` accounting for Shadow DOM subtrees)
          if (closest('[aria-modal="true"]', getActiveEl()) !== this.$el) {
              return;
          }
          let hasOpenPopover = false;
          try {
              hasOpenPopover = !!this.$el.querySelector('[popover]:not([popover="manual"]):popover-open');
          }
          catch {
              // Run that DOM query in a try/catch because not all browsers support the
              // `:popover-open` selector, which would cause the whole expression to
              // fail
              // See: https://caniuse.com/mdn-css_selectors_popover-open
              // See: https://github.com/KittyGiraudel/a11y-dialog/pull/578#discussion_r1343215149
          }
          // If the dialog is shown and the ESC key is pressed, prevent any further
          // effects from the ESC key and hide the dialog, unless:
          // - its role is `alertdialog`, which means it should be modal
          // - or it contains an open popover, in which case ESC should close it
          if (event.key === 'Escape' &&
              this.$el.getAttribute('role') !== 'alertdialog' &&
              !hasOpenPopover) {
              event.preventDefault();
              this.hide(event);
          }
          // If the dialog is shown and the TAB key is pressed, make sure the focus
          // stays trapped within the dialog element
          if (event.key === 'Tab') {
              trapTabKey(this.$el, event);
          }
      }
      /**
       * If the dialog is shown and the focus is not within a dialog element (either
       * this one or another one in case of nested dialogs) or an element with the
       * ignore attribute, move it back to the dialog container
       * See: https://github.com/KittyGiraudel/a11y-dialog/issues/177
       */
      maintainFocus() {
          // We use `getActiveEl()` and not `event.target` here because the latter can
          // be a shadow root. This can happen when having a focusable element after
          // slotted content: tabbing out of it causes this focus listener to trigger
          // with the shadow root as a target event. In such a case, the focus would
          // be incorrectly moved to the dialog, which shouldn’t happen. Getting the
          // active element (while accounting for Shadow DOM) avoids that problem.
          // See: https://github.com/KittyGiraudel/a11y-dialog/issues/778
          const target = getActiveEl();
          if (!closest(`[aria-modal="true"], [${SCOPE}-ignore-focus-trap]`, target)) {
              focus(this.$el);
          }
      }
  }

  function instantiateDialogs() {
      for (const el of document.querySelectorAll('[data-a11y-dialog]')) {
          new A11yDialog(el);
      }
  }
  if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', instantiateDialogs);
      }
      else {
          instantiateDialogs();
      }
  }

  return A11yDialog;

}));
