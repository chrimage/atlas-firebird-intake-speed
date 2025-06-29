/**
 * Homepage Template
 */

export async function getHomepageHTML(corsHeaders: Record<string, string>): Promise<Response> {
	// Complete Atlas Divisions homepage with Three.js globe
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atlas Divisions - Solutions That Outlast the Storm</title>
    <meta name="description" content="Atlas Divisions - Mapping Chaos, Building Resilience. Professional services in auto repair, logistics, AI tools, and emergency response.">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Three.js ES6 Module from CDNjs -->
    <script type="module">
        import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.177.0/three.module.min.js';
        window.THREE = THREE;
        
        // Set up Atlas Globe initialization function with enhanced error handling
        window.initAtlasGlobeWhenReady = function() {
            if (typeof AtlasGlobe !== 'undefined' && typeof THREE !== 'undefined') {
                try {
                    window.atlasGlobe = new AtlasGlobe();
                    console.log('Atlas Globe initialized successfully');
                } catch (error) {
                    console.error('Atlas Globe initialization failed:', error);
                    // Fallback to static globe emoji
                    const container = document.getElementById('globe-container');
                    if (container) {
                        container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#d4af37;font-size:8rem;animation:float 6s ease-in-out infinite;">🌍</div>';
                    }
                }
            }
        };
        
    </script>
    
    <style>
        :root {
            /* Atlas Divisions Brand Colors */
            --color-bg: #0a0a0a;
            --color-bg-secondary: #1a1a1a;
            --color-text: #ffffff;
            --color-text-secondary: #b8b8b8;
            --color-accent-gold: #d4af37;
            --color-accent-bronze: #cd7f32;
            --color-accent-teal: #008080;
            --emergency-red: #dc143c;
            --ocean-blue: #001122;
            
            /* Typography */
            --font-heading: 'Montserrat', sans-serif;
            --font-body: 'Inter', sans-serif;
            
            /* Effects */
            --border-radius: 8px;
            --border-radius-large: 12px;
            --transition: all 0.3s ease;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--font-body);
            background: var(--color-bg);
            color: var(--color-text);
            line-height: 1.6;
            overflow-x: hidden;
        }
        
        /* Navigation */
        .nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(212, 175, 55, 0.2);
            height: 70px;
        }
        
        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 100%;
        }
        
        .nav-brand {
            font-family: var(--font-heading);
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--color-accent-gold);
            text-decoration: none;
        }
        
        .nav-links {
            display: flex;
            list-style: none;
            gap: 2rem;
        }
        
        .nav-links a {
            color: var(--color-text);
            text-decoration: none;
            font-weight: 500;
            transition: var(--transition);
        }
        
        .nav-links a:hover {
            color: var(--color-accent-gold);
        }
        
        .nav-contact {
            background: var(--color-accent-teal);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: var(--border-radius);
            text-decoration: none;
            font-weight: 600;
            transition: var(--transition);
        }
        
        .nav-contact:hover {
            background: #006666;
            transform: translateY(-2px);
        }
        
        .mobile-menu-toggle {
            display: none;
            background: none;
            border: none;
            color: var(--color-text);
            font-size: 1.5rem;
            cursor: pointer;
        }
        
        /* Hero Section */
        .hero {
            min-height: 100vh;
            display: flex;
            align-items: center;
            padding: 7rem 0 4rem;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 50%);
            pointer-events: none;
        }
        
        .hero-container {
            max-width: min(95vw, 1200px);
            margin: 0 auto;
            padding: 0 clamp(1rem, 4vw, 2rem);
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: clamp(2rem, 5vw, 4rem);
            align-items: center;
        }
        
        .hero-content {
            animation: fadeInUp 1s ease-out;
        }
        
        .hero-globe {
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeInUp 1s ease-out 0.3s both;
        }
        
        .company-title {
            font-family: var(--font-heading);
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: 800;
            color: var(--color-accent-gold);
            margin-bottom: 1rem;
            text-shadow: 0 4px 8px rgba(212, 175, 55, 0.3);
        }
        
        .company-tagline {
            font-size: clamp(1.2rem, 2.5vw, 1.5rem);
            color: var(--color-text-secondary);
            margin-bottom: 1rem;
            font-weight: 500;
        }
        
        .company-message {
            font-size: clamp(1.1rem, 2vw, 1.3rem);
            color: var(--color-accent-teal);
            margin-bottom: 2rem;
            font-weight: 600;
        }
        
        .identity-card {
            background: rgba(26, 26, 26, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: var(--border-radius-large);
            padding: 2rem;
            margin: 2rem 0;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .identity-text {
            font-size: 1.1rem;
            line-height: 1.8;
            color: var(--color-text);
        }
        
        .cta-buttons {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 1rem 2rem;
            border: none;
            border-radius: var(--border-radius);
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: var(--transition);
            cursor: pointer;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, var(--color-accent-teal) 0%, var(--color-accent-gold) 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3);
        }
        
        .btn-secondary {
            background: transparent;
            color: var(--color-accent-gold);
            border: 2px solid var(--color-accent-gold);
        }
        
        .btn-secondary:hover {
            background: var(--color-accent-gold);
            color: var(--color-bg);
            transform: translateY(-2px);
        }
        
        .email-copy {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--color-accent-gold);
            cursor: pointer;
            transition: var(--transition);
        }
        
        .email-copy:hover {
            color: var(--color-accent-bronze);
        }
        
        /* Globe Container */
        #globe-container {
            width: min(40vw, 500px);
            height: min(40vw, 500px);
            position: relative;
            margin: 0 auto;
            filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.3));
            animation: float 6s ease-in-out infinite;
        }
        
        #globe-container:hover {
            transform: scale(1.05);
        }
        
        /* Services Section */
        .services {
            padding: 6rem 0;
            background: var(--color-bg-secondary);
        }
        
        .services-container {
            max-width: min(95vw, 1200px);
            margin: 0 auto;
            padding: 0 clamp(1rem, 4vw, 2rem);
        }
        
        .section-title {
            font-family: var(--font-heading);
            font-size: clamp(2rem, 4vw, 3rem);
            text-align: center;
            margin-bottom: 3rem;
            color: var(--color-text);
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: clamp(1rem, 3vw, 2rem);
            max-width: min(90vw, 800px);
            margin: 0 auto;
        }
        
        .service-card {
            background: rgba(26, 26, 26, 0.95);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: var(--border-radius-large);
            padding: 2rem;
            transition: var(--transition);
            position: relative;
            overflow: hidden;
        }
        
        .service-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(135deg, var(--color-accent-teal) 0%, var(--color-accent-gold) 100%);
        }
        
        .service-card.emergency::before {
            background: var(--emergency-red);
        }
        
        .service-card:hover {
            transform: translateY(-8px);
            border-color: rgba(212, 175, 55, 0.4);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .service-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            display: block;
        }
        
        .service-title {
            font-family: var(--font-heading);
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--color-text);
        }
        
        .service-focus {
            color: var(--color-accent-gold);
            font-weight: 600;
            margin-bottom: 1rem;
        }
        
        .service-features {
            list-style: none;
            margin-bottom: 1.5rem;
        }
        
        .service-features li {
            padding: 0.25rem 0;
            color: var(--color-text-secondary);
            position: relative;
            padding-left: 1.5rem;
        }
        
        .service-features li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: var(--color-accent-teal);
            font-weight: bold;
        }
        
        .emergency .service-features li::before {
            color: var(--emergency-red);
        }
        
        /* Contact Section */
        .contact {
            padding: 6rem 0;
            background: var(--color-bg);
        }
        
        .contact-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
        }
        
        .contact-info h2 {
            font-family: var(--font-heading);
            font-size: 2.5rem;
            margin-bottom: 2rem;
            color: var(--color-text);
        }
        
        .contact-methods {
            margin-bottom: 2rem;
        }
        
        .contact-method {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
            padding: 1rem;
            background: rgba(26, 26, 26, 0.5);
            border-radius: var(--border-radius);
            transition: var(--transition);
        }
        
        .contact-method:hover {
            background: rgba(26, 26, 26, 0.8);
        }
        
        .contact-form {
            background: rgba(26, 26, 26, 0.95);
            padding: 2rem;
            border-radius: var(--border-radius-large);
            border: 1px solid rgba(212, 175, 55, 0.2);
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--color-text);
            font-weight: 600;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 1rem;
            border: 2px solid rgba(212, 175, 55, 0.2);
            border-radius: var(--border-radius);
            background: rgba(10, 10, 10, 0.5);
            color: var(--color-text);
            font-family: var(--font-body);
            transition: var(--transition);
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--color-accent-gold);
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }
        
        .required {
            color: var(--emergency-red);
        }
        
        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes float {
            0%, 100% {
                transform: translateY(0px);
            }
            50% {
                transform: translateY(-20px);
            }
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
            .nav-links {
                display: none;
            }
            
            .mobile-menu-toggle {
                display: block;
            }
            
            /* MOBILE HERO: Simple single column layout */
            .hero-container {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                text-align: center !important;
                gap: 2rem !important;
                max-width: 95vw !important;
            }
            
            /* Company TITLE comes first */
            .company-title {
                order: 1 !important;
                margin-bottom: 1rem !important;
            }
            
            /* Globe comes SECOND and is HUGE */
            .hero-globe {
                order: 2 !important;
                width: 100% !important;
                display: flex !important;
                justify-content: center !important;
                margin: 2rem 0 !important;
            }
            
            /* Rest of content comes THIRD */
            .hero-content {
                order: 3 !important;
                width: 100% !important;
            }
            
            .company-tagline,
            .company-message,
            .identity-card,
            .cta-buttons {
                order: inherit !important;
            }
            
            /* Make globe MASSIVE on mobile */
            #globe-container {
                width: 85vw !important;
                height: 85vw !important;
                max-width: 450px !important;
                max-height: 450px !important;
                min-width: 300px !important;
                min-height: 300px !important;
            }
            
            .contact-container {
                grid-template-columns: 1fr;
            }
            
            .cta-buttons {
                justify-content: center;
            }
            
            .services-grid {
                grid-template-columns: 1fr;
                grid-template-rows: repeat(4, 1fr);
                max-width: min(95vw, 400px);
                gap: clamp(1rem, 4vw, 1.5rem);
            }
        }
        
        @media (max-width: 480px) {
            .nav-container {
                padding: 0 1rem;
            }
            
            .hero {
                padding: 5rem 0 2rem;
            }
            
            .hero-container,
            .services-container,
            .contact-container {
                padding: 0 1rem;
            }
            
            #globe-container {
                width: 200px;
                height: 200px;
            }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="nav">
        <div class="nav-container">
            <a href="#home" class="nav-brand">🌍 Atlas Divisions</a>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
            <a href="#contact" class="nav-contact">Get in Touch</a>
            <button class="mobile-menu-toggle">☰</button>
        </div>
    </nav>

    <!-- Hero Section -->
    <section id="home" class="hero">
        <div class="hero-container">
            <div class="hero-globe">
                <div id="globe-container"></div>
            </div>
            
            <div class="hero-content">
                <h1 class="company-title">Atlas Divisions</h1>
                <p class="company-tagline">Solutions That Outlast the Storm</p>
                <p class="company-message">Mapping Chaos. Building Resilience.</p>
                
                <div class="identity-card">
                    <p class="identity-text">
                        Founded by <strong>Captain Harley Miller</strong>, Atlas Divisions delivers no-nonsense, 
                        transparent solutions across multiple domains. We specialize in adaptive response, 
                        crisis management, and building systems that endure. Our military-influenced precision 
                        meets practical problem-solving to create solutions that truly outlast the storm.
                    </p>
                </div>
                
                <div class="cta-buttons">
                    <a href="#services" class="btn btn-primary">
                        Explore Services
                    </a>
                    <a href="#contact" class="btn btn-secondary">
                        Start Project
                    </a>
                </div>
                
                <div class="cta-buttons">
                    <span class="email-copy" onclick="copyEmail()">
                        📧 harley@atlasdivisions.com
                        <span id="copy-feedback" style="display: none; color: var(--color-accent-teal);">✓ Copied!</span>
                    </span>
                </div>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section id="services" class="services">
        <div class="services-container">
            <h2 class="section-title">Our Services</h2>
            <div class="services-grid">
                <div class="service-card">
                    <span class="service-icon">🔧</span>
                    <h3 class="service-title">Auto & Home Systems Repair</h3>
                    <p class="service-focus">Practical, reliable repairs</p>
                    <ul class="service-features">
                        <li>Transparent pricing</li>
                        <li>Emergency availability</li>
                        <li>Maintenance planning</li>
                        <li>No-nonsense diagnostics</li>
                    </ul>
                </div>
                
                <div class="service-card">
                    <span class="service-icon">📊</span>
                    <h3 class="service-title">Logistics & Adaptive Operations</h3>
                    <p class="service-focus">Streamlined operations for businesses</p>
                    <ul class="service-features">
                        <li>Tailored solutions</li>
                        <li>Crisis response</li>
                        <li>Efficiency audits</li>
                        <li>Scalable design</li>
                    </ul>
                </div>
                
                <div class="service-card">
                    <span class="service-icon">🤖</span>
                    <h3 class="service-title">AI Tools & Digital Infrastructure</h3>
                    <p class="service-focus">Transparent AI integration</p>
                    <ul class="service-features">
                        <li>Ethical implementation</li>
                        <li>Custom automation</li>
                        <li>Infrastructure setup</li>
                        <li>Training & documentation</li>
                    </ul>
                </div>
                
                <div class="service-card emergency">
                    <span class="service-icon">🚨</span>
                    <h3 class="service-title">Emergency & Crisis Response</h3>
                    <p class="service-focus">24/7 urgent situation response</p>
                    <ul class="service-features">
                        <li>Emergency availability</li>
                        <li>Rapid assessment</li>
                        <li>Multi-domain management</li>
                        <li>Clear communication</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact">
        <div class="contact-container">
            <div class="contact-info">
                <h2>Get in Touch</h2>
                <div class="contact-methods">
                    <div class="contact-method">
                        <span>📧</span>
                        <div>
                            <strong>Email:</strong><br>
                            <span class="email-copy" onclick="copyEmail()">harley@atlasdivisions.com</span>
                        </div>
                    </div>
                    <div class="contact-method">
                        <span>⚡</span>
                        <div>
                            <strong>Response Time:</strong><br>
                            Within 24 hours
                        </div>
                    </div>
                    <div class="contact-method">
                        <span>🌐</span>
                        <div>
                            <strong>Domain:</strong><br>
                            atlasdivisions.com
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="contact-form">
                <h3>Send a Message</h3>
                <form action="/submit" method="POST">
                    <div class="form-group">
                        <label for="name">Name <span class="required">*</span></label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email">
                    </div>
                    
                    <div class="form-group">
                        <label for="phone">Phone</label>
                        <input type="tel" id="phone" name="phone">
                    </div>
                    
                    <div class="form-group">
                        <label for="service_type">Service Type <span class="required">*</span></label>
                        <select id="service_type" name="service_type" required>
                            <option value="">Select a service...</option>
                            <option value="Auto & Home Systems Repair">Auto & Home Systems Repair</option>
                            <option value="Logistics & Adaptive Operations">Logistics & Adaptive Operations</option>
                            <option value="AI Tools & Digital Infrastructure">AI Tools & Digital Infrastructure</option>
                            <option value="Emergency & Crisis Response">Emergency & Crisis Response</option>
                            <option value="General Inquiry">General Inquiry</option>
                            <option value="Partnership Opportunity">Partnership Opportunity</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="message">Message <span class="required">*</span></label>
                        <textarea id="message" name="message" rows="5" placeholder="Describe how we can help you..." required></textarea>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        Send Message 🚀
                    </button>
                </form>
            </div>
        </div>
    </section>

    <script>
        // Atlas Divisions Globe Class - Enhanced Animation Implementation
        class AtlasGlobe {
            constructor() {
                this.scene = null;
                this.camera = null;
                this.renderer = null;
                this.globeMesh = null;
                
                this.isDragging = false;
                this.previousMousePosition = { x: 0, y: 0 };
                this.rotationVelocity = { x: 0, y: 0 };
                this.autoRotationSpeed = 0.005; // Fixed consistent rate for west-to-east rotation
                this.friction = 0.95; // Slightly more friction for smoother transitions
                this.rotationSpeed = 0.008; // Adjusted for left-right only interaction
                
                // Atlas Divisions styling
                this.atlasColors = {
                    ocean: '#001122',
                    land: '#d4af37',   // Atlas gold
                    stroke: '#cd7f32', // Atlas bronze
                    atmosphere: 0xd4af37, // Gold atmosphere
                    light: 0xd4af37    // Gold lighting
                };
                
                this.init();
            }
            
            init() {
                if (typeof THREE === 'undefined') {
                    console.error('Three.js not loaded');
                    const container = document.getElementById('globe-container');
                    if (container) {
                        container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#d4af37;font-size:4rem;">🌍</div>';
                    }
                    return;
                }
                
                this.createScene();
                this.setupEventListeners();
            }
            
            createScene() {
                const container = document.getElementById('globe-container');
                if (!container) return;
                
                // Force container to update its computed styles
                container.style.display = container.style.display;
                
                // Wait a moment for CSS to apply, then get dimensions
                setTimeout(() => {
                    const width = container.offsetWidth || container.clientWidth;
                    const height = container.offsetHeight || container.clientHeight;
                    
                    console.log('Globe container dimensions:', width, 'x', height);
                    
                    this.scene = new THREE.Scene();
                    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
                    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                    
                    this.renderer.setSize(width, height);
                    this.renderer.setClearColor(0x000000, 0);
                    container.appendChild(this.renderer.domElement);
                    
                    this.camera.position.z = 4;
                    
                    // Create globe after scene is ready
                    this.createGlobe();
                    this.setupLighting();
                    this.animate();
                }, 100);
            }
            
            async createGlobe() {
                const geometry = new THREE.SphereGeometry(1.5, 64, 64);
                const texture = await this.createAtlasTexture();
                
                const material = new THREE.MeshPhongMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0.9
                });
                
                this.globeMesh = new THREE.Mesh(geometry, material);
                this.globeMesh.rotation.x = 0.1;
                this.scene.add(this.globeMesh);
                
                this.createAtmosphere();
                
                // Start with consistent west-to-east auto-rotation (Y-axis only)
                this.rotationVelocity.x = 0; // No vertical rotation
                this.rotationVelocity.y = this.autoRotationSpeed;
            }
            
            createAtmosphere() {
                const atmosphereGeometry = new THREE.SphereGeometry(1.6, 64, 64);
                const atmosphereMaterial = new THREE.MeshBasicMaterial({
                    color: this.atlasColors.atmosphere,
                    transparent: true,
                    opacity: 0.1,
                    side: THREE.BackSide
                });
                const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
                this.scene.add(atmosphere);
            }
            
            setupLighting() {
                const ambientLight = new THREE.AmbientLight(this.atlasColors.light, 0.4);
                this.scene.add(ambientLight);
                
                const directionalLight = new THREE.DirectionalLight(this.atlasColors.light, 0.8);
                directionalLight.position.set(5, 3, 5);
                this.scene.add(directionalLight);
            }
            
            async createAtlasTexture() {
                const canvas = document.createElement('canvas');
                canvas.width = 2048;
                canvas.height = 1024;
                const ctx = canvas.getContext('2d');
                
                // Ocean background
                ctx.fillStyle = this.atlasColors.ocean;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                try {
                    const response = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
                    const geoData = await response.json();
                    this.drawWorldMap(ctx, geoData, canvas.width, canvas.height);
                } catch (error) {
                    console.log('Using fallback map');
                    this.drawFallbackMap(ctx, canvas.width, canvas.height);
                }
                
                const texture = new THREE.CanvasTexture(canvas);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                return texture;
            }
            
            drawWorldMap(ctx, geoData, width, height) {
                ctx.fillStyle = this.atlasColors.land;
                ctx.strokeStyle = this.atlasColors.stroke;
                ctx.lineWidth = 1;
                
                geoData.features.forEach(feature => {
                    if (feature.geometry.type === 'Polygon') {
                        this.drawPolygon(ctx, feature.geometry.coordinates, width, height);
                    } else if (feature.geometry.type === 'MultiPolygon') {
                        feature.geometry.coordinates.forEach(polygon => {
                            this.drawPolygon(ctx, polygon, width, height);
                        });
                    }
                });
            }
            
            drawPolygon(ctx, coordinates, width, height) {
                coordinates.forEach(ring => {
                    ctx.beginPath();
                    ring.forEach((coord, index) => {
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
                });
            }
            
            drawFallbackMap(ctx, width, height) {
                const continents = [
                    { x: 0.2, y: 0.3, w: 0.25, h: 0.4 },
                    { x: 0.25, y: 0.5, w: 0.15, h: 0.35 },
                    { x: 0.48, y: 0.25, w: 0.12, h: 0.15 },
                    { x: 0.5, y: 0.35, w: 0.15, h: 0.4 },
                    { x: 0.6, y: 0.2, w: 0.3, h: 0.35 },
                    { x: 0.75, y: 0.65, w: 0.12, h: 0.1 }
                ];
                
                ctx.fillStyle = this.atlasColors.land;
                continents.forEach(continent => {
                    ctx.fillRect(
                        continent.x * width,
                        continent.y * height,
                        continent.w * width,
                        continent.h * height
                    );
                });
            }
            
            setupEventListeners() {
                const container = document.getElementById('globe-container');
                if (!container) return;
                
                container.style.cursor = 'grab';
                
                container.addEventListener('mousedown', this.onMouseDown.bind(this));
                container.addEventListener('mousemove', this.onMouseMove.bind(this));
                container.addEventListener('mouseup', this.onMouseUp.bind(this));
                container.addEventListener('mouseleave', this.onMouseLeave.bind(this));
                
                container.addEventListener('touchstart', this.onTouchStart.bind(this));
                container.addEventListener('touchmove', this.onTouchMove.bind(this));
                container.addEventListener('touchend', this.onTouchEnd.bind(this));
                
                window.addEventListener('resize', this.onWindowResize.bind(this));
                
                // Add ResizeObserver to watch container size changes
                if (window.ResizeObserver) {
                    const resizeObserver = new ResizeObserver((entries) => {
                        for (const entry of entries) {
                            if (entry.target.id === 'globe-container') {
                                this.onWindowResize();
                            }
                        }
                    });
                    resizeObserver.observe(container);
                }
            }
            
            onMouseDown(event) {
                this.startDragging(event.clientX, event.clientY);
                document.getElementById('globe-container').style.cursor = 'grabbing';
            }
            
            onMouseMove(event) {
                if (this.isDragging) {
                    this.updateRotation(event.clientX, event.clientY);
                }
            }
            
            onMouseUp() {
                this.stopDragging();
                document.getElementById('globe-container').style.cursor = 'grab';
            }
            
            onMouseLeave() {
                this.stopDragging();
                document.getElementById('globe-container').style.cursor = 'grab';
            }
            
            onTouchStart(event) {
                event.preventDefault();
                if (event.touches.length === 1) {
                    const touch = event.touches[0];
                    this.startDragging(touch.clientX, touch.clientY);
                }
            }
            
            onTouchMove(event) {
                event.preventDefault();
                if (this.isDragging && event.touches.length === 1) {
                    const touch = event.touches[0];
                    this.updateRotation(touch.clientX, touch.clientY);
                }
            }
            
            onTouchEnd(event) {
                event.preventDefault();
                this.stopDragging();
            }
            
            startDragging(clientX, clientY) {
                this.isDragging = true;
                const container = document.getElementById('globe-container');
                const rect = container.getBoundingClientRect();
                this.previousMousePosition = {
                    x: clientX - rect.left,
                    y: clientY - rect.top
                };
            }
            
            updateRotation(clientX, clientY) {
                const container = document.getElementById('globe-container');
                const rect = container.getBoundingClientRect();
                const currentMousePosition = {
                    x: clientX - rect.left,
                    y: clientY - rect.top
                };
                
                const deltaX = currentMousePosition.x - this.previousMousePosition.x;
                // const deltaY = currentMousePosition.y - this.previousMousePosition.y; // Ignore Y movement
                
                // Only allow left-right (horizontal) rotation - Y-axis rotation only
                this.rotationVelocity.x = 0; // Disable vertical rotation completely
                this.rotationVelocity.y = deltaX * this.rotationSpeed; // Only horizontal rotation
                
                this.previousMousePosition = currentMousePosition;
            }
            
            stopDragging() {
                this.isDragging = false;
            }
            
            onWindowResize() {
                const container = document.getElementById('globe-container');
                if (!container || !this.renderer || !this.camera) return;
                
                const width = container.offsetWidth || container.clientWidth;
                const height = container.offsetHeight || container.clientHeight;
                
                console.log('Resizing globe canvas to:', width, 'x', height);
                
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(width, height);
            }
            
            animate() {
                requestAnimationFrame(this.animate.bind(this));
                
                if (this.globeMesh) {
                    if (this.isDragging) {
                        // When dragging, only apply Y-axis rotation from user interaction
                        this.globeMesh.rotation.y += this.rotationVelocity.y;
                        // Keep X rotation fixed (no up-down rotation)
                    } else {
                        // When not dragging, apply friction to user velocity
                        this.rotationVelocity.y *= this.friction;
                        
                        // Apply user velocity if still significant
                        if (Math.abs(this.rotationVelocity.y) > 0.001) {
                            this.globeMesh.rotation.y += this.rotationVelocity.y;
                        } else {
                            // Return to consistent fixed auto-rotation (west to east)
                            this.rotationVelocity.y = 0;
                            this.globeMesh.rotation.y += this.autoRotationSpeed;
                        }
                    }
                    
                    // Keep X rotation fixed - no vertical rotation allowed
                    this.globeMesh.rotation.x = 0.1; // Slight tilt for better viewing angle
                }
                
                this.renderer.render(this.scene, this.camera);
            }
        }
        
        // Initialize globe
        let atlasGlobe = null;
        
        // Copy email functionality
        function copyEmail() {
            const email = 'harley@atlasdivisions.com';
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(email).then(() => {
                    showCopyFeedback();
                }).catch(() => {
                    fallbackCopyMethod(email);
                });
            } else {
                fallbackCopyMethod(email);
            }
        }
        
        function fallbackCopyMethod(email) {
            const textArea = document.createElement('textarea');
            textArea.value = email;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                showCopyFeedback();
            } catch (err) {
                console.error('Failed to copy email:', err);
            }
            
            document.body.removeChild(textArea);
        }
        
        function showCopyFeedback() {
            const feedback = document.getElementById('copy-feedback');
            if (feedback) {
                feedback.style.display = 'inline';
                setTimeout(() => {
                    feedback.style.display = 'none';
                }, 2000);
            }
        }
        
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Initialize Atlas Globe when page loads with progressive enhancement
        window.addEventListener('load', function() {
            // Initialize the Atlas Globe with retry logic (no loading message that breaks formatting)
            function initializeGlobe(retries = 3) {
                if (typeof window.initAtlasGlobeWhenReady === 'function') {
                    window.initAtlasGlobeWhenReady();
                } else if (retries > 0) {
                    setTimeout(() => initializeGlobe(retries - 1), 200);
                } else {
                    // Final fallback after all retries - just show static globe emoji
                    const container = document.getElementById('globe-container');
                    if (container) {
                        container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#d4af37;font-size:8rem;animation:float 6s ease-in-out infinite;">🌍</div>';
                    }
                }
            }
            
            initializeGlobe();
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (atlasGlobe && atlasGlobe.renderer) {
                // Clean up Three.js resources
                const container = document.getElementById('globe-container');
                if (container && atlasGlobe.renderer.domElement) {
                    container.removeChild(atlasGlobe.renderer.domElement);
                }
                atlasGlobe.renderer.dispose();
            }
        });
    </script>
</body>
</html>`;

	return new Response(html, {
		headers: { 'Content-Type': 'text/html', ...corsHeaders }
	});
}