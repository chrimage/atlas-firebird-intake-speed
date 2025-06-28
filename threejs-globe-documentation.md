# Three.js Spinning Globe Implementation Documentation
## Atlas Divisions Interactive World Globe

### Overview
This documentation covers the complete implementation of a Three.js-powered interactive spinning globe featured on the Atlas Divisions website. The globe serves as a central visual element that combines real-world geographic data with branded styling and smooth animations.

---

## 🏗️ Technical Architecture

### Core Dependencies
- **Three.js**: Version r162
- **CDN Source**: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r162/three.min.js`
- **External Data**: GeoJSON world map data from GitHub
- **Fallback**: Simplified continent mapping system

### HTML Structure
```html
<div class="hero-globe">
    <div id="globe-container"></div>
</div>
```

### CSS Container Configuration
```css
#globe-container {
    width: 400px;
    height: 400px;
    position: relative;
    margin: 0 auto;
    filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.3));
    animation: float 6s ease-in-out infinite;
}

#globe-container:hover {
    transform: scale(1.05);
}
```

---

## 🎨 Visual Design System

### Brand Color Integration
```css
:root {
    --color-accent-gold: #d4af37;    /* Land masses */
    --color-accent-bronze: #cd7f32;  /* Country borders */
    --ocean-blue: #001122;           /* Ocean color */
}
```

### Visual Effects
- **Floating Animation**: 6-second vertical oscillation (-20px range)
- **Golden Glow**: Drop-shadow effect with brand gold color
- **Hover Scaling**: 1.05x transform on mouse hover
- **Atmospheric Glow**: Outer sphere with back-side rendering

---

## 🌍 Three.js Implementation

### Scene Setup
```javascript
function initGlobe() {
    const container = document.getElementById('globe-container');
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    
    // Core Three.js components
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(renderer.domElement);
}
```

### Globe Geometry
```javascript
const geometry = new THREE.SphereGeometry(1.5, 64, 64);
```
- **Radius**: 1.5 units
- **Width Segments**: 64 (high resolution)
- **Height Segments**: 64 (smooth curvature)

---

## 🗺️ World Map Texture System

### Dual-Source Approach

#### Primary: GeoJSON Data
```javascript
async function fetchWorldMap() {
    const response = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
    if (!response.ok) throw new Error('Failed to fetch world map');
    return await response.json();
}
```

#### Canvas Texture Generation
```javascript
const canvas = document.createElement('canvas');
canvas.width = 2048;   // High resolution
canvas.height = 1024;  // 2:1 aspect ratio (equirectangular projection)
const ctx = canvas.getContext('2d');

// Ocean background
ctx.fillStyle = '#001122';
ctx.fillRect(0, 0, canvas.width, canvas.height);
```

#### Geographic Data Processing
```javascript
function drawWorldMap(ctx, worldData, width, height) {
    ctx.fillStyle = '#d4af37'; // Atlas gold for land
    ctx.strokeStyle = '#cd7f32'; // Atlas bronze for borders
    ctx.lineWidth = 1;
    
    worldData.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
            drawPolygon(ctx, feature.geometry.coordinates[0], width, height);
        } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach(polygon => {
                drawPolygon(ctx, polygon[0], width, height);
            });
        }
    });
}
```

#### Coordinate Transformation
```javascript
function drawPolygon(ctx, coordinates, width, height) {
    ctx.beginPath();
    coordinates.forEach((coord, index) => {
        // Convert lat/lng to canvas coordinates
        const x = ((coord[0] + 180) / 360) * width;
        const y = ((90 - coord[1]) / 180) * height;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}
```

### Fallback System
```javascript
function drawFallbackMap(ctx, width, height) {
    const continents = [
        { name: 'North America', x: 0.2, y: 0.3, w: 0.25, h: 0.4 },
        { name: 'South America', x: 0.25, y: 0.5, w: 0.15, h: 0.35 },
        { name: 'Europe', x: 0.48, y: 0.25, w: 0.12, h: 0.15 },
        { name: 'Africa', x: 0.5, y: 0.35, w: 0.15, h: 0.4 },
        { name: 'Asia', x: 0.6, y: 0.2, w: 0.3, h: 0.35 },
        { name: 'Australia', x: 0.75, y: 0.65, w: 0.12, h: 0.1 }
    ];
    
    continents.forEach(continent => {
        const x = continent.x * width;
        const y = continent.y * height;
        const w = continent.w * width;
        const h = continent.h * height;
        
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
    });
}
```

---

## 💡 Lighting System

### Ambient Lighting
```javascript
const ambientLight = new THREE.AmbientLight(0xd4af37, 0.4);
scene.add(ambientLight);
```
- **Color**: Atlas gold (`0xd4af37`)
- **Intensity**: 0.4 (subtle base illumination)

### Directional Lighting
```javascript
const directionalLight = new THREE.DirectionalLight(0xd4af37, 0.8);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);
```
- **Color**: Atlas gold (`0xd4af37`)
- **Intensity**: 0.8 (primary light source)
- **Position**: Upper-right positioning for natural shadow

### Atmospheric Effect
```javascript
const atmosphereGeometry = new THREE.SphereGeometry(1.6, 32, 32);
const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0xd4af37,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide
});
const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
scene.add(atmosphere);
```

---

## 🎮 Animation & Interaction

### Auto-Rotation
```javascript
function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (globe) {
        // Continuous rotation
        globe.rotation.y += 0.005;
        
        // Mouse interaction
        globe.rotation.x += (targetRotationX - globe.rotation.x) * 0.05;
        globe.rotation.y += (targetRotationY - globe.rotation.y) * 0.05;
    }
    
    renderer.render(scene, camera);
}
```

### Mouse Interaction
```javascript
function onMouseMove(event) {
    const container = document.getElementById('globe-container');
    const rect = container.getBoundingClientRect();
    
    // Normalize mouse coordinates to -1 to 1 range
    mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Apply rotation influence
    targetRotationX = mouseY * 0.1;
    targetRotationY = mouseX * 0.1;
}
```

### Animation Parameters
- **Auto-rotation Speed**: 0.005 radians per frame
- **Mouse Influence**: 0.1 multiplier for sensitivity
- **Interpolation Damping**: 0.05 for smooth transitions
- **Animation Loop**: `requestAnimationFrame` for 60fps

---

## 📱 Responsive Design

### Breakpoint System
```css
/* Desktop: 400px × 400px */
#globe-container {
    width: 400px;
    height: 400px;
}

/* Tablet: 768px breakpoint */
@media (max-width: 768px) {
    #globe-container {
        width: 250px;
        height: 250px;
    }
}

/* Mobile: 480px breakpoint */
@media (max-width: 480px) {
    #globe-container {
        width: 200px;
        height: 200px;
    }
}
```

### Dynamic Resize Handling
```javascript
function onWindowResize() {
    const container = document.getElementById('globe-container');
    if (!container) return;
    
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

window.addEventListener('resize', onWindowResize);
```

---

## ⚡ Performance Optimizations

### Resource Management
```javascript
// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});
```

### Error Handling
```javascript
fetchWorldMap().then(worldData => {
    drawWorldMap(ctx, worldData, canvas.width, canvas.height);
    // ... continue with globe creation
}).catch(error => {
    console.warn('Failed to load world map data, using fallback:', error);
    drawFallbackMap(ctx, canvas.width, canvas.height);
    // ... continue with fallback globe
});
```

### Optimization Techniques
1. **High-resolution geometry**: 64×64 segments for smooth appearance
2. **Efficient texture size**: 2048×1024 canvas for crisp detail
3. **Conditional rendering**: Error handling prevents crashes
4. **Animation cleanup**: Proper resource disposal
5. **Responsive adaptation**: Size scaling for performance

---

## 🎯 Implementation Features

### Core Features
- ✅ **Interactive 3D Globe**: Mouse-responsive rotation
- ✅ **Real Geographic Data**: Accurate country boundaries
- ✅ **Brand Integration**: Atlas Divisions color scheme
- ✅ **Atmospheric Effects**: Subtle glow and professional lighting
- ✅ **Responsive Design**: Mobile-optimized scaling
- ✅ **Performance Optimized**: 60fps animation with cleanup
- ✅ **Fallback System**: Graceful degradation for data failures
- ✅ **Smooth Animations**: Floating effect and continuous rotation

### Brand Alignment
- **Color Consistency**: Matches site-wide CSS variables
- **Visual Hierarchy**: Central placement in hero section
- **Symbolic Meaning**: Represents global reach and Atlas mythology
- **Professional Appearance**: Subtle effects without distraction

---

## 🔧 Usage Instructions

### Basic Integration
1. **Include Three.js**: Add CDN link to HTML head
2. **Create Container**: Add `div` with `id="globe-container"`
3. **Initialize**: Call `initGlobe()` after page load
4. **Cleanup**: Add event listeners for proper resource management

### Customization Options

#### Colors
```javascript
// Ocean color
ctx.fillStyle = '#001122';

// Land color
ctx.fillStyle = '#d4af37';

// Border color
ctx.strokeStyle = '#cd7f32';

// Lighting color
const ambientLight = new THREE.AmbientLight(0xd4af37, 0.4);
```

#### Animation Speed
```javascript
// Auto-rotation speed
globe.rotation.y += 0.005; // Adjust this value

// Mouse sensitivity
targetRotationX = mouseY * 0.1; // Adjust multiplier
targetRotationY = mouseX * 0.1;

// Interpolation smoothness
globe.rotation.x += (targetRotationX - globe.rotation.x) * 0.05; // Adjust damping
```

#### Size Configuration
```javascript
// Globe radius
const geometry = new THREE.SphereGeometry(1.5, 64, 64); // Adjust first parameter

// Camera distance
camera.position.z = 4; // Adjust distance
```

---

## 🐛 Troubleshooting

### Common Issues

#### Globe Not Appearing
- Check if Three.js CDN is loaded
- Verify container element exists with correct ID
- Ensure `initGlobe()` is called after DOM ready

#### Performance Issues
- Reduce sphere geometry segments for lower-end devices
- Decrease texture canvas size
- Implement frame rate limiting

#### Map Data Loading Failures
- Fallback system automatically handles GeoJSON failures
- Check console for network-related errors
- Verify external data source availability

---

## 📊 Technical Specifications

| Component | Specification |
|-----------|---------------|
| **Three.js Version** | r162 |
| **Sphere Radius** | 1.5 units |
| **Geometry Resolution** | 64×64 segments |
| **Texture Resolution** | 2048×1024 pixels |
| **Animation Frame Rate** | 60 FPS (requestAnimationFrame) |
| **Auto-rotation Speed** | 0.005 rad/frame |
| **Mouse Sensitivity** | 0.1 multiplier |
| **Interpolation Damping** | 0.05 factor |
| **Container Sizes** | 400px/250px/200px |

---

## 🔄 Future Enhancements

### Potential Improvements
1. **Country Highlighting**: Interactive country selection
2. **Location Markers**: Add pins for business locations
3. **Texture Variations**: Day/night cycles or satellite imagery
4. **Animation Controls**: Play/pause and speed adjustment
5. **Touch Gestures**: Mobile-specific interaction patterns
6. **Performance Modes**: Quality settings for different devices

### Advanced Features
- **WebGL2 Support**: Enhanced rendering capabilities
- **Shader Materials**: Custom lighting and effects
- **LOD System**: Level-of-detail for performance scaling
- **Data Visualization**: Overlay business metrics or statistics

---

## 📄 License & Credits

- **Three.js**: MIT License
- **GeoJSON Data**: D3 Graph Gallery (GitHub)
- **Implementation**: Atlas Divisions (Custom)
- **Brand Colors**: Atlas Divisions Brand Guidelines

---

*This documentation covers the complete Three.js spinning globe implementation for Atlas Divisions. The globe combines technical excellence with brand alignment to create an engaging and professional web experience.*