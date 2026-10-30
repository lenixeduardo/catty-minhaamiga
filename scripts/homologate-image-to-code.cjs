/* End-to-end integration validation for Catty landing and app shell.
 * This script does not modify the source or replace approved assets.
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.HOMOLOGATION_URL || 'http://127.0.0.1:5173';
const art = process.env.HOMOLOGATION_OUT || 'artifacts/e2e';
const sizes = [
  {name:'mobile', width:390, height:844},
  {name:'tablet', width:820, height:1180},
  {name:'desktop', width:1440, height:900}
];
const report = {kind:'catty-image-to-code-e2e', date:new Date().toISOString(), reference:'Landing Page da Catty em Três Telas.png (user-approved mockup; available privately, not committed)', checks:[], pages:[], issues:[], limitations:[]};
const check = (id, ok, data={}) => {
  report.checks.push({id,passed:!!ok,details:data});
  if(!ok) report.issues.push({id,...data});
};
(async()=>{
  fs.mkdirSync(art,{recursive:true});
  const src = fs.readFileSync('src/landing/CattyLanding.tsx','utf8');
  const refs = [...new Set([...src.matchAll(/['"`](\/(?:assets\/[^'"`]+|catty\.png))['"`]/g)].map(m=>m[1]))].sort();
  report.sourceAssetReferences = refs;
  for(const ref of refs){
    const found = fs.existsSync(path.join('public',ref.replace(/^\//,'')));
    check(`asset-present:${ref}`,found,{path:ref,reason:found?'Tracked asset available':'Referenced asset absent from public/; onError fallback is not faithful reconstruction'});
  }
  const browser = await chromium.launch({headless:true});
  try {
    for(const size of sizes){
      const context = await browser.newContext({viewport:{width:size.width,height:size.height},deviceScaleFactor:1,reducedMotion:'reduce'});
      const page = await context.newPage();
      const errors=[];
      page.on('pageerror',error=>errors.push('pageerror:'+error.message));
      page.on('console',msg=>{if(msg.type()==='error')errors.push('console:'+msg.text())});
      page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
      const response = await page.goto(base+'/landing',{waitUntil:'networkidle',timeout:60000});
      await page.evaluate(()=>document.fonts.ready);
      await page.screenshot({path:path.join(art,`${size.name}-viewport.png`),animations:'disabled'});
      await page.screenshot({path:path.join(art,`${size.name}-full.png`),fullPage:true,animations:'disabled'});
      const state=await page.evaluate(()=>{
        const shown=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
        const img=[...document.images].filter(shown).map(el=>({src:el.getAttribute('src'),url:el.currentSrc,ok:el.complete&&el.naturalWidth>0}));
        return {title:document.title,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,main:!![...document.querySelectorAll('main')].find(shown),heading:[...document.querySelectorAll('h1')].filter(shown).map(x=>x.innerText),images:img,hero:!![...document.querySelectorAll('.cm-hero,.catty-hero')].find(shown),font:getComputedStyle(document.body).fontFamily};
      });
      report.pages.push({route:'/landing',viewport:size, status:response.status(),state,errors});
      check(`${size.name}:http200`,response.status()===200,{status:response.status()});
      check(`${size.name}:main`,state.main);
      check(`${size.name}:heading`,state.heading.length>0,{headings:state.heading});
      check(`${size.name}:no-overflow`,state.scrollWidth<=state.width+1,{scrollWidth:state.scrollWidth,width:state.width});
      check(`${size.name}:images-decode`,state.images.every(i=>i.ok),{invalid:state.images.filter(i=>!i.ok)});
      check(`${size.name}:no-runtime-errors`,!errors.length,{errors});
      if(size.name==='mobile'){
        const faq=page.locator('.cm-faq-item button').first();
        check('mobile:faq-exists',await faq.count()>0);
        if(await faq.count()){
          await faq.click();
          check('mobile:faq-expand',(await faq.getAttribute('aria-expanded'))==='true');
          await faq.click();
          check('mobile:faq-collapse',(await faq.getAttribute('aria-expanded'))==='false');
        }
        const link=page.locator('a[href="#mobile-why"]').first();
        if(await link.count()){await link.click();check('mobile:anchor',await page.evaluate(()=>location.hash)==='#mobile-why');}
        else check('mobile:anchor',false,{reason:'Mobile navigation anchor missing'});
      }
      if(size.name==='desktop'){
        const buttons=page.locator('.catty-feature-tabs button');
        if(await buttons.count()===3){await buttons.nth(1).click();check('desktop:tabs',await buttons.nth(1).getAttribute('aria-pressed')==='true');}
        else check('desktop:tabs',false,{count:await buttons.count()});
      }
      await context.close();
    }
    const ctx=await browser.newContext({viewport:{width:390,height:844}});
    const app=await ctx.newPage();const errors=[];
    app.on('pageerror',e=>errors.push(e.message));
    const res=await app.goto(base+'/',{waitUntil:'domcontentloaded',timeout:30000});
    await app.screenshot({path:path.join(art,'app-viewport.png'),animations:'disabled'});
    const state=await app.evaluate(()=>({text:document.body.innerText.slice(0,1600),main:!!document.querySelector('main'),buttons:[...document.querySelectorAll('button')].slice(0,18).map(b=>b.getAttribute('aria-label')||b.innerText)}));
    report.pages.push({route:'/', status:res.status(),state,errors});
    check('app:http200',res.status()===200,{status:res.status()});
    check('app:no-uncaught-errors',errors.length===0,{errors});
    // Controlled negative case: no real Gemini secret in CI, so a real voice session must NOT be claimed.
    report.limitations.push('Gemini Live microphone, provider stream, real audio and Supabase authentication are not end-to-end validated without credentials/browser microphone.');
    report.limitations.push('Mockup reference is 3 phone compositions: visual similarity must compare an equivalent frame, not use unaligned whole-image pixel metrics.');
    await ctx.close();
  } finally { await browser.close(); }
  report.summary={passed:report.checks.filter(x=>x.passed).length,failed:report.checks.filter(x=>!x.passed).length,total:report.checks.length,approved:report.issues.length===0};
  fs.writeFileSync(path.join(art,'homologation.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(art,'homologation.md'),['# Catty — Image to Code E2E homologation',`Result: ${report.summary.approved?'PASS':'NOT APPROVED'}`,`Checks: ${report.summary.passed}/${report.summary.total}`, ...report.issues.map(i=>`- FAIL **${i.id}** — ${i.reason||JSON.stringify(i.details||{})}`), ...report.limitations.map(i=>`- LIMITATION: ${i}`)].join('\n')+'\n');
  console.log(JSON.stringify(report.summary));
  if(!report.summary.approved)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});