const fs=require('fs');
const {chromium}=require(process.cwd()+'/node_modules/playwright');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const [baseUrl,label,out]=process.argv.slice(-3); const account='z6Mko3CyjG9n8KX8Hr3CCq7461mcvh15uSmaVih7uJQt6t9i';
 const issues=[]; let browser,page,trace=false; const startedAt=new Date().toISOString();
 try {
  browser=await chromium.launch({headless:true}); const context=await browser.newContext({viewport:{width:1280,height:900}}); page=await context.newPage();
  page.on('console',m=>{if(['error','warning'].includes(m.type()))issues.push({type:'console-'+m.type(),text:m.text()})}); page.on('pageerror',e=>issues.push({type:'pageerror',text:String(e)})); page.on('requestfailed',r=>issues.push({type:'requestfailed',text:r.url(),failure:r.failure()}));
  await context.tracing.start({screenshots:true,snapshots:true,sources:false}); trace=true;
  const target=`${baseUrl}/hm/${account}/issue-972-move-destination`; await page.goto(target,{waitUntil:'domcontentloaded',timeout:90000});
  const moved=page.getByRole('link',{name:'Moved guide',exact:true}); await moved.first().waitFor({state:'visible',timeout:90000}); const movedCount=await moved.count(); const movedText=await moved.allTextContents();
  const republished=page.getByRole('link',{name:'Republished guide',exact:true}); const republishCount=await republished.count(); const republishText=await republished.allTextContents();
  await page.screenshot({path:out+'/file-browser.png',fullPage:true});
  const result={label,sourceSha:'4b356bfb29a801a6ad310e16942e3f1dc72a66fd',surface:'web',url:target,startedAt,finishedAt:new Date().toISOString(),status:movedCount===1&&republishCount>=1?'BASELINE_NOT_REPRODUCED':'REPRODUCED',assertion:{movedGuideExpectedCount:1,movedGuideActualCount:movedCount,republishExpectedMinimum:1,republishActualCount:republishCount},movedText,republishText,issues};
  fs.writeFileSync(out+'/summary.json',JSON.stringify(result,null,2)); console.log(JSON.stringify(result));
  if(movedCount!==1)throw new Error(`plain move redirect remains listed: Moved guide count ${movedCount}`); if(republishCount<1)throw new Error('republish redirect missing');
 } catch(e){if(page){try{await page.screenshot({path:out+'/failure.png',fullPage:true})}catch{} try{fs.writeFileSync(out+'/failure-body.txt',await page.locator('body').innerText({timeout:2000}))}catch{}} if(!fs.existsSync(out+'/summary.json'))fs.writeFileSync(out+'/summary.json',JSON.stringify({label,startedAt,finishedAt:new Date().toISOString(),status:'ERROR',error:String(e),issues},null,2)); console.error(e); process.exitCode=1}
 finally {if(trace)await page.context().tracing.stop({path:out+'/trace.zip'}).catch(()=>{}); if(browser)await browser.close().catch(()=>{});}
})()
