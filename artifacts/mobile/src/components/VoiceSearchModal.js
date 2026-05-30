import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Easing, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { aiCorrectVoiceQuery } from '../services/voiceCorrection';
import { LinearGradient } from 'expo-linear-gradient';

const LOGO_IMG = require('../logo.png');

export default function VoiceSearchModal({ visible, onClose, onSpeechResult }) {
  const { colors, shadows, isDark } = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [status, setStatus] = useState('idle'); // idle, listening, processing, done, error
  const [corrected, setCorrected] = useState('');
  const [language, setLanguage] = useState('en-US'); // en-US, ne-NP

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef(Array.from({ length: 6 }).map(() => new Animated.Value(8))).current;

  // Refs to avoid stale closures in event listener callbacks
  const recognitionRef = useRef(null);
  const statusRef = useRef('idle');
  const transcriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const isListeningRef = useRef(false);

  const updateStatus = (newStatus) => {
    setStatus(newStatus);
    statusRef.current = newStatus;
  };

  const updateTranscript = (text) => {
    setTranscript(text);
    transcriptRef.current = text;
  };

  const updateInterimTranscript = (text) => {
    setInterimTranscript(text);
    interimTranscriptRef.current = text;
  };

  const updateIsListening = (val) => {
    setIsListening(val);
    isListeningRef.current = val;
  };

  // Soundwave animation
  useEffect(() => {
    let animLoop;
    if (isListening) {
      const animateWave = () => {
        const animations = waveAnims.map((anim) =>
          Animated.sequence([
            Animated.timing(anim, {
              toValue: Math.random() * 40 + 8,
              duration: Math.random() * 150 + 150,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 8,
              duration: Math.random() * 150 + 150,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
          ])
        );
        animLoop = Animated.parallel(animations);
        animLoop.start(() => {
          if (isListeningRef.current) animateWave();
        });
      };
      animateWave();

      // Pulsate mic button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnims.forEach(anim => anim.setValue(8));
      if (animLoop) animLoop.stop();
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isListening]);

  // Clean state and auto start listening when modal opens/closes or language changes
  useEffect(() => {
    if (visible) {
      updateTranscript('');
      updateInterimTranscript('');
      setCorrected('');
      updateStatus('idle');
      updateIsListening(false);
      
      // Auto start listening after modal transition animation
      const timer = setTimeout(() => {
        startListening();
      }, 350);
      return () => clearTimeout(timer);
    } else {
      stopListening(false);
    }
  }, [visible, language]);

  // Initialize Speech Recognition
  const startListening = () => {
    updateTranscript('');
    updateInterimTranscript('');
    setCorrected('');
    updateStatus('idle');
    updateIsListening(false);
    
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = language;
        
        rec.onstart = () => {
          updateIsListening(true);
          updateStatus('listening');
        };
        
        rec.onresult = (e) => {
          let interim = '';
          let final = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) {
              final += e.results[i][0].transcript;
            } else {
              interim += e.results[i][0].transcript;
            }
          }
          if (final) {
            updateTranscript(final);
          }
          updateInterimTranscript(interim);
        };
        
        rec.onerror = (e) => {
          console.warn('Speech error:', e.error);
          updateStatus('error');
          updateIsListening(false);
        };
        
        rec.onend = () => {
          updateIsListening(false);
          // If the speech recognition naturally timed out or stopped because speaker paused,
          // and we have successfully captured a transcript, automatically submit it!
          const textToProcess = transcriptRef.current || interimTranscriptRef.current;
          if (textToProcess && statusRef.current === 'listening') {
            processResult(textToProcess);
          } else if (statusRef.current === 'listening') {
            updateStatus('idle');
          }
        };
        
        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
        startSimulation();
      }
    } else {
      // Fallback: Simulate voice recognition since Web Speech is not supported or not web platform
      startSimulation();
    }
  };

  const stopListening = (shouldSubmit = true) => {
    updateIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    
    if (shouldSubmit) {
      const textToProcess = transcriptRef.current || interimTranscriptRef.current;
      if (textToProcess && textToProcess !== 'Simulating voice input...') {
        processResult(textToProcess);
      } else if (statusRef.current === 'listening') {
        updateStatus('idle');
      }
    } else {
      updateStatus('idle');
    }
  };

  // Simulate dictation in platforms where Web Speech is unavailable
  const startSimulation = () => {
    updateIsListening(true);
    updateStatus('listening');
    updateTranscript('Simulating voice input...');
    
    // Select a random search phrase based on Nepali/English preference
    const examples = language === 'ne-NP' 
      ? ['ghar safa garne', 'dhara bat pani ayena', 'ac bigryo batti short bhayo', 'kotha rang lagauna parne']
      : ['room cleaning services', 'need professional plumber', 'electrician for short circuit', 'beauty salon service'];
      
    const randomPhrase = examples[Math.floor(Math.random() * examples.length)];
    
    // Simulate words typing in slowly
    let currentText = '';
    const words = randomPhrase.split(' ');
    let wordIdx = 0;
    
    const interval = setInterval(() => {
      if (wordIdx < words.length) {
        currentText += (wordIdx === 0 ? '' : ' ') + words[wordIdx];
        updateInterimTranscript(currentText);
        wordIdx++;
      } else {
        clearInterval(interval);
        updateIsListening(false);
        updateTranscript(randomPhrase);
        processResult(randomPhrase);
      }
    }, 600);
    
    recognitionRef.current = { stop: () => { clearInterval(interval); } };
  };

  // Run AI Correction on query result
  const processResult = async (rawText) => {
    if (!rawText || rawText === 'Simulating voice input...') return;

    updateStatus('processing');
    try {
      const correctedText = await aiCorrectVoiceQuery(rawText);
      setCorrected(correctedText);
      updateStatus('done');
      
      // Auto-submit after delay
      setTimeout(() => {
        onSpeechResult(correctedText);
        onClose();
      }, 1500);
    } catch (e) {
      setCorrected(rawText);
      updateStatus('done');
      setTimeout(() => {
        onSpeechResult(rawText);
        onClose();
      }, 1500);
    }
  };

  const selectSuggestion = (phrase) => {
    setTranscript(phrase);
    processResult(phrase);
  };

  const suggestions = language === 'ne-NP'
    ? [
        { label: 'Cleaning', phrase: 'kotha safa garne' },
        { label: 'Plumbing', phrase: 'dhara banaune plumber' },
        { label: 'AC Repair', phrase: 'air conditioner bigryo' },
        { label: 'Electrician', phrase: 'wire check garne batti' },
      ]
    : [
        { label: 'Deep Cleaning', phrase: 'room cleaning service' },
        { label: 'Call Plumber', phrase: 'plumbing leak repair' },
        { label: 'AC Service', phrase: 'ac cooling repair' },
        { label: 'Home Salon', phrase: 'hair cut salon' },
      ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }, shadows.lg]}>
          
          {/* Header Controls */}
          <View style={styles.header}>
            {/* Language Switcher */}
            <View style={[styles.langToggleWrap, { backgroundColor: colors.surfaceAlt }]}>
              <TouchableOpacity 
                style={[styles.langBtn, language === 'en-US' && { backgroundColor: colors.primary }]}
                onPress={() => setLanguage('en-US')}
              >
                <Text style={[styles.langText, { color: language === 'en-US' ? '#fff' : colors.textSecondary }]}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.langBtn, language === 'ne-NP' && { backgroundColor: colors.primary }]}
                onPress={() => setLanguage('ne-NP')}
              >
                <Text style={[styles.langText, { color: language === 'ne-NP' ? '#fff' : colors.textSecondary }]}>NEP</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Assistant Logo */}
          <View style={styles.assistantLogoArea}>
            <View style={styles.logoBadge}>
              <Image source={LOGO_IMG} style={styles.logoImg} resizeMode="contain" />
            </View>
            <Text style={[styles.logoTitle, { color: colors.text }]}>OrderMe Voice Search</Text>
            <Text style={[styles.logoSubtitle, { color: colors.textSecondary }]}>
              {language === 'ne-NP' ? 'नेपालीमा बोल्नुहोस्' : 'Speak clearly in English or Nepali'}
            </Text>
          </View>

          {/* Transcript Area */}
          <View style={[styles.transcriptArea, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            {status === 'idle' && (
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>Tap the microphone to start speaking...</Text>
            )}
            {status === 'listening' && (
              <View>
                <Text style={[styles.listeningText, { color: colors.primary }]}>Listening...</Text>
                <Text style={[styles.voiceInputText, { color: colors.text }]}>
                  {interimTranscript || '...'}
                </Text>
              </View>
            )}
            {status === 'processing' && (
              <View style={styles.loadingRow}>
                <Ionicons name="sparkles" size={16} color={colors.primary} style={styles.rotate} />
                <Text style={[styles.statusText, { color: colors.primary }]}>AI Correcting speech transcript...</Text>
              </View>
            )}
            {status === 'done' && (
              <View>
                <Text style={[styles.originalSpeech, { color: colors.textLight }]}>Spoken: "{transcript || interimTranscript}"</Text>
                <View style={styles.correctedRow}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                  <Text style={[styles.correctedText, { color: colors.text }]}>
                    Search term: <Text style={{ fontWeight: '800', color: colors.primary }}>{corrected}</Text>
                  </Text>
                </View>
              </View>
            )}
            {status === 'error' && (
              <Text style={[styles.errorText, { color: colors.danger }]}>Oops! Speech recognition failed. Please try again.</Text>
            )}
          </View>

          {/* Animated soundwaves */}
          {isListening && (
            <View style={styles.soundwave}>
              {waveAnims.map((anim, idx) => (
                <Animated.View
                  key={idx}
                  style={[
                    styles.waveBar,
                    {
                      height: anim,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Mic Button and Animation rings */}
          <View style={styles.micContainer}>
            {isListening && (
              <Animated.View
                style={[
                  styles.micRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    borderColor: colors.primary + '35',
                  },
                ]}
              />
            )}
            <TouchableOpacity
              onPress={isListening ? () => stopListening(true) : startListening}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isListening ? ['#ef4444', '#b91c1c'] : [colors.primary, colors.primaryDark]}
                style={styles.micBtn}
              >
                <Ionicons name={isListening ? 'stop' : 'mic'} size={32} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Selectable prompts for Nepalese users */}
          <View style={styles.promptsSection}>
            <Text style={[styles.promptsTitle, { color: colors.textSecondary }]}>Or choose a sample query:</Text>
            <View style={styles.chipsWrap}>
              {suggestions.map((s, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.promptChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  onPress={() => selectSuggestion(s.phrase)}
                >
                  <Text style={[styles.promptChipText, { color: colors.text }]}>{s.label}</Text>
                  <Text style={[styles.promptChipSub, { color: colors.textSecondary }]}>"{s.phrase}"</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  langToggleWrap: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 2,
  },
  langBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  assistantLogoArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  logoImg: {
    width: 56,
    height: 56,
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  logoSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  transcriptArea: {
    width: '100%',
    minHeight: 80,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  listeningText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: 'center',
  },
  voiceInputText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  originalSpeech: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
    textAlign: 'center',
  },
  correctedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  correctedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  soundwave: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    gap: 5,
    marginBottom: 16,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  micContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  micRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
  micBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  promptsSection: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.25)',
    paddingTop: 16,
  },
  promptsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  promptChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  promptChipSub: {
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 1,
  },
  rotate: {
    // Rotation handled simply by icon choice, but icon itself gives premium sparkles vibe
  }
});
