import React, { useState } from 'react';
import { Container } from 'reactstrap';
import { getTokenOrRefresh } from './token_util';
import './custom.css';
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk');

export default function App() {
    const [player, updatePlayer] = useState({p: undefined, muted: false});

    async function sttFromMic() {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'en-US';

        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);


        recognizer.recognizeOnceAsync(result => {
            if (result.reason === ResultReason.RecognizedSpeech) {
                window.botpressWebChat.sendPayload({
                    type: 'trigger',
                    payload: { sttquestion: result.text }
                });
                window.botpressWebChat.onEvent(event => {
                    if (event.type === 'TRIGGER' && event.value.textToSpeak) {
                        textToSpeech(event.value.textToSpeak);
                    }
                }, ['TRIGGER']);
            } else {
                window.botpressWebChat.sendPayload({
                    type: 'trigger',
                    payload: { sttquestion:'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.' }
                });
            }
        });
    }

    async function textToSpeech(textToSpeak) {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        const myPlayer = new speechsdk.SpeakerAudioDestination();
        updatePlayer(p => {p.p = myPlayer; return p;});
        const audioConfig = speechsdk.AudioConfig.fromSpeakerOutput(player.p);

        let synthesizer = new speechsdk.SpeechSynthesizer(speechConfig, audioConfig);

        synthesizer.speakTextAsync(
        textToSpeak,
        result => {
            let text;
            if (result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted) {
                text = `synthesis finished for "${textToSpeak}".\n`
            } else if (result.reason === speechsdk.ResultReason.Canceled) {
                text = `synthesis failed. Error detail: ${result.errorDetails}.\n`
            }
            synthesizer.close();
            synthesizer = undefined;
        },
        function (err) {

            synthesizer.close();
            synthesizer = undefined;
        });
    }

    

    return (
        <Container className="app-container">
        
        <button class="thq-button-filled btn-microphone" onClick={() => sttFromMic()}><i className="fas fa-microphone fa-lg mr-2" ></i></button>

        </Container>
    );
}
