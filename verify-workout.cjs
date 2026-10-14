const {chromium}=require('C:/Users/usuario/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try {
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 const choose=async(form,name,value)=>{await form.locator(`[data-picker="${name}"]`).click();assert.equal(await page.locator('.value-picker [data-value]').count(),name==='reps'?20:101);await page.locator(`.value-picker [data-value="${value}"]`).click();assert.equal(await form.locator(`[name="${name}"]`).inputValue(),String(value));}; const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(require('node:path').resolve('Index.html')).href);
 await page.evaluate(()=>localStorage.clear());await page.reload();
 await page.fill('#username','pedro');await page.fill('#password','wrong');await page.click('button[type=submit]');
 assert(await page.locator('#login-message').textContent());
 await page.fill('#password','1234');await page.click('button[type=submit]');
 const expectedGroups={Perna:13,'Braço':7,Peito:3,Costas:4,Ombro:4};
 for(const [group,count] of Object.entries(expectedGroups)){await page.click(`[data-filter="${group}"]`);assert.equal(await page.locator('.exercise-card').count(),count);}
 await page.click('[data-filter="Perna"]');assert(await page.locator('[data-add="agachamento"]').textContent().then(t=>t.includes('Agachamento livre')));
 assert.equal(await page.getByText('Cadeira abdutora',{exact:true}).count(),0);
 await page.click('[data-filter="Peito"]');assert.equal(await page.locator('.exercise-card').count(),3);
 await page.click('[data-add="supino"]');await page.click('[data-add="voador"]');
 await page.click('[data-up="voador"]');assert.equal(await page.locator('.selected-list li').first().getAttribute('data-order'),'voador');
 await page.fill('#body-weight','70');await page.locator('#body-weight').blur();
 await page.click('#start-workout');
 await page.locator('[data-exercise="voador"] [data-picker="reps"]').click();
 await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');
 assert.equal(await page.locator('[data-exercise="voador"] [name="reps"]').inputValue(),'2');
 await page.locator('[data-exercise="voador"] [data-picker="kg"]').click();await page.keyboard.press('End');await page.keyboard.press('Enter');
 assert.equal(await page.locator('[data-exercise="voador"] [name="kg"]').inputValue(),'500');
 await page.locator('[data-exercise="voador"] [data-picker="kg"]').click();await page.screenshot({path:'preview-picker-mobile.png'});await page.keyboard.press('Escape');
 const series=page.locator('[data-exercise="voador"]');await choose(series,'reps',10);await choose(series,'kg',20);await series.locator('button[type="submit"]').click();
 await choose(series,'reps',12);await choose(series,'kg',25);await series.locator('button[type="submit"]').click();
 await page.click('#save-workout');await page.reload();
 await page.fill('#username','pedro');await page.fill('#password','1234');await page.click('button[type=submit]');
 assert.equal(await page.locator('.set-list li').count(),2);
 await page.evaluate(()=>{const key='pulse-workout-v1';const s=JSON.parse(localStorage.getItem(key));s.started=Date.now()-3600000;localStorage.setItem(key,JSON.stringify(s));});await page.reload();
 await page.fill('#username','pedro');await page.fill('#password','1234');await page.click('button[type=submit]');
 await page.click('#finish-workout');const metrics=await page.locator('.metric strong').allTextContents();assert.deepEqual(metrics.slice(0,2),['2','22']);assert.equal(metrics[3],'500 kg·rep');
 assert.equal(await page.locator('.calorie-number').textContent(),'≈ 250 kcal');
 for(const width of [320,390,760,1024,1440]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);}
 await page.click('#new-workout');await page.click('[data-add="agachamento"]');
 // Exercita a alça de arrastar com Pointer Events, incluindo reordenação por coordenadas.
 await page.setViewportSize({width:1024,height:844});await page.click('[data-filter="Braço"]');
 const h=page.locator('[data-drag="rosca"]');await h.scrollIntoViewIfNeeded();const hb=await h.boundingBox();const z=await page.locator('#drop-zone').boundingBox();
 await page.mouse.move(hb.x+20,hb.y+20);await page.mouse.down();await page.mouse.move(z.x+40,z.y+60,{steps:15});await page.mouse.up();assert.equal(await page.locator('.selected-list li').count(),2);
 await page.click('[data-filter="Peito"]');
 const th=page.locator('[data-drag="voador"]');await th.scrollIntoViewIfNeeded();const tb=await th.boundingBox(),tz=await page.locator('#drop-zone').boundingBox();
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tb.x+20,y:tb.y+20}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tz.x+50,y:tz.y+80}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.locator('.selected-list li').count(),3);
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'preview-mobile.png',fullPage:true});
 // Dados legados fora dos novos intervalos não devem ser alterados.
 await page.evaluate(()=>localStorage.setItem('pulse-workout-v1',JSON.stringify({phase:'active',selected:['agachamento','unilateral'],weight:'70',started:Date.now()-1000,ended:null,sets:{agachamento:[{reps:25,kg:22.5}],unilateral:[{reps:10,kg:2.5}]}})));
 await page.reload();await page.fill('#username','pedro');await page.fill('#password','1234');await page.click('button[type=submit]');
 assert((await page.locator('.execution-list').textContent()).includes('Remada serrote'));assert((await page.locator('.set-list').first().textContent()).includes('22,5'));
 const legacy=page.locator('[data-exercise="agachamento"]');await choose(legacy,'reps',20);await choose(legacy,'kg',0);await legacy.locator('button[type="submit"]').click();
 await page.click('#finish-workout');assert.equal(await page.locator('.metric strong').nth(3).textContent(),'587,5 kg·rep');
 assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('pulse-workout-v1')).sets.agachamento[0].kg===22.5));
 assert.deepEqual(errors,[]);console.log('OK: login, filtros, seleção, ordenação, arraste com mouse e toque emulado, séries, persistência após recarga, resumo (2 séries, 22 repetições, 500 kg·rep), calorias (70 kg/1 hora), sem overflow em 320–1440 px.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});


