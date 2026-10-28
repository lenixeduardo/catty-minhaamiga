const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
 const browser = await chromium.launch({ headless: true });
 const sizes = [
  ['mobile-390x844',390,844],['mobile-375x812',375,812],
  ['tablet-768x1024',768,1024],['desktop-1440x900',1440,900]
 ];
 const report={date:new Date().toISOString(),url:'http://127.0.0.1:5173/landing',checks:[],screenshots:[],issues:[]};
 const check=(name,passed,details='')=>{report.checks.push({name,passed,details});if(!passed)report.issues.push(name+': '+details);};
 fs.mkdirSync('artifacts',{recursive:true});
 for(const [label,width,height] of sizes){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith('http://127.0.0.1:5173/'))errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(report.url,{waitUntil:'networkidle',timeout:60000});
  await page.screenshot({path:'artifacts/'+label+'-full.png',fullPage:true,animations:'disabled'});
  await page.screenshot({path:'artifacts/'+label+'-viewport.png',fullPage:false,animations:'disabled'});
  report.screenshots.push(label+'-full.png',label+'-viewport.png');
  const state=await page.evaluate(()=>{
   const imgs=[...document.images].filter(x=>x.getClientRects().length>0);
   const boxes=[...document.querySelectorAll('.cm-plan-cards article')].filter(x=>x.getClientRects().length>0).map(x=>{const r=x.getBoundingClientRect();const btn=x.querySelector('.cm-button')?.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,buttonBottom:btn?.bottom}});
   return {scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth,
    images:imgs.map(i=>({src:i.getAttribute('src'),actual:i.currentSrc,ok:i.complete&&i.naturalWidth>0,width:i.naturalWidth})),
    darkDemoVisible:(()=>{const e=document.querySelector('.cm-why');return !!e&&e.getClientRects().length>0&&getComputedStyle(e).display!=='none'})(),
    phoneVisible:(()=>{const e=document.querySelector('.cm-demo .cm-mini-phone');return !!e&&e.getClientRects().length>0})(),
    chatVisible:(()=>{const e=document.querySelector('.cm-chat-you');return !!e&&e.getClientRects().length>0})(),
    heroVisible:(()=>{const e=document.querySelector('.cm-hero');return !!e&&e.getClientRects().length>0})(),
    cards:boxes
   };
  });
  check(label+' no horizontal overflow',state.scrollWidth<=state.innerWidth+1,JSON.stringify({scrollWidth:state.scrollWidth,viewport:state.innerWidth}));
  check(label+' no broken visible images',state.images.every(i=>i.ok),JSON.stringify(state.images.filter(i=>!i.ok)));
  check(label+' no console/page/network errors',errors.length===0,JSON.stringify(errors));
  if(width<=780){
   check(label+' dark demo and chat visible',state.darkDemoVisible&&state.phoneVisible&&state.chatVisible,JSON.stringify({demo:state.darkDemoVisible,phone:state.phoneVisible,chat:state.chatVisible}));
   check(label+' hero visible',state.heroVisible);
   check(label+' both cards same height',state.cards.length===2&&Math.abs(state.cards[0].height-state.cards[1].height)<=2,JSON.stringify(state.cards));
   check(label+' buttons bottom aligned',state.cards.length===2&&Math.abs(state.cards[0].buttonBottom-state.cards[1].buttonBottom)<=3,JSON.stringify(state.cards));
   const faq=page.locator('.cm-faq-item button').first();
   await faq.click();
   check(label+' FAQ interaction',await faq.getAttribute('aria-expanded')==='true');
   await page.locator('a[href="#mobile-why"]').first().click();
   check(label+' anchor navigation',await page.evaluate(()=>location.hash)==='#mobile-why');
  }
  await page.close();
 }
 await browser.close();
 fs.writeFileSync('artifacts/validation.json',JSON.stringify(report,null,2));
 fs.writeFileSync('artifacts/validation.md','# Catty responsive validation\n\n'+report.checks.map(x=>'- '+(x.passed?'PASS':'FAIL')+' '+x.name+(x.details?' — '+x.details:'')).join('\n')+'\n');
 console.log(JSON.stringify({passed:report.checks.filter(c=>c.passed).length,failed:report.issues.length,issues:report.issues},null,2));
 if(report.issues.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});