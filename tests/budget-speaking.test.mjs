import assert from "node:assert/strict";
import test from "node:test";
import { letter, sample, totals } from "../public/budget/budget.mjs";
import { applyAgentResult } from "../scripts/budget-agent.mjs";

const today = "2026-11-24";
const change = (...changes) => applyAgentResult(sample, {mode:"update",reply:"Done",language:"en-GB",changes},today).budget;
const repair = {target:"extra",action:"add",name:"Bike repair",amount:1000,reason:"It was broken."};

test("a repair changes the spendable amount once and keeps the reason for Squeezy", () => {
  const updated = change(repair);
  assert.equal(totals(updated).remaining, totals(sample).remaining - 1000);
  assert.match(letter(updated), /Bike repair.*It was broken/);
  assert.equal(totals(sample).remaining, 4800);
});

test("a private bank snapshot has no effect on income, costs or sharing", () => {
  const updated = change({target:"bank",action:"set",amount:18000});
  assert.deepEqual(updated.bank,{amount:18000,asOf:today});
  assert.deepEqual(totals(updated),totals(sample));
  assert.equal(letter(updated),letter(sample));
});

test("a paid-through edit keeps the original cost", () => {
  const updated = change({target:"basic",action:"edit",id:"bike",status:"paid",until:"2027-01-31"});
  assert.equal(updated.basics.find(x=>x.id==="bike").status,"paid");
  assert.deepEqual(totals(updated),totals(sample));
});

test("invalid dates, missing targets and mixed clarification/edits leave the book intact", () => {
  const before = structuredClone(sample);
  assert.throws(()=>change(repair,{target:"basic",action:"edit",id:"bike",until:"2027-02-30"}));
  assert.throws(()=>change({target:"extra",action:"remove",id:"typo"}));
  assert.throws(()=>applyAgentResult(sample,{mode:"clarify",reply:"How much?",language:"en",changes:[repair]},today));
  assert.deepEqual(sample,before);
});
