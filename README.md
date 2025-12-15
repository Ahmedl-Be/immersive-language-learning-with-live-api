# Immergo

Immergo is an immersive language learning application powered by the Google Gemini Live SDK. It simulates real-world roleplay scenarios (e.g., buying a bus ticket, ordering coffee) to help users practice speaking in various languages with an AI that acts as a native speaker.

## Features

-   **Missions & Roleplay**: Choose from structured scenarios with specific objectives.
-   **Learning Modes**:
    -   **Teacher Mode**: Get helpful explanations and translations in your native language.
    -   **Immersive Mode**: Strict "No Free Rides" policy where you must speak the target language to proceed.
-   **Native Language Support**: Select your native language for tailored feedback and assistance.
-   **Proactive AI Persona**: The AI adopts a specific role (e.g., "Bus Driver", "Friendly Neighbor").
-   **Real-time Multimodal Interaction**: Speak naturally with the AI, which responds with low-latency audio.
-   **Performance Scoring**: Get graded on your fluency (Tiro, Proficiens, Peritus) with actionable feedback (Immersive Mode).

## Tech Stack

-   **Frontend**: Vanilla JavaScript, Vite, Web Audio API, WebSocket.
-   **Backend**: Python, FastAPI, `google-genai` SDK.
-   **Communication**: WebSocket for full-duplex audio streaming.

## Prerequisites

-   Node.js (v18+)
-   Python (v3.10+)
-   Google Cloud Project with Vertex AI enabled.
-   Google Cloud Application Default Credentials configured.

## Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd immergo
```

### 2. Backend Setup
Create a virtual environment and install dependencies:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r server/requirements.txt
```

Create a `.env` file in the root directory:
```env
# Optional: Set specific project details if needed
# PROJECT_ID=your-google-cloud-project-id
# LOCATION=us-central1
```

### 3. Frontend Setup
Install Node dependencies:
```bash
npm install
```

## Running the Application

### Development (Recommended)
Run the frontend and backend separately for hot-reloading:

1.  **Frontend**:
    ```bash
    npm run dev
    ```
2.  **Backend**:
    ```bash
    python3 server/main.py
    ```
3.  Open the localhost URL provided by Vite (e.g., `http://localhost:5173`).

### Production Build
To serve the built frontend via the Python server:

1.  **Build**:
    ```bash
    npm run build
    ```
2.  **Run Server**:
    ```bash
    python3 server/main.py
    ```
3.  Access at `http://localhost:8000`.


