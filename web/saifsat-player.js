/**
 * SaifSat Universal Core Player - v1.6.0 (Monetized & Anti-AdBlock Edition)
 * Zero-Lag, Low-Memory IPTV Engine
 * Integrated with Obfuscated DirectLink Monetization
 */

class SaifSatPlayer {
    constructor(options = {}) {
        this.container = typeof options.container === 'string' 
            ? document.querySelector(options.container) 
            : options.container;
            
        this.lowLatency = options.lowLatency !== false;
        this.maxBufferLength = options.maxBufferLength || 10;
        this.hlsInstance = null;
        this.gl = null;
        this.worker = null;

        // تشفير رابط Monetag DirectLink لتفادي كشف الـ AdBlock والفحص التلقائي
        // https://uplcm.com/4/12154670
        this._rawDirectLink = atob("aHR0cHM6Ly91cGxjbS5jb20vNC8xMjE1NDY3MA==");
        this._hasTriggeredInitialAd = false;

        this._initDOM();
        this._initWebGL();
        this._initWorker();
    }

    _initDOM() {
        this.container.style.position = 'relative';
        this.container.style.backgroundColor = '#000';
        this.container.style.overflow = 'hidden';

        // 1. عنصر الفيديو الأساسي
        this.video = document.createElement('video');
        this.video.style.width = '100%';
        this.video.style.height = '100%';
        this.video.style.display = 'block';
        this.video.playsInline = true;
        this.video.autoplay = true;

        // 2. طبقة الـ Canvas الاحتياطية للـ GPU
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'none';

        // 3. عزل طبقة الإعلانات داخل Shadow DOM لتخطي AdBlock و DNS Blocking تماماً
        this.adHost = document.createElement('div');
        this.adShadow = this.adHost.attachShadow({ mode: 'closed' });
        this._buildShadowAdUI();

        // 4. مؤشر التحميل
        this.loader = document.createElement('div');
        this.loader.innerHTML = '<div class="saifsat-spinner"></div>';
        this.loader.style.position = 'absolute';
        this.loader.style.top = '50%';
        this.loader.style.left = '50%';
        this.loader.style.transform = 'translate(-50%, -50%)';
        this.loader.style.display = 'none';

        // 5. صندوق الأخطاء
        this.errorNotice = document.createElement('div');
        this._setupErrorNotice();

        this.container.appendChild(this.video);
        this.container.appendChild(this.canvas);
        this.container.appendChild(this.adHost);
        this.container.appendChild(this.loader);
        this.container.appendChild(this.errorNotice);

        this._bindEvents();
    }

    _buildShadowAdUI() {
        const style = document.createElement('style');
        style.textContent = `
            ._0x9a1 {
                position: absolute;
                top: 16px;
                right: 16px;
                max-width: 290px;
                background: rgba(15, 20, 32, 0.8);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 215, 0, 0.4);
                box-shadow: 0 8px 24px rgba(0,0,0,0.6);
                border-radius: 10px;
                padding: 10px 14px;
                color: #fff;
                font-family: sans-serif;
                font-size: 12px;
                z-index: 9999;
                display: none;
                transition: opacity 0.4s ease, transform 0.4s ease;
                transform: translateY(-8px);
                direction: rtl;
            }
            ._0x9a1._active {
                display: block;
                opacity: 1;
                transform: translateY(0);
            }
            ._0xbtn {
                display: inline-block;
                background: #ffd700;
                color: #000;
                padding: 5px 12px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: bold;
                font-size: 11px;
                margin-top: 6px;
                cursor: pointer;
            }
        `;

        this.adCard = document.createElement('div');
        this.adCard.className = '_0x9a1';
        this.adCard.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="color:#ffd700; font-weight:bold;">⚡ راعي البث المباشر</span>
                <span id="_0xclose" style="cursor:pointer; color:#888; font-size:14px;">✕</span>
            </div>
            <div style="color:#d1d5db; font-size:11px; line-height:1.4;">انقر لدعم البث المجاني وتصفح العروض الحصرية بدون تقطيع.</div>
            <div class="_0xbtn" id="_0xcta">مشاهدة العرض الآن ❯</div>
        `;

        this.adShadow.appendChild(style);
        this.adShadow.appendChild(this.adCard);

        this.adCard.querySelector('#_0xclose').onclick = (e) => {
            e.stopPropagation();
            this.adCard.classList.remove('_active');
        };

        this.adCard.querySelector('#_0xcta').onclick = (e) => {
            e.stopPropagation();
            window.open(this._rawDirectLink, '_blank');
            this.adCard.classList.remove('_active');
        };
    }

    _triggerMonetization() {
        this.adCard.classList.add('_active');

        setTimeout(() => {
            this.adCard.classList.remove('_active');
        }, 6000);
    }

    _openDirectLinkBackground() {
        if (!this._hasTriggeredInitialAd) {
            this._hasTriggeredInitialAd = true;
            try {
                window.open(this._rawDirectLink, '_blank');
            } catch (e) {}
        }
    }

    _setupErrorNotice() {
        this.errorNotice.style.position = 'absolute';
        this.errorNotice.style.top = '50%';
        this.errorNotice.style.left = '50%';
        this.errorNotice.style.transform = 'translate(-50%, -50%)';
        this.errorNotice.style.backgroundColor = 'rgba(20, 10, 10, 0.85)';
        this.errorNotice.style.border = '1px solid #ff4444';
        this.errorNotice.style.borderRadius = '8px';
        this.errorNotice.style.padding = '12px 20px';
        this.errorNotice.style.color = '#ff6b6b';
        this.errorNotice.style.fontSize = '13px';
        this.errorNotice.style.display = 'none';
        this.errorNotice.style.zIndex = '20';
        this.errorNotice.innerHTML = '⚠️ تعذر الاتصال بالسيرفر أو الرابط منتهي الصلاحية';
    }

    _initWebGL() {
        try {
            this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
        } catch (e) {}
    }

    _initWorker() {
        try {
            this.worker = new Worker('saifsat-demux-worker.js');
        } catch (err) {}
    }

    _bindEvents() {
        this.video.addEventListener('waiting', () => this._showLoader(true));
        this.video.addEventListener('playing', () => {
            this._showLoader(false);
            this.errorNotice.style.display = 'none';
            this._triggerMonetization();
        });
        this.video.addEventListener('canplay', () => this._showLoader(false));
    }

    _showLoader(show) {
        this.loader.style.display = show ? 'block' : 'none';
    }

    loadSource(streamUrl) {
        this.errorNotice.style.display = 'none';
        this._showLoader(true);

        if (this.hlsInstance) {
            this.hlsInstance.destroy();
            this.hlsInstance = null;
        }

        if (streamUrl.includes('.m3u8') && window.Hls && Hls.isSupported()) {
            this.video.style.display = 'block';
            this.canvas.style.display = 'none';

            this.hlsInstance = new Hls({
                enableWorker: true,
                lowLatencyMode: this.lowLatency,
                backBufferLength: 6,
                maxBufferLength: this.maxBufferLength,
                maxMaxBufferLength: 12,
                maxBufferSize: 25 * 1024 * 1024,
                liveSyncDurationCount: 2,
                fragLoadingTimeOut: 8000,
                manifestLoadingTimeOut: 8000,
                autoStartLoad: true
            });

            this.hlsInstance.loadSource(streamUrl);
            this.hlsInstance.attachMedia(this.video);

            this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                this.video.play().catch(() => {
                    this.video.muted = true;
                    this.video.play();
                });
            });

            this.hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    this._showLoader(false);
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            this.errorNotice.style.display = 'block';
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            this.hlsInstance.recoverMediaError();
                            break;
                        default:
                            this._activateCanvasPipeline(streamUrl);
                            break;
                    }
                }
            });
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            this.video.src = streamUrl;
            this.video.play();
        } else {
            this._activateCanvasPipeline(streamUrl);
        }
    }

    _activateCanvasPipeline(streamUrl) {
        this.video.style.display = 'none';
        this.canvas.style.display = 'block';
        this._triggerMonetization();
        this._showLoader(false);
    }

    togglePlay() {
        this._openDirectLinkBackground();
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
    }

    toggleMute() {
        this.video.muted = !this.video.muted;
        return this.video.muted;
    }

    toggleFullscreen() {
        this._openDirectLinkBackground();
        if (!document.fullscreenElement) {
            this.container.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }

    destroy() {
        if (this.hlsInstance) this.hlsInstance.destroy();
        if (this.worker) this.worker.terminate();
        this.video.src = '';
        this.container.innerHTML = '';
    }
}