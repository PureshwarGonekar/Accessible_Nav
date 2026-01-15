import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

const VoiceInput = ({ onSpeechDetected, placeholder = "Listening..." }) => {
    const [isListening, setIsListening] = useState(false);
    const [supportEffect, setSupportEffect] = useState(false);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn("Speech Recognition not supported in this browser.");
            return;
        }
    }, []);

    const toggleListen = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setSupportEffect(true);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onSpeechDetected(transcript);
            setIsListening(false);
            setSupportEffect(false);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
            setSupportEffect(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            setSupportEffect(false);
        };

        recognition.start();
    };

    const stopListening = () => {
        // Usually auto-stops, but we can force state reset
        setIsListening(false);
    };

    return (
        <button
            type="button"
            onClick={toggleListen}
            title="Voice Search"
            style={{
                background: isListening ? 'hsl(var(--danger))' : 'rgba(128,128,128,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                animation: isListening ? 'pulse 1.5s infinite' : 'none'
            }}
        >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
    );
};

export default VoiceInput;
