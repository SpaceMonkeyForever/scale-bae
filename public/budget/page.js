import { sample, hasPeriod, totals, money, cycle, coverage, letter, shareIntro, examples, dateLabel, itemText } from "./budget.mjs";
import { locale, t, setLocale, bindShell } from "./language.mjs";
import { icon } from "./icons.js";
import { budgetConversation } from "./voice.js";

import { storedLocale, saveLocale, preferenceKey } from "./preference.mjs";

export function mountBudget(root, live) {
  let revision = live?.revision;
  const $ = selector => root.querySelector(selector);
  const username = live?.username ?? $(".who").dataset.username;
  const displayName = live?.name || (live ? username : "Squishy");
  if (!live) {
    $(".avatar").textContent = Array.from(displayName)[0]?.toUpperCase() || "";
    $(".profile-name").textContent = displayName;
  }
  const updateShell = bindShell(root);
  setLocale(storedLocale(username, displayName));
  const storageKey = "scale-bae-budget-example-v1";
  let budget = live?.budget ?? structuredClone(sample);
  if (!live) {
    try { budget = JSON.parse(sessionStorage.getItem(storageKey)) || budget; } catch { /* Offline preview. */ }
  }
  let saving = false;
  const dialog = $("#editor");
  let toastTimer;
  const agent = budgetConversation({root, readBudget: () => budget, readRevision: () => revision, onConflict: syncConflict, applyBudget: saveBudget, openShare: shareSummary});
  function escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function toast(message) {
    $("#toast").textContent = message;
    $("#toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2600);
  }
  function syncConflict(current) {
    revision = current.revision;
    budget = current.budget;
    agent.forget();
    dialog.close();
    render();
    toast(t("This budget changed on another device. Check the latest figures and try again."));
  }
  async function saveBudget(next) {
    if (saving) return false;
    if (live) {
      saving = true;
      $("#main").inert = dialog.inert = true;
      try {
        const response = await fetch("/budget/book",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({revision,budget:next})});
        if (response.status === 409) { syncConflict(await response.json()); return false; }
        if (!response.ok) throw new Error();
        const saved = await response.json();
        revision = saved.revision;
        next = saved.budget;
      } catch {
        toast(t("Couldn’t confirm the save. Check your connection and try again."));
        return false;
      } finally {
        saving = false;
        $("#main").inert = dialog.inert = false;
      }
    }
    const previousCheck = budget.bank;
    budget = next;
    if (!live) try { sessionStorage.setItem(storageKey, JSON.stringify(budget)); } catch { /* Keep working in memory. */ }
    render();
    if (budget.bank && (budget.bank.amount !== previousCheck?.amount || budget.bank.asOf !== previousCheck?.asOf)
        && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      $("#bank-amount").animate([{opacity: 0.4, transform: "translateY(4px)"}, {opacity: 1, transform: "translateY(0)"}], {duration: 280, easing: "ease-out"});
    }
    return true;
  }
  async function persist(message, next) {
    agent.forget();
    if (!await saveBudget(next)) return;
    dialog.close(); toast(t(message));
  }
  function mathRow(label, value) { return '<div class="math-row"><dt>'+label+'</dt><dd>'+value+'</dd></div>'; }
  function row(item, kind) {
    const detail = kind === "basic" ? coverage(item) : itemText(item,"reason");
    return '<button class="row" data-kind="'+kind+'" data-id="'+escape(item.id)+'"><span class="row-main"><span class="tile '+escape(item.color || "lilac")+'">'+icon(item.icon || "note")+'</span><span><strong>'+escape(itemText(item,"name"))+'</strong><small>'+escape(detail)+'</small></span></span><span class="row-end">'+money(item.amount)+icon("chevron")+'</span></button>';
  }
  function render() {
    const summary = totals(budget), r = summary.remaining;
    const ready = hasPeriod(budget);
    $(".talk .lead").textContent = t(ready ? "A bill paid, a little extra spent, or money from Squeezy." :
      "Tell me how much Squeezy gave you, when it’s for, and which bills are paid or still due.");
    $("#period").textContent = ready ? cycle(budget) : t("Getting started");
    $("#balance").textContent = ready ? money(Math.abs(r)) : (budget.allocated === null ? "—" : money(budget.allocated));
    $("#balance-label").textContent = !ready ? t(budget.allocated === null ? "Set up your budget" : "allocated") : t(r < 0 ? "short" : r === 0 ? "left over" : "to spare");
    $("#balance-hint").textContent = !ready ? t("Add your allocation and its dates to see what’s left.") : t(r < 0 ? "Top-up needed to cover the plan through {date}." : "After basics and extras through {date}.", {date:dateLabel(budget.end)});
    root.querySelectorAll('[data-do="share"]').forEach(button => { button.disabled = !ready; });
    $("#math").hidden = !ready;
    $("#math").innerHTML = mathRow(t("From Squeezy"),money(budget.allocated)) + (budget.topups.length ? mathRow(t("Later top-ups"),"+"+money(summary.topups)) : "") + mathRow(t("The basics"),"−"+money(summary.basics)) + mathRow(t("Outside the plan"),"−"+money(summary.extras));
    $("#bank-check").hidden = !budget.bank;
    $("#bank-amount").textContent = budget.bank ? money(budget.bank.amount) : "";
    const bankDate = $("#bank-date");
    bankDate.dateTime = budget.bank?.asOf ?? "";
    bankDate.textContent = budget.bank ? dateLabel(budget.bank.asOf, true) : "";
    $("#basic-list").innerHTML = budget.basics.map(x=>row(x,"basic")).join("") || '<p class="empty">'+t("Add your first regular cost.")+'</p>';
    $("#extra-list").innerHTML = budget.extras.map(x=>row(x,"extra")).join("") || '<p class="empty">'+t("No extras this period.")+'</p>';
  }
  function openBody(content) {
    agent.cancel();
    $("#dialog-body").innerHTML = content;
    if (!dialog.open) dialog.showModal();
    const heading = $("#dialog-title");
    if (heading) heading.focus({preventScroll:true});
    dialog.scrollTop = 0;
  }
  function heading(kicker,title,subtitle) {
    return '<div class="eyebrow">'+t(kicker)+'</div><h2 id="dialog-title" tabindex="-1">'+t(title)+'</h2>'+(subtitle ? '<p>'+t(subtitle)+'</p>' : "");
  }
  function field(label, name, type, value, attributes = "") {
    return '<label>'+t(label)+'<input name="'+name+'" type="'+type+'" value="'+escape(value)+'" '+attributes+'></label>';
  }
  const amountField = (label, value, allowZero=false) => field(label,"amount","number",value == null ? "" : value/100,'inputmode="decimal" step=".01" min="'+(allowZero ? '0':'0.01')+'" max="99999999" required');
  const getAmount = data => Math.round(Number(data.get("amount")) * 100);
  const collections = {basic:"basics", extra:"extras", topup:"topups"};
  function editEntry(kind, entry={}) {
    const basic = kind === "basic", extra = kind === "extra", isExisting = Boolean(entry.id);
    const title = basic ? (isExisting ? "Edit a basic" : "Add a basic") : extra ? (isExisting ? "Edit an extra" : "Add an extra") : (isExisting ? "Edit a top-up" : "Add a top-up");
    const amountLabel = basic ? "Amount from this budget (£)" : "Amount (£)";
    const subtitle = basic ? "Use the cost for this whole period. Enter £0 if an earlier budget covered it." : extra ? "Keep the reason in your own words for Squeezy." : "This is added to the original allocation.";
    openBody(heading("My budget book",title,subtitle)+'<form id="entry-form">'+field(basic ? "Basic" : extra ? "What was it?" : "Top-up note","name","text",itemText(entry,"name"),'required maxlength="100"')+amountField(amountLabel,entry.amount,basic)+
      (basic ? '<label>'+t("How is it covered?")+'<select name="status"><option value="planned">'+t("Still to cover")+'</option><option value="reserved">'+t("Money set aside")+'</option><option value="paid">'+t("Already paid")+'</option></select></label>'+field("Covered through","until","date",entry.until || "") :
       extra ? '<label>'+t("Why was it outside the plan?")+'<textarea name="reason" required maxlength="400">'+escape(itemText(entry,"reason"))+'</textarea></label>' : "")+
      '<div class="dialog-actions">'+(isExisting ? '<button type="button" class="danger" id="remove">'+t("Remove")+'</button>' : "")+'<button type="button" class="secondary" data-cancel>'+t("Cancel")+'</button><button class="primary" type="submit">'+t("Save update")+'</button></div></form>');
    const form = $("#entry-form");
    if (basic) {
      const status = form.elements.status, until = form.elements.until;
      const syncDate = () => { until.required = status.value !== "planned"; until.parentElement.hidden = !until.required; until.disabled = !until.required; };
      status.value = entry.status || "planned"; status.onchange = syncDate; syncDate();
    }
    form.onsubmit = e => {
      e.preventDefault();
      const data = new FormData(form), name = String(data.get("name")).trim(), reason = String(data.get("reason") || "").trim();
      if (!name || (extra && !reason)) {
        const input = !name ? form.elements.name : form.elements.reason;
        input.setCustomValidity(t("Please add a few words.")); input.reportValidity(); input.oninput = () => input.setCustomValidity(""); return;
      }
      const value = {...entry,id: entry.id || crypto.randomUUID(), name: name === itemText(entry,"name") ? entry.name : name, amount:getAmount(data)};
      if (basic) Object.assign(value,{status:data.get("status"),until:data.get("until") || ""});
      if (extra) value.reason = reason === itemText(entry,"reason") ? (entry.reason || "") : reason;
      const next = structuredClone(budget);
      const items = next[collections[kind]];
      if (isExisting) items[items.findIndex(item => item.id === entry.id)] = value;
      else items.push(value);
      persist("Budget updated",next);
    };
    if (isExisting) $("#remove").onclick = () => {
      openBody(heading("My budget book","Remove this entry?",t("Remove “{name}” from your budget?", {name:escape(itemText(entry,"name"))}))+'<div class="dialog-actions"><button class="secondary" id="keep">'+t("Keep entry")+'</button><button class="primary" id="confirm-remove">'+t("Remove entry")+'</button></div>');
      $("#keep").onclick = () => editEntry(kind,entry);
      $("#confirm-remove").onclick = () => { persist("Entry removed",{...budget,[collections[kind]]:budget[collections[kind]].filter(x => x.id !== entry.id)}); };
    };
  }
  function allocation() {
    openBody(heading("From Squeezy","Your allocation","The original amount and how long it needs to last.")+'<form id="allocation-form">'+amountField("Original amount (£)",budget.allocated,true)+'<div class="field-pair">'+field("From","start","date",budget.start,"required")+field("Through","end","date",budget.end,"required")+'</div><div class="dialog-actions"><button type="button" class="secondary" data-cancel>'+t("Cancel")+'</button><button class="primary">'+t("Save allocation")+'</button></div></form><div class="section-head topup-heading"><strong>'+t("Later top-ups")+'</strong><button class="small-action" id="new-topup">'+icon("plus")+' '+t("Add")+'</button></div>'+budget.topups.map(x=>row(x,"topup")).join(""));
    const form = $("#allocation-form");
    const constrain = () => { form.elements.end.min = form.elements.start.value; };
    constrain(); form.elements.start.oninput = constrain;
    form.onsubmit = e => { e.preventDefault(); const data=new FormData(form); persist("Allocation updated",{...budget,start:data.get("start"),end:data.get("end"),allocated:getAmount(data)}); };
    $("#new-topup").onclick = () => editEntry("topup",{name:t("From Squeezy")});
  }
  function shareSummary() {
    if (!hasPeriod(budget)) { toast(t("Add your allocation and its dates to see what’s left.")); return; }
    const message = letter(budget);
    const summary = totals(budget);
    const summaryRows = [
      mathRow(t("Original allocation"), money(budget.allocated)),
      ...budget.topups.map(x => mathRow(t("Top-up") + " · " + escape(x.name), "+" + money(x.amount))),
      mathRow(t("Basics for the period"), "−" + money(summary.basics)),
      mathRow(t("Outside the plan"), "−" + money(summary.extras)),
      mathRow(t(summary.remaining < 0 ? "Top-up needed" : "Left over"), money(Math.abs(summary.remaining)))
    ].join("");
    function details(item, note) {
      return '<li><div><strong>' + escape(itemText(item,"name")) + '</strong><span>' +
        money(item.amount) + '</span></div><small>' + escape(note) + '</small></li>';
    }
    const article = '<article class="letter" id="letter"><span class="letter-date">' + cycle(budget) +
      '</span><h3>'+t("Hi Squeezy,")+'</h3><p>' + escape(shareIntro(summary.remaining)) + '</p><dl>' +
      summaryRows + '</dl><h4>'+t("Outside the plan")+'</h4><ul>' +
      budget.extras.map(x => details(x, itemText(x,"reason"))).join("") +
      '</ul>' + (budget.extras.length ? '' : '<p>'+t("No extras this period.")+'</p>') +
      '<h4>'+t("The basics")+'</h4><ul>' + budget.basics.map(x => details(x, coverage(x, true))).join("") +
      '</ul></article>';
    openBody(heading("For Squeezy","Your budget update","Read it through, then choose where to send it.") + article +
      '<div class="share-footer"><div id="share-status" class="inline-msg" role="status"></div><div class="dialog-actions"><button id="copy" class="secondary">'+t("Copy message")+'</button>' +
      (typeof navigator.share === "function" ? '<button id="share" class="primary">'+t("Share…")+'</button>' : "") + '</div></div>');
    $("#copy").onclick = async () => {
      try { await navigator.clipboard.writeText(message); $("#share-status").textContent=t("Message copied."); }
      catch {
        const text = document.createElement("textarea");
        text.setAttribute("aria-label", t("Message to copy"));
        text.readOnly = true;
        text.value = message;
        $("#letter").replaceChildren(text);
        text.focus();
        text.select();
        $("#share-status").textContent=t("Message selected. Use your device’s Copy command.");
      }
    };
    if ($("#share")) $("#share").onclick = async () => {
      try { await navigator.share({text:message}); } catch (err) { if (err.name !== "AbortError") $("#share-status").textContent=t("Sharing is unavailable here. You can copy the message."); }
    };
  }
  function reset() {
    if (live) return;
    openBody(heading("Sample budget","Start over?","Restore the example amounts and clear your changes in this tab.")+'<div class="dialog-actions"><button class="secondary" data-cancel>'+t("Keep changes")+'</button><button class="primary" id="reset-confirm">'+t("Reset example")+'</button></div>');
    $("#reset-confirm").onclick=()=>{persist("Example restored",structuredClone(sample));};
  }
  const onClick = e => {
    const button=e.target.closest("button"); if (!button) return;
    if (button.hasAttribute("data-cancel") || button.id === "close") { dialog.close(); return; }
    if (button.dataset.demo) { agent.start(false, t(examples[button.dataset.demo])); return; }
    if (button.dataset.kind) { const kind=button.dataset.kind; editEntry(kind,budget[collections[kind]].find(x=>x.id === button.dataset.id)); return; }
    const actions={share:shareSummary,talk:()=>agent.start(true),type:()=>agent.start(false),allocation,reset,"add-basic":()=>editEntry("basic"),"add-extra":()=>editEntry("extra")};
    actions[button.dataset.do]?.();
  };
  root.addEventListener("click", onClick);
  function refreshLanguage() {
    document.documentElement.lang = locale;
    document.title = t("My budget book · scale-bae");
    if (languageSelect) languageSelect.value = locale;
    updateShell();
    agent.refreshLanguage();
    render();
  }
  const languageSelect = $("#interface-language");
  if (languageSelect) languageSelect.onchange = e => saveLocale(username, e.target.value);
  const onLanguage = e => {
    if (e.detail.username !== username) return;
    setLocale(e.detail.locale);
    refreshLanguage();
  };
  const onStorage = e => {
    if (e.key !== null && e.key !== preferenceKey(username)) return;
    setLocale(storedLocale(username, displayName));
    refreshLanguage();
  };
  window.addEventListener("scale-bae-language", onLanguage);
  window.addEventListener("storage", onStorage);
  root.querySelectorAll("[data-icon]").forEach(el=>el.innerHTML=icon(el.dataset.icon));
  refreshLanguage();
  return () => {
    agent.dispose();
    clearTimeout(toastTimer);
    root.removeEventListener("click", onClick);
    window.removeEventListener("scale-bae-language", onLanguage);
    window.removeEventListener("storage", onStorage);
  };
}
