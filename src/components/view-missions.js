import missionsData from '../data/missions.json';

class ViewMissions extends HTMLElement {
  connectedCallback() {
    const options = `
            <option>🇪🇬 Arabic</option>
            <option>🇩🇪 German</option>
            <option>🇬🇧 English</option>
            <option>🇪🇸 Spanish</option>
            <option>🇫🇷 French</option>
            <option>🇮🇳 Hindi</option>
            <option>🇮🇩 Indonesian</option>
            <option>🇮🇹 Italian</option>
            <option>🇯🇵 Japanese</option>
            <option>🇰🇷 Korean</option>
            <option>🇧🇷 Portuguese</option>
            <option>🇷🇺 Russian</option>
            <option>🇳🇱 Dutch</option>
            <option>🇵🇱 Polish</option>
            <option>🇹🇭 Thai</option>
            <option>🇹🇷 Turkish</option>
            <option>🇻🇳 Vietnamese</option>
            <option>🇷🇴 Romanian</option>
            <option>🇺🇦 Ukrainian</option>
            <option>🇧🇩 Bengali</option>
            <option>🇮🇳 Marathi</option>
            <option>🇮🇳 Tamil</option>
            <option>🇮🇳 Telugu</option>
    `;

    this.innerHTML = `
      <div class="container">
        <h2 style="margin-top: var(--spacing-xl);">Select Mission</h2>
        
        <div style="margin-bottom: var(--spacing-lg); display: flex; align-items: center; gap: var(--spacing-sm);">
          <div style="flex: 1;">
            <label style="display: block; font-size: 0.8rem; margin-bottom: 4px; opacity: 0.7;">From (Native)</label>
            <select id="from-lang" style="
              width: 100%;
              padding: var(--spacing-md);
              border: 1px solid #ccc;
              border-radius: var(--radius-md);
              background: transparent;
              font-family: var(--font-body);
              font-size: 1rem;
              appearance: none;
            ">
              ${options}
            </select>
          </div>

          <div style="font-size: 1.2rem; margin-top: 20px; opacity: 0.5;">→</div>

          <div style="flex: 1;">
            <label style="display: block; font-size: 0.8rem; margin-bottom: 4px; opacity: 0.7;">To (Target)</label>
            <select id="to-lang" style="
              width: 100%;
              padding: var(--spacing-md);
              border: 1px solid #ccc;
              border-radius: var(--radius-md);
              background: transparent;
              font-family: var(--font-body);
              font-size: 1rem;
              appearance: none;
            ">
              ${options}
            </select>
          </div>
        </div>

        <div style="margin-bottom: var(--spacing-lg);">
        <div style="margin-bottom: var(--spacing-lg);">
            <div style="display: flex; gap: var(--spacing-md);">
                <button id="mode-teacher" class="mode-btn" style="
                    flex: 1;
                    padding: var(--spacing-lg);
                    border-radius: var(--radius-lg);
                    border: 2px solid transparent;
                    background: #f5f5f5;
                    cursor: pointer;
                    display: flex; flex-direction: column; align-items: center; gap: var(--spacing-sm);
                    transition: all 0.2s;
                    text-align: center;
                ">
                    <span style="font-size: 2rem;">🧑‍🏫</span>
                    <span style="font-weight: bold; font-size: 1.1rem;">Teacher Mode</span>
                    <span style="font-size: 0.85rem; opacity: 0.7; line-height: 1.4;">
                        Helpful explanations, native language allowed. No grading.
                    </span>
                </button>

                <button id="mode-immersive" class="mode-btn" style="
                    flex: 1;
                    padding: var(--spacing-lg);
                    border-radius: var(--radius-lg);
                    border: 2px solid transparent;
                    background: #f5f5f5;
                    cursor: pointer;
                    display: flex; flex-direction: column; align-items: center; gap: var(--spacing-sm);
                    transition: all 0.2s;
                    text-align: center;
                ">
                    <span style="font-size: 2rem;">🎭</span>
                    <span style="font-weight: bold; font-size: 1.1rem;">Immersive Mode</span>
                    <span style="font-size: 0.85rem; opacity: 0.7; line-height: 1.4;">
                        Strict roleplay, graded, no native language allowed.
                    </span>
                </button>
            </div>
        </div>

        <div class="missions-list">
          <!-- Missions will be injected here -->
        </div>
      </div>
    `;

    this.renderMissions();

    // Restore language preference
    const savedLang = localStorage.getItem('immergo_language');
    const savedFromLang = localStorage.getItem('immergo_from_language');

    const toSelect = this.querySelector('#to-lang');
    const fromSelect = this.querySelector('#from-lang');

    if (savedLang) toSelect.value = savedLang;

    // Default From language to English if not set
    if (savedFromLang) {
      fromSelect.value = savedFromLang;
    } else {
      // Try to find English or default to first
      const options = Array.from(fromSelect.options);
      const englishOption = options.find(o => o.text.includes('English'));
      if (englishOption) fromSelect.value = englishOption.text;
    }


    // Mode Logic
    const modeImmersive = this.querySelector('#mode-immersive');
    const modeTeacher = this.querySelector('#mode-teacher');
    let currentMode = localStorage.getItem('immergo_mode') || 'immergo_immersive'; // Default to immersive

    const updateModeUI = () => {
      // Reset styles
      [modeTeacher, modeImmersive].forEach(btn => {
        btn.style.borderColor = 'transparent';
        btn.style.background = '#f5f5f5';
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'none';
      });

      const activeBtn = currentMode === 'immergo_teacher' ? modeTeacher : modeImmersive;

      // Active style
      activeBtn.style.borderColor = 'var(--color-accent-primary)';
      activeBtn.style.background = 'white'; // or a light tint
      activeBtn.style.transform = 'scale(1.02)';
      activeBtn.style.boxShadow = 'var(--shadow-md)';
    };

    modeImmersive.addEventListener('click', () => {
      currentMode = 'immergo_immersive';
      localStorage.setItem('immergo_mode', currentMode);
      updateModeUI();
    });

    modeTeacher.addEventListener('click', () => {
      currentMode = 'immergo_teacher';
      localStorage.setItem('immergo_mode', currentMode);
      updateModeUI();
    });

    updateModeUI();

    // Add change listeners to persist immediately
    fromSelect.addEventListener('change', () => {
      localStorage.setItem('immergo_from_language', fromSelect.value);
    });

    toSelect.addEventListener('change', () => {
      localStorage.setItem('immergo_language', toSelect.value);
    });
  }

  renderMissions() {
    const missions = missionsData;

    const listContainer = this.querySelector('.missions-list');

    missions.forEach(mission => {
      const card = document.createElement('div');
      card.className = 'card mission-card';
      card.style.cursor = 'pointer';

      let badgeColor = '#8bc34a';
      if (mission.difficulty === 'Medium') badgeColor = '#ffc107';
      if (mission.difficulty === 'Hard') badgeColor = '#ff9800';
      if (mission.difficulty === 'Expert') badgeColor = '#f44336';

      // Highlight Easy for the first one if we wanted, but sticking to logic
      if (mission.difficulty === 'Easy') badgeColor = '#8bc34a';


      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xs);">
          <h3 style="margin: 0; font-size: 1.1rem;">${mission.title}</h3>
          <span style="
            background: ${badgeColor}33;
            color: ${badgeColor};
            padding: 2px 8px;
            border-radius: var(--radius-sm);
            font-size: 0.8rem;
            font-weight: 700;
            display: inline-block;
          ">${mission.difficulty}</span>
        </div>
        <p style="margin: 0; font-size: 0.9rem;">${mission.desc}</p>
      `;

      card.addEventListener('click', () => {
        const toSelect = this.querySelector('#to-lang');
        const fromSelect = this.querySelector('#from-lang');

        const selectedToLang = toSelect.value;
        const selectedFromLang = fromSelect.value;
        // currentMode is defined in the closure above? No, it's local to connectedCallback.
        // We need to re-read it or make it accessible. Let's re-read from localStorage for simplicity and safety
        const selectedMode = localStorage.getItem('immergo_mode') || 'immergo_immersive';

        // Save preference
        localStorage.setItem('immergo_language', selectedToLang);
        localStorage.setItem('immergo_from_language', selectedFromLang);

        this.dispatchEvent(new CustomEvent('navigate', {
          bubbles: true,
          detail: {
            view: 'chat',
            mission: mission,
            language: selectedToLang,
            fromLanguage: selectedFromLang,
            mode: selectedMode
          }
        }));
      });

      listContainer.appendChild(card);
    });
  }
}

customElements.define('view-missions', ViewMissions);
