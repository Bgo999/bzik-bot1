# Quick Testing Checklist - Voice System

## ✅ Pre-Test Verification

- [x] Build succeeded (npm run build)
- [x] No TypeScript errors
- [x] All fixes applied to InteractiveDemo.tsx
- [x] Code compiled to dist/ folder

---

## 🧪 Manual Testing Steps

### Step 1: Start Development Server
```bash
cd "c:\My Web Sites\Bzik.bot\bzik-clever-buddy-site-main"
npm run dev
```
- Expected: Server starts on http://localhost:8080
- Expected: Backend API available at http://127.0.0.1:5000

### Step 2: Open Browser & Access Chat
- **URL**: http://localhost:8080
- **Action**: Wait for page to load completely
- **Expected**: Bzik character visible, chat interface ready

### Step 3: Open Browser Console
- **Shortcut**: F12 (or right-click → Inspect)
- **Tab**: Console
- **Action**: Clear any existing logs (Command/Ctrl+L)

### Step 4: Test TTS Output (CRITICAL)
- **Action**: Type "Hello" in chat input
- **Send**: Click send or press Enter
- **Expected Sound**: AI responds with voice (female voice at slightly faster speed)
- **Expected Console**: 
  ```
  🔊 speakText called with: [AI response text]
  ℹ️ No voices available, waiting...
  🔊 Using voice: Microsoft Zoe Desktop - English (United States)
  🔊 TTS started
  🔊 Stopped recognition for TTS
  🔊 TTS finished
  ```
- **Result**: ✅ PASS / ❌ FAIL

### Step 5: Test Recognition Restart
- **Expected**: After AI finishes speaking, waveform/mic indicator should appear
- **Expected Console**: 
  ```
  🔄 Restarting recognition after TTS
  🔄 Starting recognition...
  ```
- **Result**: ✅ PASS / ❌ FAIL

### Step 6: Test Continuous Conversation
- **Action**: Say or type another message while mic is listening
- **Examples**:
  - "How are you?"
  - "What can you do?"
  - "Tell me about yourself"
- **Expected**: AI responds again with voice
- **Expected**: Waveform appears again after response
- **Result**: ✅ PASS / ❌ FAIL

### Step 7: Test 30-Second Idle Timeout (Optional)
- **Action**: Say/type a message, AI responds, then do nothing for 30 seconds
- **Expected (at ~30s)**: AI says "May I go?"
- **Expected Console**: 
  ```
  ⏰ [idle timer messages]
  ```
- **Action**: Do nothing for another 5 seconds
- **Expected (at ~35s)**: AI says "Goodbye — see you later" and session ends
- **Result**: ✅ PASS / ❌ FAIL

### Step 8: Test No Listening Indicator During Speech
- **Action**: Send a message and listen to response
- **During AI Speech**: Waveform should NOT be visible/active
- **After AI Finishes**: Waveform should return
- **Result**: ✅ PASS / ❌ FAIL

---

## ❌ Troubleshooting

### Problem: No Audio Output (🔊 Critical Issue)
**Symptoms**: Message sent → AI responds but no sound, chat shows response text

**Check These**:
1. Browser volume is ON
2. System volume is ON
3. Browser console shows 🔊 messages
4. No 🔊 error messages
5. Look for "TTS error:" in console

**Fixes to Try**:
- Refresh page (F5)
- Check if browser supports Web Speech API
- Try Chrome or Edge
- Check if microphone permission was granted

**If Still Failing**: 
- Check `synthRef.current` exists in console: `window.speechSynthesis ? 'EXISTS' : 'MISSING'`
- Look for any 🔊 error logs
- Report error text from console

---

### Problem: Mic Doesn't Restart After AI Speaks
**Symptoms**: AI responds, but no waveform appears, can't send another message

**Check These**:
1. Console shows 🔄 messages
2. No 🔄 error messages
3. `recognitionRef.current` exists
4. `sessionEndedRef.current` is false

**Fixes to Try**:
- Refresh page
- Grant microphone permission again if prompted
- Check browser permissions (Settings → Privacy → Microphone)

**If Still Failing**:
- Look for "Error restarting recognition:" in console
- Check recognitionRef state in console

---

### Problem: Session Ends After First Response
**Symptoms**: Can send one message, AI responds, then system appears dead

**Check These**:
1. `sessionEndedRef` value - should be false during active chat
2. No "session ended" messages in console
3. Idle timer isn't firing unexpectedly
4. No unhandled exceptions in console

**Fixes to Try**:
- Clear browser cache (Ctrl+Shift+Delete)
- Disable browser extensions
- Try incognito/private window
- Check for JavaScript errors in console

---

### Problem: Voice Quality Issues
**Symptoms**: Voice sounds robotic, too fast/slow, or wrong gender

**Check**: 
```javascript
// In console:
window.speechSynthesis.getVoices().forEach(v => console.log(v.name, v.lang))
```

**If No Female Voices**: System may use default voice

---

## 📊 Test Results Template

| Test | Expected | Actual | Status | Notes |
|------|----------|--------|--------|-------|
| TTS Output | Hear AI voice | ? | ⏳ | |
| Mic Restart | Waveform reappears | ? | ⏳ | |
| Conversation | Multiple exchanges | ? | ⏳ | |
| Idle Timeout | "May I go?" at 30s | ? | ⏳ | |
| Graceful Shutdown | "Goodbye" at 35s | ? | ⏳ | |
| No Listening During Speech | Waveform hidden | ? | ⏳ | |

---

## 🛠️ Console Commands for Debugging

```javascript
// Check if synthesis available
window.speechSynthesis ? '✅ SpeechSynthesis available' : '❌ SpeechSynthesis missing'

// List all voices
window.speechSynthesis.getVoices().map(v => `${v.name} (${v.lang})`).join('\n')

// Check session refs (if dev tools allow accessing React state)
// Will depend on how React DevTools is configured
```

---

## 📝 Sample Console Output (Expected)

```
🔊 speakText called with: Hi there! I'm Bzik, your AI business consultant. How can I help you?
ℹ️ No voices available, waiting...
🔊 Using voice: Microsoft Zoe Desktop - English (United States)
🔊 Calling synthRef.speak()
🔊 TTS started
🔊 Stopped recognition for TTS
[5 seconds of actual speech audio]
🔊 TTS finished
🔄 Restarting recognition after TTS
🔄 Starting recognition...
[Waveform becomes visible, ready for user input]
```

---

## ✅ Sign-Off

When all tests pass, you can confirm:
- ✅ TTS (voice output) working
- ✅ Recognition auto-restart working
- ✅ Continuous conversation possible
- ✅ All 5 features functioning correctly
- ✅ Ready for production deployment

---

**Test Date**: _____________  
**Tester Name**: _____________  
**Overall Result**: ✅ PASS / ❌ FAIL / ⏳ INCOMPLETE
