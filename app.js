// Copyright (c) 2022 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall web app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

/* ========================================
   SCALE LOCK COMPONENT
   Empêche la "respiration" du modèle tout en gardant pinch-to-scale fonctionnel
   ======================================== */
AFRAME.registerComponent('scale-lock', {
  schema: {
    enabled: { type: 'boolean', default: true }
  },

  init: function() {
    this.lockedScale = new THREE.Vector3();
    this.initialized = false;
    this.isPinching = false;

    // Bind touch event handlers to detect pinching
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    // Wait for scene to be ready
    this.el.sceneEl.addEventListener('loaded', () => {
      const canvas = this.el.sceneEl.canvas;
      if (canvas) {
        canvas.addEventListener('touchstart', this.onTouchStart);
        canvas.addEventListener('touchend', this.onTouchEnd);
      }
    });
  },

  onTouchStart: function(event) {
    // Detect if user is pinching (2 fingers)
    if (event.touches.length === 2) {
      this.isPinching = true;
    }
  },

  onTouchEnd: function(event) {
    // Stop pinching when less than 2 fingers
    if (event.touches.length < 2) {
      // Update locked scale when pinch ends
      if (this.isPinching) {
        this.lockedScale.copy(this.el.object3D.scale);
        this.isPinching = false;
      }
    }
  },

  tick: function() {
    if (!this.data.enabled) return;

    const currentScale = this.el.object3D.scale;

    // Initialize locked scale on first tick
    if (!this.initialized) {
      this.lockedScale.copy(currentScale);
      this.initialized = true;
      return;
    }

    // If user is pinching, update locked scale continuously
    if (this.isPinching) {
      this.lockedScale.copy(currentScale);
    } else {
      // Otherwise, enforce locked scale to prevent "breathing"
      // Only enforce if difference is significant (avoid float precision issues)
      const scaleDiff = Math.abs(currentScale.x - this.lockedScale.x);
      if (scaleDiff > 0.001) {
        currentScale.copy(this.lockedScale);
      }
    }
  },

  remove: function() {
    const canvas = this.el.sceneEl.canvas;
    if (canvas) {
      canvas.removeEventListener('touchstart', this.onTouchStart);
      canvas.removeEventListener('touchend', this.onTouchEnd);
    }
  }
});

console.log('Scale Lock Component Loaded - Prevents model breathing while allowing pinch-to-scale');
