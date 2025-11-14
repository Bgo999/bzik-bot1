import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Play, Square, Upload, Volume2 } from "lucide-react";
import { BzikCharacter } from "./BzikCharacter";

interface VoiceCloningProps {
  onVoiceLearned?: (voiceData: any) => void;
}

export const VoiceCloning: React.FC<VoiceCloningProps> = ({ onVoiceLearned }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [clonedVoice, setClonedVoice] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      console.log("🎤 Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false 
        } 
      });
      console.log("✅ Microphone access granted");
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordedAudio(audioBlob);
        processVoice(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Progress simulation
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 2;
        setRecordingProgress(progress);
        if (progress >= 100) {
          clearInterval(progressInterval);
          mediaRecorder.stop();
          setIsRecording(false);
          setRecordingProgress(0);
        }
      }, 200);

    } catch (error: any) {
      console.error('❌ Error starting recording:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      // Provide user feedback based on error type
      if (error.name === 'NotAllowedError') {
        alert('🔒 Microphone permission denied. Please allow microphone access to use voice cloning.');
      } else if (error.name === 'NotFoundError') {
        alert('🔍 No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotReadableError') {
        alert('⚠️ Microphone is in use by another application. Please close that application and try again.');
      } else if (error.name === 'SecurityError') {
        alert('🔐 Microphone access requires HTTPS. Please use a secure connection.');
      } else {
        alert('Microphone access denied. Please allow microphone access to use voice cloning.');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingProgress(0);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, [isRecording]);

  const processVoice = async (audioBlob: Blob) => {
    setIsProcessing(true);

    // Simulate voice processing (in real implementation, this would send to ML API)
    setTimeout(() => {
      const mockVoiceData = {
        id: 'user_voice_' + Date.now(),
        name: 'Your Voice',
        sampleRate: 44100,
        characteristics: {
          pitch: Math.random() * 0.5 + 0.75,
          speed: Math.random() * 0.3 + 0.85,
          tone: 'neutral'
        },
        createdAt: new Date().toISOString()
      };

      setClonedVoice(mockVoiceData);
      setIsProcessing(false);

      if (onVoiceLearned) {
        onVoiceLearned(mockVoiceData);
      }
    }, 3000);
  };

  const playSample = useCallback(() => {
    if (!clonedVoice) return;

    setIsPlaying(true);

    // Generate a sample using the cloned voice characteristics
    const utterance = new SpeechSynthesisUtterance(
      "Hello! This is your cloned voice speaking. I can now talk just like you!"
    );

    // Apply voice characteristics
    utterance.rate = clonedVoice.characteristics.speed;
    utterance.pitch = clonedVoice.characteristics.pitch;

    // Try to find a similar voice
    const voices = speechSynthesis.getVoices();
    const similarVoice = voices.find(v =>
      v.lang.includes('en') &&
      (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('male'))
    );

    if (similarVoice) {
      utterance.voice = similarVoice;
    }

    utterance.onend = () => setIsPlaying(false);
    speechSynthesis.speak(utterance);
  }, [clonedVoice]);

  const uploadAudio = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setRecordedAudio(file);
      processVoice(file);
    }
  }, []);

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Voice Cloning <span className="gradient-text">Technology</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Train Bzik to speak with your exact voice. Record a sample and watch the AI learn your unique speech patterns.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Recording Section */}
          <Card className="p-8 gradient-card">
            <div className="text-center space-y-6">
              <h3 className="text-2xl font-bold">Record Your Voice</h3>
              <p className="text-muted-foreground">
                Record 5-10 seconds of clear speech for best results
              </p>

              <div className="flex justify-center items-center gap-4">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Stop Recording
                  </Button>
                )}

                <div className="text-center">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={uploadAudio}
                    className="hidden"
                    id="audio-upload"
                  />
                  <label htmlFor="audio-upload">
                    <Button variant="outline" size="lg" asChild>
                      <span>
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Audio
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              {isRecording && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-500 font-medium">Recording...</span>
                  </div>
                  <Progress value={recordingProgress} className="w-64 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Speak clearly: "Hello, I am training my AI voice clone."
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-blue-500 font-medium">Processing Voice...</span>
                  </div>
                  <Progress value={75} className="w-64 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing speech patterns, pitch, and tone...
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Results Section */}
          {clonedVoice && (
            <Card className="p-8 gradient-card">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <BzikCharacter size="medium" mood="excited" />
                  <div>
                    <h3 className="text-2xl font-bold">Voice Clone Complete!</h3>
                    <p className="text-muted-foreground">Your voice has been successfully cloned</p>
                  </div>
                </div>

                <div className="bg-muted p-6 rounded-lg">
                  <h4 className="font-semibold mb-2">Voice Characteristics:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Pitch: {(clonedVoice.characteristics.pitch * 100).toFixed(0)}%</div>
                    <div>Speed: {(clonedVoice.characteristics.speed * 100).toFixed(0)}%</div>
                    <div>Tone: {clonedVoice.characteristics.tone}</div>
                    <div>Sample Rate: {clonedVoice.sampleRate}Hz</div>
                  </div>
                </div>

                <Button
                  onClick={playSample}
                  size="lg"
                  disabled={isPlaying}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-5 h-5 mr-2" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5 mr-2" />
                      Test Your Cloned Voice
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground">
                  <p>⚠️ This is a demonstration. Full voice cloning requires advanced AI models and processing.</p>
                  <p>In production, this would integrate with services like ElevenLabs, Respeecher, or custom ML models.</p>
                </div>
              </div>
            </Card>
          )}

          {/* Technical Info */}
          <Card className="p-6 bg-muted/50">
            <h4 className="font-semibold mb-4">How Voice Cloning Works:</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><strong>1. Audio Capture:</strong> Record or upload clear voice samples (5-30 seconds)</p>
              <p><strong>2. Feature Extraction:</strong> Analyze pitch, tone, speed, and speech patterns</p>
              <p><strong>3. Model Training:</strong> Use machine learning to create voice synthesis model</p>
              <p><strong>4. Voice Generation:</strong> Synthesize speech that matches your voice characteristics</p>
            </div>

            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <h5 className="font-semibold text-primary mb-2">Production Implementation:</h5>
              <ul className="text-sm space-y-1">
                <li>• ElevenLabs API for high-quality voice cloning</li>
                <li>• Respeecher for enterprise voice solutions</li>
                <li>• Custom ML models (Tacotron, WaveNet, etc.)</li>
                <li>• Real-time voice conversion for live conversations</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
