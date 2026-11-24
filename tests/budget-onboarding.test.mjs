import test from "node:test";
import assert from "node:assert/strict";
import { emptyBudget, totals } from "../public/budget/budget.mjs";
import { budgetTurn } from "../scripts/budget-agent.mjs";

const today = "2026-11-24";
async function turn(budget, result) {
  return budgetTurn({budget,today,turns:[{role:"user",content:"Set up my budget."}]},
    async () => ({stop_reason:"end_turn",content:[{type:"text",text:JSON.stringify({...result,language:"en-GB"})}]}));
}
test("a fresh book has no invented total and supports partial setup and zero allocation", async () => {
  const fresh = emptyBudget();
  assert.equal(totals(fresh).remaining,null);
  const partial = await turn(fresh,{mode:"update",reply:"Got it. What dates is that for?",
    changes:[{action:"set",target:"allocation",amount:0}]});
  assert.equal(partial.budget.allocated,0);
  assert.equal(totals(partial.budget).remaining,null);
  const full = await turn(partial.budget,{mode:"update",reply:"Added the dates.",
    changes:[{action:"set",target:"allocation",start:"2026-11-01",end:"2026-12-31"}]});
  assert.equal(totals(full.budget).remaining,0);
});
test("clarification does not change the book; a complete opening statement applies together", async () => {
  const book = emptyBudget();
  const question = await turn(book,{mode:"clarify",reply:"How much is the bike?",changes:[]});
  assert.equal(question.budget,undefined);
  const result = await turn(book,{mode:"update",reply:"Saved.",changes:[
    {action:"set",target:"allocation",amount:100000,start:"2026-11-01",end:"2026-11-30"},
    {action:"add",target:"basic",name:"Rent paid last month",amount:0,status:"paid",until:"2026-11-30"},
    {action:"add",target:"basic",name:"Bike",amount:10000,status:"reserved",until:"2026-11-30"},
    {action:"add",target:"basic",name:"Power",amount:5000,status:"planned"}]});
  assert.equal(totals(result.budget).remaining,85000);
  assert.deepEqual(book,emptyBudget());
});
test("a malformed paid bill gets one repair attempt and never becomes a partial save", async () => {
  const book = emptyBudget();
  const input = {budget:book,today,turns:[{role:"user",content:"Rent is paid."}],interfaceLocale:"id-ID"};
  const invalid = {mode:"update",language:"id",reply:"Sudah.",changes:[
    {action:"add",target:"basic",name:"Sewa",status:"paid",amount:50000}]};
  let attempts = 0;
  const result = await budgetTurn(input,async () => {
    attempts++;
    return {stop_reason:"end_turn",content:[{type:"text",text:JSON.stringify(invalid)}]};
  });
  assert.equal(attempts,2);
  assert.equal(result.mode,"clarify");
  assert.equal(result.budget,undefined);
  assert.deepEqual(book,emptyBudget());
});
