import './audio-visualizer.js';
import { GeminiLiveAPI, MultimodalLiveResponseType, FunctionCallDefinition } from '../lib/gemini-live/geminilive.js';
import { AudioStreamer, AudioPlayer } from '../lib/gemini-live/mediaUtils.js';

class ViewChat extends HTMLElement {
    constructor() {
        super();
        this._mission = null;
    }

    set mission(value) {
        this._mission = value;
        this.render();
    }

    set language(value) {
        this._language = value;
    }

    set fromLanguage(value) {
        this._fromLanguage = value;
    }

    set mode(value) {
        this._mode = value;
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {
        if (this.audioStreamer) this.audioStreamer.stop();
        if (this.client) this.client.disconnect();
    }

    render() {
        if (!this._mission) return; // Wait for mission prop

        this.innerHTML = `
      <div class="container" style="justify-content: space-between;">
        
        <div style="margin-top: var(--spacing-xl); text-align: center;">
          <h2 style="font-size: 1.5rem; margin-bottom: var(--spacing-xs);">${this._mission.target_role || 'Target Person'}</h2>
          <div style="
            background: rgba(var(--color-accent-secondary-rgb), 0.1); 
            border: 1px solid var(--color-accent-secondary);
            border-radius: var(--radius-lg);
            padding: var(--spacing-md) var(--spacing-lg);
            display: inline-block;
            margin-top: var(--spacing-md);
            max-width: 800px;
          ">
            <p style="font-size: 1.2rem; font-weight: bold; color: var(--color-accent-secondary); margin: 0;">${this._mission.title}</p>
            <p style="font-size: 1rem; opacity: 0.9; margin-top: 4px;">${this._mission.desc}</p>
          </div>
          ${this._mode === 'immergo_teacher' ? `
          <div style="margin-top: var(--spacing-lg); opacity: 0.8; font-size: 0.9rem; background: #e8f5e9; color: #2e7d32; padding: 8px 16px; border-radius: var(--radius-full); display: inline-flex; align-items: center; gap: 6px;">
            <span>You can ask for <strong>translations</strong> & <strong>explanations</strong> in ${this._fromLanguage || 'your language'} at any time.</span>
          </div>
          ` : ''}
        </div>

        <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
          <audio-visualizer></audio-visualizer>
        </div>

        <div style="margin-bottom: var(--spacing-xxl); display: flex; flex-direction: column; gap: var(--spacing-lg); align-items: center;">
           
           <button id="mic-btn" style="
            background: var(--color-accent-primary);
            color: white;
            padding: var(--spacing-lg) var(--spacing-xl);
            border-radius: var(--radius-full);
            width: auto; height: auto;
            min-width: 200px;
            box-shadow: var(--shadow-md);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            z-index: 2;
            transition: all 0.3s ease;
          ">
            <span style="font-size: 1.2rem; font-weight: bold; margin-bottom: 4px;">Start Mission</span>
            <span style="font-size: 0.8rem; opacity: 0.9;">You start the conversation!</span>
          </button>

             <button id="end-btn" style="
            background: transparent;
            color: var(--color-danger);
            padding: var(--spacing-sm);
            margin-top: var(--spacing-lg);
            width: auto; height: auto;
            font-size: 0.9rem;
            opacity: 0.8;
            display: flex; align-items: center; gap: 4px;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
            End Session
          </button>
       
        </div>

        <!-- Confirmation Dialog -->
        <div id="confirm-dialog" class="hidden" style="
            position: fixed; inset: 0; 
            background: rgba(255,255,255,0.9); 
            backdrop-filter: blur(4px);
            z-index: 10;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
        ">
            <div style="text-align: center; padding: var(--spacing-lg);">
                <h3 style="margin-bottom: var(--spacing-md);">End Session?</h3>
                <p style="margin-bottom: var(--spacing-lg);">Are you sure you want to stop?</p>
                <div style="display: flex; gap: var(--spacing-md);">
                    <button id="cancel-end" style="
                        padding: var(--spacing-sm) var(--spacing-lg);
                        border: 1px solid var(--color-text-sub);
                        border-radius: var(--radius-full);
                        background: transparent;
                    ">Cancel</button>
                    <button id="confirm-end" style="
                        padding: var(--spacing-sm) var(--spacing-lg);
                        background: var(--color-danger);
                        color: white;
                        border-radius: var(--radius-full);
                    ">End Session</button>
                </div>
            </div>
        </div>

      </div>
    `;

        const endBtn = this.querySelector('#end-btn');
        const confirmDialog = this.querySelector('#confirm-dialog');
        const cancelEndBtn = this.querySelector('#cancel-end');
        const confirmEndBtn = this.querySelector('#confirm-end');

        // Show confirmation
        endBtn.addEventListener('click', () => {
            confirmDialog.classList.remove('hidden');
            // Use flex because 'hidden' sets display: none in style.css, but we want flex centered
            confirmDialog.style.display = 'flex';
        });

        // Cancel
        cancelEndBtn.addEventListener('click', () => {
            confirmDialog.classList.add('hidden');
            confirmDialog.style.display = 'none';
        });

        // Helper to perform navigation
        const doEndSession = () => {
            // Cleanup Gemini session
            if (this.audioStreamer) this.audioStreamer.stop();
            if (this.client) this.client.disconnect();
            if (this.audioPlayer) this.audioPlayer.interrupt(); // Stop playback
            console.log("👋 [App] Session ended by user");

            // Incomplete session
            const result = {
                incomplete: true
            };

            this.dispatchEvent(new CustomEvent('navigate', {
                bubbles: true,
                detail: { view: 'summary', result: result }
            }));
        };

        // Confirm
        confirmEndBtn.addEventListener('click', doEndSession);

        // Animate visualizer on click
        const viz = this.querySelector('audio-visualizer');
        const micBtn = this.querySelector('#mic-btn');
        let isSpeaking = false;

        // Initialize Gemini Live
        this.client = new GeminiLiveAPI();
        this.audioStreamer = new AudioStreamer(this.client);
        this.audioPlayer = new AudioPlayer();

        // Define Mission Complete Tool
        const completeMissionTool = new FunctionCallDefinition(
            "complete_mission",
            "Call this tool when the user has successfully completed the mission objective. Provide a score and feedback.",
            {
                type: "OBJECT",
                properties: {
                    score: {
                        type: "INTEGER",
                        description: "Rating from 1 to 3 based on performance: 1 (Tiro) = Struggled, used frequent English, or needed many hints. 2 (Proficiens) = Good, intelligible but with errors or hesitation. 3 (Peritus) = Excellent, fluent, native-like, no help needed."
                    },
                    feedback_pointers: {
                        type: "ARRAY",
                        items: { type: "STRING" },
                        description: "List of 3 constructive feedback points or compliments in English."
                    }
                },
                required: ["score", "feedback_pointers"]
            },
            ["score", "feedback_pointers"]
        );

        completeMissionTool.functionToCall = (args) => {
            console.log("🏆 [App] Mission Complete Tool Triggered!", args);

            // Map score to level
            const levels = { 1: 'Tiro', 2: 'Proficiens', 3: 'Peritus' };
            const level = levels[args.score] || 'Proficiens';

            console.log("⏳ [App] Waiting for final audio to play before ending session...");

            // Delay cleanup to allow the agent's congratulatory message to be heard
            setTimeout(() => {
                // Cleanup
                if (this.audioStreamer) this.audioStreamer.stop();
                if (this.client) this.client.disconnect();
                if (this.audioPlayer) this.audioPlayer.interrupt();

                // Navigate to summary
                const result = {
                    score: args.score.toString(),
                    level: level,
                    notes: args.feedback_pointers
                };

                this.dispatchEvent(new CustomEvent('navigate', {
                    bubbles: true,
                    detail: { view: 'summary', result: result }
                }));
            }, 5000); // 5 seconds delay
        };

        this.client.addFunction(completeMissionTool);

        // Setup client callbacks for logging
        this.client.onConnectionStarted = () => {
            console.log("🚀 [Gemini] Connection started");
        };

        this.client.onOpen = () => {
            console.log("🔓 [Gemini] WebSocket connection opened");
        };

        this.client.onReceiveResponse = (response) => {
            console.log("📥 [Gemini] Received response:", response.type);
            if (response.type === MultimodalLiveResponseType.AUDIO) {
                this.audioPlayer.play(response.data);
            } else if (response.type === MultimodalLiveResponseType.TURN_COMPLETE) {
                console.log("✅ [Gemini] Turn complete");
            } else if (response.type === MultimodalLiveResponseType.TOOL_CALL) {
                console.log("🛠️ [Gemini] Tool Call received:", response.data);
                if (response.data.functionCalls) {
                    response.data.functionCalls.forEach(fc => {
                        this.client.callFunction(fc.name, fc.args);
                    });
                }
            }
        };

        this.client.onError = (error) => {
            console.error("❌ [Gemini] Error:", error);
        };

        this.client.onClose = () => {
            console.log("🔒 [Gemini] Connection closed");
        };

        micBtn.addEventListener('click', async () => {
            isSpeaking = !isSpeaking;
            micBtn.style.background = isSpeaking ? '#2c2c2c' : 'var(--color-accent-primary)';

            if (isSpeaking) {
                // Change to Stop/Listening state
                micBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    <span style="margin-left: 8px;">Pause Session</span>
                `;
                micBtn.style.flexDirection = 'row';
            } else {
                // Revert to Start state
                micBtn.innerHTML = `
                    <span style="font-size: 1.2rem; font-weight: bold; margin-bottom: 4px;">Start Mission</span>
                    <span style="font-size: 0.8rem; opacity: 0.9;">You start the conversation!</span>
                `;
                micBtn.style.flexDirection = 'column';
            }

            if (isSpeaking) {
                console.log("🎙️ [App] Microphone button clicked: Starting session...");
                viz.setActive(true);

                try {

                    // 0. Configure System Instructions
                    const language = this._language || "French";
                    const fromLanguage = this._fromLanguage || "English";
                    const mode = this._mode || "immergo_immersive";
                    const missionTitle = this._mission ? this._mission.title : "General Conversation";
                    const missionDesc = this._mission ? this._mission.desc : "";
                    const targetRole = this._mission ? (this._mission.target_role || "a local native speaker") : "a conversational partner";

                    let systemInstruction = "";

                    if (mode === 'immergo_teacher') {
                        // Teacher Mode Prompt
                        systemInstruction = `
ROLEPLAY INSTRUCTION:
You are acting as **${targetRole}**, a native speaker of ${language}.
The user is a language learner (native speaker of ${fromLanguage}) trying to: "${missionTitle}" (${missionDesc}).
Your goal is to be a HELPFUL TEACHER while playing your role (${targetRole}).

INTERACTION GUIDELINES:
1. Act as the person, but if the user struggles, friendly explains options in their native language (${fromLanguage}).
2. It's okay for the user to ask questions in ${fromLanguage}. Answer them helpfully.
3. Encourage the user to speak ${language}, but do not force them if they are asking for clarity.
4. Utilising the proactive audio feature, do not respond until it is necessary.

MISSION COMPLETION:
When the user has successfully achieved the mission objective declared in the scenario:
1. Speak a brief congratulatory message and sound happy for their progress.
2. THEN call the "complete_mission" tool.
3. IMPORTANT: Set 'score' to 0 (Zero) to indicate this was a practice session.
4. Provide 3 helpful tips or vocabulary words they learned in the feedback list (in ${fromLanguage}).
`;
                    } else {
                        // Immersive Mode Prompt (Default)
                        systemInstruction = `
ROLEPLAY INSTRUCTION:
You are acting as **${targetRole}**, a native speaker of ${language}.
The user is a language learner (native speaker of ${fromLanguage}) trying to: "${missionTitle}" (${missionDesc}).
Your goal is to play your role (${targetRole}) naturally. Do not act as an AI assistant. Act as the person.

INTERACTION GUIDELINES:
1. It is up to you if you want to directly speak back, or speak out what you think the user is saying in your native language before responding.
2. Utilising the proactive audio feature, do not respond until it is necessary (i.e. the user has finished their turn).
3. Be helpful but strict about language practice. It is just like speaking to a multilingual person.
4. You cannot proceed without the user speaking the target language (${language}) themselves.
5. If you need to give feedback, corrections, or translations, use the user's native language (${fromLanguage}).

NO FREE RIDES POLICY:
If the user asks for help in ${fromLanguage} (e.g., "please can you repeat"), you MUST NOT simply answer.
Instead, force them to say the phrase in the target language (${language}).
For example, say: "You mean to say [Insert Translation in ${language}]" (provided in ${fromLanguage}) and wait for them to repeat it.
Do not continue the conversation until they attempt the phrase in ${language}.

MISSION COMPLETION:
When the user has successfully achieved the mission objective declared in the scenario:
1. Speak a brief congratulatory message (in character) and say goodbye.
2. THEN call the "complete_mission" tool.
3. Assign a score based on strict criteria: 1 for struggling/English reliance (Tiro), 2 for capable but imperfect (Proficiens), 3 for native-level fluency (Peritus).
4. Provide 3 specific pointers or compliments in the feedback list (in the user's native language: ${fromLanguage}).
`;
                    }

                    console.log("📝 [App] Setting system instructions for", language, "Mode:", mode);
                    this.client.setSystemInstructions(systemInstruction);

                    // 1. Connect to WebSocket
                    console.log("🔌 [App] Connecting to backend...");
                    await this.client.connect();

                    // 2. Start Audio Stream
                    console.log("🎤 [App] Starting audio stream...");
                    await this.audioStreamer.start();

                    // 3. Initialize Audio Player
                    console.log("🔊 [App] Initializing audio player...");
                    await this.audioPlayer.init();

                    console.log("✨ [App] Session active!");

                } catch (err) {
                    console.error("❌ [App] Failed to start session:", err);
                    isSpeaking = false;
                    micBtn.style.background = 'var(--color-accent-primary)';
                    viz.setActive(false);
                }

            } else {
                console.log("🛑 [App] Microphone button clicked: Stopping session...");
                viz.setActive(false);

                // Stop everything
                this.audioStreamer.stop();
                this.client.disconnect();
                // AudioPlayer doesn't strictly need stopping but good to know
                console.log("👋 [App] Session ended");
            }
        });
    }
}

customElements.define('view-chat', ViewChat);
