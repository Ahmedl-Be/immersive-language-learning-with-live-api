import './view-splash.js';
import './view-missions.js';
import './view-chat.js';
import './view-summary.js';
import './text-cycler.js';

class AppRoot extends HTMLElement {
    constructor() {
        super();
        this.state = {
            view: 'splash', // splash, missions, chat, summary
            selectedMission: null,
            selectedLanguage: null,
            sessionResult: null
        };
    }

    connectedCallback() {
        this.render();
        this.addEventListener('navigate', (e) => {
            this.state.view = e.detail.view;
            if (e.detail.mission) this.state.selectedMission = e.detail.mission;
            if (e.detail.language) this.state.selectedLanguage = e.detail.language;
            if (e.detail.fromLanguage) this.state.selectedFromLanguage = e.detail.fromLanguage;
            if (e.detail.mode) this.state.selectedMode = e.detail.mode;
            if (e.detail.result) this.state.sessionResult = e.detail.result;
            this.render();
        });
    }

    render() {
        this.innerHTML = '';
        let currentView;

        switch (this.state.view) {
            case 'splash':
                currentView = document.createElement('view-splash');
                break;
            case 'missions':
                currentView = document.createElement('view-missions');
                break;
            case 'chat':
                currentView = document.createElement('view-chat');
                currentView.mission = this.state.selectedMission;
                currentView.language = this.state.selectedLanguage;
                currentView.fromLanguage = this.state.selectedFromLanguage;
                currentView.mode = this.state.selectedMode;
                break;
            case 'summary':
                currentView = document.createElement('view-summary');
                currentView.result = this.state.sessionResult;
                break;
            default:
                currentView = document.createElement('view-splash');
        }

        currentView.classList.add('fade-in');
        this.appendChild(currentView);
    }
}

customElements.define('app-root', AppRoot);
