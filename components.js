/**
 * AR Restaurant Menu - Advanced Tracking Stability Components
 * Optimized for 8th Wall WebAR with A-Frame
 */

/* ========================================
   AR HIT TEST COMPONENT
   Détecte les surfaces pour le placement
   ======================================== */
AFRAME.registerComponent('ar-hit-test', {
  init: function() {
    this.hitTestResults = null;
    this.hitTestSource = null;
    this.reticle = document.getElementById('reticle');

    // Wait for XR8 to be ready
    this.el.sceneEl.addEventListener('realityready', () => {
      this.setupHitTest();
    });
  },

  setupHitTest: function() {
    const scene = this.el.sceneEl;

    // 8th Wall specific hit test setup
    scene.addEventListener('enter-vr', () => {
      this.initializeHitTest();
    });
  },

  initializeHitTest: function() {
    this.hitTestActive = true;
  },

  tick: function() {
    if (!this.hitTestActive) return;

    // Use XR8 surface detection
    if (window.XR8 && XR8.XrController) {
      const processCpuResult = XR8.processCpu.reality();

      if (processCpuResult && processCpuResult.realityTexture) {
        // Get device pose
        const frame = XR8.XrController.poseController().position;

        // Simple raycasting from camera
        this.performSimpleRaycast();
      }
    }
  },

  performSimpleRaycast: function() {
    const camera = this.el.sceneEl.camera;
    const raycaster = new THREE.Raycaster();

    // Cast ray from camera center (0, 0) in NDC
    raycaster.setFromCamera(new THREE.Vector2(0, -0.2), camera);

    // Create virtual ground plane at reasonable distance
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hitPoint = new THREE.Vector3();

    raycaster.ray.intersectPlane(groundPlane, hitPoint);

    if (hitPoint && this.reticle) {
      // Position reticle at hit point
      this.reticle.object3D.position.copy(hitPoint);
      this.reticle.setAttribute('visible', true);

      // Store hit test result for placement
      this.hitTestResults = {
        position: hitPoint.clone(),
        rotation: new THREE.Quaternion()
      };
    }
  }
});

/* ========================================
   AR TRACKING QUALITY MONITOR
   Surveille la qualité du tracking
   ======================================== */
AFRAME.registerComponent('ar-tracking-quality', {
  init: function() {
    this.lastQuality = null;
    this.checkInterval = 500; // ms
    this.lastCheck = 0;
  },

  tick: function(time) {
    if (time - this.lastCheck < this.checkInterval) return;
    this.lastCheck = time;

    if (window.XR8 && XR8.XrController) {
      const tracking = XR8.XrController.poseController();

      if (tracking) {
        // Estimate quality based on tracking state
        let quality = 'limited';

        if (tracking.position && tracking.rotation) {
          // Check if we have good tracking data
          const hasMovement = Math.abs(tracking.position.x) > 0.01 ||
                             Math.abs(tracking.position.z) > 0.01;

          quality = hasMovement ? 'good' : 'normal';
        }

        if (quality !== this.lastQuality) {
          this.lastQuality = quality;
          window.dispatchEvent(new CustomEvent('tracking-quality-change', {
            detail: { quality }
          }));
        }
      }
    }
  }
});

/* ========================================
   TAP TO PLACE WITH LOCKING
   Placement et ancrage du modèle
   ======================================== */
AFRAME.registerComponent('tap-to-place', {
  schema: {
    reticleId: { type: 'string', default: '#reticle' }
  },

  init: function() {
    this.placed = false;
    this.locked = false;
    this.anchorPosition = new THREE.Vector3();
    this.anchorRotation = new THREE.Quaternion();

    // Bind event handlers
    this.onTouchStart = this.onTouchStart.bind(this);

    // Wait for scene to be ready
    this.el.sceneEl.addEventListener('loaded', () => {
      this.setupEventListeners();
    });
  },

  setupEventListeners: function() {
    const canvas = this.el.sceneEl.canvas;
    canvas.addEventListener('touchstart', this.onTouchStart);
  },

  onTouchStart: function(event) {
    // Only handle single tap for placement
    if (event.touches.length !== 1) return;
    if (this.placed) return;

    const hitTest = this.el.sceneEl.components['ar-hit-test'];

    if (hitTest && hitTest.hitTestResults) {
      const hit = hitTest.hitTestResults;

      // Place the model at hit position
      this.el.object3D.position.copy(hit.position);
      this.el.object3D.quaternion.copy(hit.rotation);

      // Store anchor point
      this.anchorPosition.copy(hit.position);
      this.anchorRotation.copy(hit.rotation);

      // Make visible and mark as placed
      this.el.setAttribute('visible', true);
      this.placed = true;

      // Lock after short delay to allow initial stabilization
      setTimeout(() => {
        this.locked = true;
        console.log('Model locked at:', this.anchorPosition);
      }, 500);

      // Hide reticle
      const reticle = document.querySelector(this.data.reticleId);
      if (reticle) {
        reticle.setAttribute('visible', false);
      }

      // Dispatch event
      window.dispatchEvent(new CustomEvent('model-placed'));
    }
  },

  tick: function() {
    if (!this.placed || !this.locked) return;

    // Anchor model to world position (reduce drift)
    // Use small correction factor to avoid sudden jumps
    const currentPos = this.el.object3D.position;
    const correctionFactor = 0.05; // 5% correction per frame

    currentPos.lerp(this.anchorPosition, correctionFactor);
  },

  remove: function() {
    const canvas = this.el.sceneEl.canvas;
    canvas.removeEventListener('touchstart', this.onTouchStart);
  }
});

/* ========================================
   PINCH TO SCALE
   Zoom/dézoom avec 2 doigts
   ======================================== */
AFRAME.registerComponent('pinch-scale', {
  schema: {
    min: { type: 'number', default: 0.5 },
    max: { type: 'number', default: 3.0 },
    initial: { type: 'number', default: 1.0 }
  },

  init: function() {
    this.initialDistance = 0;
    this.currentScale = this.data.initial;
    this.baseScale = this.data.initial;
    this.isPinching = false;

    // Bind events
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    const canvas = this.el.sceneEl.canvas;
    canvas.addEventListener('touchstart', this.onTouchStart);
    canvas.addEventListener('touchmove', this.onTouchMove);
    canvas.addEventListener('touchend', this.onTouchEnd);
  },

  onTouchStart: function(event) {
    if (event.touches.length === 2) {
      this.isPinching = true;
      this.initialDistance = this.getDistance(event.touches[0], event.touches[1]);
      this.baseScale = this.currentScale;
      event.preventDefault();
    }
  },

  onTouchMove: function(event) {
    if (!this.isPinching || event.touches.length !== 2) return;

    const currentDistance = this.getDistance(event.touches[0], event.touches[1]);
    const scale = (currentDistance / this.initialDistance) * this.baseScale;

    // Clamp scale
    this.currentScale = THREE.MathUtils.clamp(scale, this.data.min, this.data.max);

    // Apply scale
    this.el.object3D.scale.set(
      this.currentScale,
      this.currentScale,
      this.currentScale
    );

    event.preventDefault();
  },

  onTouchEnd: function(event) {
    if (event.touches.length < 2) {
      this.isPinching = false;
    }
  },

  getDistance: function(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  remove: function() {
    const canvas = this.el.sceneEl.canvas;
    canvas.removeEventListener('touchstart', this.onTouchStart);
    canvas.removeEventListener('touchmove', this.onTouchMove);
    canvas.removeEventListener('touchend', this.onTouchEnd);
  }
});

/* ========================================
   TWO FINGER ROTATE
   Rotation avec 2 doigts
   ======================================== */
AFRAME.registerComponent('two-finger-rotate', {
  init: function() {
    this.isRotating = false;
    this.initialAngle = 0;
    this.currentRotation = 0;
    this.baseRotation = 0;
    this.rotationThreshold = 10; // degrees minimum before rotation starts

    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    const canvas = this.el.sceneEl.canvas;
    canvas.addEventListener('touchstart', this.onTouchStart);
    canvas.addEventListener('touchmove', this.onTouchMove);
    canvas.addEventListener('touchend', this.onTouchEnd);
  },

  onTouchStart: function(event) {
    if (event.touches.length === 2) {
      const pinchComponent = this.el.components['pinch-scale'];
      if (!pinchComponent || !pinchComponent.isPinching) {
        this.isRotating = true;
        this.initialAngle = this.getAngle(event.touches[0], event.touches[1]);
        this.baseRotation = this.currentRotation;
      }
    }
  },

  onTouchMove: function(event) {
    if (!this.isRotating || event.touches.length !== 2) return;

    const currentAngle = this.getAngle(event.touches[0], event.touches[1]);
    let deltaAngle = currentAngle - this.initialAngle;

    // Normalize angle to -180 to 180
    while (deltaAngle > 180) deltaAngle -= 360;
    while (deltaAngle < -180) deltaAngle += 360;

    // Apply threshold to avoid accidental rotation
    if (Math.abs(deltaAngle) > this.rotationThreshold) {
      this.currentRotation = this.baseRotation + deltaAngle;

      // Apply rotation (Y-axis)
      const radians = THREE.MathUtils.degToRad(this.currentRotation);
      this.el.object3D.rotation.y = radians;

      event.preventDefault();
    }
  },

  onTouchEnd: function(event) {
    if (event.touches.length < 2) {
      this.isRotating = false;
    }
  },

  getAngle: function(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  },

  remove: function() {
    const canvas = this.el.sceneEl.canvas;
    canvas.removeEventListener('touchstart', this.onTouchStart);
    canvas.removeEventListener('touchmove', this.onTouchMove);
    canvas.removeEventListener('touchend', this.onTouchEnd);
  }
});

/* ========================================
   DRAG TO MOVE
   Déplacement du modèle avec un doigt
   ======================================== */
AFRAME.registerComponent('drag-to-move', {
  schema: {
    enabled: { type: 'boolean', default: true }
  },

  init: function() {
    this.isDragging = false;
    this.dragStartTime = 0;
    this.dragThreshold = 300; // ms - hold time before drag starts
    this.touchStartPos = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.raycaster = new THREE.Raycaster();

    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    const canvas = this.el.sceneEl.canvas;
    canvas.addEventListener('touchstart', this.onTouchStart);
    canvas.addEventListener('touchmove', this.onTouchMove);
    canvas.addEventListener('touchend', this.onTouchEnd);
  },

  onTouchStart: function(event) {
    if (event.touches.length !== 1) return;
    if (!this.data.enabled) return;

    const tapToPlace = this.el.components['tap-to-place'];
    if (!tapToPlace || !tapToPlace.placed) return;

    this.dragStartTime = Date.now();
    this.touchStartPos.set(event.touches[0].clientX, event.touches[0].clientY);

    // Start drag after threshold
    this.dragTimeout = setTimeout(() => {
      this.isDragging = true;
    }, this.dragThreshold);
  },

  onTouchMove: function(event) {
    if (!this.isDragging || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const camera = this.el.sceneEl.camera;

    // Convert touch to NDC
    const rect = this.el.sceneEl.canvas.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast from camera
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // Intersect with horizontal plane at model's Y position
    this.dragPlane.constant = -this.el.object3D.position.y;
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.dragPlane, intersection);

    if (intersection) {
      // Update position
      this.el.object3D.position.x = intersection.x;
      this.el.object3D.position.z = intersection.z;

      // Update anchor if model is locked
      const tapToPlace = this.el.components['tap-to-place'];
      if (tapToPlace && tapToPlace.locked) {
        tapToPlace.anchorPosition.copy(this.el.object3D.position);
      }
    }

    event.preventDefault();
  },

  onTouchEnd: function(event) {
    clearTimeout(this.dragTimeout);
    this.isDragging = false;
  },

  remove: function() {
    const canvas = this.el.sceneEl.canvas;
    canvas.removeEventListener('touchstart', this.onTouchStart);
    canvas.removeEventListener('touchmove', this.onTouchMove);
    canvas.removeEventListener('touchend', this.onTouchEnd);
  }
});

/* ========================================
   POSITION SMOOTHER
   Smoothing intelligent pour réduire jitter
   ======================================== */
AFRAME.registerComponent('position-smoother', {
  schema: {
    enabled: { type: 'boolean', default: true },
    factor: { type: 'number', default: 0.15 } // 0 = no smoothing, 1 = instant
  },

  init: function() {
    this.targetPosition = new THREE.Vector3();
    this.smoothedPosition = new THREE.Vector3();
    this.initialized = false;
    this.velocityThreshold = 0.01; // m/s - below this, apply stronger smoothing
  },

  tick: function(time, deltaTime) {
    if (!this.data.enabled) return;

    const tapToPlace = this.el.components['tap-to-place'];
    if (!tapToPlace || !tapToPlace.placed) return;

    const currentPos = this.el.object3D.position;

    // Initialize smoothed position
    if (!this.initialized) {
      this.smoothedPosition.copy(currentPos);
      this.targetPosition.copy(currentPos);
      this.initialized = true;
      return;
    }

    // Calculate velocity
    const velocity = this.targetPosition.distanceTo(currentPos) / (deltaTime / 1000);

    // Adaptive smoothing based on velocity
    let smoothFactor = this.data.factor;
    if (velocity < this.velocityThreshold) {
      // Stronger smoothing for micro-movements (jitter)
      smoothFactor = this.data.factor * 0.5;
    }

    // Apply smoothing
    this.targetPosition.copy(currentPos);
    this.smoothedPosition.lerp(this.targetPosition, smoothFactor);

    // Only apply if difference is significant (avoid float precision issues)
    const distance = this.smoothedPosition.distanceTo(currentPos);
    if (distance > 0.0001) {
      currentPos.copy(this.smoothedPosition);
    }
  }
});

/* ========================================
   SCALE LOCK
   Maintien du scale absolu (anti-respiration)
   ======================================== */
AFRAME.registerComponent('scale-lock', {
  schema: {
    enabled: { type: 'boolean', default: true }
  },

  init: function() {
    this.lockedScale = new THREE.Vector3(1, 1, 1);
    this.initialized = false;
  },

  tick: function() {
    if (!this.data.enabled) return;

    const tapToPlace = this.el.components['tap-to-place'];
    if (!tapToPlace || !tapToPlace.placed) return;

    // Initialize locked scale after placement
    if (!this.initialized) {
      this.lockedScale.copy(this.el.object3D.scale);
      this.initialized = true;
      return;
    }

    // Check if scale was modified by pinch-scale component
    const pinchScale = this.el.components['pinch-scale'];
    if (pinchScale && pinchScale.isPinching) {
      // Update locked scale when user is actively pinching
      this.lockedScale.copy(this.el.object3D.scale);
    } else {
      // Otherwise, enforce locked scale to prevent "breathing"
      const currentScale = this.el.object3D.scale;

      // Only enforce if difference is significant
      const scaleDiff = Math.abs(currentScale.x - this.lockedScale.x);
      if (scaleDiff > 0.001) {
        currentScale.copy(this.lockedScale);
      }
    }
  }
});

/* ========================================
   INITIALIZATION
   ======================================== */
console.log('AR Restaurant Menu Components Loaded');
console.log('Components: ar-hit-test, ar-tracking-quality, tap-to-place, pinch-scale, two-finger-rotate, drag-to-move, position-smoother, scale-lock');
