# 🍽️ Menu AR Restaurant - Optimisation Tracking 8th Wall

Application WebAR optimisée pour afficher des plats de restaurant en 3D avec tracking ultra-stable.

## 🎯 Fonctionnalités Principales

### ✅ Stabilité du Tracking
- **Lock de position** : Ancrage ferme du modèle après placement pour réduire le drift
- **Position smoother** : Filtrage intelligent des micro-jitters sans effet "gluant"
- **Scale lock** : Taille constante du modèle (pas de "respiration") malgré les mouvements de caméra

### 🎮 Gestures Optimisés
- **Tap to place** : Placement simple d'un tap sur la surface détectée
- **Pinch-to-zoom** : Zoom/dézoom avec 2 doigts MALGRÉ le scale absolute
- **Two-finger rotate** : Rotation fluide du modèle avec 2 doigts
- **Drag to move** : Maintenez (300ms) puis glissez pour repositionner

### 📊 Monitoring
- **Tracking quality indicator** : Badge en temps réel de la qualité du tracking
- **Instructions contextuelles** : Aide adaptative selon l'état de l'application

---

## 🚀 Setup dans 8th Wall Cloud Editor

### 1. Créer un Nouveau Projet

1. Connectez-vous sur [8th Wall Console](https://console.8thwall.com/)
2. Cliquez sur **"Create New Project"**
3. Sélectionnez **"A-Frame"** comme framework
4. Nommez votre projet (ex: "menu-ar-restaurant")

### 2. Uploader les Fichiers

Dans l'éditeur 8th Wall, uploadez les 3 fichiers :

```
📁 Projet
├── index.html        ← Fichier principal
├── components.js     ← Composants AR
└── styles.css        ← Styles UI
```

**Comment uploader :**
- Cliquez sur **"+"** ou **"Add File"**
- Sélectionnez **"Upload File"**
- Uploadez chaque fichier un par un

### 3. Configuration de l'App Key

⚠️ **IMPORTANT** : Remplacez `YOUR_APP_KEY_HERE` dans `index.html` ligne 11 :

```html
<!-- Avant -->
<script async src="//apps.8thwall.com/xrweb?appKey=YOUR_APP_KEY_HERE"></script>

<!-- Après (utilisez votre vraie App Key) -->
<script async src="//apps.8thwall.com/xrweb?appKey=VOTRE_CLE_ICI"></script>
```

**Où trouver votre App Key :**
1. Dans 8th Wall Console, allez dans votre projet
2. Cliquez sur **"Settings"** ou **"App Key"**
3. Copiez la clé (format: `XXXXXXXXXXXXXXX`)

### 4. Ajouter un Modèle 3D (Optionnel)

Le projet inclut un placeholder (burger stylisé) pour les tests. Pour utiliser votre propre modèle :

#### Option A : Upload de fichier GLB/GLTF

1. **Uploadez votre modèle 3D** dans 8th Wall Cloud Editor
   - Format recommandé : `.glb` (optimisé)
   - Taille max : 5-10 MB pour bonnes performances

2. **Dans index.html**, décommentez et modifiez la section assets (ligne 35-37) :

```html
<a-assets>
  <a-asset-item id="dish-model" src="./models/votre-plat.glb"></a-asset-item>
</a-assets>
```

3. **Remplacez le placeholder** (ligne 92-138) par :

```html
<a-gltf-model
  src="#dish-model"
  position="0 0 0"
  scale="0.1 0.1 0.1"
  shadow="cast: true; receive: true">
</a-gltf-model>
```

#### Option B : Utiliser une URL externe

```html
<a-assets>
  <a-asset-item id="dish-model" src="https://example.com/models/dish.glb"></a-asset-item>
</a-assets>
```

**Recommandations pour les modèles 3D :**
- **Format** : GLB (GLTF binaire compressé)
- **Taille** : < 5 MB idéalement
- **Polygones** : 10k-50k triangles max
- **Textures** : 1024x1024 ou 2048x2048 max
- **Optimisations** : Utilisez [gltf-transform](https://gltf-transform.donmccurdy.com/) pour compresser

---

## 📱 Test de l'Application

### 1. Publier le Projet

1. Dans 8th Wall Cloud Editor, cliquez sur **"Publish"**
2. Votre projet sera disponible à l'URL : `https://VOTRE_PROJET.8thwall.app/`

### 2. Générer un QR Code

1. Copiez l'URL de votre projet
2. Utilisez un générateur de QR code : [QR Code Generator](https://www.qr-code-generator.com/)
3. Imprimez le QR code pour vos tests

### 3. Scanner avec Mobile

1. **Ouvrez la caméra** de votre smartphone (iOS Safari ou Android Chrome)
2. **Scannez le QR code** généré
3. **Autorisez l'accès** à la caméra et aux capteurs de mouvement
4. **Bougez le téléphone** pour scanner l'environnement

### 4. Test du Tracking

**Étapes de test :**

1. ✅ **Placement initial**
   - Un réticule vert apparaît au centre de l'écran
   - Pointez vers une surface horizontale (table, sol)
   - Tapez pour placer le modèle

2. ✅ **Test de stabilité**
   - Bougez votre téléphone en cercle (360°)
   - Le modèle doit rester stable (drift < 2-3 cm acceptable)
   - Éloignez/rapprochez : le modèle ne doit PAS changer de taille

3. ✅ **Test des gestures**
   - **Pinch** : Pincez avec 2 doigts → zoom/dézoom fonctionnel
   - **Rotate** : Rotez avec 2 doigts → rotation du modèle
   - **Drag** : Maintenez 300ms puis glissez → déplacement

4. ✅ **Monitoring**
   - Vérifiez le badge de tracking en haut :
     - 🟢 "Bon tracking" = OK
     - 🟡 "Tracking OK" = Acceptable
     - 🔴 "Qualité limitée" = Bougez plus pour améliorer

---

## 🔧 Optimisations Avancées

### Ajuster le Smoothing

Dans `index.html` ligne 86, modifiez le paramètre `factor` :

```html
position-smoother="enabled: true; factor: 0.15"
```

- **0.05** : Smoothing fort (plus stable mais moins réactif)
- **0.15** : Balance (recommandé)
- **0.30** : Smoothing léger (plus réactif mais peut jitter)

### Ajuster le Pinch Range

Dans `index.html` ligne 85, modifiez les limites :

```html
pinch-scale="min: 0.5; max: 3.0; initial: 1.0"
```

- **min** : Taille minimale (0.5 = 50%)
- **max** : Taille maximale (3.0 = 300%)
- **initial** : Taille de départ (1.0 = 100%)

### Désactiver le Drag

Si vous voulez un modèle fixe après placement :

```html
drag-to-move="enabled: false"
```

### Ajuster le Délai de Drag

Dans `components.js` ligne 366, modifiez :

```javascript
this.dragThreshold = 300; // ms - hold time before drag starts
```

- **200** : Drag rapide (peut causer des placements accidentels)
- **300** : Balance (recommandé)
- **500** : Drag lent (plus intentionnel)

---

## 🐛 Troubleshooting

### Le modèle drift beaucoup

**Solutions :**
1. Améliorez l'éclairage de la scène
2. Évitez les surfaces uniformes (ajoutez des textures/objets)
3. Bougez lentement au début pour que le SLAM se calibre
4. Augmentez le `correctionFactor` dans `tap-to-place` (ligne 214) : `0.05` → `0.1`

### Le smoothing est trop "gluant"

**Solutions :**
1. Augmentez le `factor` dans `position-smoother` : `0.15` → `0.25`
2. Désactivez temporairement : `position-smoother="enabled: false"`

### Le modèle "respire" quand je bouge

**Solutions :**
1. Vérifiez que `scale-lock` est activé
2. Vérifiez qu'il n'y a pas de conflits avec d'autres composants
3. Le pinch-scale ne doit être actif QUE pendant le pinch

### Pas de réticule visible

**Solutions :**
1. Vérifiez que vous pointez vers une surface horizontale
2. Améliorez l'éclairage
3. Bougez le téléphone pour scanner l'environnement

### Les gestures ne fonctionnent pas

**Solutions :**
1. Vérifiez que le modèle est placé (après le tap)
2. Les gestures 2 doigts peuvent se chevaucher : essayez séparément
3. Sur iOS, assurez-vous d'autoriser les capteurs de mouvement

### Erreur "App Key invalid"

**Solutions :**
1. Vérifiez que vous avez remplacé `YOUR_APP_KEY_HERE`
2. Copiez-collez la clé depuis 8th Wall Console
3. Assurez-vous qu'il n'y a pas d'espaces avant/après

---

## 📐 Architecture des Composants

```
components.js
├── ar-hit-test              → Détection de surface
├── ar-tracking-quality      → Monitoring du tracking
├── tap-to-place             → Placement + locking
├── pinch-scale              → Zoom 2 doigts
├── two-finger-rotate        → Rotation 2 doigts
├── drag-to-move             → Déplacement 1 doigt
├── position-smoother        → Anti-jitter
└── scale-lock               → Anti-respiration
```

### Ordre d'Exécution

1. **ar-hit-test** : Détecte la surface en continu
2. **tap-to-place** : Place le modèle au tap
3. **position-smoother** : Lisse les mouvements
4. **scale-lock** : Force le scale constant (sauf pendant pinch)
5. **pinch-scale** : Gère le zoom utilisateur
6. **two-finger-rotate** : Gère la rotation
7. **drag-to-move** : Gère le déplacement

---

## 🎨 Personnalisation UI

### Modifier les Couleurs

Dans `styles.css` :

```css
/* Background overlay */
.instruction-card {
  background: rgba(0, 0, 0, 0.85); /* Noir transparent */
}

/* Badge tracking - bon état */
.tracking-badge.tracking-good {
  background: rgba(34, 197, 94, 0.3);
  color: #86efac;
}
```

### Changer les Textes

Dans `index.html` ligne 31 :

```html
<h2>🍽️ Menu AR Restaurant</h2>
<p id="instruction-text">Déplacez votre téléphone pour scanner l'environnement...</p>
```

### Masquer les Instructions

Ajoutez dans `styles.css` :

```css
.overlay {
  display: none !important;
}
```

---

## 📊 Performances

### Cibles Recommandées

- **FPS** : 30-60 fps (vérifiez dans les dev tools)
- **Drift** : < 3 cm après 360° complet
- **Latency** : < 100ms pour les gestures
- **Memory** : < 150 MB

### Optimisation Modèle 3D

**Avant upload :**

```bash
# Installer gltf-transform
npm install -g @gltf-transform/cli

# Optimiser le modèle
gltf-transform optimize input.glb output.glb \
  --texture-compress webp \
  --simplify \
  --deduplicate
```

### Monitoring Performance

Ajoutez dans `index.html` avant `</a-scene>` :

```html
<a-entity stats></a-entity>
```

---

## 📚 Ressources

- [8th Wall Documentation](https://www.8thwall.com/docs)
- [A-Frame Documentation](https://aframe.io/docs/)
- [GLTF Optimization](https://gltf-transform.donmccurdy.com/)
- [WebAR Best Practices](https://www.8thwall.com/blog/post/49/5-tips-for-building-great-webar-experiences)

---

## 🔐 Limitations & Notes

### Limitations 8th Wall

- **Pas d'image target** dans cette version (world tracking uniquement)
- **Pas d'occlusion** native (le modèle reste visible sous la table)
- **Drift** : 2-5 cm acceptable après plusieurs minutes sur surfaces uniformes

### Occlusion (Future Amélioration)

Pour implémenter l'occlusion :
1. Utiliser **8th Wall Mesh** (plan payant)
2. Ou passer à **WebXR Device API** (support limité)
3. Ou ajouter un **depth sensing** manuel (complexe)

### Compatibilité

- ✅ **iOS 13+** : Safari (recommandé)
- ✅ **Android 8+** : Chrome (WebARCore required)
- ❌ **Desktop** : Non supporté (nécessite mobile AR)

---

## 📝 License

Ce code est fourni pour usage éducatif et commercial. Libre d'utilisation avec attribution.

---

## 🤝 Support

Pour toute question ou bug :
1. Vérifiez la section Troubleshooting
2. Consultez la [8th Wall Community](https://community.8thwall.com/)
3. Testez avec le placeholder avant votre modèle custom

---

**Bon développement AR ! 🚀**
