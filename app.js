// Flash Nick Yapma Programı - Ana JavaScript

class FlashNickMaker {
    constructor() {
        this.canvas = document.getElementById('nickCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.bgImage = null;
        this.leftDecorImage = null;
        this.rightDecorImage = null;
        this.animationFrame = null;
        this.isAnimating = false;
        this.particles = [];
        this.particleAnimationFrame = null;
        this.sparkles = [];
        this.sparkleFrame = 0;
        
        // Çoklu text öğeleri
        this.textLayers = [
            {
                id: 1,
                text: 'SevDa',
                fontFamily: 'Lobster',
                fontSize: 40,
                textColor: '#ffffff',
                shadowColor: '#000000',
                shadowBlur: 5,
                outlineColor: '#000000',
                outlineWidth: 2,
                gradientColor1: '#ff0000',
                gradientColor2: '#ffff00',
                effectGlow: false,
                effectOutline: true,
                effectGradient: false,
                effect3D: false,
                textX: 50,
                textY: 50,
                textBlendMode: 'source-over',
                warpType: 'none',
                warpAmount: 0.35,
                textAnimationType: 'none',
                rotation: 0,
                opacity: 100,
                visible: true
            }
        ];
        this.activeTextLayer = 1;
        
        this.settings = {
            text: 'SevDa',
            fontFamily: 'Lobster',
            fontSize: 40,
            textColor: '#ffffff',
            shadowColor: '#000000',
            shadowBlur: 5,
            outlineColor: '#000000',
            outlineWidth: 2,
            gradientColor1: '#ff0000',
            gradientColor2: '#ffff00',
            effectGlow: false,
            effectOutline: true,
            effectGradient: false,
            effect3D: false,
            bgType: 'gradient1',
            canvasWidth: 300,
            canvasHeight: 100,
            textX: 50,
            textY: 50,
            particleType: 'none',
            particleDensity: 15,
            particleSize: 12,
            particleColor: '#ffff00',
            particleRainbow: false,
            particleDirection: 'down',
            particleBlendMode: 'source-over',
            // Yeni özellikler
            textSparkleType: 'none',
            sparkleCount: 8,
            sparkleColor: '#ffffff',
            sparkleAnimate: false,
            // Harf içi parıltı
            innerSparkleType: 'none',
            innerSparkleCount: 15,
            innerSparkleColor: '#ffffff',
            innerSparkleSize: 3,
            innerSparkleAnimate: false,
            // Blend / Warp
            textBlendMode: 'source-over',
            warpType: 'none',
            warpAmount: 0.35,
            lineStyle: 'none',
            linePosition: 'bottom',
            lineColor: '#000000',
            frameStyle: 'none',
            frameColor: '#000000',
            frameWidth: 2,
            framePadding: 10,
            // Yazı animasyonları
            textAnimationType: 'none',
            scrollType: 'none',
            scrollSpeed: 3,
            // Bayrak ayarları
            leftFlag: 'none',
            rightFlag: 'none',
            flagAnimation: 'wave',
            flagSize: 25,
            flagY: 50,
            flagLeftX: 5,
            flagRightX: 95,
            // Resim efekti
            imageEffect: 'none',
            // Fotoğraf düzenleme ayarları
            imageSaturation: 100,      // Doygunluk (0-200)
            imageTemperature: 0,       // Sıcaklık (-100 ile +100)
            imageHue: 0,               // Ton (-180 ile +180)
            imageSharpness: 0,         // Keskinlik (0-100)
            imageCropX: 0,             // Kırpma X başlangıç (%)
            imageCropY: 0,             // Kırpma Y başlangıç (%)
            imageCropWidth: 100,       // Kırpma genişlik (%)
            imageCropHeight: 100,      // Kırpma yükseklik (%)
            // Fotoğraf overlay ve animasyon
            photoOverlay: 'none',
            overlayIntensity: 50,
            customOverlayColor: '#ff00ff',
            colorOverlayMode: 'none',
            photoAnimation: 'none',
            photoAnimSpeed: 3,
            splitLayout: 'none',
            splitRatio: 50,
            splitBorder: false,
            photoSideEffect: 'none'
        };

        this.textAnimationFrame = null;
        this.photoAnimationFrame = null;
        this.photoAnimPhase = 0;
        this.scrollAnimationFrame = null;
        this.flagAnimationFrame = null;
        this.flagPhase = 0;
        this.innerSparkles = [];
        this.innerSparkleFrame = 0;

        // Blur fırça ayarları
        this.blurBrushActive = false;
        this.blurBrushSize = 30;
        this.blurBrushStrength = 10;
        this.blurMask = null; // Blur yapılan alanları saklayan canvas

        // Palette presets
        this.palettes = {
            vapor: ['#ff7bd1', '#8ef1ff', '#6c5ce7'],
            sunset: ['#ff9a3c', '#ff5e62', '#ffb347'],
            neon: ['#39ff14', '#00eaff', '#ff00ff'],
            pastel: ['#ffd1dc', '#c1f0f6', '#ffe29f'],
            turkish: ['#e30a17', '#0fb5d3', '#a60000']
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.initSparkles();
        this.initBlurBrush();
        this.render();
    }

    // Blur Fırça Sistemi
    initBlurBrush() {
        const canvas = this.canvas;
        
        // Mouse olayları
        canvas.addEventListener('mousedown', (e) => this.startBlurPaint(e));
        canvas.addEventListener('mousemove', (e) => this.paintBlur(e));
        canvas.addEventListener('mouseup', () => this.stopBlurPaint());
        canvas.addEventListener('mouseleave', () => this.stopBlurPaint());
        
        // Touch olayları (mobil)
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startBlurPaint(e.touches[0]);
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.paintBlur(e.touches[0]);
        });
        canvas.addEventListener('touchend', () => this.stopBlurPaint());
    }

    startBlurPaint(e) {
        if (!this.blurBrushActive) return;
        this.isBlurPainting = true;
        this.paintBlur(e);
    }

    stopBlurPaint() {
        this.isBlurPainting = false;
    }

    paintBlur(e) {
        if (!this.blurBrushActive || !this.isBlurPainting) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // Blur maskesini oluştur (yoksa)
        if (!this.blurMask) {
            this.blurMask = document.createElement('canvas');
            this.blurMask.width = this.canvas.width;
            this.blurMask.height = this.canvas.height;
        }
        
        const maskCtx = this.blurMask.getContext('2d');
        
        // Fırça boyutunda daire çiz (beyaz = blur yapılacak alan)
        maskCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        maskCtx.beginPath();
        maskCtx.arc(x, y, this.blurBrushSize / 2, 0, Math.PI * 2);
        maskCtx.fill();
        
        // Canvas'ı yeniden çiz (blur ile)
        this.render();
    }

    applyBlurFromMask(ctx, canvas) {
        if (!this.blurMask) return;
        
        const maskCtx = this.blurMask.getContext('2d');
        const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const maskPixels = maskData.data;
        
        const strength = this.blurBrushStrength;
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                const maskValue = maskPixels[idx]; // R kanalı (beyaz = 255)
                
                if (maskValue > 10) {
                    // Bu piksel blur yapılacak
                    let r = 0, g = 0, b = 0, a = 0, count = 0;
                    
                    // Çevredeki piksellerin ortalamasını al
                    for (let dy = -strength; dy <= strength; dy++) {
                        for (let dx = -strength; dx <= strength; dx++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                                const nIdx = (ny * canvas.width + nx) * 4;
                                r += tempData[nIdx];
                                g += tempData[nIdx + 1];
                                b += tempData[nIdx + 2];
                                a += tempData[nIdx + 3];
                                count++;
                            }
                        }
                    }
                    
                    // Ortalama değerleri yaz
                    const blendRatio = Math.min(maskValue / 255, 1);
                    data[idx] = Math.round(data[idx] * (1 - blendRatio) + (r / count) * blendRatio);
                    data[idx + 1] = Math.round(data[idx + 1] * (1 - blendRatio) + (g / count) * blendRatio);
                    data[idx + 2] = Math.round(data[idx + 2] * (1 - blendRatio) + (b / count) * blendRatio);
                    data[idx + 3] = Math.round(data[idx + 3] * (1 - blendRatio) + (a / count) * blendRatio);
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    clearBlurMask() {
        if (this.blurMask) {
            const maskCtx = this.blurMask.getContext('2d');
            maskCtx.clearRect(0, 0, this.blurMask.width, this.blurMask.height);
        }
        this.render();
    }
    
    // Fotoğraf düzenleme UI'ını güncelle
    updatePhotoEditingUI() {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(id + 'Val');
            if (el) el.value = val;
            if (valEl) valEl.textContent = val;
        };
        
        setVal('imageSaturation', this.settings.imageSaturation);
        setVal('imageTemperature', this.settings.imageTemperature);
        setVal('imageHue', this.settings.imageHue);
        setVal('imageSharpness', this.settings.imageSharpness);
        setVal('imageCropX', this.settings.imageCropX);
        setVal('imageCropY', this.settings.imageCropY);
        setVal('imageCropWidth', this.settings.imageCropWidth);
        setVal('imageCropHeight', this.settings.imageCropHeight);
    }

    toggleBlurBrush(active) {
        this.blurBrushActive = active;
        this.canvas.style.cursor = active ? 'crosshair' : 'default';
    }

    bindEvents() {
        // Text input
        document.getElementById('nickInput').addEventListener('input', (e) => {
            this.settings.text = e.target.value;
            this.updateActiveLayer();
            this.initSparkles();
            this.render();
        });

        // Font family
        document.getElementById('fontFamily').addEventListener('change', (e) => {
            this.settings.fontFamily = e.target.value;
            this.updateActiveLayer();
            this.render();
        });

        // Font size
        document.getElementById('fontSize').addEventListener('input', (e) => {
            this.settings.fontSize = parseInt(e.target.value);
            document.getElementById('fontSizeVal').textContent = e.target.value;
            this.updateActiveLayer();
            this.render();
        });

        // Text color
        document.getElementById('textColor').addEventListener('input', (e) => {
            this.settings.textColor = e.target.value;
            this.render();
        });

        // Shadow color
        document.getElementById('shadowColor').addEventListener('input', (e) => {
            this.settings.shadowColor = e.target.value;
            this.render();
        });

        // Shadow blur
        document.getElementById('shadowBlur').addEventListener('input', (e) => {
            this.settings.shadowBlur = parseInt(e.target.value);
            document.getElementById('shadowBlurVal').textContent = e.target.value;
            this.render();
        });

        // Outline color
        document.getElementById('outlineColor').addEventListener('input', (e) => {
            this.settings.outlineColor = e.target.value;
            this.render();
        });

        // Outline width
        document.getElementById('outlineWidth').addEventListener('input', (e) => {
            this.settings.outlineWidth = parseInt(e.target.value);
            document.getElementById('outlineWidthVal').textContent = e.target.value;
            this.render();
        });

        // Gradient colors - değiştirildiğinde otomatik gradient efektini aç
        document.getElementById('gradientColor1').addEventListener('input', (e) => {
            this.settings.gradientColor1 = e.target.value;
            // Gradient efektini otomatik aç
            this.settings.effectGradient = true;
            document.getElementById('effectGradient').checked = true;
            this.render();
        });

        document.getElementById('gradientColor2').addEventListener('input', (e) => {
            this.settings.gradientColor2 = e.target.value;
            // Gradient efektini otomatik aç
            this.settings.effectGradient = true;
            document.getElementById('effectGradient').checked = true;
            this.render();
        });

        // Effects
        document.getElementById('effectGlow').addEventListener('change', (e) => {
            this.settings.effectGlow = e.target.checked;
            this.updateActiveLayer();
            this.render();
        });

        document.getElementById('effectOutline').addEventListener('change', (e) => {
            this.settings.effectOutline = e.target.checked;
            this.updateActiveLayer();
            this.render();
        });

        document.getElementById('effectGradient').addEventListener('change', (e) => {
            this.settings.effectGradient = e.target.checked;
            this.updateActiveLayer();
            this.render();
        });

        document.getElementById('effect3D').addEventListener('change', (e) => {
            this.settings.effect3D = e.target.checked;
            this.updateActiveLayer();
            this.render();
        });

        // Canvas size
        document.getElementById('canvasWidth').addEventListener('input', (e) => {
            this.settings.canvasWidth = parseInt(e.target.value);
            document.getElementById('canvasWidthVal').textContent = e.target.value;
            this.canvas.width = this.settings.canvasWidth;
            this.render();
        });

        document.getElementById('canvasHeight').addEventListener('input', (e) => {
            this.settings.canvasHeight = parseInt(e.target.value);
            document.getElementById('canvasHeightVal').textContent = e.target.value;
            this.canvas.height = this.settings.canvasHeight;
            this.render();
        });

        // Text position
        document.getElementById('textX').addEventListener('input', (e) => {
            this.settings.textX = parseInt(e.target.value);
            document.getElementById('textXVal').textContent = e.target.value;
            this.updateActiveLayer();
            this.render();
        });

        document.getElementById('textY').addEventListener('input', (e) => {
            this.settings.textY = parseInt(e.target.value);
            document.getElementById('textYVal').textContent = e.target.value;
            this.updateActiveLayer();
            this.render();
        });

        // Particle settings
        document.getElementById('particleType').addEventListener('change', (e) => {
            this.settings.particleType = e.target.value;
            this.initParticles();
            if (this.settings.particleType !== 'none') {
                this.startParticleAnimation();
            } else {
                this.stopParticleAnimation();
                this.render();
            }
        });

        document.getElementById('particleDensity').addEventListener('input', (e) => {
            this.settings.particleDensity = parseInt(e.target.value);
            document.getElementById('particleDensityVal').textContent = e.target.value;
            this.initParticles();
        });

        document.getElementById('particleSize').addEventListener('input', (e) => {
            this.settings.particleSize = parseInt(e.target.value);
            document.getElementById('particleSizeVal').textContent = e.target.value;
        });

        document.getElementById('particleColor').addEventListener('input', (e) => {
            this.settings.particleColor = e.target.value;
        });

        document.getElementById('particleRainbow').addEventListener('change', (e) => {
            this.settings.particleRainbow = e.target.checked;
        });

        document.getElementById('particleDirection').addEventListener('change', (e) => {
            this.settings.particleDirection = e.target.value;
            this.initParticles();
        });

        // Text Sparkle settings
        document.getElementById('textSparkleType').addEventListener('change', (e) => {
            this.settings.textSparkleType = e.target.value;
            this.initSparkles();
            if (this.settings.sparkleAnimate && this.settings.textSparkleType !== 'none') {
                this.startSparkleAnimation();
            }
            this.render();
        });

        document.getElementById('sparkleCount').addEventListener('input', (e) => {
            this.settings.sparkleCount = parseInt(e.target.value);
            document.getElementById('sparkleCountVal').textContent = e.target.value;
            this.initSparkles();
            this.render();
        });

        document.getElementById('sparkleColor').addEventListener('input', (e) => {
            this.settings.sparkleColor = e.target.value;
            this.render();
        });

        document.getElementById('sparkleAnimate').addEventListener('change', (e) => {
            this.settings.sparkleAnimate = e.target.checked;
            if (e.target.checked && this.settings.textSparkleType !== 'none') {
                this.startSparkleAnimation();
            } else {
                this.stopSparkleAnimation();
            }
        });

        // Harf içi parıltı ayarları
        document.getElementById('innerSparkleType').addEventListener('change', (e) => {
            this.settings.innerSparkleType = e.target.value;
            this.initInnerSparkles();
            if (this.settings.innerSparkleAnimate && e.target.value !== 'none') {
                this.startInnerSparkleAnimation();
            }
            this.render();
        });

        document.getElementById('innerSparkleCount').addEventListener('input', (e) => {
            this.settings.innerSparkleCount = parseInt(e.target.value);
            document.getElementById('innerSparkleCountVal').textContent = e.target.value;
            this.initInnerSparkles();
            this.render();
        });

        document.getElementById('innerSparkleColor').addEventListener('input', (e) => {
            this.settings.innerSparkleColor = e.target.value;
            this.render();
        });

        document.getElementById('innerSparkleSize').addEventListener('input', (e) => {
            this.settings.innerSparkleSize = parseInt(e.target.value);
            document.getElementById('innerSparkleSizeVal').textContent = e.target.value;
            this.render();
        });

        document.getElementById('innerSparkleAnimate').addEventListener('change', (e) => {
            this.settings.innerSparkleAnimate = e.target.checked;
            if (e.target.checked && this.settings.innerSparkleType !== 'none') {
                this.startInnerSparkleAnimation();
            } else {
                this.stopInnerSparkleAnimation();
            }
        });

        // Line style settings
        document.getElementById('lineStyle').addEventListener('change', (e) => {
            this.settings.lineStyle = e.target.value;
            this.render();
        });

        document.getElementById('linePosition').addEventListener('change', (e) => {
            this.settings.linePosition = e.target.value;
            this.render();
        });

        document.getElementById('lineColor').addEventListener('input', (e) => {
            this.settings.lineColor = e.target.value;
            this.render();
        });

        // Frame style settings
        document.getElementById('frameStyle').addEventListener('change', (e) => {
            this.settings.frameStyle = e.target.value;
            this.render();
        });

        document.getElementById('frameColor').addEventListener('input', (e) => {
            this.settings.frameColor = e.target.value;
            this.render();
        });

        document.getElementById('frameWidth').addEventListener('input', (e) => {
            this.settings.frameWidth = parseInt(e.target.value);
            document.getElementById('frameWidthVal').textContent = e.target.value;
            this.render();
        });

        document.getElementById('framePadding').addEventListener('input', (e) => {
            this.settings.framePadding = parseInt(e.target.value);
            document.getElementById('framePaddingVal').textContent = e.target.value;
            this.render();
        });

        // Background image - Yüksek kaliteli yükleme
        document.getElementById('bgImage').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // Orijinal resmi yüksek kalitede sakla
                        this.bgImageOriginal = img;
                        this.bgImage = img;
                        this.settings.bgType = 'custom';
                        
                        // Yeni resim yüklendiğinde fotoğraf ayarlarını sıfırla
                        this.settings.imageSaturation = 100;
                        this.settings.imageTemperature = 0;
                        this.settings.imageHue = 0;
                        this.settings.imageSharpness = 0;
                        this.settings.imageCropX = 0;
                        this.settings.imageCropY = 0;
                        this.settings.imageCropWidth = 100;
                        this.settings.imageCropHeight = 100;
                        
                        // Blur maskesini temizle
                        if (this.blurMask) {
                            const maskCtx = this.blurMask.getContext('2d');
                            maskCtx.clearRect(0, 0, this.blurMask.width, this.blurMask.height);
                        }
                        
                        // UI'ı güncelle
                        this.updatePhotoEditingUI();
                        
                        this.render();
                        showToast('Arka plan resmi yüklendi! 🖼️');
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Left decoration - Yüksek kaliteli yükleme
        document.getElementById('leftDecor').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        this.leftDecorImageOriginal = img;
                        this.leftDecorImage = img;
                        this.render();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Right decoration - Yüksek kaliteli yükleme
        document.getElementById('rightDecor').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        this.rightDecorImageOriginal = img;
                        this.rightDecorImage = img;
                        this.render();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Animation preview
        document.getElementById('previewAnimation').addEventListener('click', () => {
            this.previewAnimation();
        });

        // Text animation
        document.getElementById('textAnimationType').addEventListener('change', (e) => {
            this.settings.textAnimationType = e.target.value;
        });

        document.getElementById('previewTextAnimation').addEventListener('click', () => {
            this.previewTextAnimation();
        });

        // Scroll animation
        document.getElementById('scrollType').addEventListener('change', (e) => {
            this.settings.scrollType = e.target.value;
        });

        document.getElementById('scrollSpeed').addEventListener('input', (e) => {
            this.settings.scrollSpeed = parseInt(e.target.value);
            document.getElementById('scrollSpeedVal').textContent = e.target.value;
        });

        document.getElementById('previewScroll').addEventListener('click', () => {
            this.previewScrollAnimation();
        });

        // Bayrak kontrolleri
        document.getElementById('leftFlag').addEventListener('change', (e) => {
            this.settings.leftFlag = e.target.value;
            this.startFlagAnimation();
        });

        document.getElementById('rightFlag').addEventListener('change', (e) => {
            this.settings.rightFlag = e.target.value;
            this.startFlagAnimation();
        });

        document.getElementById('flagAnimation').addEventListener('change', (e) => {
            this.settings.flagAnimation = e.target.value;
            this.startFlagAnimation();
        });

        document.getElementById('flagSize').addEventListener('input', (e) => {
            this.settings.flagSize = parseInt(e.target.value);
            document.getElementById('flagSizeVal').textContent = e.target.value;
            this.render();
        });

        document.getElementById('flagY').addEventListener('input', (e) => {
            this.settings.flagY = parseInt(e.target.value);
            document.getElementById('flagYVal').textContent = e.target.value;
            this.render();
        });

        document.getElementById('flagLeftX').addEventListener('input', (e) => {
            this.settings.flagLeftX = parseInt(e.target.value);
            document.getElementById('flagLeftXVal').textContent = e.target.value;
            this.render();
        });

        document.getElementById('flagRightX').addEventListener('input', (e) => {
            this.settings.flagRightX = parseInt(e.target.value);
            document.getElementById('flagRightXVal').textContent = e.target.value;
            this.render();
        });

        // Resim efekti
        document.getElementById('imageEffect').addEventListener('change', (e) => {
            this.settings.imageEffect = e.target.value;
            this.render();
        });

        // Download PNG
        document.getElementById('downloadPng').addEventListener('click', () => {
            this.downloadPNG();
        });

        // Download GIF
        document.getElementById('downloadGif').addEventListener('click', () => {
            this.downloadGIF();
        });

        // Blend mode controls
        const textBlend = document.getElementById('textBlendMode');
        if (textBlend) {
            textBlend.addEventListener('change', (e) => {
                this.settings.textBlendMode = e.target.value;
                this.render();
            });
        }
        const particleBlend = document.getElementById('particleBlendMode');
        if (particleBlend) {
            particleBlend.addEventListener('change', (e) => {
                this.settings.particleBlendMode = e.target.value;
                this.render();
            });
        }

        // Warp controls
        const warpType = document.getElementById('warpType');
        if (warpType) {
            warpType.addEventListener('change', (e) => {
                this.settings.warpType = e.target.value;
                this.render();
            });
        }
        const warpAmount = document.getElementById('warpAmount');
        if (warpAmount) {
            warpAmount.addEventListener('input', (e) => {
                this.settings.warpAmount = parseFloat(e.target.value);
                document.getElementById('warpAmountVal').textContent = e.target.value;
                this.render();
            });
        }

        // Palette apply
        const paletteSelect = document.getElementById('paletteSelect');
        const paletteApply = document.getElementById('applyPaletteBtn');
        if (paletteSelect && paletteApply) {
            paletteApply.addEventListener('click', () => {
                const val = paletteSelect.value;
                const palette = this.palettes[val];
                if (palette) {
                    applyPalette(palette);
                }
            });
        }

        // Randomize with locks
        const randomizeBtn = document.getElementById('randomizeLocked');
        if (randomizeBtn) {
            randomizeBtn.addEventListener('click', () => {
                randomizeWithLocks();
            });
        }

        // Copy to clipboard
        document.getElementById('copyToClipboard').addEventListener('click', () => {
            this.copyToClipboard();
        });
    }

    render(options = {}) {
        const ctx = options.ctx || this.ctx;
        const canvas = options.canvas || this.canvas;
        const offset = options.offset || { x: 0, y: 0 };
        const hueShift = options.hueShift || 0;
        const particleFrame = options.particleFrame || 0;
        const sparkleFrame = options.sparkleFrame || this.sparkleFrame;
        const transparent = options.transparent || false;

        // Yüksek kaliteli çizim ayarları
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Split layout kontrolü
        if (this.settings.splitLayout !== 'none' && this.bgImage) {
            this.drawSplitLayout(ctx, canvas, offset, hueShift, particleFrame, sparkleFrame, transparent);
            return;
        }

        // Draw background (skip if transparent export)
        if (!transparent) {
            this.drawBackground(ctx, canvas, hueShift);
            // Photo overlay efektlerini uygula
            this.applyPhotoOverlay(ctx, canvas);
        }

        // Draw frame (behind everything)
        if (this.settings.frameStyle !== 'none') {
            this.drawFrame(ctx, canvas);
        }

        // Draw particles (behind text)
        if (this.settings.particleType !== 'none') {
            this.drawParticles(ctx, canvas, particleFrame);
        }

        // Draw decorations
        this.drawDecorations(ctx, canvas);

        // Draw decorative lines (before text)
        if (this.settings.lineStyle !== 'none') {
            this.drawDecorativeLines(ctx, canvas);
        }

        // Draw text
        this.drawText(ctx, canvas, offset, hueShift);

        // Draw inner sparkles (inside text)
        if (this.settings.innerSparkleType !== 'none') {
            this.drawInnerSparkles(ctx, canvas, this.innerSparkleFrame);
        }

        // Draw text sparkles (on top of text)
        if (this.settings.textSparkleType !== 'none') {
            this.drawTextSparkles(ctx, canvas, sparkleFrame);
        }

        // Blur fırçası maskesini uygula (en son)
        if (this.blurMask && canvas === this.canvas) {
            this.applyBlurFromMask(ctx, canvas);
        }
    }

    // Yazı parıltıları sistemi
    initSparkles() {
        this.sparkles = [];
        const count = this.settings.sparkleCount;
        
        // Yazının etrafında parıltı pozisyonları oluştur
        for (let i = 0; i < count; i++) {
            this.sparkles.push({
                angle: (i / count) * Math.PI * 2,
                distance: 0.6 + Math.random() * 0.4,
                size: 0.5 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5
            });
        }
    }

    drawTextSparkles(ctx, canvas, frame = 0) {
        const x = canvas.width * this.settings.textX / 100;
        const y = canvas.height * this.settings.textY / 100;
        
        // Yazı boyutunu hesapla
        ctx.font = `${this.settings.fontSize}px "${this.settings.fontFamily}"`;
        const textWidth = ctx.measureText(this.settings.text).width;
        const textHeight = this.settings.fontSize;
        
        const radius = Math.max(textWidth, textHeight) / 2 + 10;
        
        ctx.save();
        
        for (const sparkle of this.sparkles) {
            // Animasyonlu pozisyon
            let animOffset = 0;
            if (this.settings.sparkleAnimate) {
                animOffset = Math.sin(frame * 0.1 * sparkle.speed + sparkle.phase) * 5;
            }
            
            const sparkleX = x + Math.cos(sparkle.angle) * (radius * sparkle.distance + animOffset);
            const sparkleY = y + Math.sin(sparkle.angle) * (radius * sparkle.distance * 0.6 + animOffset);
            
            // Parıltı opaklığı animasyonu
            let opacity = 1;
            if (this.settings.sparkleAnimate) {
                opacity = 0.5 + Math.sin(frame * 0.15 * sparkle.speed + sparkle.phase) * 0.5;
            }
            
            ctx.globalAlpha = opacity;
            ctx.fillStyle = this.settings.sparkleColor;
            
            const size = 6 * sparkle.size;
            
            switch (this.settings.textSparkleType) {
                case 'sparkle':
                    this.drawSparkleShape(ctx, sparkleX, sparkleY, size);
                    break;
                case 'twinkle':
                    this.drawTwinkle(ctx, sparkleX, sparkleY, size);
                    break;
                case 'dots':
                    ctx.beginPath();
                    ctx.arc(sparkleX, sparkleY, size / 3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'stars':
                    this.drawStar(ctx, sparkleX, sparkleY, 5, size, size / 2);
                    break;
                case 'hearts':
                    this.drawHeart(ctx, sparkleX - size/2, sparkleY - size/2, size);
                    break;
                case 'diamonds':
                    this.drawDiamond(ctx, sparkleX, sparkleY, size);
                    break;
            }
        }
        
        ctx.restore();
    }

    drawSparkleShape(ctx, x, y, size) {
        ctx.beginPath();
        // 4 kollu parıltı
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.2, y - size * 0.2);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size * 0.2, y + size * 0.2);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size * 0.2, y + size * 0.2);
        ctx.lineTo(x - size, y);
        ctx.lineTo(x - size * 0.2, y - size * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    drawTwinkle(ctx, x, y, size) {
        ctx.beginPath();
        // Daha ince 4 kollu ışıltı
        const thin = size * 0.1;
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + thin, y - thin);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + thin, y + thin);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - thin, y + thin);
        ctx.lineTo(x - size, y);
        ctx.lineTo(x - thin, y - thin);
        ctx.closePath();
        ctx.fill();
    }

    drawDiamond(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.6, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size * 0.6, y);
        ctx.closePath();
        ctx.fill();
    }

    // Harf içi parıltı sistemi
    initInnerSparkles() {
        this.innerSparkles = [];
        const count = this.settings.innerSparkleCount;
        
        for (let i = 0; i < count; i++) {
            this.innerSparkles.push({
                xOffset: Math.random(), // 0-1 arası, yazı genişliği içinde
                yOffset: Math.random(), // 0-1 arası, yazı yüksekliği içinde
                size: 0.5 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 1,
                opacity: 0.5 + Math.random() * 0.5
            });
        }
    }

    drawInnerSparkles(ctx, canvas, frame = 0) {
        if (this.innerSparkles.length === 0) {
            this.initInnerSparkles();
        }

        const text = this.settings.text;
        if (!text) return;

        // Yazı pozisyonu ve boyutunu hesapla
        ctx.font = `${this.settings.fontSize}px "${this.settings.fontFamily}"`;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = this.settings.fontSize;
        
        const centerX = canvas.width * this.settings.textX / 100;
        const centerY = canvas.height * this.settings.textY / 100;
        
        // Yazının sol üst köşesi
        const textLeft = centerX - textWidth / 2;
        const textTop = centerY - textHeight / 2;

        ctx.save();
        
        // Clipping mask oluştur - sadece yazının içinde görünsün
        ctx.font = `${this.settings.fontSize}px "${this.settings.fontFamily}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text path oluştur ve clip yap
        ctx.beginPath();
        ctx.rect(textLeft - 5, textTop - 5, textWidth + 10, textHeight + 10);
        ctx.clip();

        // Her parıltıyı çiz
        for (const sparkle of this.innerSparkles) {
            let opacity = sparkle.opacity;
            let sizeMultiplier = 1;
            
            // Animasyon
            if (this.settings.innerSparkleAnimate) {
                opacity = 0.3 + Math.abs(Math.sin(frame * 0.08 * sparkle.speed + sparkle.phase)) * 0.7;
                sizeMultiplier = 0.7 + Math.abs(Math.sin(frame * 0.1 * sparkle.speed + sparkle.phase)) * 0.6;
            }
            
            const sparkleX = textLeft + sparkle.xOffset * textWidth;
            const sparkleY = textTop + sparkle.yOffset * textHeight;
            const size = this.settings.innerSparkleSize * sparkle.size * sizeMultiplier;
            
            ctx.globalAlpha = opacity;
            ctx.fillStyle = this.settings.innerSparkleColor;
            
            switch (this.settings.innerSparkleType) {
                case 'stars':
                    this.drawMiniStar(ctx, sparkleX, sparkleY, size);
                    break;
                case 'twinkle':
                    this.drawTwinkle(ctx, sparkleX, sparkleY, size);
                    break;
                case 'dots':
                    ctx.beginPath();
                    ctx.arc(sparkleX, sparkleY, size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'glitter':
                    this.drawGlitter(ctx, sparkleX, sparkleY, size, frame, sparkle.phase);
                    break;
                case 'shimmer':
                    this.drawShimmer(ctx, sparkleX, sparkleY, size);
                    break;
            }
        }
        
        ctx.restore();
    }

    drawMiniStar(ctx, x, y, size) {
        const spikes = 4;
        const outerRadius = size;
        const innerRadius = size / 2;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI / spikes) - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    drawGlitter(ctx, x, y, size, frame, phase) {
        // Dönen glitter efekti
        const rotation = frame * 0.05 + phase;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        // 4 kollu glitter
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.15, -size * 0.15);
        ctx.lineTo(size, 0);
        ctx.lineTo(size * 0.15, size * 0.15);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.15, size * 0.15);
        ctx.lineTo(-size, 0);
        ctx.lineTo(-size * 0.15, -size * 0.15);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    drawShimmer(ctx, x, y, size) {
        // Elmas şeklinde shimmer
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.5, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size * 0.5, y);
        ctx.closePath();
        ctx.fill();
        
        // İç parlaklık
        ctx.globalAlpha *= 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.5);
        ctx.lineTo(x + size * 0.25, y);
        ctx.lineTo(x, y + size * 0.5);
        ctx.lineTo(x - size * 0.25, y);
        ctx.closePath();
        ctx.fill();
    }

    startInnerSparkleAnimation() {
        this.stopInnerSparkleAnimation();
        
        const animate = () => {
            this.innerSparkleFrame++;
            this.render();
            this.innerSparkleAnimationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }

    stopInnerSparkleAnimation() {
        if (this.innerSparkleAnimationFrame) {
            cancelAnimationFrame(this.innerSparkleAnimationFrame);
            this.innerSparkleAnimationFrame = null;
        }
    }

    startSparkleAnimation() {
        this.stopSparkleAnimation();
        
        const animate = () => {
            this.sparkleFrame++;
            this.render({ sparkleFrame: this.sparkleFrame });
            this.sparkleAnimationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }

    stopSparkleAnimation() {
        if (this.sparkleAnimationFrame) {
            cancelAnimationFrame(this.sparkleAnimationFrame);
            this.sparkleAnimationFrame = null;
        }
    }

    // Dekoratif çizgiler
    drawDecorativeLines(ctx, canvas) {
        const x = canvas.width * this.settings.textX / 100;
        const y = canvas.height * this.settings.textY / 100;
        
        ctx.font = `${this.settings.fontSize}px "${this.settings.fontFamily}"`;
        const textWidth = ctx.measureText(this.settings.text).width;
        const textHeight = this.settings.fontSize;
        
        ctx.strokeStyle = this.settings.lineColor;
        ctx.fillStyle = this.settings.lineColor;
        ctx.lineWidth = 1.5;
        
        const lineY = y + textHeight / 2 + 8;
        const lineYTop = y - textHeight / 2 - 8;
        const startX = x - textWidth / 2 - 20;
        const endX = x + textWidth / 2 + 20;
        
        const drawLine = (yPos) => {
            switch (this.settings.lineStyle) {
                case 'underline':
                    ctx.beginPath();
                    ctx.moveTo(startX, yPos);
                    ctx.lineTo(endX, yPos);
                    ctx.stroke();
                    break;
                case 'dashed':
                    ctx.setLineDash([8, 4]);
                    ctx.beginPath();
                    ctx.moveTo(startX, yPos);
                    ctx.lineTo(endX, yPos);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    break;
                case 'dotted':
                    for (let i = startX; i < endX; i += 8) {
                        ctx.beginPath();
                        ctx.arc(i, yPos, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                case 'double':
                    ctx.beginPath();
                    ctx.moveTo(startX, yPos - 2);
                    ctx.lineTo(endX, yPos - 2);
                    ctx.moveTo(startX, yPos + 2);
                    ctx.lineTo(endX, yPos + 2);
                    ctx.stroke();
                    break;
                case 'arrow':
                    ctx.beginPath();
                    ctx.moveTo(startX + 15, yPos);
                    ctx.lineTo(endX - 15, yPos);
                    ctx.stroke();
                    // Sol ok
                    ctx.beginPath();
                    ctx.moveTo(startX + 15, yPos);
                    ctx.lineTo(startX + 5, yPos - 5);
                    ctx.moveTo(startX + 15, yPos);
                    ctx.lineTo(startX + 5, yPos + 5);
                    ctx.stroke();
                    // Sağ ok
                    ctx.beginPath();
                    ctx.moveTo(endX - 15, yPos);
                    ctx.lineTo(endX - 5, yPos - 5);
                    ctx.moveTo(endX - 15, yPos);
                    ctx.lineTo(endX - 5, yPos + 5);
                    ctx.stroke();
                    break;
                case 'wave':
                    ctx.beginPath();
                    ctx.moveTo(startX, yPos);
                    for (let i = startX; i < endX; i += 10) {
                        ctx.quadraticCurveTo(i + 5, yPos - 5, i + 10, yPos);
                    }
                    ctx.stroke();
                    break;
                case 'fancy':
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(startX, yPos);
                    ctx.lineTo(x - 20, yPos);
                    ctx.stroke();
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(x - 20, yPos);
                    ctx.lineTo(x + 20, yPos);
                    ctx.stroke();
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + 20, yPos);
                    ctx.lineTo(endX, yPos);
                    ctx.stroke();
                    ctx.lineWidth = 1.5;
                    break;
                case 'heartline':
                    ctx.beginPath();
                    ctx.moveTo(startX, yPos);
                    ctx.lineTo(x - 30, yPos);
                    ctx.stroke();
                    this.drawHeart(ctx, x - 8, yPos - 8, 12);
                    ctx.beginPath();
                    ctx.moveTo(x + 30, yPos);
                    ctx.lineTo(endX, yPos);
                    ctx.stroke();
                    break;
                case 'starline':
                    ctx.beginPath();
                    ctx.moveTo(startX, yPos);
                    ctx.lineTo(x - 30, yPos);
                    ctx.stroke();
                    this.drawStar(ctx, x, yPos, 5, 8, 4);
                    ctx.beginPath();
                    ctx.moveTo(x + 30, yPos);
                    ctx.lineTo(endX, yPos);
                    ctx.stroke();
                    break;
            }
        };
        
        if (this.settings.linePosition === 'bottom' || this.settings.linePosition === 'both') {
            drawLine(lineY);
        }
        if (this.settings.linePosition === 'top' || this.settings.linePosition === 'both') {
            drawLine(lineYTop);
        }
        if (this.settings.linePosition === 'around') {
            drawLine(lineY);
            drawLine(lineYTop);
            // Sol ve sağ dikey çizgiler
            ctx.beginPath();
            ctx.moveTo(startX - 5, lineYTop);
            ctx.lineTo(startX - 5, lineY);
            ctx.moveTo(endX + 5, lineYTop);
            ctx.lineTo(endX + 5, lineY);
            ctx.stroke();
        }
    }

    // Çerçeve çizimi
    drawFrame(ctx, canvas) {
        const padding = this.settings.framePadding;
        const width = this.settings.frameWidth;
        
        ctx.strokeStyle = this.settings.frameColor;
        ctx.lineWidth = width;
        
        const x = padding;
        const y = padding;
        const w = canvas.width - padding * 2;
        const h = canvas.height - padding * 2;
        
        switch (this.settings.frameStyle) {
            case 'simple':
                ctx.strokeRect(x, y, w, h);
                break;
            case 'rounded':
                this.roundRect(ctx, x, y, w, h, 10);
                ctx.stroke();
                break;
            case 'double':
                ctx.strokeRect(x, y, w, h);
                ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
                break;
            case 'dotted':
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(x, y, w, h);
                ctx.setLineDash([]);
                break;
            case 'dashed':
                ctx.setLineDash([10, 5]);
                ctx.strokeRect(x, y, w, h);
                ctx.setLineDash([]);
                break;
            case 'fancy':
                // Ana çerçeve
                ctx.strokeRect(x, y, w, h);
                // Köşe süslemeleri
                const cornerSize = 15;
                ctx.fillStyle = this.settings.frameColor;
                // Sol üst
                ctx.fillRect(x - 2, y - 2, cornerSize, width + 2);
                ctx.fillRect(x - 2, y - 2, width + 2, cornerSize);
                // Sağ üst
                ctx.fillRect(x + w - cornerSize + 2, y - 2, cornerSize, width + 2);
                ctx.fillRect(x + w - width, y - 2, width + 2, cornerSize);
                // Sol alt
                ctx.fillRect(x - 2, y + h - width, cornerSize, width + 2);
                ctx.fillRect(x - 2, y + h - cornerSize + 2, width + 2, cornerSize);
                // Sağ alt
                ctx.fillRect(x + w - cornerSize + 2, y + h - width, cornerSize, width + 2);
                ctx.fillRect(x + w - width, y + h - cornerSize + 2, width + 2, cornerSize);
                break;
            case 'shadow':
                // Gölge
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(x + 4, y + 4, w, h);
                // Ana çerçeve
                ctx.strokeStyle = this.settings.frameColor;
                ctx.strokeRect(x, y, w, h);
                break;
        }
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // Parçacık sistemi
    initParticles() {
        this.particles = [];
        const count = this.settings.particleDensity;
        
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        const canvas = this.canvas;
        const direction = this.settings.particleDirection;
        
        let x, y, vx, vy;
        
        switch (direction) {
            case 'down':
                x = Math.random() * canvas.width;
                y = -20;
                vx = (Math.random() - 0.5) * 2;
                vy = Math.random() * 2 + 1;
                break;
            case 'up':
                x = Math.random() * canvas.width;
                y = canvas.height + 20;
                vx = (Math.random() - 0.5) * 2;
                vy = -(Math.random() * 2 + 1);
                break;
            case 'left':
                x = canvas.width + 20;
                y = Math.random() * canvas.height;
                vx = -(Math.random() * 2 + 1);
                vy = (Math.random() - 0.5) * 2;
                break;
            case 'right':
                x = -20;
                y = Math.random() * canvas.height;
                vx = Math.random() * 2 + 1;
                vy = (Math.random() - 0.5) * 2;
                break;
            case 'random':
                x = Math.random() * canvas.width;
                y = Math.random() * canvas.height;
                vx = (Math.random() - 0.5) * 3;
                vy = (Math.random() - 0.5) * 3;
                break;
            case 'explode':
                x = canvas.width / 2;
                y = canvas.height / 2;
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 3 + 1;
                vx = Math.cos(angle) * speed;
                vy = Math.sin(angle) * speed;
                break;
            default:
                x = Math.random() * canvas.width;
                y = -20;
                vx = 0;
                vy = Math.random() * 2 + 1;
        }
        
        return {
            x,
            y,
            vx,
            vy,
            size: this.settings.particleSize * (0.5 + Math.random() * 0.5),
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            opacity: Math.random() * 0.5 + 0.5,
            hue: Math.random() * 360,
            life: 1
        };
    }

    updateParticles() {
        const canvas = this.canvas;
        
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            p.hue = (p.hue + 2) % 360;
            
            // Ekran dışına çıkanları yenile
            const isOutside = 
                p.x < -30 || p.x > canvas.width + 30 ||
                p.y < -30 || p.y > canvas.height + 30;
            
            if (isOutside) {
                this.particles[i] = this.createParticle();
            }
        }
    }

    drawParticles(ctx, canvas, frame = 0) {
        const type = this.settings.particleType;
        const blend = this.settings.particleBlendMode || 'source-over';
        
        for (const p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.globalAlpha = p.opacity;
            ctx.globalCompositeOperation = blend;
            
            // Renk belirleme
            let color;
            if (this.settings.particleRainbow) {
                color = `hsl(${p.hue}, 100%, 60%)`;
            } else {
                color = this.settings.particleColor;
            }
            
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            
            const size = p.size;
            
            switch (type) {
                case 'stars':
                    this.drawStar(ctx, 0, 0, 5, size, size / 2);
                    break;
                case 'hearts':
                    this.drawHeart(ctx, 0, 0, size);
                    break;
                case 'sparkles':
                    this.drawSparkle(ctx, 0, 0, size);
                    break;
                case 'snow':
                    this.drawSnowflake(ctx, 0, 0, size);
                    break;
                case 'bubbles':
                    ctx.beginPath();
                    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 0.3;
                    ctx.fill();
                    break;
                case 'fire':
                    this.drawFire(ctx, 0, 0, size, p.hue);
                    break;
                case 'confetti':
                    ctx.fillRect(-size / 2, -size / 4, size, size / 2);
                    break;
                case 'flowers':
                    this.drawFlower(ctx, 0, 0, size);
                    break;
            }
            
            ctx.restore();
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    drawHeart(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size / 4);
        ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
        ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 0.7, x, y + size);
        ctx.bezierCurveTo(x, y + size * 0.7, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
        ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
        ctx.fill();
    }

    drawSparkle(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size / 4, y - size / 4);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size / 4, y + size / 4);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size / 4, y + size / 4);
        ctx.lineTo(x - size, y);
        ctx.lineTo(x - size / 4, y - size / 4);
        ctx.closePath();
        ctx.fill();
    }

    drawSnowflake(ctx, x, y, size) {
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -size);
            ctx.moveTo(0, -size * 0.6);
            ctx.lineTo(-size * 0.3, -size * 0.8);
            ctx.moveTo(0, -size * 0.6);
            ctx.lineTo(size * 0.3, -size * 0.8);
            ctx.stroke();
            ctx.restore();
        }
    }

    drawFire(ctx, x, y, size, hue) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFlower(ctx, x, y, size) {
        const petalCount = 5;
        for (let i = 0; i < petalCount; i++) {
            ctx.save();
            ctx.rotate(i * (Math.PI * 2 / petalCount));
            ctx.beginPath();
            ctx.ellipse(0, -size / 2, size / 3, size / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        // Çiçek ortası
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 0, size / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    startParticleAnimation() {
        this.stopParticleAnimation();
        this.initParticles();
        
        let frame = 0;
        const animate = () => {
            this.updateParticles();
            this.flagPhase = frame; // Bayrak animasyonu için
            this.render({ particleFrame: frame });
            frame++;
            this.particleAnimationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }

    stopParticleAnimation() {
        if (this.particleAnimationFrame) {
            cancelAnimationFrame(this.particleAnimationFrame);
            this.particleAnimationFrame = null;
        }
    }

    startFlagAnimation() {
        // Eğer zaten parçacık animasyonu çalışıyorsa, sadece render et
        if (this.particleAnimationFrame) {
            this.render();
            return;
        }
        
        // Bayrak yoksa animasyon başlatma
        if (this.settings.leftFlag === 'none' && this.settings.rightFlag === 'none') {
            this.stopFlagAnimation();
            this.render();
            return;
        }
        
        // Sadece bayrak animasyonu
        this.stopFlagAnimation();
        
        const animate = () => {
            this.flagPhase++;
            this.render();
            this.flagAnimationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }

    stopFlagAnimation() {
        if (this.flagAnimationFrame) {
            cancelAnimationFrame(this.flagAnimationFrame);
            this.flagAnimationFrame = null;
        }
    }

    drawBackground(ctx, canvas, hueShift = 0) {
        switch (this.settings.bgType) {
            case 'gradient1':
                const grad1 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                grad1.addColorStop(0, this.shiftHue('#ff6b6b', hueShift));
                grad1.addColorStop(1, this.shiftHue('#feca57', hueShift));
                ctx.fillStyle = grad1;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                break;
            case 'gradient2':
                const grad2 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                grad2.addColorStop(0, this.shiftHue('#5f27cd', hueShift));
                grad2.addColorStop(1, this.shiftHue('#341f97', hueShift));
                ctx.fillStyle = grad2;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                break;
            case 'gradient3':
                const grad3 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                grad3.addColorStop(0, this.shiftHue('#00b894', hueShift));
                grad3.addColorStop(1, this.shiftHue('#0984e3', hueShift));
                ctx.fillStyle = grad3;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                break;
            case 'dark':
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                break;
            case 'transparent':
                // Keep transparent
                break;
            case 'custom':
                if (this.bgImage) {
                    this.drawImageWithEffect(ctx, this.bgImage, 0, 0, canvas.width, canvas.height, true);
                }
                break;
            default:
                const gradDefault = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradDefault.addColorStop(0, '#667eea');
                gradDefault.addColorStop(1, '#764ba2');
                ctx.fillStyle = gradDefault;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    drawDecorations(ctx, canvas) {
        const decorSize = Math.min(canvas.height * 0.8, 60);
        const margin = 10;

        if (this.leftDecorImage) {
            const aspectRatio = this.leftDecorImage.width / this.leftDecorImage.height;
            const width = decorSize * aspectRatio;
            const height = decorSize;
            const y = (canvas.height - height) / 2;
            this.drawImageWithEffect(ctx, this.leftDecorImage, margin, y, width, height);
        }

        if (this.rightDecorImage) {
            const aspectRatio = this.rightDecorImage.width / this.rightDecorImage.height;
            const width = decorSize * aspectRatio;
            const height = decorSize;
            const y = (canvas.height - height) / 2;
            this.drawImageWithEffect(ctx, this.rightDecorImage, canvas.width - width - margin, y, width, height);
        }

        // Bayrakları çiz
        this.drawFlags(ctx, canvas);
    }

    drawImageWithEffect(ctx, image, x, y, width, height, isBackground = false) {
        const effect = this.settings.imageEffect;
        
        // Boyutları tam sayıya çevir ve minimum 1 yap
        width = Math.max(1, Math.floor(width));
        height = Math.max(1, Math.floor(height));
        
        // Kaynak kırpma hesapla (sadece arka plan için)
        let srcX = 0, srcY = 0;
        let srcWidth = image.naturalWidth || image.width;
        let srcHeight = image.naturalHeight || image.height;
        
        if (isBackground) {
            const cropX = this.settings.imageCropX / 100;
            const cropY = this.settings.imageCropY / 100;
            const cropW = this.settings.imageCropWidth / 100;
            const cropH = this.settings.imageCropHeight / 100;
            
            srcX = Math.floor(srcWidth * cropX);
            srcY = Math.floor(srcHeight * cropY);
            srcWidth = Math.floor((image.naturalWidth || image.width) * cropW);
            srcHeight = Math.floor((image.naturalHeight || image.height) * cropH);
        }
        
        // Yüksek kaliteli çizim ayarları
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Fotoğraf ayarları var mı kontrol et
        const hasPhotoAdjustments = isBackground && (
            this.settings.imageSaturation !== 100 ||
            this.settings.imageTemperature !== 0 ||
            this.settings.imageHue !== 0 ||
            this.settings.imageSharpness > 0
        );
        
        if (effect === 'none' && !hasPhotoAdjustments) {
            // Yüksek kaliteli çizim için orijinal boyutlardan scale et
            this.drawHighQualityImage(ctx, image, x, y, width, height, srcX, srcY, srcWidth, srcHeight);
            return;
        }

        // Efektli çizim için yüksek çözünürlüklü geçici canvas
        const scale = Math.min(2, Math.max(1, srcWidth / width)); // Max 2x upscale
        const tempWidth = Math.floor(width * scale);
        const tempHeight = Math.floor(height * scale);
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = tempWidth;
        tempCanvas.height = tempHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Yüksek kaliteli ayarlar
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        
        // Resmi geçici canvas'a yüksek kalitede çiz (kırpma ile)
        tempCtx.drawImage(image, srcX, srcY, srcWidth, srcHeight, 0, 0, tempWidth, tempHeight);
        
        // Pixel verilerini al
        let imageData;
        try {
            imageData = tempCtx.getImageData(0, 0, tempWidth, tempHeight);
        } catch(e) {
            // CORS hatası veya başka bir hata durumunda normal çiz
            this.drawHighQualityImage(ctx, image, x, y, width, height, srcX, srcY, srcWidth, srcHeight);
            return;
        }
        const data = imageData.data;
        
        switch(effect) {
            case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg;     // R
                    data[i + 1] = avg; // G
                    data[i + 2] = avg; // B
                }
                break;
                
            case 'sepia':
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                }
                break;
                
            case 'invert':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }
                break;
                
            case 'brightness':
                const brightnessAmount = 50;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] + brightnessAmount);
                    data[i + 1] = Math.min(255, data[i + 1] + brightnessAmount);
                    data[i + 2] = Math.min(255, data[i + 2] + brightnessAmount);
                }
                break;
                
            case 'contrast':
                const contrastFactor = 1.5;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrastFactor + 128));
                    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrastFactor + 128));
                    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrastFactor + 128));
                }
                break;
                
            case 'vintage':
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    // Vintage efekti - hafif sarımsı ve soluk
                    data[i] = Math.min(255, r * 1.1);
                    data[i + 1] = Math.min(255, g * 0.9);
                    data[i + 2] = Math.min(255, b * 0.7);
                }
                break;
                
            case 'blur':
                // Basit blur - CSS filter kullan
                tempCtx.putImageData(imageData, 0, 0);
                ctx.save();
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.filter = 'blur(2px)';
                ctx.drawImage(tempCanvas, x, y, width, height);
                ctx.restore();
                return;
        }
        
        // Fotoğraf düzenleme ayarlarını uygula (sadece arka plan için)
        if (isBackground) {
            this.applyPhotoAdjustments(data);
        }
        
        // Efektli veriyi geri yaz
        tempCtx.putImageData(imageData, 0, 0);
        
        // Keskinlik uygula (sadece arka plan için)
        if (isBackground && this.settings.imageSharpness > 0) {
            this.applySharpness(tempCtx, tempWidth, tempHeight, this.settings.imageSharpness);
        }
        
        // Ana canvas'a yüksek kaliteli çiz
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(tempCanvas, x, y, width, height);
    }
    
    // Fotoğraf ayarlarını pixel verilerine uygula
    applyPhotoAdjustments(data) {
        const saturation = this.settings.imageSaturation / 100; // 0-2 arası
        const temperature = this.settings.imageTemperature; // -100 ile 100 arası
        const hue = this.settings.imageHue; // -180 ile 180 arası
        
        // Varsayılan değerlerde hiçbir şey yapma
        if (saturation === 1 && temperature === 0 && hue === 0) return;
        
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            
            // Ton (Hue) ayarı - renk döndürme
            if (hue !== 0) {
                // RGB -> HSL dönüşümü
                const rNorm = r / 255;
                const gNorm = g / 255;
                const bNorm = b / 255;
                
                const max = Math.max(rNorm, gNorm, bNorm);
                const min = Math.min(rNorm, gNorm, bNorm);
                let h, s, l = (max + min) / 2;
                
                if (max === min) {
                    h = s = 0;
                } else {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                        case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
                        case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
                        case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
                    }
                }
                
                // Hue'yu değiştir
                h = (h + hue / 360 + 1) % 1;
                
                // HSL -> RGB dönüşümü
                if (s === 0) {
                    r = g = b = l * 255;
                } else {
                    const hue2rgb = (p, q, t) => {
                        if (t < 0) t += 1;
                        if (t > 1) t -= 1;
                        if (t < 1/6) return p + (q - p) * 6 * t;
                        if (t < 1/2) return q;
                        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                        return p;
                    };
                    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                    const p = 2 * l - q;
                    r = hue2rgb(p, q, h + 1/3) * 255;
                    g = hue2rgb(p, q, h) * 255;
                    b = hue2rgb(p, q, h - 1/3) * 255;
                }
            }
            
            // Doygunluk (Saturation) ayarı
            if (saturation !== 1) {
                const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
                r = Math.min(255, Math.max(0, gray + (r - gray) * saturation));
                g = Math.min(255, Math.max(0, gray + (g - gray) * saturation));
                b = Math.min(255, Math.max(0, gray + (b - gray) * saturation));
            }
            
            // Sıcaklık (Temperature) ayarı - sıcak/soğuk
            if (temperature !== 0) {
                const tempFactor = temperature / 100;
                if (tempFactor > 0) {
                    // Sıcak (sarı-turuncu tonlar)
                    r = Math.min(255, r + tempFactor * 30);
                    g = Math.min(255, g + tempFactor * 15);
                    b = Math.max(0, b - tempFactor * 20);
                } else {
                    // Soğuk (mavi tonlar)
                    r = Math.max(0, r + tempFactor * 20);
                    g = Math.min(255, g - tempFactor * 5);
                    b = Math.min(255, b - tempFactor * 30);
                }
            }
            
            data[i] = Math.round(r);
            data[i + 1] = Math.round(g);
            data[i + 2] = Math.round(b);
        }
    }
    
    // Keskinlik filtresi uygula (Unsharp Mask benzeri)
    applySharpness(ctx, width, height, amount) {
        if (amount <= 0) return;
        
        const factor = amount / 100; // 0-1 arası
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const dataCopy = new Uint8ClampedArray(data);
        
        // Basit Unsharp Mask - merkez pikseli güçlendir
        const kernel = factor * 0.5;
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                for (let c = 0; c < 3; c++) { // RGB kanalları
                    const center = dataCopy[idx + c];
                    
                    // Çevredeki piksellerin ortalaması
                    const neighbors = (
                        dataCopy[idx - width * 4 + c] + // üst
                        dataCopy[idx + width * 4 + c] + // alt
                        dataCopy[idx - 4 + c] + // sol
                        dataCopy[idx + 4 + c]   // sağ
                    ) / 4;
                    
                    // Keskinleştirme: merkez - blur farkını ekle
                    const sharpened = center + (center - neighbors) * kernel;
                    data[idx + c] = Math.min(255, Math.max(0, sharpened));
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // Yüksek kaliteli resim çizimi - Lanczos benzeri kalite
    drawHighQualityImage(ctx, image, x, y, targetWidth, targetHeight, srcX = 0, srcY = 0, srcWidth = null, srcHeight = null) {
        // Kaynak boyutları varsayılan olarak tam resim
        if (srcWidth === null) srcWidth = image.naturalWidth || image.width;
        if (srcHeight === null) srcHeight = image.naturalHeight || image.height;
        
        // Eğer hedef boyut kaynaktan küçükse, kademeli küçültme yap
        if (targetWidth < srcWidth * 0.5 || targetHeight < srcHeight * 0.5) {
            // Kademeli downscale - her adımda %50 küçült (daha iyi kalite)
            let currentWidth = srcWidth;
            let currentHeight = srcHeight;
            
            let tempCanvas = document.createElement('canvas');
            let tempCtx = tempCanvas.getContext('2d');
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';
            
            // İlk adım: kırpılmış resmi tempCanvas'a koy
            tempCanvas.width = currentWidth;
            tempCanvas.height = currentHeight;
            tempCtx.drawImage(image, srcX, srcY, srcWidth, srcHeight, 0, 0, currentWidth, currentHeight);
            
            // Kademeli küçültme (her adımda max %50)
            while (currentWidth > targetWidth * 2 || currentHeight > targetHeight * 2) {
                const newWidth = Math.max(targetWidth, Math.floor(currentWidth / 2));
                const newHeight = Math.max(targetHeight, Math.floor(currentHeight / 2));
                
                const newCanvas = document.createElement('canvas');
                newCanvas.width = newWidth;
                newCanvas.height = newHeight;
                const newCtx = newCanvas.getContext('2d');
                newCtx.imageSmoothingEnabled = true;
                newCtx.imageSmoothingQuality = 'high';
                newCtx.drawImage(tempCanvas, 0, 0, currentWidth, currentHeight, 0, 0, newWidth, newHeight);
                
                tempCanvas = newCanvas;
                tempCtx = newCtx;
                currentWidth = newWidth;
                currentHeight = newHeight;
            }
            
            // Son adım: hedef boyuta çiz
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(tempCanvas, 0, 0, currentWidth, currentHeight, x, y, targetWidth, targetHeight);
        } else {
            // Normal çizim (küçültme az veya büyütme) - kırpma ile
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight, x, y, targetWidth, targetHeight);
        }
    }

    drawFlags(ctx, canvas, phase = null) {
        const flagSize = this.settings.flagSize;
        const animPhase = phase !== null ? phase : this.flagPhase;

        if (this.settings.leftFlag !== 'none') {
            // Sol bayrak pozisyonu - yüzde hesapla
            const x = (canvas.width * this.settings.flagLeftX / 100) - (flagSize * 0.75);
            const y = (canvas.height * this.settings.flagY / 100) - (flagSize / 2);
            this.drawFlag(ctx, this.settings.leftFlag, x, y, flagSize, animPhase);
        }

        if (this.settings.rightFlag !== 'none') {
            // Sağ bayrak pozisyonu - yüzde hesapla
            const x = (canvas.width * this.settings.flagRightX / 100) - (flagSize * 0.75);
            const y = (canvas.height * this.settings.flagY / 100) - (flagSize / 2);
            this.drawFlag(ctx, this.settings.rightFlag, x, y, flagSize, animPhase);
        }
    }

    drawFlag(ctx, flagType, x, y, size, phase) {
        const width = size * 1.5;
        const height = size;
        const animation = this.settings.flagAnimation;
        
        ctx.save();
        
        // Animasyon efektleri
        if (animation === 'rotating') {
            ctx.translate(x + width/2, y + height/2);
            ctx.rotate(phase * 0.1);
            ctx.translate(-(x + width/2), -(y + height/2));
        } else if (animation === 'pulse') {
            const scale = 1 + Math.sin(phase * 0.2) * 0.1;
            ctx.translate(x + width/2, y + height/2);
            ctx.scale(scale, scale);
            ctx.translate(-(x + width/2), -(y + height/2));
        }

        // Bayrak tipine göre çiz
        switch(flagType) {
            case 'turkey':
                this.drawTurkishFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'usa':
                this.drawUSAFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'germany':
                this.drawGermanFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'france':
                this.drawFrenchFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'uk':
                this.drawUKFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'italy':
                this.drawItalianFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'spain':
                this.drawSpanishFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'netherlands':
                this.drawDutchFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'russia':
                this.drawRussianFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'brazil':
                this.drawBrazilFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'japan':
                this.drawJapanFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'southkorea':
                this.drawSouthKoreaFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'china':
                this.drawChinaFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'canada':
                this.drawCanadaFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'australia':
                this.drawAustraliaFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'mexico':
                this.drawMexicoFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'argentina':
                this.drawArgentinaFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'india':
                this.drawIndiaFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'saudiarabia':
                this.drawSaudiFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'uae':
                this.drawUAEFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'egypt':
                this.drawEgyptFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'greece':
                this.drawGreeceFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'portugal':
                this.drawPortugalFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'poland':
                this.drawPolandFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'sweden':
                this.drawSwedenFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'norway':
                this.drawNorwayFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'finland':
                this.drawFinlandFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'denmark':
                this.drawDenmarkFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'switzerland':
                this.drawSwitzerlandFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'austria':
                this.drawAustriaFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'belgium':
                this.drawBelgiumFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'ukraine':
                this.drawUkraineFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'israel':
                this.drawIsraelFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'pakistan':
                this.drawPakistanFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'indonesia':
                this.drawIndonesiaFlag(ctx, x, y, width, height, phase, animation);
                break;
            case 'azerbaijan':
                this.drawAzerbaijanFlag(ctx, x, y, width, height, phase, animation);
                break;
        }
        
        ctx.restore();
    }

    drawTurkishFlag(ctx, x, y, width, height, phase, animation) {
        const stripes = 10;
        const stripeWidth = width / stripes;
        
        for (let i = 0; i < stripes; i++) {
            ctx.save();
            
            // Dalgalanma efekti
            let offsetY = 0;
            if (animation === 'wave') {
                offsetY = Math.sin((phase * 0.15) + (i * 0.5)) * 3;
            }
            
            ctx.beginPath();
            ctx.rect(x + i * stripeWidth, y + offsetY, stripeWidth + 1, height);
            ctx.clip();
            
            // Kırmızı zemin
            ctx.fillStyle = '#E30A17';
            ctx.fillRect(x, y + offsetY, width, height);
            
            // Beyaz hilal
            const centerX = x + width * 0.38;
            const centerY = y + height / 2 + offsetY;
            const outerRadius = height * 0.35;
            const innerRadius = height * 0.28;
            
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // İç kısım (hilal için)
            ctx.fillStyle = '#E30A17';
            ctx.beginPath();
            ctx.arc(centerX + outerRadius * 0.25, centerY, innerRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Yıldız
            ctx.fillStyle = '#FFFFFF';
            this.drawStar(ctx, x + width * 0.575, centerY, height * 0.14, 5, 0.5);
            
            ctx.restore();
        }
        
        // Kenarlık
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawStar(ctx, cx, cy, radius, points, innerRatio) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? radius : radius * innerRatio;
            const angle = (i * Math.PI / points) - Math.PI / 2;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    drawUSAFlag(ctx, x, y, width, height, phase, animation) {
        const stripeHeight = height / 13;
        
        // Çizgiler
        for (let i = 0; i < 13; i++) {
            let offsetY = 0;
            if (animation === 'wave') {
                offsetY = Math.sin((phase * 0.15) + (i * 0.3)) * 2;
            }
            ctx.fillStyle = i % 2 === 0 ? '#B22234' : '#FFFFFF';
            ctx.fillRect(x, y + i * stripeHeight + offsetY, width, stripeHeight + 1);
        }
        
        // Mavi kutu
        const blueWidth = width * 0.4;
        const blueHeight = stripeHeight * 7;
        ctx.fillStyle = '#3C3B6E';
        ctx.fillRect(x, y, blueWidth, blueHeight);
        
        // Kenarlık
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawGermanFlag(ctx, x, y, width, height, phase, animation) {
        const colors = ['#000000', '#DD0000', '#FFCE00'];
        const stripeHeight = height / 3;
        
        colors.forEach((color, i) => {
            let offsetY = 0;
            if (animation === 'wave') {
                offsetY = Math.sin((phase * 0.15) + (i * 0.5)) * 2;
            }
            ctx.fillStyle = color;
            ctx.fillRect(x, y + i * stripeHeight + offsetY, width, stripeHeight + 1);
        });
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawFrenchFlag(ctx, x, y, width, height, phase, animation) {
        const colors = ['#002395', '#FFFFFF', '#ED2939'];
        const stripeWidth = width / 3;
        
        colors.forEach((color, i) => {
            let offsetY = 0;
            if (animation === 'wave') {
                offsetY = Math.sin((phase * 0.15) + (i * 0.5)) * 2;
            }
            ctx.fillStyle = color;
            ctx.fillRect(x + i * stripeWidth, y + offsetY, stripeWidth + 1, height);
        });
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawUKFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Mavi zemin
        ctx.fillStyle = '#012169';
        ctx.fillRect(x, y + offsetY, width, height);
        
        // Beyaz çapraz
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = height * 0.15;
        ctx.beginPath();
        ctx.moveTo(x, y + offsetY);
        ctx.lineTo(x + width, y + height + offsetY);
        ctx.moveTo(x + width, y + offsetY);
        ctx.lineTo(x, y + height + offsetY);
        ctx.stroke();
        
        // Kırmızı çapraz
        ctx.strokeStyle = '#C8102E';
        ctx.lineWidth = height * 0.08;
        ctx.beginPath();
        ctx.moveTo(x, y + offsetY);
        ctx.lineTo(x + width, y + height + offsetY);
        ctx.moveTo(x + width, y + offsetY);
        ctx.lineTo(x, y + height + offsetY);
        ctx.stroke();
        
        // Beyaz haç
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = height * 0.25;
        ctx.beginPath();
        ctx.moveTo(x + width/2, y + offsetY);
        ctx.lineTo(x + width/2, y + height + offsetY);
        ctx.moveTo(x, y + height/2 + offsetY);
        ctx.lineTo(x + width, y + height/2 + offsetY);
        ctx.stroke();
        
        // Kırmızı haç
        ctx.strokeStyle = '#C8102E';
        ctx.lineWidth = height * 0.15;
        ctx.beginPath();
        ctx.moveTo(x + width/2, y + offsetY);
        ctx.lineTo(x + width/2, y + height + offsetY);
        ctx.moveTo(x, y + height/2 + offsetY);
        ctx.lineTo(x + width, y + height/2 + offsetY);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawItalianFlag(ctx, x, y, width, height, phase, animation) {
        const colors = ['#008C45', '#F4F5F0', '#CD212A'];
        const stripeWidth = width / 3;
        
        colors.forEach((color, i) => {
            let offsetY = 0;
            if (animation === 'wave') {
                offsetY = Math.sin((phase * 0.15) + (i * 0.5)) * 2;
            }
            ctx.fillStyle = color;
            ctx.fillRect(x + i * stripeWidth, y + offsetY, stripeWidth + 1, height);
        });
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawSpanishFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        ctx.fillStyle = '#AA151B';
        ctx.fillRect(x, y + offsetY, width, height * 0.25);
        ctx.fillRect(x, y + height * 0.75 + offsetY, width, height * 0.25);
        
        ctx.fillStyle = '#F1BF00';
        ctx.fillRect(x, y + height * 0.25 + offsetY, width, height * 0.5);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawDutchFlag(ctx, x, y, width, height, phase, animation) {
        const colors = ['#AE1C28', '#FFFFFF', '#21468B'];
        const stripeHeight = height / 3;
        
        colors.forEach((color, i) => {
            let offsetY = 0;
            if (animation === 'wave') {
                offsetY = Math.sin((phase * 0.15) + (i * 0.5)) * 2;
            }
            ctx.fillStyle = color;
            ctx.fillRect(x, y + i * stripeHeight + offsetY, width, stripeHeight + 1);
        });
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawRussianFlag(ctx, x, y, width, height, phase, animation) {
        const colors = ['#FFFFFF', '#0039A6', '#D52B1E'];
        const stripeHeight = height / 3;
        
        colors.forEach((color, i) => {
            let offsetY = 0;
            if (animation === 'wave') {
                offsetY = Math.sin((phase * 0.15) + (i * 0.5)) * 2;
            }
            ctx.fillStyle = color;
            ctx.fillRect(x, y + i * stripeHeight + offsetY, width, stripeHeight + 1);
        });
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawBrazilFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Yeşil zemin
        ctx.fillStyle = '#009739';
        ctx.fillRect(x, y + offsetY, width, height);
        
        // Sarı elmas
        ctx.fillStyle = '#FEDD00';
        ctx.beginPath();
        ctx.moveTo(x + width * 0.5, y + offsetY + 2);
        ctx.lineTo(x + width - 2, y + height/2 + offsetY);
        ctx.lineTo(x + width * 0.5, y + height + offsetY - 2);
        ctx.lineTo(x + 2, y + height/2 + offsetY);
        ctx.closePath();
        ctx.fill();
        
        // Mavi daire
        ctx.fillStyle = '#002776';
        ctx.beginPath();
        ctx.arc(x + width/2, y + height/2 + offsetY, height * 0.28, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawJapanFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Beyaz zemin
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y + offsetY, width, height);
        
        // Kırmızı daire
        ctx.fillStyle = '#BC002D';
        ctx.beginPath();
        ctx.arc(x + width/2, y + height/2 + offsetY, height * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawSouthKoreaFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Beyaz zemin
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y + offsetY, width, height);
        
        // Merkez yin-yang (basitleştirilmiş)
        ctx.fillStyle = '#C60C30';
        ctx.beginPath();
        ctx.arc(x + width/2, y + height/2 + offsetY, height * 0.25, 0, Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#003478';
        ctx.beginPath();
        ctx.arc(x + width/2, y + height/2 + offsetY, height * 0.25, Math.PI, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawChinaFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Kırmızı zemin
        ctx.fillStyle = '#DE2910';
        ctx.fillRect(x, y + offsetY, width, height);
        
        // Sarı yıldız
        ctx.fillStyle = '#FFDE00';
        this.drawStar(ctx, x + width * 0.2, y + height * 0.35 + offsetY, height * 0.2, 5, 0.5);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawCanadaFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Kırmızı şeritler
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x, y + offsetY, width * 0.25, height);
        ctx.fillRect(x + width * 0.75, y + offsetY, width * 0.25, height);
        
        // Beyaz ortası
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + width * 0.25, y + offsetY, width * 0.5, height);
        
        // Akçaağaç yaprağı (basit)
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(x + width/2, y + height * 0.2 + offsetY);
        ctx.lineTo(x + width * 0.6, y + height * 0.5 + offsetY);
        ctx.lineTo(x + width/2, y + height * 0.8 + offsetY);
        ctx.lineTo(x + width * 0.4, y + height * 0.5 + offsetY);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawAustraliaFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Mavi zemin
        ctx.fillStyle = '#00008B';
        ctx.fillRect(x, y + offsetY, width, height);
        
        // Basit yıldız
        ctx.fillStyle = '#FFFFFF';
        this.drawStar(ctx, x + width * 0.25, y + height * 0.7 + offsetY, height * 0.15, 7, 0.5);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawMexicoFlag(ctx, x, y, width, height, phase, animation) {
        const colors = ['#006341', '#FFFFFF', '#CE1126'];
        const stripeWidth = width / 3;
        
        colors.forEach((color, i) => {
            let offsetY = 0;
            if (animation === 'wave') {
                offsetY = Math.sin((phase * 0.15) + (i * 0.5)) * 2;
            }
            ctx.fillStyle = color;
            ctx.fillRect(x + i * stripeWidth, y + offsetY, stripeWidth + 1, height);
        });
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawArgentinaFlag(ctx, x, y, width, height, phase, animation) {
        const colors = ['#74ACDF', '#FFFFFF', '#74ACDF'];
        const stripeHeight = height / 3;
        
        colors.forEach((color, i) => {
            let offsetY = 0;
            if (animation === 'wave') {
                offsetY = Math.sin((phase * 0.15) + (i * 0.5)) * 2;
            }
            ctx.fillStyle = color;
            ctx.fillRect(x, y + i * stripeHeight + offsetY, width, stripeHeight + 1);
        });
        
        // Güneş
        ctx.fillStyle = '#F6B40E';
        ctx.beginPath();
        ctx.arc(x + width/2, y + height/2, height * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawIndiaFlag(ctx, x, y, width, height, phase, animation) {
        const colors = ['#FF9933', '#FFFFFF', '#138808'];
        const stripeHeight = height / 3;
        
        colors.forEach((color, i) => {
            let offsetY = 0;
            if (animation === 'wave') {
                offsetY = Math.sin((phase * 0.15) + (i * 0.5)) * 2;
            }
            ctx.fillStyle = color;
            ctx.fillRect(x, y + i * stripeHeight + offsetY, width, stripeHeight + 1);
        });
        
        // Chakra (basit daire)
        ctx.strokeStyle = '#000080';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + width/2, y + height/2, height * 0.12, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawSaudiFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Yeşil zemin
        ctx.fillStyle = '#006C35';
        ctx.fillRect(x, y + offsetY, width, height);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawUAEFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Kırmızı dikey şerit
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x, y + offsetY, width * 0.25, height);
        
        // Yeşil
        ctx.fillStyle = '#00732F';
        ctx.fillRect(x + width * 0.25, y + offsetY, width * 0.75, height / 3);
        
        // Beyaz
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + width * 0.25, y + height/3 + offsetY, width * 0.75, height / 3);
        
        // Siyah
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + width * 0.25, y + height * 2/3 + offsetY, width * 0.75, height / 3);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawEgyptFlag(ctx, x, y, width, height, phase, animation) {
        const colors = ['#CE1126', '#FFFFFF', '#000000'];
        const stripeHeight = height / 3;
        
        colors.forEach((color, i) => {
            let offsetY = 0;
            if (animation === 'wave') {
                offsetY = Math.sin((phase * 0.15) + (i * 0.5)) * 2;
            }
            ctx.fillStyle = color;
            ctx.fillRect(x, y + i * stripeHeight + offsetY, width, stripeHeight + 1);
        });
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawGreeceFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        const stripeHeight = height / 9;
        
        for (let i = 0; i < 9; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#0D5EAF' : '#FFFFFF';
            ctx.fillRect(x, y + i * stripeHeight + offsetY, width, stripeHeight + 1);
        }
        
        // Mavi kare
        ctx.fillStyle = '#0D5EAF';
        ctx.fillRect(x, y + offsetY, width * 0.37, stripeHeight * 5);
        
        // Beyaz haç
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y + stripeHeight * 2 + offsetY, width * 0.37, stripeHeight);
        ctx.fillRect(x + width * 0.15, y + offsetY, width * 0.07, stripeHeight * 5);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawPortugalFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Yeşil
        ctx.fillStyle = '#006600';
        ctx.fillRect(x, y + offsetY, width * 0.4, height);
        
        // Kırmızı
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x + width * 0.4, y + offsetY, width * 0.6, height);
        
        // Sarı daire
        ctx.fillStyle = '#FFCC00';
        ctx.beginPath();
        ctx.arc(x + width * 0.4, y + height/2 + offsetY, height * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawPolandFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y + offsetY, width, height / 2);
        
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(x, y + height/2 + offsetY, width, height / 2);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawSwedenFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Mavi zemin
        ctx.fillStyle = '#006AA7';
        ctx.fillRect(x, y + offsetY, width, height);
        
        // Sarı haç
        ctx.fillStyle = '#FECC00';
        ctx.fillRect(x + width * 0.28, y + offsetY, width * 0.12, height);
        ctx.fillRect(x, y + height * 0.4 + offsetY, width, height * 0.2);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawNorwayFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Kırmızı zemin
        ctx.fillStyle = '#EF2B2D';
        ctx.fillRect(x, y + offsetY, width, height);
        
        // Beyaz haç
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + width * 0.24, y + offsetY, width * 0.18, height);
        ctx.fillRect(x, y + height * 0.35 + offsetY, width, height * 0.3);
        
        // Mavi haç
        ctx.fillStyle = '#002868';
        ctx.fillRect(x + width * 0.28, y + offsetY, width * 0.1, height);
        ctx.fillRect(x, y + height * 0.4 + offsetY, width, height * 0.2);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawFinlandFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Beyaz zemin
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y + offsetY, width, height);
        
        // Mavi haç
        ctx.fillStyle = '#002F6C';
        ctx.fillRect(x + width * 0.28, y + offsetY, width * 0.12, height);
        ctx.fillRect(x, y + height * 0.4 + offsetY, width, height * 0.2);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawDenmarkFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Kırmızı zemin
        ctx.fillStyle = '#C60C30';
        ctx.fillRect(x, y + offsetY, width, height);
        
        // Beyaz haç
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + width * 0.28, y + offsetY, width * 0.1, height);
        ctx.fillRect(x, y + height * 0.4 + offsetY, width, height * 0.2);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawSwitzerlandFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Kırmızı zemin
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x, y + offsetY, width, height);
        
        // Beyaz artı
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + width * 0.4, y + height * 0.2 + offsetY, width * 0.2, height * 0.6);
        ctx.fillRect(x + width * 0.2, y + height * 0.4 + offsetY, width * 0.6, height * 0.2);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawAustriaFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        ctx.fillStyle = '#ED2939';
        ctx.fillRect(x, y + offsetY, width, height / 3);
        ctx.fillRect(x, y + height * 2/3 + offsetY, width, height / 3);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y + height/3 + offsetY, width, height / 3);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawBelgiumFlag(ctx, x, y, width, height, phase, animation) {
        const colors = ['#000000', '#FAE042', '#ED2939'];
        const stripeWidth = width / 3;
        
        colors.forEach((color, i) => {
            let offsetY = 0;
            if (animation === 'wave') {
                offsetY = Math.sin((phase * 0.15) + (i * 0.5)) * 2;
            }
            ctx.fillStyle = color;
            ctx.fillRect(x + i * stripeWidth, y + offsetY, stripeWidth + 1, height);
        });
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawUkraineFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        ctx.fillStyle = '#005BBB';
        ctx.fillRect(x, y + offsetY, width, height / 2);
        
        ctx.fillStyle = '#FFD500';
        ctx.fillRect(x, y + height/2 + offsetY, width, height / 2);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawIsraelFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Beyaz zemin
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y + offsetY, width, height);
        
        // Mavi şeritler
        ctx.fillStyle = '#0038B8';
        ctx.fillRect(x, y + height * 0.1 + offsetY, width, height * 0.12);
        ctx.fillRect(x, y + height * 0.78 + offsetY, width, height * 0.12);
        
        // David yıldızı (basit)
        ctx.strokeStyle = '#0038B8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const cx = x + width/2;
        const cy = y + height/2 + offsetY;
        const size = height * 0.2;
        // Üçgen yukarı
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx - size * 0.87, cy + size * 0.5);
        ctx.lineTo(cx + size * 0.87, cy + size * 0.5);
        ctx.closePath();
        ctx.stroke();
        // Üçgen aşağı
        ctx.beginPath();
        ctx.moveTo(cx, cy + size);
        ctx.lineTo(cx - size * 0.87, cy - size * 0.5);
        ctx.lineTo(cx + size * 0.87, cy - size * 0.5);
        ctx.closePath();
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawPakistanFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        // Beyaz şerit
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y + offsetY, width * 0.25, height);
        
        // Yeşil ana alan
        ctx.fillStyle = '#01411C';
        ctx.fillRect(x + width * 0.25, y + offsetY, width * 0.75, height);
        
        // Hilal ve yıldız
        ctx.fillStyle = '#FFFFFF';
        const cx = x + width * 0.6;
        const cy = y + height/2 + offsetY;
        ctx.beginPath();
        ctx.arc(cx, cy, height * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#01411C';
        ctx.beginPath();
        ctx.arc(cx + height * 0.08, cy, height * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        this.drawStar(ctx, cx + height * 0.22, cy, height * 0.1, 5, 0.5);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawIndonesiaFlag(ctx, x, y, width, height, phase, animation) {
        let offsetY = animation === 'wave' ? Math.sin(phase * 0.15) * 2 : 0;
        
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x, y + offsetY, width, height / 2);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y + height/2 + offsetY, width, height / 2);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawAzerbaijanFlag(ctx, x, y, width, height, phase, animation) {
        const colors = ['#3F9BBF', '#EF3340', '#00AE65'];
        const stripeHeight = height / 3;
        
        colors.forEach((color, i) => {
            let offsetY = 0;
            if (animation === 'wave') {
                offsetY = Math.sin((phase * 0.15) + (i * 0.5)) * 2;
            }
            ctx.fillStyle = color;
            ctx.fillRect(x, y + i * stripeHeight + offsetY, width, stripeHeight + 1);
        });
        
        // Hilal ve yıldız
        ctx.fillStyle = '#FFFFFF';
        const cx = x + width * 0.5;
        const cy = y + height/2;
        ctx.beginPath();
        ctx.arc(cx, cy, height * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#EF3340';
        ctx.beginPath();
        ctx.arc(cx + height * 0.04, cy, height * 0.095, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        this.drawStar(ctx, cx + height * 0.15, cy, height * 0.06, 8, 0.5);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

    drawText(ctx, canvas, offset = { x: 0, y: 0 }, hueShift = 0) {
        // Tüm text layer'ları çiz
        this.textLayers.forEach(layer => {
            if (!layer.visible) return;
            this.drawSingleTextLayer(ctx, canvas, layer, offset, hueShift);
        });
    }
    
    drawSingleTextLayer(ctx, canvas, layer, offset = { x: 0, y: 0 }, hueShift = 0) {
        const text = layer.text;
        ctx.font = `${layer.fontSize}px "${layer.fontFamily}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Pozisyonu yüzdeye göre hesapla
        const x = (canvas.width * layer.textX / 100) + offset.x;
        const y = (canvas.height * layer.textY / 100) + offset.y;

        ctx.save();
        
        // Opaklık
        ctx.globalAlpha = layer.opacity / 100;
        
        // Rotasyon
        if (layer.rotation !== 0) {
            ctx.translate(x, y);
            ctx.rotate((layer.rotation * Math.PI) / 180);
            ctx.translate(-x, -y);
        }
        
        // 3D Effect
        if (layer.effect3D) {
            for (let i = 5; i > 0; i--) {
                ctx.fillStyle = `rgba(0, 0, 0, ${0.1 * i})`;
                ctx.fillText(text, x + i, y + i);
            }
        }

        // Glow effect
        if (layer.effectGlow) {
            ctx.shadowColor = this.shiftHue(layer.textColor, hueShift);
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } else {
            ctx.shadowColor = layer.shadowColor;
            ctx.shadowBlur = layer.shadowBlur;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }

        // Blend mode ayarla
        const blend = layer.textBlendMode || 'source-over';
        ctx.globalCompositeOperation = blend;

        const fillTextRoutine = (drawX, drawY) => {
            // Text fill
            if (layer.effectGradient) {
                const gradient = ctx.createLinearGradient(drawX - 100, drawY, drawX + 100, drawY);
                gradient.addColorStop(0, this.shiftHue(layer.gradientColor1, hueShift));
                gradient.addColorStop(1, this.shiftHue(layer.gradientColor2, hueShift));
                ctx.fillStyle = gradient;
            } else {
                ctx.fillStyle = this.shiftHue(layer.textColor, hueShift);
            }

            // Outline
            if (layer.effectOutline && layer.outlineWidth > 0) {
                ctx.strokeStyle = layer.outlineColor;
                ctx.lineWidth = layer.outlineWidth * 2;
                ctx.strokeText(text, drawX, drawY);
            }

            ctx.fillText(text, drawX, drawY);
        };

        // Warp support
        if (layer.warpType === 'none') {
            fillTextRoutine(x, y);
        } else {
            // Per-letter warp
            const letters = text.split('');
            const metrics = ctx.measureText(text);
            const totalWidth = metrics.width;
            let cursorX = x - totalWidth / 2;
            const amount = layer.warpAmount || 0.3;
            for (let i = 0; i < letters.length; i++) {
                const letter = letters[i];
                const w = ctx.measureText(letter).width;
                const progress = letters.length > 1 ? i / (letters.length - 1) : 0.5;
                let offsetY = 0;
                let rot = 0;
                if (layer.warpType === 'flag') {
                    offsetY = Math.sin(progress * Math.PI * 2) * layer.fontSize * amount;
                } else if (layer.warpType === 'arc') {
                    const arcSpan = Math.PI * amount;
                    const angle = -arcSpan / 2 + progress * arcSpan;
                    offsetY = Math.sin(angle) * layer.fontSize * amount;
                    rot = angle * 0.35;
                }
                ctx.save();
                ctx.globalCompositeOperation = blend; // Blend'i restore sonrası tekrar ayarla
                ctx.translate(cursorX + w / 2 + offset.x, y + offsetY + offset.y);
                if (rot !== 0) ctx.rotate(rot);
                fillTextRoutine(0, 0);
                ctx.restore();
                cursorX += w;
            }
        }

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    }

    shiftHue(color, shift) {
        if (shift === 0) return color;
        
        // Convert hex to HSL, shift hue, convert back
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        h = (h + shift / 360) % 1;
        if (h < 0) h += 1;

        // HSL to RGB
        let r2, g2, b2;
        if (s === 0) {
            r2 = g2 = b2 = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r2 = hue2rgb(p, q, h + 1/3);
            g2 = hue2rgb(p, q, h);
            b2 = hue2rgb(p, q, h - 1/3);
        }

        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
    }

    previewAnimation() {
        const animationType = document.getElementById('animationType').value;
        
        if (animationType === 'none') {
            this.stopAnimation();
            return;
        }

        this.stopAnimation();
        this.isAnimating = true;

        let frame = 0;
        const animate = () => {
            if (!this.isAnimating) return;

            frame++;
            let offset = { x: 0, y: 0 };
            let hueShift = 0;

            switch (animationType) {
                case 'pulse':
                    const scale = 1 + Math.sin(frame * 0.1) * 0.05;
                    this.ctx.save();
                    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
                    this.ctx.scale(scale, scale);
                    this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
                    this.render();
                    this.ctx.restore();
                    break;
                case 'glow':
                    const glowIntensity = Math.sin(frame * 0.1) * 10 + 15;
                    this.settings.shadowBlur = glowIntensity;
                    this.render();
                    break;
                case 'rainbow':
                    hueShift = (frame * 3) % 360;
                    this.render({ hueShift });
                    break;
                case 'shake':
                    offset.x = Math.sin(frame * 0.5) * 3;
                    this.render({ offset });
                    break;
                case 'bounce':
                    offset.y = Math.abs(Math.sin(frame * 0.1)) * -10;
                    this.render({ offset });
                    break;
            }

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();

        // Stop after 3 seconds
        setTimeout(() => {
            this.stopAnimation();
            this.render();
        }, 3000);
    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        if (this.textAnimationFrame) {
            cancelAnimationFrame(this.textAnimationFrame);
            this.textAnimationFrame = null;
        }
        if (this.scrollAnimationFrame) {
            cancelAnimationFrame(this.scrollAnimationFrame);
            this.scrollAnimationFrame = null;
        }
    }

    // Yazı Animasyonları
    previewTextAnimation() {
        const animationType = this.settings.textAnimationType;
        
        if (animationType === 'none') {
            this.stopAnimation();
            this.render();
            return;
        }

        this.stopAnimation();
        this.isAnimating = true;

        const text = this.settings.text;
        const letters = text.split('');
        let frame = 0;
        const totalFrames = 120; // 2 saniye

        const animate = () => {
            if (!this.isAnimating || frame > totalFrames) {
                this.stopAnimation();
                this.render();
                return;
            }

            // Önce arka planı çiz
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawBackground(this.ctx, this.canvas, 0);
            
            if (this.settings.frameStyle !== 'none') {
                this.drawFrame(this.ctx, this.canvas);
            }
            
            if (this.settings.particleType !== 'none') {
                this.updateParticles();
                this.drawParticles(this.ctx, this.canvas, frame);
            }
            
            this.drawDecorations(this.ctx, this.canvas);
            
            if (this.settings.lineStyle !== 'none') {
                this.drawDecorativeLines(this.ctx, this.canvas);
            }

            // Animasyonlu harfleri çiz
            this.drawAnimatedText(this.ctx, this.canvas, animationType, frame, letters);

            if (this.settings.textSparkleType !== 'none') {
                this.drawTextSparkles(this.ctx, this.canvas, frame);
            }

            frame++;
            this.textAnimationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    drawAnimatedText(ctx, canvas, animationType, frame, letters) {
        const x = canvas.width * this.settings.textX / 100;
        const y = canvas.height * this.settings.textY / 100;
        
        ctx.font = `${this.settings.fontSize}px "${this.settings.fontFamily}"`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        // Toplam genişliği hesapla
        const totalWidth = ctx.measureText(this.settings.text).width;
        
        // Her harfin pozisyonunu önceden hesapla
        const letterPositions = [];
        let currentX = 0;
        for (let i = 0; i < letters.length; i++) {
            const letterWidth = ctx.measureText(letters[i]).width;
            letterPositions.push({
                x: currentX + letterWidth / 2,
                width: letterWidth
            });
            currentX += letterWidth;
        }
        
        // Başlangıç X pozisyonu (merkeze hizalı)
        const startX = x - totalWidth / 2;
        
        for (let i = 0; i < letters.length; i++) {
            const letter = letters[i];
            const letterInfo = letterPositions[i];
            const letterX = startX + letterInfo.x; // Harfin merkez X pozisyonu
            
            ctx.save();
            
            // Animasyon hesaplamaları
            const delay = i * 5; // Her harf için gecikme
            const localFrame = Math.max(0, frame - delay);
            const progress = Math.min(1, localFrame / 30);
            
            let offsetX = 0, offsetY = 0, scale = 1, rotation = 0, alpha = 1;
            let letterColor = this.settings.textColor;
            
            switch (animationType) {
                case 'typewriter':
                    alpha = localFrame > 0 ? 1 : 0;
                    break;
                    
                case 'fadeIn':
                    alpha = progress;
                    break;
                    
                case 'slideIn':
                    // Animasyon sırasında harf sağdan gelir ama hedef pozisyon değişmez
                    offsetX = (1 - progress) * 50;
                    alpha = progress;
                    break;
                    
                case 'dropIn':
                    offsetY = (1 - progress) * -50;
                    alpha = progress;
                    break;
                    
                case 'wave':
                    offsetY = Math.sin((frame + i * 10) * 0.1) * 8;
                    break;
                    
                case 'elastic':
                    if (progress < 1) {
                        const elasticProgress = 1 - Math.pow(2, -10 * progress) * Math.cos(progress * Math.PI * 3);
                        scale = elasticProgress;
                        offsetY = (1 - elasticProgress) * -30;
                    }
                    break;
                    
                case 'rotate':
                    rotation = (1 - progress) * Math.PI * 2;
                    alpha = progress;
                    break;
                    
                case 'scale':
                    scale = progress;
                    alpha = progress;
                    break;
                    
                case 'colorWave':
                    const hue = ((frame * 5) + (i * 30)) % 360;
                    letterColor = `hsl(${hue}, 100%, 60%)`;
                    offsetY = Math.sin((frame + i * 8) * 0.1) * 5;
                    break;
                    
                case 'glitch':
                    if (Math.random() < 0.1) {
                        offsetX = (Math.random() - 0.5) * 10;
                        offsetY = (Math.random() - 0.5) * 5;
                        letterColor = Math.random() < 0.5 ? '#ff0000' : '#00ffff';
                    }
                    break;
                    
                case 'neon':
                    const neonIntensity = Math.sin((frame + i * 5) * 0.2) * 0.5 + 0.5;
                    ctx.shadowColor = this.settings.textColor;
                    ctx.shadowBlur = 10 + neonIntensity * 20;
                    alpha = 0.7 + neonIntensity * 0.3;
                    break;
                    
                case 'matrix':
                    if (progress < 1) {
                        // Rastgele karakterler göster
                        const matrixChars = '0123456789ABCDEF@#$%';
                        if (Math.random() < 0.3) {
                            letters[i] = matrixChars[Math.floor(Math.random() * matrixChars.length)];
                        }
                    } else {
                        letters[i] = this.settings.text[i];
                    }
                    letterColor = `rgb(0, ${Math.floor(200 + Math.random() * 55)}, 0)`;
                    break;
            }
            
            ctx.globalAlpha = alpha;
            // Offset'leri translate'e dahil et, böylece animasyon bittikten sonra doğru pozisyonda kalır
            ctx.translate(letterX + offsetX, y + offsetY);
            ctx.rotate(rotation);
            ctx.scale(scale, scale);
            
            // Gölge
            if (this.settings.effectGlow) {
                ctx.shadowColor = letterColor;
                ctx.shadowBlur = 15;
            } else {
                ctx.shadowColor = this.settings.shadowColor;
                ctx.shadowBlur = this.settings.shadowBlur;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }
            
            // Gradient veya düz renk
            if (this.settings.effectGradient) {
                const gradient = ctx.createLinearGradient(-letterInfo.width/2, 0, letterInfo.width/2, 0);
                gradient.addColorStop(0, this.settings.gradientColor1);
                gradient.addColorStop(1, this.settings.gradientColor2);
                ctx.fillStyle = gradient;
            } else {
                ctx.fillStyle = letterColor;
            }
            
            // Kenarlık (harfi 0,0'da çiz çünkü translate ile zaten doğru pozisyondayız)
            if (this.settings.effectOutline && this.settings.outlineWidth > 0) {
                ctx.strokeStyle = this.settings.outlineColor;
                ctx.lineWidth = this.settings.outlineWidth * 2;
                ctx.strokeText(letter, 0, 0);
            }
            
            ctx.fillText(letter, 0, 0);
            
            ctx.restore();
        }
    }

    // Kayan Yazı Animasyonları
    previewScrollAnimation() {
        const scrollType = this.settings.scrollType;
        
        if (scrollType === 'none') {
            this.stopAnimation();
            this.render();
            return;
        }

        this.stopAnimation();
        this.isAnimating = true;

        let frame = 0;
        const speed = this.settings.scrollSpeed;

        const animate = () => {
            if (!this.isAnimating) {
                this.render();
                return;
            }

            // Arka planı çiz
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawBackground(this.ctx, this.canvas, 0);
            
            if (this.settings.frameStyle !== 'none') {
                this.drawFrame(this.ctx, this.canvas);
            }
            
            if (this.settings.particleType !== 'none') {
                this.updateParticles();
                this.drawParticles(this.ctx, this.canvas, frame);
            }
            
            this.drawDecorations(this.ctx, this.canvas);
            
            if (this.settings.lineStyle !== 'none') {
                this.drawDecorativeLines(this.ctx, this.canvas);
            }

            // Kayan yazıyı çiz
            this.drawScrollingText(this.ctx, this.canvas, scrollType, frame, speed);

            if (this.settings.textSparkleType !== 'none') {
                this.drawTextSparkles(this.ctx, this.canvas, frame);
            }

            frame++;
            this.scrollAnimationFrame = requestAnimationFrame(animate);
        };

        animate();

        // 5 saniye sonra durdur
        setTimeout(() => {
            this.stopAnimation();
            this.render();
        }, 5000);
    }

    drawScrollingText(ctx, canvas, scrollType, frame, speed) {
        ctx.font = `${this.settings.fontSize}px "${this.settings.fontFamily}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = this.settings.text;
        const textWidth = ctx.measureText(text).width;
        const centerX = canvas.width * this.settings.textX / 100;
        const centerY = canvas.height * this.settings.textY / 100;
        
        let x = centerX, y = centerY;
        
        switch (scrollType) {
            case 'leftToRight':
                x = ((frame * speed) % (canvas.width + textWidth)) - textWidth / 2;
                break;
                
            case 'rightToLeft':
                x = canvas.width - ((frame * speed) % (canvas.width + textWidth)) + textWidth / 2;
                break;
                
            case 'topToBottom':
                y = ((frame * speed) % (canvas.height + this.settings.fontSize)) - this.settings.fontSize / 2;
                break;
                
            case 'bottomToTop':
                y = canvas.height - ((frame * speed) % (canvas.height + this.settings.fontSize)) + this.settings.fontSize / 2;
                break;
                
            case 'bounce':
                const bounceRange = (canvas.width - textWidth) / 2;
                x = centerX + Math.sin(frame * speed * 0.02) * bounceRange;
                break;
                
            case 'circular':
                const radius = Math.min(canvas.width, canvas.height) * 0.2;
                x = centerX + Math.cos(frame * speed * 0.03) * radius;
                y = centerY + Math.sin(frame * speed * 0.03) * radius * 0.5;
                break;
                
            case 'zigzag':
                x = centerX + Math.sin(frame * speed * 0.05) * (canvas.width * 0.3);
                y = centerY + Math.cos(frame * speed * 0.1) * (canvas.height * 0.2);
                break;
        }
        
        // Gölge
        if (this.settings.effectGlow) {
            ctx.shadowColor = this.settings.textColor;
            ctx.shadowBlur = 20;
        } else {
            ctx.shadowColor = this.settings.shadowColor;
            ctx.shadowBlur = this.settings.shadowBlur;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }
        
        // 3D efekt
        if (this.settings.effect3D) {
            for (let i = 5; i > 0; i--) {
                ctx.fillStyle = `rgba(0, 0, 0, ${0.1 * i})`;
                ctx.fillText(text, x + i, y + i);
            }
        }
        
        // Gradient veya düz renk
        if (this.settings.effectGradient) {
            const gradient = ctx.createLinearGradient(x - textWidth/2, y, x + textWidth/2, y);
            gradient.addColorStop(0, this.settings.gradientColor1);
            gradient.addColorStop(1, this.settings.gradientColor2);
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = this.settings.textColor;
        }
        
        // Kenarlık
        if (this.settings.effectOutline && this.settings.outlineWidth > 0) {
            ctx.strokeStyle = this.settings.outlineColor;
            ctx.lineWidth = this.settings.outlineWidth * 2;
            ctx.strokeText(text, x, y);
        }
        
        ctx.fillText(text, x, y);
        
        // Gölgeyi sıfırla
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    downloadPNG() {
        const scaleSelect = document.getElementById('exportScale');
        const transparentCheckbox = document.getElementById('exportTransparent');
        const scale = scaleSelect ? parseInt(scaleSelect.value || '1') : 1;
        const transparent = transparentCheckbox ? transparentCheckbox.checked : false;

        // Ana sahneyi temiz bir geçici canvas'a çiz
        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = this.canvas.width;
        baseCanvas.height = this.canvas.height;
        const baseCtx = baseCanvas.getContext('2d');
        this.render({ ctx: baseCtx, canvas: baseCanvas, transparent });

        let finalCanvas = baseCanvas;

        // İstenen ölçek varsa upscale et
        if (scale && scale > 1) {
            const scaledCanvas = document.createElement('canvas');
            scaledCanvas.width = this.canvas.width * scale;
            scaledCanvas.height = this.canvas.height * scale;
            const sctx = scaledCanvas.getContext('2d');
            sctx.imageSmoothingEnabled = true;
            sctx.imageSmoothingQuality = 'high';
            sctx.drawImage(baseCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
            finalCanvas = scaledCanvas;
        }

        const link = document.createElement('a');
        link.download = `flash-nick-${Date.now()}.png`;
        link.href = finalCanvas.toDataURL('image/png');
        link.click();
    }

    async downloadGIF() {
        const scaleSelect = document.getElementById('exportScale');
        const transparentCheckbox = document.getElementById('exportTransparent');
        const exportScale = scaleSelect ? parseInt(scaleSelect.value || '1') : 1;
        const exportTransparent = transparentCheckbox ? transparentCheckbox.checked : false;
        const animationType = document.getElementById('animationType').value;
        const textAnimationType = this.settings.textAnimationType;
        const scrollType = this.settings.scrollType;
        const hasParticles = this.settings.particleType !== 'none';
        const hasFlags = this.settings.leftFlag !== 'none' || this.settings.rightFlag !== 'none';
        const hasSplitLayout = this.settings.splitLayout !== 'none';
        const hasTextSparkles = this.settings.textSparkleType !== 'none';
        const hasInnerSparkles = this.settings.innerSparkleType !== 'none';
        
        if (animationType === 'none' && !hasParticles && textAnimationType === 'none' && 
            scrollType === 'none' && !hasFlags && !hasSplitLayout && !hasTextSparkles && !hasInnerSparkles) {
            alert('Lütfen önce bir animasyon efekti seçin! (parçacık, yazı animasyonu, parıltı vb.)');
            return;
        }

        // Check if GIF.js is available
        if (typeof GIF === 'undefined') {
            alert('GIF kütüphanesi yüklenemedi. Lütfen localhost:8080 üzerinden çalıştırın!');
            return;
        }

        // Kullanıcıya bilgi ver
        const downloadBtn = document.getElementById('downloadGif');
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = '⏳ GIF Oluşturuluyor...';
        downloadBtn.disabled = true;

        try {
            const baseWidth = this.canvas.width;
            const baseHeight = this.canvas.height;
            const gif = new GIF({
                workers: 4,
                quality: 8,
                width: baseWidth * exportScale,
                height: baseHeight * exportScale,
                workerScript: 'gif.worker.js',
                transparent: exportTransparent ? 0x00000000 : null
            });

            // Frame sayısını animasyon tipine göre ayarla
            let frames = 30;
            if (textAnimationType !== 'none') frames = 40;
            if (scrollType !== 'none') frames = 60;
            if (hasParticles || hasTextSparkles || hasInnerSparkles) frames = Math.max(frames, 30);
            
            const baseCanvas = document.createElement('canvas');
            baseCanvas.width = baseWidth;
            baseCanvas.height = baseHeight;
            const baseCtx = baseCanvas.getContext('2d');

            const scaledCanvas = exportScale > 1 ? document.createElement('canvas') : null;
            let scaledCtx = null;
            if (scaledCanvas) {
                scaledCanvas.width = baseWidth * exportScale;
                scaledCanvas.height = baseHeight * exportScale;
                scaledCtx = scaledCanvas.getContext('2d');
                scaledCtx.imageSmoothingEnabled = true;
                scaledCtx.imageSmoothingQuality = 'high';
            }

            // Orijinal ayarları sakla
            const originalShadowBlur = this.settings.shadowBlur;
            const letters = this.settings.text.split('');
            
            // GIF için parçacıkları başlat
            if (hasParticles) {
                this.initParticles();
            }

            for (let i = 0; i < frames; i++) {
                // Geçici canvas'ı temizle
                baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
                
                // Split layout varsa özel rendering
                if (hasSplitLayout) {
                    this.drawSplitLayout(baseCtx, baseCanvas, {x: 0, y: 0}, 0, i, i, exportTransparent);
                } else {
                    // Normal rendering
                    // Arka plan
                    if (!exportTransparent) {
                        this.drawBackground(baseCtx, baseCanvas, 0);
                    }
                    
                    // Fotoğraf overlay
                    if (this.settings.photoOverlay !== 'none' || this.settings.colorOverlayMode !== 'none') {
                        this.applyPhotoOverlay(baseCtx, baseCanvas);
                    }
                    
                    // Çerçeve
                    if (this.settings.frameStyle !== 'none') {
                        this.drawFrame(baseCtx, baseCanvas);
                    }
                    
                    // Parçacıkları güncelle ve çiz
                    if (hasParticles) {
                        this.updateParticles();
                        this.drawParticles(baseCtx, baseCanvas, i);
                    }
                    
                    // Bayrak fazını güncelle
                    this.flagPhase = i * 2;
                    
                    // Dekorasyonlar (bayraklar dahil)
                    this.drawDecorations(baseCtx, baseCanvas);
                    
                    // Dekoratif çizgiler
                    if (this.settings.lineStyle !== 'none') {
                        this.drawDecorativeLines(baseCtx, baseCanvas);
                    }
                    
                    let offset = { x: 0, y: 0 };
                    let hueShift = 0;

                    // Yazı animasyonu varsa
                    if (textAnimationType !== 'none') {
                        this.drawAnimatedText(baseCtx, baseCanvas, textAnimationType, i * 3, [...letters]);
                    }
                    // Kayan yazı varsa
                    else if (scrollType !== 'none') {
                        this.drawScrollingText(baseCtx, baseCanvas, scrollType, i * 2, this.settings.scrollSpeed);
                    }
                    // Temel animasyonlar
                    else {
                        switch (animationType) {
                            case 'pulse':
                                const scale = 1 + Math.sin(i * (Math.PI * 2 / frames)) * 0.08;
                                baseCtx.save();
                                baseCtx.translate(baseCanvas.width / 2, baseCanvas.height / 2);
                                baseCtx.scale(scale, scale);
                                baseCtx.translate(-baseCanvas.width / 2, -baseCanvas.height / 2);
                                this.drawText(baseCtx, baseCanvas, offset, hueShift);
                                baseCtx.restore();
                                break;
                            case 'glow':
                                this.settings.shadowBlur = Math.sin(i * (Math.PI * 2 / frames)) * 15 + 20;
                                this.drawText(baseCtx, baseCanvas, offset, hueShift);
                                break;
                            case 'rainbow':
                                hueShift = (i * (360 / frames)) % 360;
                                this.drawText(baseCtx, baseCanvas, offset, hueShift);
                                break;
                            case 'shake':
                                offset.x = Math.sin(i * (Math.PI * 4 / frames)) * 5;
                                this.drawText(baseCtx, baseCanvas, offset, hueShift);
                                break;
                            case 'bounce':
                                offset.y = -Math.abs(Math.sin(i * (Math.PI * 2 / frames))) * 15;
                                this.drawText(baseCtx, baseCanvas, offset, hueShift);
                                break;
                            default:
                                this.drawText(baseCtx, baseCanvas, offset, hueShift);
                        }
                    }
                    
                    // İç parıltılar
                    if (hasInnerSparkles) {
                        this.drawInnerSparkles(baseCtx, baseCanvas, i);
                    }
                    
                    // Dış parıltılar
                    if (hasTextSparkles) {
                        this.drawTextSparkles(baseCtx, baseCanvas, i);
                    }
                }

                // Frame'i GIF'e ekle (gerekirse upscale ederek)
                if (exportScale > 1 && scaledCtx) {
                    scaledCtx.clearRect(0, 0, scaledCanvas.width, scaledCanvas.height);
                    scaledCtx.drawImage(baseCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
                    gif.addFrame(scaledCtx, { copy: true, delay: 60 });
                } else {
                    gif.addFrame(baseCtx, { copy: true, delay: 60 });
                }
                
                // Progress göster
                downloadBtn.textContent = `⏳ ${Math.round((i / frames) * 100)}%`;
            }

            // Orijinal ayarları geri yükle
            this.settings.shadowBlur = originalShadowBlur;

            gif.on('finished', (blob) => {
                const link = document.createElement('a');
                link.download = `flash-nick-${Date.now()}.gif`;
                link.href = URL.createObjectURL(blob);
                link.click();
                
                // Butonu eski haline getir
                downloadBtn.textContent = '✅ Tamamlandı!';
                setTimeout(() => {
                    downloadBtn.textContent = originalText;
                    downloadBtn.disabled = false;
                }, 2000);
            });

            gif.on('error', (err) => {
                console.error('GIF hatası:', err);
                alert('GIF oluşturulurken hata oluştu!');
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            });

            gif.render();
        } catch (err) {
            console.error('GIF hatası:', err);
            alert('GIF oluşturulurken hata oluştu: ' + err.message);
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
        }
    }

    async copyToClipboard() {
        try {
            const blob = await new Promise(resolve => this.canvas.toBlob(resolve));
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            alert('Resim panoya kopyalandı!');
        } catch (err) {
            console.error('Kopyalama hatası:', err);
            alert('Kopyalama başarısız oldu. Tarayıcınız bu özelliği desteklemiyor olabilir.');
        }
    }
}

// Global functions for onclick handlers
function addChar(char) {
    const input = document.getElementById('nickInput');
    input.value += char;
    input.dispatchEvent(new Event('input'));
}

function setPresetBg(type) {
    window.flashNickMaker.settings.bgType = type;
    window.flashNickMaker.bgImage = null;
    window.flashNickMaker.render();
}

function clearDecor(side) {
    if (side === 'left') {
        window.flashNickMaker.leftDecorImage = null;
    } else {
        window.flashNickMaker.rightDecorImage = null;
    }
    window.flashNickMaker.render();
}

// Blur Fırça Global Fonksiyonları
function toggleBlurBrush() {
    const maker = window.flashNickMaker;
    if (!maker) {
        showToast('Sayfa yükleniyor, lütfen bekleyin...');
        console.error('FlashNickMaker henüz yüklenmedi');
        return;
    }
    
    // Arka plan resmi yoksa uyar
    if (!maker.bgImage) {
        showToast('Önce bir arka plan resmi yükleyin! 🖼️');
        return;
    }
    
    maker.blurBrushActive = !maker.blurBrushActive;
    maker.toggleBlurBrush(maker.blurBrushActive);
    
    const btn = document.getElementById('blurBrushToggle');
    if (btn) {
        if (maker.blurBrushActive) {
            btn.textContent = '🖌️ Fırça Aktif';
            btn.style.background = '#27ae60';
            btn.style.borderColor = '#2ecc71';
            showToast('Fırça aktif! Canvas üzerinde çizin 🖌️');
        } else {
            btn.textContent = '🖌️ Fırça Kapalı';
            btn.style.background = '#333';
            btn.style.borderColor = '#555';
            showToast('Fırça kapatıldı');
        }
    }
}

function clearBlurMask() {
    const maker = window.flashNickMaker;
    if (maker) {
        maker.clearBlurMask();
        showToast('Blur temizlendi! 🗑️');
    }
}

// Fotoğraf ayarlarını sıfırla
function resetImageSettings() {
    const maker = window.flashNickMaker;
    if (!maker) return;
    
    maker.settings.imageSaturation = 100;
    maker.settings.imageTemperature = 0;
    maker.settings.imageHue = 0;
    maker.settings.imageSharpness = 0;
    maker.settings.imageCropX = 0;
    maker.settings.imageCropY = 0;
    maker.settings.imageCropWidth = 100;
    maker.settings.imageCropHeight = 100;
    
    // UI güncelle
    document.getElementById('imageSaturation').value = 100;
    document.getElementById('imageSaturationVal').textContent = '100';
    document.getElementById('imageTemperature').value = 0;
    document.getElementById('imageTemperatureVal').textContent = '0';
    document.getElementById('imageHue').value = 0;
    document.getElementById('imageHueVal').textContent = '0';
    document.getElementById('imageSharpness').value = 0;
    document.getElementById('imageSharpnessVal').textContent = '0';
    document.getElementById('imageCropX').value = 0;
    document.getElementById('imageCropXVal').textContent = '0';
    document.getElementById('imageCropY').value = 0;
    document.getElementById('imageCropYVal').textContent = '0';
    document.getElementById('imageCropWidth').value = 100;
    document.getElementById('imageCropWidthVal').textContent = '100';
    document.getElementById('imageCropHeight').value = 100;
    document.getElementById('imageCropHeightVal').textContent = '100';
    
    maker.render();
    showToast('Fotoğraf ayarları sıfırlandı! 🔄');
}

// Fotoğraf düzenleme ve blur fırça event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Blur fırça slider'ları (butonlar HTML'de onclick ile bağlı)
    const blurSize = document.getElementById('blurBrushSize');
    const blurStrength = document.getElementById('blurBrushStrength');
    
    if (blurSize) {
        blurSize.addEventListener('input', (e) => {
            if (window.flashNickMaker) {
                window.flashNickMaker.blurBrushSize = parseInt(e.target.value);
            }
            document.getElementById('blurBrushSizeVal').textContent = e.target.value;
        });
    }
    
    if (blurStrength) {
        blurStrength.addEventListener('input', (e) => {
            if (window.flashNickMaker) {
                window.flashNickMaker.blurBrushStrength = parseInt(e.target.value);
            }
            document.getElementById('blurBrushStrengthVal').textContent = e.target.value;
        });
    }
    
    // Fotoğraf düzenleme kontrolleri
    const imageControls = [
        { id: 'imageSaturation', setting: 'imageSaturation' },
        { id: 'imageTemperature', setting: 'imageTemperature' },
        { id: 'imageHue', setting: 'imageHue' },
        { id: 'imageSharpness', setting: 'imageSharpness' },
        { id: 'imageCropX', setting: 'imageCropX' },
        { id: 'imageCropY', setting: 'imageCropY' },
        { id: 'imageCropWidth', setting: 'imageCropWidth' },
        { id: 'imageCropHeight', setting: 'imageCropHeight' }
    ];
    
    imageControls.forEach(ctrl => {
        const el = document.getElementById(ctrl.id);
        if (el) {
            el.addEventListener('input', (e) => {
                if (window.flashNickMaker) {
                    window.flashNickMaker.settings[ctrl.setting] = parseInt(e.target.value);
                    window.flashNickMaker.render();
                }
                const valEl = document.getElementById(ctrl.id + 'Val');
                if (valEl) valEl.textContent = e.target.value;
            });
        }
    });

    // Photo overlay ve animasyon kontrolleri
    const photoOverlay = document.getElementById('photoOverlay');
    if (photoOverlay) {
        photoOverlay.addEventListener('change', (e) => {
            if (window.flashNickMaker) {
                window.flashNickMaker.settings.photoOverlay = e.target.value;
                window.flashNickMaker.render();
            }
        });
    }

    const overlayIntensity = document.getElementById('overlayIntensity');
    if (overlayIntensity) {
        overlayIntensity.addEventListener('input', (e) => {
            if (window.flashNickMaker) {
                window.flashNickMaker.settings.overlayIntensity = parseInt(e.target.value);
                window.flashNickMaker.render();
            }
            document.getElementById('overlayIntensityVal').textContent = e.target.value;
        });
    }

    const customOverlayColor = document.getElementById('customOverlayColor');
    if (customOverlayColor) {
        customOverlayColor.addEventListener('input', (e) => {
            if (window.flashNickMaker) {
                window.flashNickMaker.settings.customOverlayColor = e.target.value;
                window.flashNickMaker.render();
            }
        });
    }

    const colorOverlayMode = document.getElementById('colorOverlayMode');
    if (colorOverlayMode) {
        colorOverlayMode.addEventListener('change', (e) => {
            if (window.flashNickMaker) {
                window.flashNickMaker.settings.colorOverlayMode = e.target.value;
                window.flashNickMaker.render();
            }
        });
    }

    const photoAnimation = document.getElementById('photoAnimation');
    if (photoAnimation) {
        photoAnimation.addEventListener('change', (e) => {
            if (window.flashNickMaker) {
                window.flashNickMaker.settings.photoAnimation = e.target.value;
            }
        });
    }

    const photoAnimSpeed = document.getElementById('photoAnimSpeed');
    if (photoAnimSpeed) {
        photoAnimSpeed.addEventListener('input', (e) => {
            if (window.flashNickMaker) {
                window.flashNickMaker.settings.photoAnimSpeed = parseInt(e.target.value);
            }
            document.getElementById('photoAnimSpeedVal').textContent = e.target.value;
        });
    }

    const splitLayout = document.getElementById('splitLayout');
    if (splitLayout) {
        splitLayout.addEventListener('change', (e) => {
            if (window.flashNickMaker) {
                window.flashNickMaker.settings.splitLayout = e.target.value;
                window.flashNickMaker.render();
            }
        });
    }

    const splitRatio = document.getElementById('splitRatio');
    if (splitRatio) {
        splitRatio.addEventListener('input', (e) => {
            if (window.flashNickMaker) {
                window.flashNickMaker.settings.splitRatio = parseInt(e.target.value);
                window.flashNickMaker.render();
            }
            document.getElementById('splitRatioVal').textContent = e.target.value;
        });
    }

    const splitBorder = document.getElementById('splitBorder');
    if (splitBorder) {
        splitBorder.addEventListener('change', (e) => {
            if (window.flashNickMaker) {
                window.flashNickMaker.settings.splitBorder = e.target.checked;
                window.flashNickMaker.render();
            }
        });
    }

    const photoSideEffect = document.getElementById('photoSideEffect');
    if (photoSideEffect) {
        photoSideEffect.addEventListener('change', (e) => {
            if (window.flashNickMaker) {
                window.flashNickMaker.settings.photoSideEffect = e.target.value;
                window.flashNickMaker.render();
            }
        });
    }
    
    // Layer Rotation
    const layerRotation = document.getElementById('layerRotation');
    if (layerRotation) {
        layerRotation.addEventListener('input', (e) => {
            document.getElementById('layerRotationVal').textContent = e.target.value;
            if (window.flashNickMaker) {
                window.flashNickMaker.updateActiveLayer();
                window.flashNickMaker.render();
            }
        });
    }
    
    // Layer Opacity
    const layerOpacity = document.getElementById('layerOpacity');
    if (layerOpacity) {
        layerOpacity.addEventListener('input', (e) => {
            document.getElementById('layerOpacityVal').textContent = e.target.value;
            if (window.flashNickMaker) {
                window.flashNickMaker.updateActiveLayer();
                window.flashNickMaker.render();
            }
        });
    }
    
    // İlk layer listesini göster
    if (window.flashNickMaker) {
        window.flashNickMaker.updateLayerList();
    }
});

function applyTemplate(templateNum) {
    const maker = window.flashNickMaker;
    
    switch (templateNum) {
        case 1:
            maker.settings.bgType = 'gradient1';
            maker.settings.fontFamily = 'Lobster';
            maker.settings.textColor = '#ffffff';
            maker.settings.effectOutline = true;
            maker.settings.outlineColor = '#000000';
            maker.settings.outlineWidth = 2;
            maker.settings.effectGradient = false;
            break;
        case 2:
            maker.settings.bgType = 'gradient2';
            maker.settings.fontFamily = 'Pacifico';
            maker.settings.textColor = '#ffffff';
            maker.settings.effectGlow = true;
            maker.settings.effectOutline = false;
            break;
        case 3:
            maker.settings.bgType = 'dark';
            maker.settings.fontFamily = 'Dancing Script';
            maker.settings.textColor = '#00ff00';
            maker.settings.effectGlow = true;
            maker.settings.shadowColor = '#00ff00';
            break;
        case 4:
            maker.settings.bgType = 'gradient1';
            maker.settings.fontFamily = 'Great Vibes';
            maker.settings.textColor = '#ffffff';
            maker.settings.effectOutline = true;
            maker.settings.outlineColor = '#ff69b4';
            break;
        case 5:
            maker.settings.bgType = 'gradient3';
            maker.settings.fontFamily = 'Kaushan Script';
            maker.settings.textColor = '#ffffff';
            maker.settings.effect3D = true;
            break;
        case 6:
            maker.settings.bgType = 'dark';
            maker.settings.fontFamily = 'Permanent Marker';
            maker.settings.textColor = '#e94560';
            maker.settings.effectGlow = true;
            break;
        case 7:
            maker.settings.fontFamily = 'Impact';
            maker.settings.effectGradient = true;
            maker.settings.gradientColor1 = '#f9ca24';
            maker.settings.gradientColor2 = '#f0932b';
            maker.settings.effectOutline = true;
            maker.settings.outlineColor = '#2c3e50';
            break;
        case 8:
            maker.settings.bgType = 'gradient2';
            maker.settings.fontFamily = 'Satisfy';
            maker.settings.textColor = '#ffffff';
            maker.settings.effectGlow = true;
            break;
    }

    // Update UI
    document.getElementById('fontFamily').value = maker.settings.fontFamily;
    document.getElementById('textColor').value = maker.settings.textColor;
    document.getElementById('effectGlow').checked = maker.settings.effectGlow || false;
    document.getElementById('effectOutline').checked = maker.settings.effectOutline || false;
    document.getElementById('effectGradient').checked = maker.settings.effectGradient || false;
    document.getElementById('effect3D').checked = maker.settings.effect3D || false;

    // Arka plan resmini koruyoruz - sadece yazı stili değişiyor
    // Eğer resim varsa bgType'ı 'image' olarak ayarla
    if (maker.bgImage) {
        maker.settings.bgType = 'image';
    }
    maker.render();
}

function applyPalette(colors) {
    const maker = window.flashNickMaker;
    maker.settings.textColor = colors[0];
    maker.settings.gradientColor1 = colors[0];
    maker.settings.gradientColor2 = colors[1];
    maker.settings.shadowColor = colors[2];
    
    document.getElementById('textColor').value = colors[0];
    document.getElementById('gradientColor1').value = colors[0];
    document.getElementById('gradientColor2').value = colors[1];
    document.getElementById('shadowColor').value = colors[2];
    
    maker.render();
}

// Rastgeleleştir (kilitlerle)
function randomizeWithLocks() {
    const maker = window.flashNickMaker;
    if (!maker) return;

    const lockFont = document.getElementById('lockFont')?.checked;
    const lockFontSize = document.getElementById('lockFontSize')?.checked;
    const lockColors = document.getElementById('lockColors')?.checked;
    const lockBackground = document.getElementById('lockBackground')?.checked;
    const lockParticles = document.getElementById('lockParticles')?.checked;
    const lockAnimation = document.getElementById('lockAnimation')?.checked;
    const lockTextPos = document.getElementById('lockTextPos')?.checked;

    // Font ve boyut
    if (!lockFont) {
        const fonts = ['Lobster','Pacifico','Press Start 2P','Orbitron','Bangers','Dancing Script','Great Vibes','Kaushan Script','Permanent Marker','Satisfy','Impact','Russo One'];
        maker.settings.fontFamily = fonts[Math.floor(Math.random() * fonts.length)];
    }
    if (!lockFontSize) {
        maker.settings.fontSize = 28 + Math.floor(Math.random() * 52); // 28-80 px
    }

    // Renkler ve efektler
    if (!lockColors) {
        const paletteKeys = Object.keys(maker.palettes);
        const key = paletteKeys[Math.floor(Math.random() * paletteKeys.length)];
        applyPalette(maker.palettes[key]);
        maker.settings.effectGradient = Math.random() > 0.4;
        maker.settings.effectGlow = Math.random() > 0.3;
        maker.settings.effectOutline = Math.random() > 0.4;
        maker.settings.outlineColor = `hsl(${Math.floor(Math.random()*360)}, 90%, 35%)`;
    }

    // Arka plan
    if (!lockBackground) {
        const bgs = ['gradient1','gradient2','gradient3','dark'];
        if (!maker.bgImage) maker.settings.bgType = bgs[Math.floor(Math.random()*bgs.length)];
        maker.settings.frameStyle = Math.random() > 0.7 ? 'gold' : 'none';
    }

    // Parçacıklar
    if (!lockParticles) {
        const parts = ['none','stars','hearts','sparkles','snow','fire','confetti','flowers','bubbles'];
        maker.settings.particleType = parts[Math.floor(Math.random()*parts.length)];
        maker.settings.particleRainbow = Math.random() > 0.6;
        maker.settings.particleBlendMode = ['source-over','screen','lighter'][Math.floor(Math.random()*3)];
        maker.initParticles();
    }

    // Animasyonlar
    if (!lockAnimation) {
        const anims = ['none','pulse','glow','rainbow','shake','bounce'];
        document.getElementById('animationType').value = anims[Math.floor(Math.random()*anims.length)];
        const textAnims = ['none','typewriter','fadeIn','slideIn','dropIn','wave','elastic','rotate','scale','colorWave','glitch','neon','matrix'];
        maker.settings.textAnimationType = textAnims[Math.floor(Math.random()*textAnims.length)];
        maker.settings.scrollType = ['none','leftToRight','rightToLeft','bounce'][Math.floor(Math.random()*4)];
    }

    // Yazı pozisyonu
    if (!lockTextPos) {
        maker.settings.textX = 35 + Math.floor(Math.random() * 30); // 35-65
        maker.settings.textY = 40 + Math.floor(Math.random() * 20); // 40-60
    }

    updateUIFromSettings(maker);
    maker.render();
    showToast('Rastgele stil uygulandı!');
}

// ===== FOTOĞRAF OVERLAY VE ANİMASYON FONKSİYONLARI =====

FlashNickMaker.prototype.applyPhotoOverlay = function(ctx, canvas) {
    if (this.settings.photoOverlay === 'none' && this.settings.colorOverlayMode === 'none') return;
    
    const intensity = this.settings.overlayIntensity / 100;
    
    ctx.save();
    
    switch (this.settings.photoOverlay) {
        case 'gradient-blue':
            const gradBlue = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradBlue.addColorStop(0, `rgba(0, 100, 255, ${intensity * 0.5})`);
            gradBlue.addColorStop(1, `rgba(0, 50, 150, ${intensity * 0.3})`);
            ctx.fillStyle = gradBlue;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
        case 'gradient-red':
            const gradRed = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradRed.addColorStop(0, `rgba(255, 50, 50, ${intensity * 0.5})`);
            gradRed.addColorStop(1, `rgba(150, 0, 0, ${intensity * 0.3})`);
            ctx.fillStyle = gradRed;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
        case 'gradient-purple':
            const gradPurple = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradPurple.addColorStop(0, `rgba(150, 50, 255, ${intensity * 0.5})`);
            gradPurple.addColorStop(1, `rgba(80, 0, 150, ${intensity * 0.3})`);
            ctx.fillStyle = gradPurple;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
        case 'gradient-green':
            const gradGreen = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradGreen.addColorStop(0, `rgba(50, 255, 100, ${intensity * 0.5})`);
            gradGreen.addColorStop(1, `rgba(0, 150, 50, ${intensity * 0.3})`);
            ctx.fillStyle = gradGreen;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
        case 'gradient-orange':
            const gradOrange = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradOrange.addColorStop(0, `rgba(255, 150, 50, ${intensity * 0.5})`);
            gradOrange.addColorStop(1, `rgba(200, 80, 0, ${intensity * 0.3})`);
            ctx.fillStyle = gradOrange;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
        case 'duotone-cyan':
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = `rgba(0, 200, 200, ${intensity * 0.6})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = `rgba(100, 255, 255, ${intensity * 0.4})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over';
            break;
        case 'duotone-pink':
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = `rgba(200, 50, 100, ${intensity * 0.6})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = `rgba(255, 150, 200, ${intensity * 0.4})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over';
            break;
        case 'vignette':
            const vignetteGrad = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
            );
            vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vignetteGrad.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.7})`);
            ctx.fillStyle = vignetteGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
        case 'light-leak':
            const leakGrad = ctx.createRadialGradient(
                canvas.width * 0.8, canvas.height * 0.2, 0,
                canvas.width * 0.8, canvas.height * 0.2, canvas.width * 0.5
            );
            leakGrad.addColorStop(0, `rgba(255, 255, 200, ${intensity * 0.5})`);
            leakGrad.addColorStop(0.5, `rgba(255, 200, 100, ${intensity * 0.3})`);
            leakGrad.addColorStop(1, 'rgba(255, 150, 0, 0)');
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = leakGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over';
            break;
        case 'film-grain':
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const grain = (Math.random() - 0.5) * intensity * 50;
                data[i] += grain;
                data[i + 1] += grain;
                data[i + 2] += grain;
            }
            ctx.putImageData(imageData, 0, 0);
            break;
        case 'glow':
            ctx.shadowColor = 'rgba(255, 255, 255, ' + (intensity * 0.8) + ')';
            ctx.shadowBlur = 30 * intensity;
            ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.1})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            break;
    }
    
    // Özel renk overlay
    if (this.settings.colorOverlayMode !== 'none') {
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };
        
        const rgb = hexToRgb(this.settings.customOverlayColor);
        if (rgb) {
            ctx.globalCompositeOperation = this.settings.colorOverlayMode;
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'source-over';
        }
    }
    
    ctx.restore();
};

FlashNickMaker.prototype.drawSplitLayout = function(ctx, canvas, offset, hueShift, particleFrame, sparkleFrame, transparent) {
    const layout = this.settings.splitLayout;
    const ratio = this.settings.splitRatio / 100;
    
    ctx.save();
    
    if (layout === 'left-right') {
        const splitX = canvas.width * ratio;
        
        // Foto tarafı (sol)
        ctx.save();
        ctx.rect(0, 0, splitX, canvas.height);
        ctx.clip();
        
        // Fotoğrafı çiz
        this.drawImageWithEffect(ctx, this.bgImage, 0, 0, canvas.width, canvas.height, true);
        
        // Overlay efektlerini uygula
        if (this.settings.photoOverlay !== 'none' || this.settings.colorOverlayMode !== 'none') {
            this.applyPhotoOverlay(ctx, canvas);
        }
        
        ctx.restore();
        
        // Yazı tarafı (sağ)
        ctx.save();
        ctx.rect(splitX, 0, canvas.width - splitX, canvas.height);
        ctx.clip();
        if (!transparent) this.drawBackground(ctx, canvas, hueShift);
        if (this.settings.particleType !== 'none') this.drawParticles(ctx, canvas, particleFrame);
        this.drawText(ctx, canvas, offset, hueShift);
        if (this.settings.textSparkleType !== 'none') this.drawTextSparkles(ctx, canvas, sparkleFrame);
        ctx.restore();
        
        // Bölme çizgisi
        if (this.settings.splitBorder) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(splitX, 0);
            ctx.lineTo(splitX, canvas.height);
            ctx.stroke();
        }
    } else if (layout === 'right-left') {
        const splitX = canvas.width * ratio;
        
        // Yazı tarafı (sol)
        ctx.save();
        ctx.rect(0, 0, splitX, canvas.height);
        ctx.clip();
        if (!transparent) this.drawBackground(ctx, canvas, hueShift);
        if (this.settings.particleType !== 'none') this.drawParticles(ctx, canvas, particleFrame);
        this.drawText(ctx, canvas, offset, hueShift);
        if (this.settings.textSparkleType !== 'none') this.drawTextSparkles(ctx, canvas, sparkleFrame);
        ctx.restore();
        
        // Foto tarafı (sağ)
        ctx.save();
        ctx.rect(splitX, 0, canvas.width - splitX, canvas.height);
        ctx.clip();
        
        // Fotoğrafı çiz
        this.drawImageWithEffect(ctx, this.bgImage, 0, 0, canvas.width, canvas.height, true);
        
        // Overlay efektlerini uygula
        if (this.settings.photoOverlay !== 'none' || this.settings.colorOverlayMode !== 'none') {
            this.applyPhotoOverlay(ctx, canvas);
        }
        
        ctx.restore();
        
        if (this.settings.splitBorder) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(splitX, 0);
            ctx.lineTo(splitX, canvas.height);
            ctx.stroke();
        }
    } else if (layout === 'top-bottom') {
        const splitY = canvas.height * ratio;
        
        // Foto tarafı (üst)
        ctx.save();
        ctx.rect(0, 0, canvas.width, splitY);
        ctx.clip();
        
        // Fotoğrafı çiz
        this.drawImageWithEffect(ctx, this.bgImage, 0, 0, canvas.width, canvas.height, true);
        
        // Overlay efektlerini uygula
        if (this.settings.photoOverlay !== 'none' || this.settings.colorOverlayMode !== 'none') {
            this.applyPhotoOverlay(ctx, canvas);
        }
        
        ctx.restore();
        
        // Yazı tarafı (alt)
        ctx.save();
        ctx.rect(0, splitY, canvas.width, canvas.height - splitY);
        ctx.clip();
        if (!transparent) this.drawBackground(ctx, canvas, hueShift);
        if (this.settings.particleType !== 'none') this.drawParticles(ctx, canvas, particleFrame);
        this.drawText(ctx, canvas, offset, hueShift);
        if (this.settings.textSparkleType !== 'none') this.drawTextSparkles(ctx, canvas, sparkleFrame);
        ctx.restore();
        
        if (this.settings.splitBorder) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, splitY);
            ctx.lineTo(canvas.width, splitY);
            ctx.stroke();
        }
    } else if (layout === 'bottom-top') {
        const splitY = canvas.height * ratio;
        
        // Yazı tarafı (üst)
        ctx.save();
        ctx.rect(0, 0, canvas.width, splitY);
        ctx.clip();
        if (!transparent) this.drawBackground(ctx, canvas, hueShift);
        if (this.settings.particleType !== 'none') this.drawParticles(ctx, canvas, particleFrame);
        this.drawText(ctx, canvas, offset, hueShift);
        if (this.settings.textSparkleType !== 'none') this.drawTextSparkles(ctx, canvas, sparkleFrame);
        ctx.restore();
        
        // Foto tarafı (alt)
        ctx.save();
        ctx.rect(0, splitY, canvas.width, canvas.height - splitY);
        ctx.clip();
        
        // Fotoğrafı çiz
        this.drawImageWithEffect(ctx, this.bgImage, 0, 0, canvas.width, canvas.height, true);
        
        // Overlay efektlerini uygula
        if (this.settings.photoOverlay !== 'none' || this.settings.colorOverlayMode !== 'none') {
            this.applyPhotoOverlay(ctx, canvas);
        }
        
        ctx.restore();
        
        if (this.settings.splitBorder) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, splitY);
            ctx.lineTo(canvas.width, splitY);
            ctx.stroke();
        }
    } else if (layout === 'diagonal') {
        // Diagonal split - Foto tarafı
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(canvas.width, 0);
        ctx.lineTo(canvas.width * (1 - ratio), canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.clip();
        
        // Fotoğrafı çiz
        this.drawImageWithEffect(ctx, this.bgImage, 0, 0, canvas.width, canvas.height, true);
        
        // Overlay efektlerini uygula
        if (this.settings.photoOverlay !== 'none' || this.settings.colorOverlayMode !== 'none') {
            this.applyPhotoOverlay(ctx, canvas);
        }
        
        ctx.restore();
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(canvas.width, 0);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(canvas.width * (1 - ratio), canvas.height);
        ctx.closePath();
        ctx.clip();
        if (!transparent) this.drawBackground(ctx, canvas, hueShift);
        if (this.settings.particleType !== 'none') this.drawParticles(ctx, canvas, particleFrame);
        this.drawText(ctx, canvas, offset, hueShift);
        if (this.settings.textSparkleType !== 'none') this.drawTextSparkles(ctx, canvas, sparkleFrame);
        ctx.restore();
        
        if (this.settings.splitBorder) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(canvas.width, 0);
            ctx.lineTo(canvas.width * (1 - ratio), canvas.height);
            ctx.stroke();
        }
    }
    
    ctx.restore();
};

FlashNickMaker.prototype.applyPhotoSideEffect = function(ctx, canvas, x, y, width, height) {
    const effect = this.settings.photoSideEffect;
    
    if (effect === 'blur-bg') {
        ctx.filter = 'blur(8px)';
        // Re-draw with blur in the clipped area
        ctx.drawImage(canvas, x, y, width, height, x, y, width, height);
        ctx.filter = 'none';
    }
};

function previewPhotoAnimation() {
    const maker = window.flashNickMaker;
    if (!maker || !maker.bgImage) {
        showToast('Önce bir fotoğraf yükleyin! 📷');
        return;
    }
    
    const anim = maker.settings.photoAnimation;
    if (anim === 'none') {
        showToast('Bir animasyon türü seçin! 🎬');
        return;
    }
    
    maker.stopPhotoAnimation();
    maker.startPhotoAnimation();
}

FlashNickMaker.prototype.startPhotoAnimation = function() {
    this.stopPhotoAnimation();
    
    const anim = this.settings.photoAnimation;
    if (anim === 'none') return;
    
    this.photoAnimPhase = 0;
    const speed = this.settings.photoAnimSpeed;
    
    const animate = () => {
        this.photoAnimPhase += speed * 0.05;
        
        // Animasyon efektini uygula (arka plan çiziminde)
        this.renderWithPhotoAnimation();
        
        this.photoAnimationFrame = requestAnimationFrame(animate);
    };
    
    animate();
};

FlashNickMaker.prototype.stopPhotoAnimation = function() {
    if (this.photoAnimationFrame) {
        cancelAnimationFrame(this.photoAnimationFrame);
        this.photoAnimationFrame = null;
    }
    this.photoAnimPhase = 0;
};

FlashNickMaker.prototype.renderWithPhotoAnimation = function() {
    if (!this.bgImage) {
        this.render();
        return;
    }
    
    const ctx = this.ctx;
    const canvas = this.canvas;
    const anim = this.settings.photoAnimation;
    const phase = this.photoAnimPhase;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    
    switch (anim) {
        case 'zoom-in':
            const scale1 = 1 + Math.sin(phase) * 0.1;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(scale1, scale1);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            break;
        case 'zoom-out':
            const scale2 = 1 - Math.sin(phase) * 0.1;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(scale2, scale2);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            break;
        case 'pan-left':
            ctx.translate(-Math.sin(phase) * 20, 0);
            break;
        case 'pan-right':
            ctx.translate(Math.sin(phase) * 20, 0);
            break;
        case 'pan-up':
            ctx.translate(0, -Math.sin(phase) * 20);
            break;
        case 'pan-down':
            ctx.translate(0, Math.sin(phase) * 20);
            break;
        case 'rotate-cw':
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(phase * 0.05);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            break;
        case 'rotate-ccw':
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-phase * 0.05);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            break;
        case 'pulse':
            const pulse = 1 + Math.sin(phase * 2) * 0.05;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(pulse, pulse);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            break;
        case 'shake':
            ctx.translate(
                Math.sin(phase * 10) * 3,
                Math.cos(phase * 10) * 3
            );
            break;
        case 'zoom-pulse':
            const zoomPulse = 1 + Math.sin(phase * 1.5) * 0.15;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(zoomPulse, zoomPulse);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            break;
        case 'pan-circle':
            const radius = 30;
            ctx.translate(
                Math.cos(phase * 0.5) * radius,
                Math.sin(phase * 0.5) * radius
            );
            break;
        case 'rotate-swing':
            const swingAngle = Math.sin(phase * 0.8) * 0.1;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(swingAngle);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            break;
        case 'wave':
            ctx.save();
            for (let y = 0; y < canvas.height; y += 5) {
                ctx.save();
                ctx.rect(0, y, canvas.width, 5);
                ctx.clip();
                ctx.translate(Math.sin(phase + y * 0.05) * 10, 0);
                this.drawBackground(ctx, canvas, 0);
                if (this.settings.photoOverlay !== 'none' || this.settings.colorOverlayMode !== 'none') {
                    this.applyPhotoOverlay(ctx, canvas);
                }
                ctx.restore();
            }
            ctx.restore();
            // Skip normal draw for wave
            ctx.restore();
            if (this.settings.frameStyle !== 'none') this.drawFrame(ctx, canvas);
            if (this.settings.particleType !== 'none') this.drawParticles(ctx, canvas, 0);
            this.drawDecorations(ctx, canvas);
            if (this.settings.lineStyle !== 'none') this.drawDecorativeLines(ctx, canvas);
            this.drawText(ctx, canvas, {x: 0, y: 0}, 0);
            if (this.settings.innerSparkleType !== 'none') this.drawInnerSparkles(ctx, canvas, this.innerSparkleFrame);
            if (this.settings.textSparkleType !== 'none') this.drawTextSparkles(ctx, canvas, this.sparkleFrame);
            return;
        case 'bounce':
            const bounceY = Math.abs(Math.sin(phase * 1.5)) * 30;
            ctx.translate(0, -bounceY);
            break;
        case 'float':
            const floatY = Math.sin(phase * 0.8) * 15;
            ctx.translate(0, floatY);
            break;
        case 'wobble':
            const wobbleX = Math.sin(phase * 2) * 10;
            const wobbleRot = Math.sin(phase * 2.5) * 0.05;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(wobbleRot);
            ctx.translate(-canvas.width / 2 + wobbleX, -canvas.height / 2);
            break;
        case 'flip-h':
            const flipH = Math.cos(phase * 0.8);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(flipH, 1);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            break;
        case 'flip-v':
            const flipV = Math.cos(phase * 0.8);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(1, flipV);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            break;
    }
    
    this.drawBackground(ctx, canvas, 0);
    if (this.settings.photoOverlay !== 'none' || this.settings.colorOverlayMode !== 'none') {
        this.applyPhotoOverlay(ctx, canvas);
    }
    
    ctx.restore();
    
    // Normal render devam eder
    if (this.settings.frameStyle !== 'none') this.drawFrame(ctx, canvas);
    if (this.settings.particleType !== 'none') this.drawParticles(ctx, canvas, 0);
    this.drawDecorations(ctx, canvas);
    if (this.settings.lineStyle !== 'none') this.drawDecorativeLines(ctx, canvas);
    this.drawText(ctx, canvas, {x: 0, y: 0}, 0);
    if (this.settings.innerSparkleType !== 'none') this.drawInnerSparkles(ctx, canvas, this.innerSparkleFrame);
    if (this.settings.textSparkleType !== 'none') this.drawTextSparkles(ctx, canvas, this.sparkleFrame);
};

// ===== TEXT LAYER YÖNETİMİ =====

FlashNickMaker.prototype.addTextLayer = function() {
    const newId = Math.max(...this.textLayers.map(l => l.id)) + 1;
    const newLayer = {
        id: newId,
        text: 'Yeni Yazı',
        fontFamily: 'Lobster',
        fontSize: 30,
        textColor: '#ffffff',
        shadowColor: '#000000',
        shadowBlur: 5,
        outlineColor: '#000000',
        outlineWidth: 2,
        gradientColor1: '#ff0000',
        gradientColor2: '#ffff00',
        effectGlow: false,
        effectOutline: true,
        effectGradient: false,
        effect3D: false,
        textX: 50,
        textY: 70,
        textBlendMode: 'source-over',
        warpType: 'none',
        warpAmount: 0.35,
        textAnimationType: 'none',
        rotation: 0,
        opacity: 100,
        visible: true
    };
    this.textLayers.push(newLayer);
    this.activeTextLayer = newId;
    this.updateLayerList();
    this.loadLayerToUI(newLayer);
    this.render();
    showToast('Yeni yazı katmanı eklendi! ✨');
};

FlashNickMaker.prototype.deleteTextLayer = function(id) {
    if (this.textLayers.length === 1) {
        showToast('En az bir yazı katmanı olmalı! ⚠️');
        return;
    }
    this.textLayers = this.textLayers.filter(l => l.id !== id);
    if (this.activeTextLayer === id) {
        this.activeTextLayer = this.textLayers[0].id;
        this.loadLayerToUI(this.textLayers[0]);
    }
    this.updateLayerList();
    this.render();
    showToast('Katman silindi! 🗑️');
};

FlashNickMaker.prototype.selectTextLayer = function(id) {
    const layer = this.textLayers.find(l => l.id === id);
    if (layer) {
        this.activeTextLayer = id;
        this.loadLayerToUI(layer);
        this.updateLayerList();
    }
};

FlashNickMaker.prototype.toggleLayerVisibility = function(id) {
    const layer = this.textLayers.find(l => l.id === id);
    if (layer) {
        layer.visible = !layer.visible;
        this.updateLayerList();
        this.render();
    }
};

FlashNickMaker.prototype.moveLayerUp = function(id) {
    const index = this.textLayers.findIndex(l => l.id === id);
    if (index < this.textLayers.length - 1) {
        [this.textLayers[index], this.textLayers[index + 1]] = [this.textLayers[index + 1], this.textLayers[index]];
        this.updateLayerList();
        this.render();
    }
};

FlashNickMaker.prototype.moveLayerDown = function(id) {
    const index = this.textLayers.findIndex(l => l.id === id);
    if (index > 0) {
        [this.textLayers[index], this.textLayers[index - 1]] = [this.textLayers[index - 1], this.textLayers[index]];
        this.updateLayerList();
        this.render();
    }
};

FlashNickMaker.prototype.updateLayerList = function() {
    const container = document.getElementById('textLayerList');
    if (!container) return;
    
    container.innerHTML = '';
    this.textLayers.slice().reverse().forEach(layer => {
        const div = document.createElement('div');
        div.className = 'text-layer-item' + (layer.id === this.activeTextLayer ? ' active' : '');
        div.innerHTML = `
            <button onclick="window.flashNickMaker.toggleLayerVisibility(${layer.id})" class="layer-visibility">
                ${layer.visible ? '👁️' : '👁️‍🗨️'}
            </button>
            <span onclick="window.flashNickMaker.selectTextLayer(${layer.id})" class="layer-name">${layer.text || 'Boş'}</span>
            <div class="layer-controls">
                <button onclick="window.flashNickMaker.moveLayerUp(${layer.id})" title="Yukarı">⬆️</button>
                <button onclick="window.flashNickMaker.moveLayerDown(${layer.id})" title="Aşağı">⬇️</button>
                <button onclick="window.flashNickMaker.deleteTextLayer(${layer.id})" title="Sil">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    });
};

FlashNickMaker.prototype.loadLayerToUI = function(layer) {
    // Text ayarlarını UI'a yükle
    document.getElementById('nickInput').value = layer.text;
    document.getElementById('fontFamily').value = layer.fontFamily;
    document.getElementById('fontSize').value = layer.fontSize;
    document.getElementById('fontSizeVal').textContent = layer.fontSize;
    document.getElementById('textColor').value = layer.textColor;
    document.getElementById('textX').value = layer.textX;
    document.getElementById('textXVal').textContent = layer.textX;
    document.getElementById('textY').value = layer.textY;
    document.getElementById('textYVal').textContent = layer.textY;
    
    // Efektler
    document.getElementById('effectGlow').checked = layer.effectGlow;
    document.getElementById('effectOutline').checked = layer.effectOutline;
    document.getElementById('effectGradient').checked = layer.effectGradient;
    document.getElementById('effect3D').checked = layer.effect3D;
    
    // Ek ayarlar varsa
    if (document.getElementById('layerRotation')) {
        document.getElementById('layerRotation').value = layer.rotation;
        document.getElementById('layerRotationVal').textContent = layer.rotation;
    }
    if (document.getElementById('layerOpacity')) {
        document.getElementById('layerOpacity').value = layer.opacity;
        document.getElementById('layerOpacityVal').textContent = layer.opacity;
    }
};

FlashNickMaker.prototype.updateActiveLayer = function() {
    const layer = this.textLayers.find(l => l.id === this.activeTextLayer);
    if (!layer) return;
    
    // UI'daki değerleri aktif katmana aktar
    layer.text = document.getElementById('nickInput').value;
    layer.fontFamily = document.getElementById('fontFamily').value;
    layer.fontSize = parseInt(document.getElementById('fontSize').value);
    layer.textColor = document.getElementById('textColor').value;
    layer.textX = parseFloat(document.getElementById('textX').value);
    layer.textY = parseFloat(document.getElementById('textY').value);
    layer.effectGlow = document.getElementById('effectGlow').checked;
    layer.effectOutline = document.getElementById('effectOutline').checked;
    layer.effectGradient = document.getElementById('effectGradient').checked;
    layer.effect3D = document.getElementById('effect3D').checked;
    
    if (document.getElementById('layerRotation')) {
        layer.rotation = parseFloat(document.getElementById('layerRotation').value);
    }
    if (document.getElementById('layerOpacity')) {
        layer.opacity = parseFloat(document.getElementById('layerOpacity').value);
    }
    
    this.updateLayerList();
};

// ===== YENİ PROFESYONEL ÖZELLİKLER =====

// Hızlı Stiller
function applyQuickStyle(style) {
    const maker = window.flashNickMaker;
    if (!maker) return;
    
    const styles = {
        romantic: {
            fontFamily: 'Great Vibes',
            textColor: '#ff6b9d',
            bgType: 'gradient1',
            effectGlow: true,
            effectGradient: true,
            gradientColor1: '#ff6b9d',
            gradientColor2: '#c44569',
            particleType: 'hearts',
            shadowColor: '#ff1744'
        },
        cool: {
            fontFamily: 'Bangers',
            textColor: '#00d4ff',
            bgType: 'gradient2',
            effectGlow: true,
            effectOutline: true,
            outlineColor: '#ffffff',
            shadowColor: '#0066ff',
            particleType: 'sparkles'
        },
        gaming: {
            fontFamily: 'Press Start 2P',
            textColor: '#00ff00',
            bgType: 'dark',
            effectGlow: true,
            effect3D: true,
            shadowColor: '#003300',
            particleType: 'fire'
        },
        elegant: {
            fontFamily: 'Satisfy',
            textColor: '#ffd700',
            bgType: 'gradient3',
            effectGlow: true,
            effectGradient: true,
            gradientColor1: '#ffd700',
            gradientColor2: '#ffaa00',
            frameStyle: 'gold',
            shadowColor: '#8b6914'
        },
        neon: {
            fontFamily: 'Orbitron',
            textColor: '#ff00ff',
            bgType: 'dark',
            effectGlow: true,
            shadowBlur: 20,
            shadowColor: '#ff00ff',
            particleType: 'sparkles'
        },
        fire: {
            fontFamily: 'Russo One',
            textColor: '#ff4500',
            bgType: 'dark',
            effectGlow: true,
            effectGradient: true,
            gradientColor1: '#ff4500',
            gradientColor2: '#ffd700',
            particleType: 'fire',
            shadowColor: '#8b0000'
        },
        turkish: {
            fontFamily: 'Lobster',
            textColor: '#ffffff',
            bgType: 'dark',
            effectGlow: true,
            effectOutline: true,
            outlineColor: '#ff0000',
            leftFlag: 'turkey',
            rightFlag: 'turkey',
            flagAnimation: 'wave',
            shadowColor: '#cc0000'
        }
    };
    
    const s = styles[style];
    if (!s) return;
    
    // Arka plan resmini koru
    const hasImage = maker.bgImage !== null;
    
    // Ayarları uygula
    Object.keys(s).forEach(key => {
        // Eğer resim varsa bgType'ı değiştirme
        if (key === 'bgType' && hasImage) {
            return; // bgType'ı atla, resmi koru
        }
        maker.settings[key] = s[key];
    });
    
    // Resim varsa bgType'ı image olarak ayarla
    if (hasImage) {
        maker.settings.bgType = 'image';
    }
    
    // UI'ı güncelle
    updateUIFromSettings(maker);
    maker.render();
    
    // Bayrak animasyonunu başlat
    if (s.leftFlag || s.rightFlag) {
        maker.startFlagAnimation();
    }
    if (s.particleType && s.particleType !== 'none') {
        maker.initParticles();
        maker.startParticleAnimation();
    }
    
    showToast(`${style.charAt(0).toUpperCase() + style.slice(1)} stili uygulandı! ✨`);
    addToHistory();
}

// Rastgele Stil
function randomStyle() {
    const styles = ['romantic', 'cool', 'gaming', 'elegant', 'neon', 'fire', 'turkish'];
    const randomIndex = Math.floor(Math.random() * styles.length);
    applyQuickStyle(styles[randomIndex]);
}

// UI Güncelleme
function updateUIFromSettings(maker) {
    const s = maker.settings;
    
    document.getElementById('fontFamily').value = s.fontFamily || 'Lobster';
    document.getElementById('textColor').value = s.textColor || '#ffffff';
    document.getElementById('shadowColor').value = s.shadowColor || '#000000';
    document.getElementById('effectGlow').checked = s.effectGlow || false;
    document.getElementById('effectOutline').checked = s.effectOutline || false;
    document.getElementById('effectGradient').checked = s.effectGradient || false;
    document.getElementById('effect3D').checked = s.effect3D || false;
    document.getElementById('gradientColor1').value = s.gradientColor1 || '#ff6b6b';
    document.getElementById('gradientColor2').value = s.gradientColor2 || '#feca57';
    document.getElementById('outlineColor').value = s.outlineColor || '#000000';
    document.getElementById('particleType').value = s.particleType || 'none';
    document.getElementById('leftFlag').value = s.leftFlag || 'none';
    document.getElementById('rightFlag').value = s.rightFlag || 'none';
    document.getElementById('frameStyle').value = s.frameStyle || 'none';
    const tb = document.getElementById('textBlendMode');
    const pb = document.getElementById('particleBlendMode');
    if (tb) tb.value = s.textBlendMode || 'source-over';
    if (pb) pb.value = s.particleBlendMode || 'source-over';
    const wt = document.getElementById('warpType');
    const wa = document.getElementById('warpAmount');
    if (wt) wt.value = s.warpType || 'none';
    if (wa) {
        wa.value = s.warpAmount || 0;
        const label = document.getElementById('warpAmountVal');
        if (label) label.textContent = s.warpAmount;
    }
    
    if (s.shadowBlur) {
        document.getElementById('shadowBlur').value = s.shadowBlur;
        document.getElementById('shadowBlurVal').textContent = s.shadowBlur;
    }
}

// Nick Ayarlama
function setNick(nick) {
    document.getElementById('nickInput').value = nick;
    window.flashNickMaker.settings.text = nick;
    window.flashNickMaker.render();
}

// Tasarım Kaydetme
function saveCurrentDesign() {
    const maker = window.flashNickMaker;
    if (!maker) return;
    
    const designs = JSON.parse(localStorage.getItem('flashNickDesigns') || '[]');
    const name = prompt('Tasarım adı girin:', `Tasarım ${designs.length + 1}`);
    
    if (!name) return;
    
    const design = {
        name: name,
        date: new Date().toLocaleDateString('tr-TR'),
        settings: { ...maker.settings },
        preview: maker.canvas.toDataURL('image/png', 0.3)
    };
    
    designs.push(design);
    localStorage.setItem('flashNickDesigns', JSON.stringify(designs));
    
    showToast('Tasarım kaydedildi! 💾');
    showSavedDesigns();
}

// Kayıtlı Tasarımları Göster
function showSavedDesigns() {
    const designs = JSON.parse(localStorage.getItem('flashNickDesigns') || '[]');
    const container = document.getElementById('savedDesignsList');
    
    if (designs.length === 0) {
        container.innerHTML = '<p style="color:#888; font-size:0.8em; text-align:center;">Henüz kayıtlı tasarım yok</p>';
        return;
    }
    
    container.innerHTML = designs.map((d, i) => `
        <div class="saved-design-item">
            <span>${d.name}</span>
            <button onclick="loadDesign(${i})">Yükle</button>
        </div>
    `).join('');
}

// Tasarım Yükleme
function loadDesign(index) {
    const designs = JSON.parse(localStorage.getItem('flashNickDesigns') || '[]');
    const design = designs[index];
    
    if (!design) return;
    
    const maker = window.flashNickMaker;
    Object.assign(maker.settings, design.settings);
    
    document.getElementById('nickInput').value = design.settings.text || '';
    updateUIFromSettings(maker);
    maker.render();
    
    showToast('Tasarım yüklendi! 📂');
}

// Kayıtları Temizle
function clearSavedDesigns() {
    if (confirm('Tüm kayıtlı tasarımlar silinecek. Emin misiniz?')) {
        localStorage.removeItem('flashNickDesigns');
        showSavedDesigns();
        showToast('Tüm tasarımlar silindi! 🗑️');
    }
}

// Geçmiş Ekleme
function addToHistory() {
    const maker = window.flashNickMaker;
    if (!maker) return;
    
    let history = JSON.parse(sessionStorage.getItem('flashNickHistory') || '[]');
    
    const item = {
        preview: maker.canvas.toDataURL('image/png', 0.2),
        text: maker.settings.text,
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
    
    history.unshift(item);
    if (history.length > 10) history = history.slice(0, 10);
    
    sessionStorage.setItem('flashNickHistory', JSON.stringify(history));
    updateHistoryList();
}

// Geçmiş Listesini Güncelle
function updateHistoryList() {
    const history = JSON.parse(sessionStorage.getItem('flashNickHistory') || '[]');
    const container = document.getElementById('historyList');
    
    if (!container) return;
    
    if (history.length === 0) {
        container.innerHTML = '<p style="color:#888; font-size:0.8em; text-align:center;">Henüz geçmiş yok</p>';
        return;
    }
    
    container.innerHTML = history.map((h, i) => `
        <div class="history-item" onclick="loadFromHistory(${i})">
            <img src="${h.preview}" alt="">
            <span>${h.text} - ${h.time}</span>
        </div>
    `).join('');
}

// Geçmişten Yükle
function loadFromHistory(index) {
    const history = JSON.parse(sessionStorage.getItem('flashNickHistory') || '[]');
    const item = history[index];
    
    if (item) {
        document.getElementById('nickInput').value = item.text;
        window.flashNickMaker.settings.text = item.text;
        window.flashNickMaker.render();
    }
}

// Toast Bildirimi
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Paylaşım Fonksiyonları
function shareToTwitter() {
    const text = encodeURIComponent('Flash Nick Pro ile harika bir nick oluşturdum! 🎨 #FlashNick #SesliChat');
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

function shareToFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareToWhatsapp() {
    const text = encodeURIComponent('Flash Nick Pro - Sesli Chat için en iyi nick yapma programı! 🎨');
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function copyShareLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Link kopyalandı! 🔗');
    });
}

// Yardım Modal
function closeHelpModal() {
    document.getElementById('helpModal').style.display = 'none';
}

// Tema Değiştirme
function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    const btn = document.getElementById('darkModeToggle');
    btn.textContent = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
    localStorage.setItem('lightMode', document.body.classList.contains('light-mode'));
}

// Sahte İstatistikler (görsel amaçlı)
function updateFakeStats() {
    const visitor = document.getElementById('visitorCount');
    const today = document.getElementById('todayCount');
    const total = document.getElementById('totalCount');
    
    if (visitor) visitor.textContent = (12000 + Math.floor(Math.random() * 1000)).toLocaleString('tr-TR');
    if (today) today.textContent = (1000 + Math.floor(Math.random() * 500)).toLocaleString('tr-TR');
    if (total) total.textContent = (150000 + Math.floor(Math.random() * 10000)).toLocaleString('tr-TR');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.flashNickMaker = new FlashNickMaker();
    
    // Kayıtlı tasarımları göster
    showSavedDesigns();
    updateHistoryList();
    updateFakeStats();
    
    // Tema ayarını yükle
    if (localStorage.getItem('lightMode') === 'true') {
        document.body.classList.add('light-mode');
        document.getElementById('darkModeToggle').textContent = '🌙';
    }
    
    // Yardım butonu
    document.getElementById('helpBtn')?.addEventListener('click', () => {
        document.getElementById('helpModal').style.display = 'flex';
    });
    
    // Tema butonu
    document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);
    
    // Otomatik tasarım resim seçici
    const autoDesignImage = document.getElementById('autoDesignImage');
    if (autoDesignImage) {
        autoDesignImage.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const status = document.getElementById('autoImageStatus');
            const label = status.parentElement;
            if (file) {
                status.textContent = '✅ ' + file.name.substring(0, 15) + (file.name.length > 15 ? '...' : '');
                label.classList.add('has-image');
            } else {
                status.textContent = '📷 Resim Seç';
                label.classList.remove('has-image');
            }
        });
    }
    
    // Sürükle Bırak Sistemi
    setupDragAndDrop();
    
    // Klavye Kısayolları
    setupKeyboardShortcuts();
    
    // Floating Action Button
    setupFAB();
    
    // Canvas Tıkla Kopyala
    setupCanvasClick();
    
    // Drop Zone Input
    const dropZoneInput = document.getElementById('dropZoneInput');
    if (dropZoneInput) {
        dropZoneInput.addEventListener('change', (e) => {
            handleImageFile(e.target.files[0]);
        });
    }
    
    // Her render'da geçmişe ekle
    const originalRender = window.flashNickMaker.render.bind(window.flashNickMaker);
    let renderTimeout;
    window.flashNickMaker.render = function(options) {
        originalRender(options);
        clearTimeout(renderTimeout);
        renderTimeout = setTimeout(() => {
            // Sadece manuel değişikliklerde geçmişe ekle
        }, 1000);
        updateFloatingPreview();
    };

    // Floating mini önizleme scroll takibi
    setupFloatingPreviewWatcher();
    
    // İstatistikleri güncelle
    setInterval(updateFakeStats, 30000);
    
    // Klavye kısayolları ipucunu 10 saniye sonra gizle
    setTimeout(() => {
        const hint = document.getElementById('keyboardHint');
        if (hint && !localStorage.getItem('keyboardHintDismissed')) {
            hint.style.opacity = '0';
            setTimeout(() => hint.style.display = 'none', 500);
        }
    }, 10000);
});

// =============================================
// KAYDIRIRKEN GÖRÜNÜR MİNİ ÖNİZLEME
// =============================================

function updateFloatingPreview() {
    const mainCanvas = document.getElementById('nickCanvas');
    const floatCanvas = document.getElementById('floatingCanvas');
    if (!mainCanvas || !floatCanvas) return;
    floatCanvas.width = mainCanvas.width;
    floatCanvas.height = mainCanvas.height;
    const ctx = floatCanvas.getContext('2d');
    ctx.clearRect(0, 0, floatCanvas.width, floatCanvas.height);
    ctx.drawImage(mainCanvas, 0, 0, floatCanvas.width, floatCanvas.height);
}

function setupFloatingPreviewWatcher() {
    const floating = document.getElementById('floatingPreview');
    const center = document.querySelector('.center-panel');
    if (!floating || !center) return;
    floating.classList.add('show');
    const sync = () => updateFloatingPreview();
    window.addEventListener('resize', sync);
    sync();
    startFloatingPreviewTicker();
}

let floatingPreviewTicker;
function startFloatingPreviewTicker() {
    const tick = () => {
        updateFloatingPreview();
        floatingPreviewTicker = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(floatingPreviewTicker);
    floatingPreviewTicker = requestAnimationFrame(tick);
}

// =============================================
// SÜRÜKLE BIRAK SİSTEMİ
// =============================================

function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const previewContainer = document.getElementById('previewContainer');
    
    // Sayfa genelinde drag-drop engelle
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
    
    // Drop Zone
    if (dropZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            });
        });
        
        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                handleImageFile(files[0]);
            }
        });
        
        dropZone.addEventListener('click', () => {
            document.getElementById('dropZoneInput')?.click();
        });
    }
    
    // Preview Container'a da drop yapılabilsin
    if (previewContainer) {
        ['dragenter', 'dragover'].forEach(eventName => {
            previewContainer.addEventListener(eventName, () => {
                previewContainer.style.outline = '3px dashed #667eea';
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            previewContainer.addEventListener(eventName, () => {
                previewContainer.style.outline = 'none';
            });
        });
        
        previewContainer.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                handleImageFile(files[0]);
            }
        });
    }
}

function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        showToast('Lütfen bir resim dosyası seçin! 🖼️');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const maker = window.flashNickMaker;
            maker.bgImageOriginal = img;
            maker.bgImage = img;
            maker.settings.bgType = 'custom';
            
            // Ayarları sıfırla
            maker.settings.imageSaturation = 100;
            maker.settings.imageTemperature = 0;
            maker.settings.imageHue = 0;
            maker.settings.imageSharpness = 0;
            maker.settings.imageCropX = 0;
            maker.settings.imageCropY = 0;
            maker.settings.imageCropWidth = 100;
            maker.settings.imageCropHeight = 100;
            
            if (maker.updatePhotoEditingUI) {
                maker.updatePhotoEditingUI();
            }
            
            maker.render();
            showToast('Arka plan yüklendi! 🖼️');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// =============================================
// KLAVYE KISAYOLLARI
// =============================================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Input alanındaysa işleme
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Ctrl/Cmd + tuş kombinasyonları
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'c':
                    e.preventDefault();
                    copyToClipboard();
                    break;
                case 's':
                    e.preventDefault();
                    downloadPNG();
                    break;
                case 'r':
                    e.preventDefault();
                    randomStyle();
                    break;
                case 'g':
                    e.preventDefault();
                    downloadGIF();
                    break;
                case 'z':
                    e.preventDefault();
                    // Geri al
                    break;
            }
        }
        
        // Tek tuş kısayolları
        switch (e.key) {
            case 'Escape':
                // Modalleri kapat
                document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
                closeFAB();
                break;
        }
    });
}

// =============================================
// FLOATING ACTION BUTTON
// =============================================

function setupFAB() {
    const fabMain = document.getElementById('fabMain');
    const floatingActions = document.querySelector('.floating-actions');
    
    if (fabMain && floatingActions) {
        fabMain.addEventListener('click', () => {
            floatingActions.classList.toggle('open');
        });
        
        // Dışarı tıklayınca kapat
        document.addEventListener('click', (e) => {
            if (!floatingActions.contains(e.target)) {
                floatingActions.classList.remove('open');
            }
        });
    }
}

function closeFAB() {
    const floatingActions = document.querySelector('.floating-actions');
    if (floatingActions) {
        floatingActions.classList.remove('open');
    }
}

// =============================================
// CANVAS TIKLA KOPYALA
// =============================================

function setupCanvasClick() {
    const canvas = document.getElementById('nickCanvas');
    if (canvas) {
        canvas.addEventListener('click', (e) => {
            // Blur fırçası aktifse kopyalama
            const maker = window.flashNickMaker;
            if (maker && maker.blurBrushActive) return;
            
            copyToClipboard();
        });
        
        canvas.style.cursor = 'pointer';
    }
}

// Panoya kopyala
async function copyToClipboard() {
    const maker = window.flashNickMaker;
    if (!maker) return;
    
    try {
        const canvas = maker.canvas;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);
        
        showToast('Panoya kopyalandı! 📋 Ctrl+V ile yapıştır');
        
        // Görsel geri bildirim
        const container = document.getElementById('previewContainer');
        if (container) {
            container.style.outline = '3px solid #27ae60';
            setTimeout(() => container.style.outline = 'none', 500);
        }
    } catch (err) {
        // Fallback: Data URL olarak kopyala
        showToast('Kopyalama başarısız, PNG olarak indirin 💾');
        console.error('Kopyalama hatası:', err);
    }
}

// =============================================
// OTOMATİK TASARIM ÜRETİCİ
// =============================================

// Tasarım presetleri
const designPresets = [
    {
        name: 'Romantik Glow',
        style: {
            fontFamily: 'Great Vibes',
            fontSize: 42,
            textColor: '#ff69b4',
            effectGlow: true,
            effectOutline: false,
            effectGradient: false,
            shadowColor: '#ff1493',
            shadowBlur: 20,
            particleType: 'hearts',
            textAnimationType: 'fadeIn'
        }
    },
    {
        name: 'Neon Cyber',
        style: {
            fontFamily: 'Orbitron',
            fontSize: 38,
            textColor: '#00ffff',
            effectGlow: true,
            effectOutline: true,
            outlineColor: '#ff00ff',
            outlineWidth: 2,
            shadowColor: '#00ffff',
            shadowBlur: 25,
            particleType: 'none',
            textBlendMode: 'screen'
        }
    },
    {
        name: 'Altın Lüks',
        style: {
            fontFamily: 'Lobster',
            fontSize: 44,
            textColor: '#ffd700',
            effectGradient: true,
            gradientColor1: '#ffd700',
            gradientColor2: '#ff8c00',
            effectOutline: true,
            outlineColor: '#8b4513',
            outlineWidth: 3,
            shadowColor: '#000000',
            shadowBlur: 10,
            particleType: 'stars'
        }
    },
    {
        name: 'Gece Mavisi',
        style: {
            fontFamily: 'Dancing Script',
            fontSize: 42,
            textColor: '#87ceeb',
            effectGlow: true,
            shadowColor: '#4169e1',
            shadowBlur: 18,
            effectOutline: true,
            outlineColor: '#191970',
            outlineWidth: 2,
            particleType: 'snow'
        }
    },
    {
        name: 'Ateş Fırtınası',
        style: {
            fontFamily: 'Permanent Marker',
            fontSize: 40,
            textColor: '#ff4500',
            effectGradient: true,
            gradientColor1: '#ff0000',
            gradientColor2: '#ffa500',
            effectGlow: true,
            shadowColor: '#ff4500',
            shadowBlur: 20,
            particleType: 'fire',
            textAnimationType: 'wave'
        }
    },
    {
        name: 'Pastel Rüya',
        style: {
            fontFamily: 'Pacifico',
            fontSize: 42,
            textColor: '#dda0dd',
            effectGradient: true,
            gradientColor1: '#ffb6c1',
            gradientColor2: '#87cefa',
            effectOutline: false,
            shadowColor: '#ff69b4',
            shadowBlur: 15,
            particleType: 'bubbles'
        }
    },
    {
        name: 'Matrix Hacker',
        style: {
            fontFamily: 'Press Start 2P',
            fontSize: 28,
            textColor: '#00ff00',
            effectGlow: true,
            shadowColor: '#00ff00',
            shadowBlur: 15,
            effectOutline: false,
            particleType: 'matrix',
            textAnimationType: 'matrix'
        }
    },
    {
        name: 'Galaktik',
        style: {
            fontFamily: 'Russo One',
            fontSize: 40,
            textColor: '#e0e0ff',
            effectGradient: true,
            gradientColor1: '#9400d3',
            gradientColor2: '#00bfff',
            effectGlow: true,
            shadowColor: '#8a2be2',
            shadowBlur: 22,
            particleType: 'stars',
            textSparkleType: 'sparkle'
        }
    },
    {
        name: 'Türk Bayrağı',
        style: {
            fontFamily: 'Righteous',
            fontSize: 40,
            textColor: '#ffffff',
            effectOutline: true,
            outlineColor: '#e30a17',
            outlineWidth: 3,
            effectGlow: true,
            shadowColor: '#e30a17',
            shadowBlur: 15,
            leftFlag: 'tr',
            rightFlag: 'tr',
            flagAnimation: 'wave'
        }
    },
    {
        name: 'Vintage Retro',
        style: {
            fontFamily: 'Bangers',
            fontSize: 44,
            textColor: '#f4a460',
            effectOutline: true,
            outlineColor: '#8b4513',
            outlineWidth: 3,
            effect3D: true,
            shadowColor: '#000000',
            shadowBlur: 5,
            imageEffect: 'sepia'
        }
    },
    {
        name: 'Buz Kraliçesi',
        style: {
            fontFamily: 'Satisfy',
            fontSize: 42,
            textColor: '#e0ffff',
            effectGradient: true,
            gradientColor1: '#add8e6',
            gradientColor2: '#ffffff',
            effectGlow: true,
            shadowColor: '#00bfff',
            shadowBlur: 20,
            particleType: 'snow',
            textSparkleType: 'shimmer'
        }
    },
    {
        name: 'Punk Rock',
        style: {
            fontFamily: 'Creepster',
            fontSize: 40,
            textColor: '#ff1493',
            effectOutline: true,
            outlineColor: '#000000',
            outlineWidth: 4,
            effectGlow: false,
            shadowColor: '#ff1493',
            shadowBlur: 10,
            textAnimationType: 'glitch'
        }
    }
];

// Otomatik tasarım üret
let autoDesignImage = null;

// Otomatik tasarım boyut presetleri
function setAutoSize(width, height) {
    document.getElementById('autoDesignWidth').value = width;
    document.getElementById('autoDesignHeight').value = height;
    
    // Aktif butonu güncelle
    document.querySelectorAll('.auto-size-presets button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function generateAutoDesign() {
    const textInput = document.getElementById('autoDesignText');
    const imageInput = document.getElementById('autoDesignImage');
    const widthInput = document.getElementById('autoDesignWidth');
    const heightInput = document.getElementById('autoDesignHeight');
    const grid = document.getElementById('autoDesignGrid');
    
    const text = textInput.value.trim() || 'NickAdı';
    const canvasWidth = parseInt(widthInput.value) || 350;
    const canvasHeight = parseInt(heightInput.value) || 120;
    
    // Resim yükle (varsa)
    const imageFile = imageInput.files[0];
    
    // Yükleniyor göster
    grid.innerHTML = `
        <div class="auto-design-loading" style="grid-column: 1 / -1;">
            <div class="spinner"></div>
            <p>Tasarımlar oluşturuluyor...</p>
        </div>
    `;
    
    // Boyutları sakla
    window.autoDesignSize = { width: canvasWidth, height: canvasHeight };
    
    // Resmi yükle ve tasarımları oluştur
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                autoDesignImage = img;
                setTimeout(() => createDesignCards(text, img), 500);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(imageFile);
    } else {
        autoDesignImage = null;
        setTimeout(() => createDesignCards(text, null), 500);
    }
}

function createDesignCards(text, bgImage) {
    const grid = document.getElementById('autoDesignGrid');
    grid.innerHTML = '';
    
    const size = window.autoDesignSize || { width: 350, height: 120 };
    
    // Rastgele 6 preset seç
    const shuffled = [...designPresets].sort(() => Math.random() - 0.5);
    const selectedPresets = shuffled.slice(0, 6);
    
    selectedPresets.forEach((preset, index) => {
        const card = document.createElement('div');
        card.className = 'auto-design-card';
        card.innerHTML = `
            <canvas id="autoCanvas${index}" width="${size.width}" height="${size.height}"></canvas>
            <div class="auto-design-card-info">
                <span>${preset.name}</span>
                <div class="auto-design-card-actions">
                    <button class="auto-card-use-btn" onclick="useAutoDesign(${index})" title="Bu tasarımı ana editöre aktar">✓ Kullan</button>
                    <button class="auto-card-download-btn" onclick="downloadAutoDesign(${index})" title="Direkt indir">⬇ İndir</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
        
        // Canvas'a çiz
        setTimeout(() => {
            renderAutoDesign(index, text, bgImage, preset);
        }, 100 * index);
    });
    
    // Preset'leri sakla
    window.currentAutoPresets = selectedPresets;
    
    showToast(`${selectedPresets.length} farklı tasarım oluşturuldu! ✨`);
}

function renderAutoDesign(index, text, bgImage, preset) {
    const canvas = document.getElementById(`autoCanvas${index}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const style = preset.style;
    
    // Arka plan
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (bgImage) {
        // Resmi çiz
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        // Hafif karartma overlay
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // Gradient arka plan
        const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGrad.addColorStop(0, '#1a1a2e');
        bgGrad.addColorStop(1, '#16213e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Font ayarla
    ctx.font = `${style.fontSize || 40}px "${style.fontFamily || 'Lobster'}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    // Glow efekti
    if (style.effectGlow) {
        ctx.shadowColor = style.shadowColor || style.textColor;
        ctx.shadowBlur = style.shadowBlur || 15;
    } else {
        ctx.shadowColor = style.shadowColor || '#000000';
        ctx.shadowBlur = style.shadowBlur || 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
    }
    
    // Gradient veya düz renk
    if (style.effectGradient) {
        const textWidth = ctx.measureText(text).width;
        const gradient = ctx.createLinearGradient(x - textWidth/2, 0, x + textWidth/2, 0);
        gradient.addColorStop(0, style.gradientColor1 || '#ff6b6b');
        gradient.addColorStop(1, style.gradientColor2 || '#feca57');
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = style.textColor || '#ffffff';
    }
    
    // Outline
    if (style.effectOutline && style.outlineWidth > 0) {
        ctx.strokeStyle = style.outlineColor || '#000000';
        ctx.lineWidth = (style.outlineWidth || 2) * 2;
        ctx.strokeText(text, x, y);
    }
    
    // Metni çiz
    ctx.fillText(text, x, y);
    
    // Bayraklar (varsa)
    if (style.leftFlag && style.leftFlag !== 'none') {
        drawMiniFlag(ctx, style.leftFlag, 15, canvas.height/2 - 15, 30);
    }
    if (style.rightFlag && style.rightFlag !== 'none') {
        drawMiniFlag(ctx, style.rightFlag, canvas.width - 45, canvas.height/2 - 15, 30);
    }
}

function drawMiniFlag(ctx, flagCode, x, y, size) {
    // Basit bayrak çizimi (sadece bazı bayraklar)
    const flags = {
        'tr': () => {
            ctx.fillStyle = '#e30a17';
            ctx.fillRect(x, y, size, size * 0.67);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x + size * 0.35, y + size * 0.33, size * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#e30a17';
            ctx.beginPath();
            ctx.arc(x + size * 0.4, y + size * 0.33, size * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    };
    
    if (flags[flagCode]) {
        flags[flagCode]();
    }
}

function useAutoDesign(index) {
    const preset = window.currentAutoPresets[index];
    if (!preset) return;
    
    const maker = window.flashNickMaker;
    const text = document.getElementById('autoDesignText').value.trim() || 'NickAdı';
    const size = window.autoDesignSize || { width: 350, height: 120 };
    
    // Canvas boyutunu uygula
    maker.settings.canvasWidth = size.width;
    maker.settings.canvasHeight = size.height;
    document.getElementById('canvasWidth').value = size.width;
    document.getElementById('canvasHeight').value = size.height;
    
    // Metni uygula
    maker.settings.text = text;
    document.getElementById('nickInput').value = text;
    
    // Stili uygula
    Object.keys(preset.style).forEach(key => {
        if (maker.settings.hasOwnProperty(key)) {
            maker.settings[key] = preset.style[key];
        }
    });
    
    // Resmi uygula (varsa)
    if (autoDesignImage) {
        maker.bgImage = autoDesignImage;
        maker.bgImageOriginal = autoDesignImage;
        maker.settings.bgType = 'custom';
    }
    
    // Canvas boyutunu güncelle
    maker.canvas.width = size.width;
    maker.canvas.height = size.height;
    
    // UI güncelle
    updateUIFromSettings(maker);
    
    maker.render();
    showToast(`"${preset.name}" tasarımı ana editöre aktarıldı! 🎨 Artık düzenlemeye devam edebilirsin.`);
    
    // Ana önizlemeye scroll
    document.querySelector('.center-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function downloadAutoDesign(index) {
    const canvas = document.getElementById(`autoCanvas${index}`);
    if (!canvas) return;
    
    const preset = window.currentAutoPresets[index];
    const text = document.getElementById('autoDesignText').value.trim() || 'NickAdı';
    
    const link = document.createElement('a');
    link.download = `${text}-${preset.name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    showToast('Tasarım indirildi! 📥');
}

