import { locale, t } from "./language.mjs";

export function budgetConversation({root, readBudget, readRevision, onConflict, applyBudget, openShare}) {
  const $ = id => root.querySelector("#" + id);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const language = $("agent-language");
  try {
    const saved = sessionStorage.getItem("budget-speech-language");
    if (saved !== null) language.value = saved || "device";
  } catch { /* Optional preference. */ }
  let active, mic, previous;
  let history = [];
  const uiMessages = new Map();

  function uiText(id, source) {
    const value = t(source);
    $(id).textContent = value;
    uiMessages.set(id, {source, value});
  }
  function refreshLanguage() {
    for (const [id, msg] of uiMessages) {
      if ($(id).textContent === msg.value) uiText(id, msg.source);
    }
    if (mic && active && !language.value) listen(active);
  }

  function stopMic() {
    if (!mic) return;
    mic.onresult = mic.onend = mic.onerror = null;
    try { mic.abort(); } catch { /* Already stopped. */ }
    mic = undefined;
  }
  function cancel() {
    active?.request?.abort();
    active = undefined;
    stopMic();
    $("agent-panel").hidden = true;
    $("agent-form").reset();
  }
  function forget() {
    cancel();
    history = [];
    previous = undefined;
    $("agent-receipt").hidden = true;
    $("agent-undo").hidden = true;
  }
  function typing(message = "", allowMic = false) {
    uiText("agent-status", message);
    $("agent-form").hidden = false;
    $("agent-mic").hidden = !allowMic;
    $("agent-input").focus();
  }
  function listen(session) {
    if (active !== session) return;
    stopMic();
    if (!SpeechRecognition) {
      typing("Use keyboard dictation or type here. This browser has no built-in microphone recognition.");
      return;
    }
    let heard = "";
    const capture = new SpeechRecognition();
    mic = capture;
    capture.lang = language.value === "device" ? navigator.language : language.value || locale;
    capture.continuous = false;
    capture.interimResults = true;
    uiText("agent-status", "Listening…");
    $("agent-form").hidden = true;
    $("agent-mic").hidden = true;
    capture.onresult = event => {
      if (active !== session || mic !== capture) return;
      const results = Array.from(event.results);
      const interim = results.map(r => r[0].transcript).join(" ").trim();
      $("agent-status").textContent = interim || t("Listening…");
      heard = results.filter(r => r.isFinal).map(r => r[0].transcript).join(" ").trim();
      if (heard && results.every(r => r.isFinal)) {
        stopMic();
        send(session, heard);
      }
    };
    capture.onerror = event => {
      if (active !== session || mic !== capture) return;
      stopMic();
      const denied = ["not-allowed","service-not-allowed"].includes(event.error);
      typing(denied ? "Microphone access is off. Type here or enable it in your browser." :
        "I couldn’t hear that. Try the microphone again, or type here.", !denied);
    };
    capture.onend = () => {
      if (active !== session || mic !== capture) return;
      mic = undefined;
      if (heard) send(session, heard);
      else typing("I didn’t catch anything. Try again, or type here.", true);
    };
    try { capture.start(); }
    catch { stopMic(); typing("The microphone couldn’t start. Try again, or type here.", true); }
  }
  async function send(session, words) {
    words = words.trim();
    if (!words || active !== session || session.request) return;
    stopMic();
    $("agent-form").hidden = $("agent-mic").hidden = true;
    $("agent-prompt").textContent = words;
    uiText("agent-status", "Thinking…");
    const controller = new AbortController();
    session.request = controller;
    const snapshot = readBudget();
    // Keep complete user/assistant pairs for references across recent updates.
    const turns = [...history, ...session.pending, {role:"user",content:words}].slice(-21);
    const now = new Date();
    const today = [now.getFullYear(), String(now.getMonth()+1).padStart(2,"0"), String(now.getDate()).padStart(2,"0")].join("-");
    try {
      const response = await fetch("/budget/turn", {
        method:"POST", signal:controller.signal, headers:{"content-type":"application/json"},
        body:JSON.stringify({...(readRevision() === undefined ? {budget:snapshot} : {revision:readRevision()}), today, turns, interfaceLocale:locale})
      });
      if (response.status === 409) { onConflict(await response.json()); return; }
      if (!response.ok) throw new Error("Turn failed");
      const result = await response.json();
      if (active !== session || readBudget() !== snapshot) return;
      session.request = undefined;
      const pair = [{role:"user",content:words},{role:"assistant",content:result.reply}];
      if (result.mode === "clarify") {
        session.pending.push(...pair);
        $("agent-prompt").textContent = result.reply;
        $("agent-input").value = "";
        if (session.voice) listen(session);
        else typing();
        return;
      }
      if (result.mode === "update") {
        if (!await applyBudget(result.budget)) {
          if (active === session) { $("agent-input").value = words; typing("Check the budget and retry your update.",session.voice); }
          return;
        }
        previous = snapshot;
      }
      history = [...history,...session.pending,...pair].slice(-16);
      cancel();
      $("agent-feedback").textContent = result.reply;
      $("agent-receipt").hidden = false;
      $("agent-undo").hidden = !previous;
      if (result.mode === "share") openShare();
    } catch {
      if (active !== session || controller.signal.aborted) return;
      session.request = undefined;
      $("agent-input").value = words;
      typing("Claude couldn’t finish that update. Your budget is unchanged. Send your words again to retry.", session.voice);
    }
  }
  function start(voice, example) {
    if (active && !example && !active.request && active.pending.length) {
      active.voice = voice;
      stopMic();
      if (voice) listen(active);
      else typing();
      return;
    }
    cancel();
    active = {voice, pending:[]};
    $("agent-panel").hidden = false;
    $("agent-receipt").hidden = true;
    uiText("agent-prompt", "What changed?");
    $("agent-status").textContent = "";
    $("agent-input").value = "";
    if (example) send(active,example);
    else if (voice) listen(active);
    else typing();
  }

  $("agent-cancel").onclick = () => {
    cancel();
    $("agent-receipt").hidden = !$("agent-feedback").textContent;
  };
  $("agent-mic").onclick = () => { if (active && !active.request) listen(active); };
  $("agent-form").onsubmit = event => {
    event.preventDefault();
    if (active) send(active,$("agent-input").value);
  };
  $("agent-undo").onclick = async () => {
    if (!previous || !await applyBudget(previous)) return;
    forget();
    uiText("agent-feedback", "Undone. Your previous budget is back.");
    $("agent-receipt").hidden = false;
  };
  language.onchange = () => {
    try { if (language.value) sessionStorage.setItem("budget-speech-language", language.value);
      else sessionStorage.removeItem("budget-speech-language"); } catch { /* Optional. */ }
    if (mic && active) listen(active);
  };
  window.addEventListener("pagehide",cancel);
  function dispose() {
    cancel();
    window.removeEventListener("pagehide",cancel);
  }
  return {start, cancel, forget, refreshLanguage, dispose};
}
