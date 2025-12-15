class AudioVisualizer extends HTMLElement {
    constructor() {
        super();
        this.active = false;
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.animationId = null;
    }

    connectedCallback() {
        this.style.display = 'block';
        this.style.width = '100%';
        this.style.height = '100%'; // Allow height to be controlled by parent or CSS

        this.innerHTML = `
      <canvas style="width: 100%; height: 100%; display: block;"></canvas>
    `;
        this.canvas = this.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');

        // Handle resizing
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this);

        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.drawIdle();
    }

    disconnectedCallback() {
        if (this.resizeObserver) this.resizeObserver.disconnect();
        this.stopAudio();
    }

    resize() {
        const rect = this.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        if (!this.active) this.drawIdle();
    }

    async startAudio() {
        if (this.audioContext) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.source = this.audioContext.createMediaStreamSource(stream);

            this.source.connect(this.analyser);
            this.analyser.fftSize = 2048; // Higher resolution
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            this.animate();
        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    }

    stopAudio() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    setActive(isActive) {
        this.active = isActive;
        if (this.active) {
            this.startAudio();
        } else {
            this.stopAudio();
            this.drawIdle();
        }
    }

    drawIdle() {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        // Responsive radius: 20% of smallest dimension
        const baseRadius = Math.min(width, height) * 0.2;
        const time = Date.now() / 2000;

        const orbs = [
            { color: '#5c6b48', scale: 1.0, offset: 0 },
            { color: '#cba36b', scale: 0.9, offset: 2 },
            { color: '#d96c6c', scale: 0.8, offset: 4 }
        ];

        orbs.forEach(orb => {
            const breathing = Math.sin(time + orb.offset) * 5;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, Math.max(0, baseRadius * orb.scale + breathing), 0, Math.PI * 2);
            this.ctx.fillStyle = orb.color;
            this.ctx.globalAlpha = 0.3; // Elegant transparency
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0; // Reset
    }

    animate() {
        if (!this.active || !this.analyser) return;

        this.animationId = requestAnimationFrame(() => this.animate());

        this.analyser.getByteTimeDomainData(this.dataArray);

        // Calculate volume (RMS)
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            const val = (this.dataArray[i] - 128) / 128.0;
            sum += val * val;
        }
        const rms = Math.sqrt(sum / this.dataArray.length);
        const targetVolume = Math.min(1, rms * 5);

        // Smooth volume
        this.smoothedVolume = this.smoothedVolume || 0;
        this.smoothedVolume += (targetVolume - this.smoothedVolume) * 0.1;

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const ctx = this.ctx;
        const centerX = width / 2;
        const centerY = height / 2;

        // Responsive logic: Ensure it never clips
        // Max radius = base + reaction + breathing
        const minDim = Math.min(width, height);
        const baseRadius = minDim * 0.15; // Start at 15%
        const maxReaction = minDim * 0.25; // Max growth is another 25%

        ctx.clearRect(0, 0, width, height);

        const orbs = [
            { color: '#5c6b48', scale: 1.2, speed: 0.5 },
            { color: '#cba36b', scale: 1.0, speed: 0.7 },
            { color: '#d96c6c', scale: 0.8, speed: 0.3 }
        ];

        orbs.forEach((orb, i) => {
            ctx.beginPath();

            // Dynamic radius
            const reaction = this.smoothedVolume * maxReaction * orb.scale;
            const breathing = Math.sin(Date.now() / 1000 * orb.speed + i) * (minDim * 0.02); // 2% breathing

            const r = baseRadius * orb.scale + reaction + breathing;

            ctx.arc(centerX, centerY, Math.max(0, r), 0, Math.PI * 2);
            ctx.fillStyle = orb.color;
            ctx.globalAlpha = 0.4; // Slightly more visible when active
            ctx.fill();
        });

        ctx.globalAlpha = 1.0;
    }
}

customElements.define('audio-visualizer', AudioVisualizer);
