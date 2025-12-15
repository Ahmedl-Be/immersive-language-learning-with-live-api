class ViewSplash extends HTMLElement {
  connectedCallback() {
    // Define translations
    const startTranslations = [
      "ابدأ", "Comenzar", "Commencer",
      "شروع کرें", "Mulai", "Inizia", "スタート", "시작",
      "Começar", "Начать", "เริ่ม", "Başla", "Bắt đầu", "Почати", "শুরু",
      "साुरु करा", "தொடங்கு", "ప్రారంభించు"
    ];

    // Escape quotes for HTML attribute if necessary, but simple JSON.stringify should be fine for these strings
    const valuesAttr = JSON.stringify(startTranslations).replace(/"/g, '&quot;');

    this.innerHTML = `
      <div class="container text-center flex-center">
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <h1 style="font-size: 4.5rem; letter-spacing: -2px; margin-bottom: var(--spacing-sm);">Immergo</h1>
          <p style="font-style: italic; font-size: 1.3rem; opacity: 0.7;">Intense immersive language learning experience.</p>
          <p style="font-size: 0.9rem; opacity: 0.5; margin-top: var(--spacing-sm);">Powered by Gemini Live API</p>
        </div>
        
        <div style="width: 100%; margin-bottom: var(--spacing-xxl);">
          <button id="start-btn" style="
            background: var(--color-accent-primary);
            color: white;
            padding: var(--spacing-md) var(--spacing-xl);
            font-size: 1.2rem;
            border-radius: var(--radius-full);
            width: 100%;
            max-width: 300px;
            box-shadow: var(--shadow-md);
          ">
            <text-cycler text="Start" values='${JSON.stringify(startTranslations)}'></text-cycler>
          </button>
        </div>

        <div style="font-size: 0.7rem; opacity: 0.5; max-width: 400px; margin: 0 auto; line-height: 1.4; padding-bottom: var(--spacing-lg);">
            <strong>Disclaimer:</strong> This application is for demo purposes only. This is not an official product. May produce inaccurate, unexpected, or offensive results. Present to a live audience at your own risk.
        </div>
      </div>
    `;

    this.querySelector('#start-btn').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('navigate', {
        bubbles: true,
        detail: { view: 'missions' }
      }));
    });
  }
}

customElements.define('view-splash', ViewSplash);
