class TextCycler extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['text', 'values'];
    }

    connectedCallback() {
        this.render();
        this.startAnimation();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
            if (name === 'values') {
                this.startAnimation();
            }
        }
    }

    render() {
        const text = this.getAttribute('text') || '';

        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        span {
          transition: opacity 0.5s ease-in-out;
          opacity: 1;
        }
        span.hidden {
          opacity: 0;
        }
      </style>
      <span id="content">${text}</span>
    `;
    }

    startAnimation() {
        if (this.intervalId) clearInterval(this.intervalId);

        const valuesStr = this.getAttribute('values');
        if (!valuesStr) return;

        let values = [];
        try {
            values = JSON.parse(valuesStr);
        } catch (e) {
            console.error('Invalid values for text-cycler:', valuesStr);
            return;
        }

        if (!Array.isArray(values) || values.length === 0) return;

        // Use a negative index to start so the first cycle moves to index 0
        let currentIndex = -1;
        const anchorText = this.getAttribute('text') || '';
        let showingAnchor = true;

        const span = this.shadowRoot.getElementById('content');
        if (!span) return;

        this.intervalId = setInterval(() => {
            if (!span) return;

            // Fade out
            span.classList.add('hidden');

            setTimeout(() => {
                if (showingAnchor) {
                    // Switch to next value
                    currentIndex = (currentIndex + 1) % values.length;
                    span.textContent = values[currentIndex];
                    showingAnchor = false;
                } else {
                    // Return to anchor text
                    span.textContent = anchorText;
                    showingAnchor = true;
                }

                // Fade in
                span.classList.remove('hidden');
            }, 500); // Wait for fade out to complete

        }, 3000);
    }

    disconnectedCallback() {
        if (this.intervalId) clearInterval(this.intervalId);
    }
}

customElements.define('text-cycler', TextCycler);
