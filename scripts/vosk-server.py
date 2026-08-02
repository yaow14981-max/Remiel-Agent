"""Vosk ASR HTTP server for Remiel-Agent.
Usage: python scripts/vosk-server.py <model_path> [port]
Default port: 2700
"""
import sys
import json
import os
import atexit
from flask import Flask, request, jsonify

app = Flask(__name__)
model = None
recognizer = None

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": model is not None})

@app.route("/recognize", methods=["POST"])
def recognize():
    """Accept PCM 16kHz mono int16 audio, return {partial, final}."""
    global recognizer
    try:
        pcm = request.data
        if len(pcm) == 0:
            return jsonify({"partial": "", "final": ""})
        # Accept waveform
        has_final = recognizer.AcceptWaveform(pcm)
        if has_final:
            result = json.loads(recognizer.Result())
            final_text = result.get("text", "")
            # Reset for next utterance
            recognizer = vosk.KaldiRecognizer(model, 16000)
            return jsonify({"partial": "", "final": final_text})
        else:
            partial = json.loads(recognizer.PartialResult())
            return jsonify({"partial": partial.get("partial", ""), "final": ""})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/reset", methods=["POST"])
def reset():
    global recognizer
    recognizer = vosk.KaldiRecognizer(model, 16000)
    return jsonify({"ok": True})

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/vosk-server.py <model_path> [port]")
        print("Example: python scripts/vosk-server.py C:/Users/29633/vosk-model/vosk-model-cn-0.22")
        sys.exit(1)

    model_path = sys.argv[1]
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 2700

    print(f"Loading Vosk model from: {model_path}")
    import vosk
    vosk.SetLogLevel(-1)
    model = vosk.Model(model_path)
    recognizer = vosk.KaldiRecognizer(model, 16000)
    print(f"Model loaded, starting server on port {port}")

    atexit.register(lambda: model.free() if model else None)
    app.run(host="127.0.0.1", port=port, debug=False)
