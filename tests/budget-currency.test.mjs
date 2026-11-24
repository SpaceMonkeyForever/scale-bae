import test from "node:test";
import assert from "node:assert/strict";
import { bookCurrency, emptyBudget, letterFromReport, money, sample } from "../public/budget/budget.mjs";
import { englishShare } from "../scripts/budget-share.mjs";
import { budgetTurn } from "../scripts/budget-agent.mjs";

test("legacy and fresh Squishy budgets default to IDR regardless of language, and explicit selections win", () => {
  const legacy = {...sample, currency:undefined};
  assert.equal(bookCurrency(legacy, "squishy"), "IDR");
  assert.equal(bookCurrency(legacy, "another-login", " Squishy "), "IDR");
  assert.equal(bookCurrency(legacy, "another-login"), "GBP");
  assert.equal(bookCurrency({...legacy, currency:"EUR"}, "squishy"), "EUR");
  assert.match(money(5000000, "IDR", "id-ID"), /Rp\s*50\.000/);
});

test("Squeezy gets English item names, reasons and coverage, with original amounts and no bank snapshot", async () => {
  const book = {...emptyBudget("IDR"), start:"2026-11-01", end:"2026-12-31", allocated:10000000,
    bank:{amount:8765432, asOf:"2026-11-01"}, topups:[{name:"Tambahan",amount:100000}],
    basics:[{name:"Listrik",amount:2000000,status:"paid",until:"2026-12-31"}],
    extras:[{name:"Ban",amount:5000000,reason:"Ban bocor"}]};
  const report = await englishShare(book, async request => {
    assert.deepEqual(JSON.parse(request.messages[0].content), ["Tambahan","Listrik","Ban","Ban bocor"]);
    return {stop_reason:"end_turn",content:[{type:"text",text:JSON.stringify({translations:["Top-up","Electricity","Tyre","Flat tyre"]})}]};
  });
  const outgoing = letterFromReport(report);
  assert.match(outgoing,/Paid through 31 Dec 2026/);
  assert.match(outgoing,/Tyre.*50,000.*Flat tyre/);
  assert.match(outgoing,/IDR\s*31,000 left/);
  assert.doesNotMatch(outgoing,/bocor|Listrik|Tambahan|87,654/);
  await assert.rejects(englishShare(book, async () => ({stop_reason:"end_turn",content:[{type:"text",text:'{"translations":[]}'}]})));
});

test("Indonesian check-ins use the saved currency and keep the agent’s rupiah acknowledgement", async () => {
  const response = await budgetTurn({budget:emptyBudget("IDR"), interfaceLocale:"id-ID", today:"2026-11-24",
    turns:[{role:"user",content:"Saldoku 50rb"}]}, async request => {
    assert.match(request.system,/Book currency: IDR/);
    return {stop_reason:"end_turn",content:[{type:"text",text:JSON.stringify({mode:"update", reply:"Saldo Rp50.000.", language:"id-ID",
      changes:[{action:"set",target:"bank",amount:5000000}]})}]};
  });
  assert.equal(response.budget.bank.amount, 5000000);
  assert.equal(response.reply, "Saldo Rp50.000.");
});
