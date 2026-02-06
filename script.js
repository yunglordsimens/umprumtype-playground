// ==================== TYPO UMPRUM v3.1 - TRENDY EFFECTS ====================

// --- GLOBAL VARIABLES ---
let p5Instance;
let fontLoaded = false;
let grid = [];
let frameTimes = [];
let lastFrameTime = performance.now();
let lowFPSWarningShown = false;
let keyboardShortcuts = {};

// FONT DATA (will be loaded from fonts.json)
let availableFonts = {};

// v3.1 CONFIGURATION - Minimal & Clean
let config = {
    // Core
    version: '3.1',
    baseFontSize: 24,
    currentFontFamily: 'AnanasRegular',
    activeText: '',
    
    // Grid & Layout
    targetGlyphCount: 1200,
    mobileMaxGlyphs: 800,
    
    // Interaction
    interactionRadius: 280,
    maxScale: 3.5,
    
    // Trendy Effects (v3.1)
    darkMode: false,
    waveEffect: false,
    bloomEffect: false,
    scatterEffect: false,
    idleStrength: 0.15,
    
    // Pause/Freeze
    paused: false,
    
    // UI State
    lastFontName: 'Ananas',
    lastStyleIndex: 0,
    lastTx: 0,
    lastTy: 0
};

// DEFAULT CONFIG
const defaultConfig = JSON.parse(JSON.stringify(config));

// --- UTILITY FUNCTIONS ---
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    
    container.appendChild(toast);
    
    // Auto-remove with animation
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, duration);
    
    // Track analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'toast_shown', {
            'event_category': 'ui',
            'event_label': type,
            'value': duration
        });
    }
}

function checkPerformance() {
    const now = performance.now();
    const delta = now - lastFrameTime;
    lastFrameTime = now;
    
    frameTimes.push(delta);
    if (frameTimes.length > 60) frameTimes.shift();
    
    const avgFrameTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
    const fps = Math.round(1000 / avgFrameTime);
    
    // Update indicator
    const indicator = document.getElementById('performance-indicator');
    indicator.textContent = `FPS: ${fps} | Glyphs: ${grid.length}`;
    
    if (fps < 45) {
        indicator.style.display = 'block';
        if (fps < 30) {
            indicator.classList.add('low');
            
            // Auto-disable scatter if performance is bad
            if (config.scatterEffect && !lowFPSWarningShown) {
                config.scatterEffect = false;
                document.getElementById('scatterToggle').checked = false;
                showToast("Disabled scatter effect for better performance", 'warning');
                lowFPSWarningShown = true;
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'auto_effect_disable', {
                        'event_category': 'performance',
                        'event_label': 'scatter',
                        'value': fps
                    });
                }
            }
        } else {
            indicator.classList.remove('low');
        }
    } else {
        indicator.style.display = 'none';
        lowFPSWarningShown = false;
    }
    
    return fps;
}

// --- KEYBOARD SHORTCUTS v3.1 ---
function initKeyboardShortcuts() {
    keyboardShortcuts = {
        '?': () => showShortcutsHelp(),
        ' ': () => toggleFreeze(), // Space bar toggles freeze
        'd': () => toggleDarkMode(),
        'r': () => resetAll(),
        's': () => document.getElementById('exportPngBtn').click(),
        'p': () => document.getElementById('exportPdfBtn').click(),
        't': () => document.getElementById('shareTweetBtn').click(),
        'w': () => toggleEffect('waveToggle', 'waveEffect'),
        'b': () => toggleEffect('bloomToggle', 'bloomEffect'),
        'c': () => toggleEffect('scatterToggle', 'scatterEffect'),
        'Escape': () => closeMobilePanel(),
        'ArrowUp': () => adjustSlider('scaleSlider', 0.1),
        'ArrowDown': () => adjustSlider('scaleSlider', -0.1),
        'ArrowLeft': () => adjustSlider('radiusSlider', -10),
        'ArrowRight': () => adjustSlider('radiusSlider', 10)
    };
    
    document.addEventListener('keydown', (e) => {
        // Don't trigger in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }
        
        const key = e.key.toLowerCase();
        if (keyboardShortcuts[key]) {
            e.preventDefault();
            keyboardShortcuts[key]();
        } else if (keyboardShortcuts[e.key]) {
            e.preventDefault();
            keyboardShortcuts[e.key]();
        }
    });
}

function showShortcutsHelp() {
    showToast(
        "Keyboard Shortcuts:<br>" +
        "Space = Freeze/unfreeze canvas<br>" +
        "D = Toggle dark mode<br>" +
        "R = Reset all settings<br>" +
        "S = Export PNG<br>" +
        "P = Export PDF<br>" +
        "T = Share on X/Twitter<br>" +
        "W = Toggle wave effect<br>" +
        "B = Toggle bloom effect<br>" +
        "C = Toggle scatter effect<br>" +
        "Arrows = Adjust sliders<br>" +
        "? = Show this help",
        'info',
        5000
    );
}

function toggleEffect(toggleId, configProp) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
        toggle.checked = !toggle.checked;
        config[configProp] = toggle.checked;
        
        showToast(`${configProp.replace('Effect', '')} effect ${toggle.checked ? 'enabled' : 'disabled'}`, 'info');
    }
}

function adjustSlider(sliderId, delta) {
    const slider = document.getElementById(sliderId);
    if (slider) {
        const current = parseFloat(slider.value);
        const step = parseFloat(slider.step) || 1;
        const min = parseFloat(slider.min) || 0;
        const max = parseFloat(slider.max) || 100;
        const newValue = Math.min(max, Math.max(min, current + delta * step));
        slider.value = newValue;
        slider.dispatchEvent(new Event('input'));
    }
}

function toggleFreeze() {
    config.paused = !config.paused;
    document.body.classList.toggle('frozen-mode', config.paused);
    
    if (config.paused) {
        showToast("Canvas frozen (press space to resume) — perfect for capture!", 'info', 2000);
        
        // Track freeze
        if (typeof gtag !== 'undefined') {
            gtag('event', 'freeze_toggle', {
                'event_category': 'interaction',
                'event_label': 'spacebar',
                'value': 1
            });
        }
    } else {
        showToast("Canvas unfrozen", 'info', 1000);
    }
}

function toggleDarkMode() {
    config.darkMode = !config.darkMode;
    document.getElementById('darkToggle').checked = config.darkMode;
    document.body.classList.toggle('dark-mode', config.darkMode);
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'dark_mode_toggle', {
            'event_category': 'ui',
            'event_label': config.darkMode ? 'enabled' : 'disabled'
        });
    }
}

function closeMobilePanel() {
    const toolsPanel = document.getElementById('tools-panel');
    const mobileToggle = document.getElementById('mobile-toggle-btn');
    
    if (window.innerWidth <= 800 && toolsPanel.style.display === 'flex') {
        toolsPanel.style.display = 'none';
        document.body.style.overflow = 'visible';
        mobileToggle.textContent = '⚙️';
    }
}

// --- FONT MANAGEMENT ---
function loadFonts() {
    // Try to load from JSON first
    fetch('fonts.json')
        .then(res => {
            if (!res.ok) throw new Error('fonts.json not found');
            return res.json();
        })
        .then(data => {
            availableFonts = data;
            loadDynamicFontFaces(data);
            populateFontSelect();
            
            // Set default text from first font
            const firstFont = Object.keys(data)[0];
            if (firstFont) {
                config.activeText = data[firstFont].sampleText;
                config.lastFontName = firstFont;
            }
            
            showToast("Fonts loaded", 'success');
        })
        .catch(err => {
            console.log('Using default fonts:', err);
            
            // Fallback to hardcoded fonts
            availableFonts = {
                'Ananas': {
                    sampleText: "Imituje žhavý pohled, vítězně, jako kdyby vynalezla nějakou novou neřest...",
                    styles: ['Regular', 'Italic'],
                    cssFamilies: ['AnanasRegular', 'AnanasItalic'],
                    author: 'Jaromír Květoň',
                    year: 2025
                },
                'Chlebiczech': {
                    sampleText: "Jeho jméno jsem zapomněl, prý provádí nárazové obchody s neřestmi...",
                    styles: ['Regular'],
                    cssFamilies: ['ChlebiczechRegular'],
                    author: 'Žofia Kosová',
                    year: 2025
                },
                'Korchma': {
                    sampleText: "Вона імітує запальний погляд, тріумфально оживаючи у темряві...",
                    styles: ['Regular', 'Italic'],
                    cssFamilies: ['KorchmaRegular', 'KorchmaItalic'],
                    author: 'Anna Sherlupenkova',
                    year: 2025
                },
                'März Grotesk': {
                    sampleText: "During the Thirty Years' War, the Swedes wanted to use it as a weapon...",
                    styles: ['Bold'],
                    cssFamilies: ['MarzGroteskBold'],
                    author: 'Šimon Vlasák',
                    year: 2025
                }
            };
            
            populateFontSelect();
            
            // Set default
            config.activeText = availableFonts['Ananas'].sampleText;
            
            showToast("Using default fonts", 'info');
        });
}

function loadDynamicFontFaces(fonts) {
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-font-faces';
    
    for (let fontName in fonts) {
        const font = fonts[fontName];
        font.cssFamilies.forEach((family, i) => {
            const style = font.styles[i];
            const weight = style.includes('Bold') ? 'bold' : 'normal';
            const fontStyle = style.includes('Italic') ? 'italic' : 'normal';
            const fileName = `${fontName}-${style}.woff2`;
            
            styleEl.innerHTML += `
                @font-face {
                    font-family: '${family}';
                    src: url('fonts/${fileName}') format('woff2');
                    font-weight: ${weight};
                    font-style: ${fontStyle};
                    font-display: block;
                }
            `;
        });
    }
    
    // Remove old if exists
    const oldStyle = document.getElementById('dynamic-font-faces');
    if (oldStyle) oldStyle.remove();
    
    document.head.appendChild(styleEl);
}

function populateFontSelect() {
    const fontSelect = document.getElementById('fontSelect');
    if (!fontSelect || Object.keys(availableFonts).length === 0) return;
    
    fontSelect.innerHTML = '';
    
    // Sort by year (newest first)
    const sortedFonts = Object.keys(availableFonts).sort((a, b) => {
        return availableFonts[b].year - availableFonts[a].year;
    });
    
    sortedFonts.forEach(fontName => {
        const fontData = availableFonts[fontName];
        const option = document.createElement('option');
        option.value = fontName;
        option.text = `${fontName} (${fontData.author}, ${fontData.year})`;
        option.title = `${fontData.author} · ${fontData.year}`;
        fontSelect.appendChild(option);
    });
    
    // Set initial selection
    if (sortedFonts.includes(config.lastFontName)) {
        fontSelect.value = config.lastFontName;
    } else {
        fontSelect.selectedIndex = 0;
        config.lastFontName = fontSelect.value;
    }
    
    // Update style dropdown
    updateStyleDropdown();
    
    // Trigger initial update
    setTimeout(() => {
        fontSelect.dispatchEvent(new Event('change'));
    }, 100);
}

function updateStyleDropdown() {
    const styleSelect = document.getElementById('styleSelect');
    const fontData = availableFonts[config.lastFontName];
    
    if (!fontData || !styleSelect) return;
    
    styleSelect.innerHTML = '';
    fontData.styles.forEach((style, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = style;
        styleSelect.appendChild(option);
    });
    
    styleSelect.value = config.lastStyleIndex;
}

// --- P5 SKETCH v3.1 ---
function sketch(p) {
    p5Instance = p;

    p.setup = function() {
        let container = document.getElementById('canvas-container');
        let cnv = p.createCanvas(container.offsetWidth, container.offsetHeight);
        cnv.parent('canvas-container');
        cnv.canvas.oncontextmenu = () => false;
        
        p.textAlign(p.CENTER, p.CENTER);
        p.rectMode(p.CENTER);
        p.frameRate(60);
        
        // Load fonts
        loadFonts();
        
        // Initialize keyboard shortcuts
        initKeyboardShortcuts();
        
        // Wait for fonts
        document.fonts.ready.then(() => {
            const loadStart = performance.now();
            fontLoaded = true;
            
            // Hide loader with animation
            document.getElementById('loader').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loader').style.display = 'none';
                
                // Initial grid
                generateGrid();
                
                const loadTime = performance.now() - loadStart;
                showToast(`v3.1 ready in ${loadTime.toFixed(0)}ms`, 'success', 2000);
                
                // Track page load
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'page_load_v3_1', {
                        'event_category': 'engagement',
                        'event_label': 'v3.1',
                        'value': Math.round(loadTime)
                    });
                }
            }, 500);
        }).catch(err => {
            console.error('Font loading error:', err);
            fontLoaded = true;
            document.getElementById('loader').style.display = 'none';
            generateGrid();
        });

        // Fallback timeout
        setTimeout(() => {
            if (!fontLoaded) {
                fontLoaded = true;
                document.getElementById('loader').style.display = 'none';
                generateGrid();
                showToast("Fonts loaded with fallback", 'warning');
            }
        }, 7000);
    };

    p.draw = function() {
        // Performance monitoring
        const fps = checkPerformance();
        
        // Handle pause/freeze mode
        if (config.paused) {
            drawPaused(p);
            return;
        }
        
        // Normal drawing
        p.background(config.darkMode ? 0 : 255);
        if (!fontLoaded || grid.length === 0) return;
        
        // Update mouse position
        let tx = p.mouseX;
        let ty = p.mouseY;
        if (p.touches.length > 0) {
            tx = p.touches[0].x;
            ty = p.touches[0].y;
        }
        if (tx === 0 && ty === 0 && p.frameCount < 10) {
            tx = -5000;
            ty = -5000;
        }
        
        config.lastTx = tx;
        config.lastTy = ty;
        
        // Apply trendy effects
        applyTrendyEffects(p, tx, ty);
        
        // Draw all glyphs
        drawGlyphs(p, tx, ty);
    };

    p.keyPressed = function() {
        if (p.key === ' ') {
            toggleFreeze();
            return false; // Prevent default space behavior
        }
    };

    p.windowResized = function() {
        let container = document.getElementById('canvas-container');
        p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        updateDensitySliderMax();
        generateGrid();
    };
}

// Initialize P5
new p5(sketch);

// --- TRENDY EFFECTS v3.1 ---
function applyTrendyEffects(p, tx, ty) {
    for (let i = 0; i < grid.length; i++) {
        let g = grid[i];
        
        // Calculate distance to cursor
        let d = p.dist(tx, ty, g.baseX, g.baseY);
        
        // Fluid Wave Effect
        if (config.waveEffect) {
            let waveOffset = p.sin((g.baseX * 0.01) + p.frameCount * 0.05) * 20;
            
            if (d < config.interactionRadius) {
                let proximity = 1 - (d / config.interactionRadius);
                waveOffset += p.sin((g.baseY * 0.02) + p.frameCount * 0.1) * proximity * 50;
            }
            
            g.waveY = waveOffset;
        } else if (g.waveY !== undefined) {
            // Smoothly return to normal
            g.waveY *= 0.95;
            if (Math.abs(g.waveY) < 0.5) g.waveY = undefined;
        }
        
        // Scatter Effect
        if (config.scatterEffect) {
            if (d < config.interactionRadius) {
                let proximity = 1 - (d / config.interactionRadius);
                g.scatterOffset = proximity * 100;
                
                // Calculate scatter direction away from cursor
                let angle = p.atan2(g.baseY - ty, g.baseX - tx);
                g.scatterX = p.cos(angle) * g.scatterOffset;
                g.scatterY = p.sin(angle) * g.scatterOffset;
            } else if (g.scatterOffset > 0) {
                // Slowly reform
                g.scatterOffset *= 0.95;
                g.scatterX *= 0.95;
                g.scatterY *= 0.95;
                
                if (g.scatterOffset < 0.5) {
                    g.scatterOffset = 0;
                    g.scatterX = 0;
                    g.scatterY = 0;
                }
            }
        }
        
        // Update position based on effects
        g.x = g.baseX + (g.scatterX || 0);
        g.y = g.baseY + (g.waveY || 0) + (g.scatterY || 0);
        
        // Boundary constraints
        const margin = 50;
        if (g.x < -margin) g.x = p.width + margin;
        if (g.x > p.width + margin) g.x = -margin;
        if (g.y < -margin) g.y = p.height + margin;
        if (g.y > p.height + margin) g.y = -margin;
    }
}

function drawPaused(p) {
    p.background(config.darkMode ? 0 : 255);
    if (!fontLoaded || grid.length === 0) return;
    
    // Draw paused glyphs at their last positions
    for (let i = 0; i < grid.length; i++) {
        let g = grid[i];
        
        p.textFont(config.currentFontFamily);
        p.textSize(config.baseFontSize);
        p.noStroke();
        p.fill(config.darkMode ? 255 : 0);
        
        p.push();
        p.translate(g.x, g.y);
        p.scale(g.lastScl || 1);
        p.rotate(g.lastRot || 0);
        p.text(g.char, 0, 0);
        p.pop();
    }
}

function drawGlyphs(p, tx, ty) {
    p.noStroke();
    
    for (let i = 0; i < grid.length; i++) {
        let g = grid[i];
        
        // Calculate distance for scale/color
        let d = p.dist(tx, ty, g.x, g.y);
        let scl = 1;
        let rot = 0;
        
        if (d < config.interactionRadius) {
            let normalizedDist = p.map(d, 0, config.interactionRadius, 0, 1);
            let proximity = 1 - normalizedDist;
            
            // Scale
            scl = 1 + (config.maxScale - 1) * (proximity * proximity);
            
            // Rotation
            rot = g.angleOffset * proximity * (p.PI / 4);
            
            // Store for pause mode
            g.lastScl = scl;
            g.lastRot = rot;
        } else {
            // Gentle idle motion
            if (config.idleStrength > 0) {
                rot += (p.noise(g.baseX * 0.01, g.baseY * 0.01, p.frameCount * 0.005) - 0.5) * config.idleStrength;
                g.lastRot = rot;
            }
            g.lastScl = scl;
        }
        
        p.textFont(config.currentFontFamily);
        p.textSize(config.baseFontSize);
        
        // Bloom Glow Effect (draw behind)
        if (config.bloomEffect && d < config.interactionRadius * 1.5) {
            let bloomProximity = 1 - p.map(d, 0, config.interactionRadius * 1.5, 0, 1);
            bloomProximity = p.constrain(bloomProximity, 0, 1);
            
            p.push();
            p.translate(g.x, g.y);
            p.scale(scl * (1 + bloomProximity * 0.3));
            p.rotate(rot);
            p.fill(config.darkMode ? 50 : 200, 100 * bloomProximity);
            p.text(g.char, 0, 0);
            p.pop();
        }
        
        // Main glyph
        p.fill(config.darkMode ? 255 : 0);
        
        p.push();
        p.translate(g.x, g.y);
        p.scale(scl);
        p.rotate(rot);
        p.text(g.char, 0, 0);
        p.pop();
    }
}

// --- GRID GENERATION ---
function generateGrid() {
    if (!p5Instance || !fontLoaded) return;
    
    try {
        let p = p5Instance;
        grid = [];
        
        // Set font for measurements
        const fontData = availableFonts[config.lastFontName] || availableFonts[Object.keys(availableFonts)[0]];
        if (!fontData) return;
        
        config.currentFontFamily = fontData.cssFamilies[config.lastStyleIndex || 0];
        p.textFont(config.currentFontFamily);
        p.textSize(config.baseFontSize);
        
        // Calculate grid
        let limit = (p.width < 800) ? config.mobileMaxGlyphs : 2500;
        config.targetGlyphCount = Math.min(config.targetGlyphCount, limit);
        
        let area = p.width * p.height;
        let avgAreaPerGlyph = area / config.targetGlyphCount;
        let spacing = p.sqrt(avgAreaPerGlyph);
        
        let gridSpacingX = spacing * 0.85;
        let gridSpacingY = spacing * 1.15;
        
        let cols = p.floor(p.width / gridSpacingX);
        let rows = p.floor(p.height / gridSpacingY);
        
        let startX = (p.width - (cols * gridSpacingX)) / 2 + gridSpacingX / 2;
        let startY = (p.height - (rows * gridSpacingY)) / 2 + gridSpacingY / 2;
        
        let textIdx = 0;
        let txt = config.activeText || fontData.sampleText;
        
        // Handle text length
        if (txt.length < 5) {
            txt = fontData.sampleText;
        }
        
        if (txt.length < 20) {
            txt = txt.repeat(Math.ceil(100 / txt.length));
        }
        
        // Update character count display
        const charCount = document.getElementById('char-count');
        if (charCount) charCount.textContent = `${txt.length} chars`;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let char = txt.charAt(textIdx % txt.length);
                textIdx++;
                
                let x = startX + (c * gridSpacingX);
                let y = startY + (r * gridSpacingY);
                
                grid.push({
                    char: char,
                    x: x,
                    y: y,
                    baseX: x,
                    baseY: y,
                    angleOffset: p.random(-1, 1),
                    lastScl: 1,
                    lastRot: 0,
                    charWidth: p.textWidth(char)
                });
            }
        }
        
        // Track grid generation
        if (typeof gtag !== 'undefined') {
            gtag('event', 'grid_generated_v3_1', {
                'event_category': 'grid',
                'event_label': config.lastFontName,
                'value': grid.length
            });
        }
        
    } catch (error) {
        console.error('Grid generation error:', error);
        showToast("Error generating grid", 'error');
    }
}

// --- UI UPDATES ---
function updateSettings() {
    if (!fontLoaded) return;
    
    try {
        const fontSelect = document.getElementById('fontSelect');
        const styleSelect = document.getElementById('styleSelect');
        const customInput = document.getElementById('customInput');
        
        // Update font
        config.lastFontName = fontSelect.value;
        config.lastStyleIndex = parseInt(styleSelect.value);
        
        const fontData = availableFonts[config.lastFontName];
        if (fontData) {
            config.currentFontFamily = fontData.cssFamilies[config.lastStyleIndex];
            
            // Update text
            const userText = customInput.value.trim();
            if (userText.length >= 5) {
                config.activeText = userText;
            } else if (userText.length > 0) {
                showToast("Text too short - need at least 5 characters", 'warning');
                config.activeText = fontData.sampleText;
                customInput.value = '';
            } else {
                config.activeText = fontData.sampleText;
            }
        }
        
        // Regenerate grid
        generateGrid();
        
        // Track font change
        if (typeof gtag !== 'undefined') {
            gtag('event', 'font_change_v3_1', {
                'event_category': 'fonts',
                'event_label': config.lastFontName,
                'style': config.lastStyleIndex
            });
        }
        
    } catch (error) {
        console.error('Settings error:', error);
        showToast("Error updating settings", 'error');
    }
}

function updateUIFromConfig() {
    // Update sliders
    document.getElementById('densitySlider').value = config.targetGlyphCount;
    document.getElementById('radiusSlider').value = config.interactionRadius;
    document.getElementById('scaleSlider').value = config.maxScale;
    
    // Update checkboxes
    document.getElementById('darkToggle').checked = config.darkMode;
    document.getElementById('waveToggle').checked = config.waveEffect;
    document.getElementById('bloomToggle').checked = config.bloomEffect;
    document.getElementById('scatterToggle').checked = config.scatterEffect;
    
    // Update displays
    document.getElementById('densityValue').textContent = `${config.targetGlyphCount} glyphs`;
    document.getElementById('radiusValue').textContent = `${config.interactionRadius}px`;
    document.getElementById('scaleValue').textContent = `${config.maxScale.toFixed(1)}x`;
    
    // Apply dark mode
    document.body.classList.toggle('dark-mode', config.darkMode);
    
    // Update font selection
    if (document.getElementById('fontSelect').value !== config.lastFontName) {
        document.getElementById('fontSelect').value = config.lastFontName;
        updateStyleDropdown();
    }
    
    document.getElementById('styleSelect').value = config.lastStyleIndex;
}

function updateDensitySliderMax() {
    if (!p5Instance) return;
    let p = p5Instance;
    let densitySlider = document.getElementById('densitySlider');
    
    let limit = (p.width < 800) ? config.mobileMaxGlyphs : 2500;
    densitySlider.max = limit;
    
    if (config.targetGlyphCount > limit) {
        config.targetGlyphCount = limit;
        densitySlider.value = limit;
        document.getElementById('densityValue').textContent = `${limit} glyphs`;
    }
}

function resetAll() {
    Object.keys(defaultConfig).forEach(key => {
        config[key] = defaultConfig[key];
    });
    
    document.getElementById('customInput').value = '';
    updateUIFromConfig();
    updateSettings();
    
    showToast("All settings reset to defaults", 'success');
    
    // Track reset
    if (typeof gtag !== 'undefined') {
        gtag('event', 'reset_all_v3_1', {
            'event_category': 'actions',
            'event_label': 'full_reset'
        });
    }
}

// --- EXPORT FUNCTIONS ---
function exportPNG() {
    let canvas = document.querySelector('canvas');
    if (!canvas) {
        showToast("No canvas found", 'error');
        return;
    }
    
    // Create a temporary canvas for watermark
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // Copy original canvas
    ctx.drawImage(canvas, 0, 0);
    
    // Add watermark
    ctx.font = '12px Helvetica Neue';
    ctx.fillStyle = config.darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Typo Umprum Playground v3.1', canvas.width - 20, canvas.height - 20);
    ctx.fillText(new Date().toLocaleDateString(), canvas.width - 20, canvas.height - 5);
    
    // Create download link
    let link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `typo-umprum-${timestamp}.png`;
    link.href = tempCanvas.toDataURL('image/png', 1.0);
    link.click();
    
    showToast("PNG exported with watermark", 'success');
    
    // Track export
    if (typeof gtag !== 'undefined') {
        gtag('event', 'export_png_v3_1', {
            'event_category': 'export',
            'event_label': 'png',
            'value': canvas.width * canvas.height
        });
    }
}

function exportPDF() {
    let canvas = document.querySelector('canvas');
    if (!canvas) {
        showToast("No canvas found", 'error');
        return;
    }
    
    if (typeof window.jspdf === 'undefined') {
        showToast("PDF export requires jsPDF library", 'error');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
    });
    
    // Add canvas image
    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
    
    // Add watermark text
    pdf.setFontSize(10);
    pdf.setTextColor(128);
    pdf.text('Typo Umprum Playground v3.1', canvas.width - 100, canvas.height - 30);
    pdf.text(new Date().toLocaleDateString(), canvas.width - 100, canvas.height - 15);
    
    // Save PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    pdf.save(`typo-umprum-${timestamp}.pdf`);
    
    showToast("PDF exported successfully", 'success');
    
    // Track export
    if (typeof gtag !== 'undefined') {
        gtag('event', 'export_pdf_v3_1', {
            'event_category': 'export',
            'event_label': 'pdf'
        });
    }
}

function shareOnTwitter() {
    const text = encodeURIComponent("Check out my typography creation with Typo Umprum Playground v3.1! #TypoUmprum #Typography #Design");
    const url = encodeURIComponent('https://typoumprum.cz/play');
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(twitterUrl, '_blank');
    
    // Reminder to export first
    setTimeout(() => {
        showToast("Don't forget to export your PNG first to attach to the tweet!", 'info', 3000);
    }, 500);
    
    // Track share
    if (typeof gtag !== 'undefined') {
        gtag('event', 'share_twitter_v3_1', {
            'event_category': 'social',
            'event_label': 'twitter'
        });
    }
}

// --- UI EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
    // Get all UI elements
    const elements = {};
    const elementIds = [
        'fontSelect', 'styleSelect', 'customInput', 'applyTextBtn', 'sample-text-btn',
        'resetBtn', 'exportPngBtn', 'exportPdfBtn', 'shareTweetBtn', 'densitySlider',
        'radiusSlider', 'scaleSlider', 'darkToggle', 'waveToggle', 'bloomToggle',
        'scatterToggle', 'mobileToggle', 'toolsPanel', 'densityValue', 'radiusValue',
        'scaleValue', 'shortcuts-btn'
    ];
    
    elementIds.forEach(id => {
        elements[id] = document.getElementById(id);
    });
    
    // Mobile panel toggle
    if (elements.mobileToggle && elements.toolsPanel) {
        elements.mobileToggle.addEventListener('click', () => {
            const isOpening = elements.toolsPanel.style.display !== 'flex';
            elements.toolsPanel.style.display = isOpening ? 'flex' : 'none';
            document.body.style.overflow = isOpening ? 'hidden' : 'visible';
            
            elements.mobileToggle.textContent = isOpening ? '✕' : '⚙️';
            elements.mobileToggle.setAttribute('aria-label', 
                isOpening ? 'Close tools panel' : 'Open tools panel');
            
            // Track panel toggle
            if (typeof gtag !== 'undefined') {
                gtag('event', 'panel_toggle_v3_1', {
                    'event_category': 'ui',
                    'event_label': isOpening ? 'open' : 'close'
                });
            }
        });
        
        // Close panel on outside click (mobile)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 800 && 
                elements.toolsPanel.style.display === 'flex' &&
                !elements.toolsPanel.contains(e.target) && 
                e.target !== elements.mobileToggle) {
                elements.toolsPanel.style.display = 'none';
                document.body.style.overflow = 'visible';
                elements.mobileToggle.textContent = '⚙️';
            }
        });
    }
    
    // Font selection
    if (elements.fontSelect) {
        elements.fontSelect.addEventListener('change', function() {
            config.lastFontName = this.value;
            updateStyleDropdown();
            updateSettings();
        });
    }
    
    if (elements.styleSelect) {
        elements.styleSelect.addEventListener('change', () => {
            config.lastStyleIndex = parseInt(elements.styleSelect.value);
            updateSettings();
        });
    }
    
    // Text controls
    if (elements.applyTextBtn) {
        elements.applyTextBtn.addEventListener('click', updateSettings);
    }
    
    if (elements.customInput) {
        elements.customInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                updateSettings();
            }
        });
        
        elements.customInput.addEventListener('input', function() {
            const count = this.value.length;
            const charCount = document.getElementById('char-count');
            if (charCount) charCount.textContent = `${count} chars`;
        });
    }
    
    if (elements.sampleTextBtn) {
        elements.sampleTextBtn.addEventListener('click', () => {
            const fontData = availableFonts[config.lastFontName];
            if (fontData) {
                elements.customInput.value = fontData.sampleText;
                updateSettings();
            }
        });
    }
    
    // Reset all
    if (elements.resetBtn) {
        elements.resetBtn.addEventListener('click', resetAll);
    }
    
    // Export buttons
    if (elements.exportPngBtn) {
        elements.exportPngBtn.addEventListener('click', exportPNG);
    }
    
    if (elements.exportPdfBtn) {
        elements.exportPdfBtn.addEventListener('click', exportPDF);
    }
    
    // Share button
    if (elements.shareTweetBtn) {
        elements.shareTweetBtn.addEventListener('click', shareOnTwitter);
    }
    
    // Shortcuts button
    if (elements['shortcuts-btn']) {
        elements['shortcuts-btn'].addEventListener('click', showShortcutsHelp);
    }
    
    // Sliders
    const sliders = [
        { id: 'densitySlider', value: 'densityValue', format: v => `${v} glyphs`, config: 'targetGlyphCount', action: () => generateGrid() },
        { id: 'radiusSlider', value: 'radiusValue', format: v => `${v}px`, config: 'interactionRadius' },
        { id: 'scaleSlider', value: 'scaleValue', format: v => `${parseFloat(v).toFixed(1)}x`, config: 'maxScale' }
    ];
    
    sliders.forEach(slider => {
        const element = document.getElementById(slider.id);
        const valueElement = document.getElementById(slider.value);
        
        if (element && valueElement) {
            element.addEventListener('input', function() {
                const value = this.value;
                valueElement.textContent = slider.format(value);
                
                // Update config
                if (slider.config === 'targetGlyphCount') {
                    config[slider.config] = parseInt(value);
                } else if (slider.config === 'maxScale') {
                    config[slider.config] = parseFloat(value);
                } else {
                    config[slider.config] = parseInt(value);
                }
                
                // Trigger action if needed
                if (slider.action) slider.action();
            });
        }
    });
    
    // Checkbox toggles
    if (elements.darkToggle) {
        elements.darkToggle.addEventListener('change', toggleDarkMode);
    }
    
    if (elements.waveToggle) {
        elements.waveToggle.addEventListener('change', function() {
            config.waveEffect = this.checked;
            
            // Track effect toggle
            if (typeof gtag !== 'undefined') {
                gtag('event', 'wave_effect_toggle', {
                    'event_category': 'effects',
                    'event_label': this.checked ? 'enabled' : 'disabled'
                });
            }
        });
    }
    
    if (elements.bloomToggle) {
        elements.bloomToggle.addEventListener('change', function() {
            config.bloomEffect = this.checked;
            
            // Track effect toggle
            if (typeof gtag !== 'undefined') {
                gtag('event', 'bloom_effect_toggle', {
                    'event_category': 'effects',
                    'event_label': this.checked ? 'enabled' : 'disabled'
                });
            }
        });
    }
    
    if (elements.scatterToggle) {
        elements.scatterToggle.addEventListener('change', function() {
            config.scatterEffect = this.checked;
            
            // Track effect toggle
            if (typeof gtag !== 'undefined') {
                gtag('event', 'scatter_effect_toggle', {
                    'event_category': 'effects',
                    'event_label': this.checked ? 'enabled' : 'disabled'
                });
            }
        });
    }
    
    // Initialize UI displays
    setTimeout(() => {
        if (elements.densityValue) {
            sliders.forEach(slider => {
                const element = document.getElementById(slider.id);
                const valueElement = document.getElementById(slider.value);
                if (element && valueElement) {
                    valueElement.textContent = slider.format(element.value);
                }
            });
        }
        
        // Update max density
        updateDensitySliderMax();
        
        // Track v3.1 launch
        if (typeof gtag !== 'undefined') {
            gtag('event', 'v3_1_launch', {
                'event_category': 'version',
                'event_label': 'trendy_refresh'
            });
        }
    }, 500);
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('Runtime error:', e.error);
    showToast("An error occurred - please refresh", 'error');
    
    // Track error
    if (typeof gtag !== 'undefined') {
        gtag('event', 'error_v3_1', {
            'event_category': 'system',
            'event_label': e.error.message,
            'value': 1
        });
    }
});

// Performance monitoring
setInterval(() => {
    if (p5Instance && fontLoaded) {
        checkPerformance();
    }
}, 1000);