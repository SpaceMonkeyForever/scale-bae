import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSession } from "@/services/auth";
import { readBudget } from "@/services/budget";

export async function GET() {
  const user = await getSession();
  const headers = {"Cache-Control":"private, no-store","Vary":"Cookie"};
  if (!user.isLoggedIn || !user.userId) return new Response(null,{status:307,headers:{...headers,Location:"/login?next=/budget"}});
  const book = readBudget(user.userId);
  const initial = JSON.stringify({...book,username:user.username,name:user.displayName || user.username})
    .replace(/</g,"\\u003c");
  const template = await readFile(join(process.cwd(),"examples/budget/index.html"),"utf8");
  const html = template.replace(/<!-- demo -->[\s\S]*?<!-- \/demo -->/g,"")
    .replace('href="#main" aria-label="Scale Bae budget home"','href="/upload" aria-label="Scale Bae home"')
    .replace('<nav aria-label="Budget navigation">','<nav aria-label="Budget navigation"><a href="/progress">Progress</a>')
    .replace('data-username="squishy"','')
    .replace("</head>",() => '<script id="saved-book" type="application/json">'+initial+'</script></head>');
  return new Response(html,{headers:{...headers,"Content-Type":"text/html; charset=utf-8"}});
}
