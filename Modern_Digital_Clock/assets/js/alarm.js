const Alarm = (() => {
  let alarmTriggered = false;
  let snoozeUntil = null;
  let lastAlarmTriggerKey = null;
  let audioCtx = null;
  let beepNode = null;

  function checkAndTriggerAlarm(parts, alarmTime, snoozeActive) {
    const alarmSet = alarmTime && alarmTime.length === 5;
    if (!alarmSet) return;
    if (snoozeActive && Date.now() < snoozeUntil) return;

    const [ah, am] = alarmTime.split(":").map((x) => parseInt(x, 10));
    const curH = parseInt(parts.hour, 10);
    const curM = parseInt(parts.minute, 10);
    const todayKey = `${parts.year}-${parts.month}-${parts.day}-${String(ah).padStart(2, "0")}:${String(am).padStart(2, "0")}`;

    if (ah === curH && am === curM) {
      if (lastAlarmTriggerKey !== todayKey) {
        triggerAlarm();
        lastAlarmTriggerKey = todayKey;
      }
    }
  }

  function triggerAlarm() {
    alarmTriggered = true;
    const alarmStateEl = document.getElementById("alarmState");
    if (alarmStateEl) {
      alarmStateEl.hidden = false;
      alarmStateEl.querySelector(".alarm-message")?.focus?.();
    }
    startBeep();
  }

  function stopAlarm() {
    alarmTriggered = false;
    const alarmStateEl = document.getElementById("alarmState");
    if (alarmStateEl) {
      alarmStateEl.hidden = true;
    }
    stopBeep();
    snoozeUntil = null;
  }

  function snoozeAlarm() {
    stopBeep();
    alarmTriggered = false;
    const alarmStateEl = document.getElementById("alarmState");
    if (alarmStateEl) {
      alarmStateEl.hidden = true;
    }
    snoozeUntil = Date.now() + 5 * 60 * 1000;
  }

  function startBeep() {
    const beepSample = document.getElementById("beepSample");
    try {
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.02);
      beepNode = { oscillator: o, gain: g };
    } catch (e) {
      try {
        beepSample.play().catch((err) => {
          UI.showToast(
            "Audio blocked by browser. Interact to enable alarm sound.",
            true,
          );
        });
      } catch (err) {}
    }
  }

  function stopBeep() {
    const beepSample = document.getElementById("beepSample");
    try {
      if (beepNode && beepNode.oscillator) {
        beepNode.gain.gain.exponentialRampToValueAtTime(
          0.0001,
          audioCtx.currentTime + 0.02,
        );
        beepNode.oscillator.stop(audioCtx.currentTime + 0.03);
        beepNode = null;
      }
    } catch (e) {}
    try {
      beepSample.pause();
      beepSample.currentTime = 0;
    } catch (e) {}
  }

  function setAlarmFromInput(val) {
    if (val) {
      UI.showToast(`Alarm set for ${val}`);
    } else {
      UI.showToast("Alarm cleared");
    }
  }

  function clearAlarm() {
    const alarmTimeInput = document.getElementById("alarmTime");
    alarmTimeInput.value = "";
    stopAlarm();
    UI.showToast("Alarm cleared");
  }

  function isSnoozed() {
    return snoozeUntil !== null && Date.now() < snoozeUntil;
  }

  return {
    checkAndTriggerAlarm,
    triggerAlarm,
    stopAlarm,
    snoozeAlarm,
    startBeep,
    stopBeep,
    setAlarmFromInput,
    clearAlarm,
    isSnoozed,
  };
})();
