import {test,expect} from '@playwright/test'
const targets=page=>page.locator('canvas').evaluate(canvas=>canvas.__harbor.projectTargets({type:'container'}))
async function waitForStaticVessel(page){
  await expect.poll(()=>page.evaluate(()=>{
    const ships=window.harborQA?.fleetStates()||[]
    return ships.length===1&&ships.every(ship=>ship.speed===0&&Math.abs(ship.position[1])<0.00001&&Math.abs(ship.pitch)<0.00001&&Math.abs(ship.roll)<0.00001)
  }),{timeout:3000,intervals:[100]}).toBe(true)
}
async function clickAndCheck(page,descriptor){
  // Project immediately before the real mouse action. A single list of screen
  // coordinates is not a durable identity for a vessel that was moving earlier.
  const target=await page.locator('canvas').evaluate((canvas,descriptor)=>canvas.__harbor.projectTargets({type:'container',uid:descriptor.uid,containerName:descriptor.containerName,containerRole:descriptor.containerRole})[0],descriptor)
  expect(target?.visible).toBe(true)
  const picksBefore=await page.evaluate(()=>window.harborQA.picks.length)
  await page.mouse.click(target.x,target.y)
  await expect.poll(()=>page.evaluate(()=>window.harborQA.picks.length)).toBe(picksBefore+1)
  await expect.poll(()=>page.evaluate(()=>window.harborQA.picks.at(-1))).toEqual({type:'resource',uid:target.uid,containerName:target.containerName,containerRole:target.containerRole})
}
test('all deck slots0..20 return exact UID through real canvas raycasts, including newly uncovered lower boxes',async({page})=>{
  await page.goto('/src/harbor/qa.html?nodes=1&pods=21')
  await page.waitForFunction(()=>window.harborQA?.stats()?.lifecycle?.canonicalPods===21)
  // This is the stationary occlusion/picking fixture, not the separate moving
  // target interaction test. Recreate only this explicit QA source after setting
  // its presentation preferences so it starts at a deterministic berth.
  await page.evaluate(()=>window.harborQA.flush(()=>{
    window.harborQA.setPreferences({patrol:false,sea:false,bob:false})
    window.harborQA.profile(1,21)
  }))
  await waitForStaticVessel(page)
  const initial=await targets(page),seen=new Set()
  expect(initial).toHaveLength(21)
  for(const target of initial.filter(target=>target.visible)){await clickAndCheck(page,target);seen.add(target.uid)}
  // Solid upper cargo must keep its occlusion. Remove it from this explicit QA
  // fixture, then verify the lower visible faces become real click targets.
  await page.evaluate(()=>['fixture-pod-18','fixture-pod-19','fixture-pod-20'].forEach(uid=>window.harborQA.remove(uid)))
  await expect.poll(()=>page.evaluate(()=>window.harborQA.stats().lifecycle.canonicalPods)).toBe(18)
  await page.waitForTimeout(700) // the bounded confirmed-DELETE exit transition
  const uncovered=await targets(page)
  expect(uncovered.every(target=>target.visible)).toBe(true)
  for(const target of uncovered){await clickAndCheck(page,target);seen.add(target.uid)}
  expect(seen.size).toBe(21)
})
test('scheduled arrival releases its load and its exact container remains clickable after crane or bounded fallback completion',async({page})=>{
  await page.goto('/src/harbor/qa.html?nodes=1&pods=21')
  await page.waitForFunction(()=>window.harborQA?.stats()?.lifecycle?.canonicalPods===21)
  await page.evaluate(()=>window.harborQA.pending('arriving-exact-uid'))
  await expect.poll(()=>page.evaluate(()=>window.harborQA.stats().lifecycle.canonicalPods)).toBe(22)
  await page.evaluate(()=>window.harborQA.schedule('arriving-exact-uid','worker-01'))
  const deadline=Date.now()+14500
  // Fleet preparation may legitimately take up to 10 seconds before its 700 ms
  // fallback (or 2.1 second crane transfer). Canonical state is already current.
  expect(await page.evaluate(()=>window.harborQA.stats().lifecycle.canonicalPods)).toBe(22)
  await expect.poll(()=>page.evaluate(()=>window.harborQA.stats().lifecycle.visualLoadingUIDs.includes('arriving-exact-uid')),{timeout:2000,intervals:[100]}).toBe(true)
  await expect.poll(()=>page.evaluate(()=>window.harborQA.stats().lifecycle.activeTransfers),{timeout:Math.max(1,deadline-Date.now()),intervals:[100]}).toBeGreaterThan(0)
  await expect.poll(()=>page.evaluate(()=>{
    const state=window.harborQA.stats().lifecycle
    return state.activeTransfers+state.queuedTransfers
  }),{timeout:Math.max(1,deadline-Date.now()),intervals:[100]}).toBe(0)
  expect(await page.evaluate(()=>window.harborQA.stats().lifecycle.canonicalPods)).toBe(22)
  // Freeze only after the complete observed visual job, then test its real
  // raycast target. This does not turn a fallback into a physical crane proof.
  await page.evaluate(()=>window.harborQA.setPreferences({patrol:false,sea:false,bob:false}))
  await waitForStaticVessel(page)
  const target=(await page.locator('canvas').evaluate(canvas=>canvas.__harbor.projectTargets({type:'container',uid:'arriving-exact-uid'})))[0]
  expect(target.visible).toBe(true)
  await clickAndCheck(page,target)
})
