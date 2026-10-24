import {test,expect} from '@playwright/test'
const targets=page=>page.locator('canvas').evaluate(canvas=>canvas.__harbor.projectTargets({type:'container'}))
async function clickAndCheck(page,target){
  await page.mouse.click(target.x,target.y)
  await expect.poll(()=>page.evaluate(()=>window.harborQA.picks.at(-1))).toEqual({type:'resource',uid:target.uid,containerName:target.containerName,containerRole:target.containerRole})
}
test('all deck slots0..20 return exact UID through real canvas raycasts, including newly uncovered lower boxes',async({page})=>{
  await page.goto('/src/harbor/qa.html?nodes=1&pods=21')
  await page.waitForFunction(()=>window.harborQA?.stats()?.lifecycle?.canonicalPods===21)
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
test('scheduled arrival releases its load and its exact container remains clickable after crane completion',async({page})=>{
  await page.goto('/src/harbor/qa.html?nodes=1&pods=21')
  await page.waitForFunction(()=>window.harborQA?.stats()?.lifecycle?.canonicalPods===21)
  await page.evaluate(()=>window.harborQA.pending('arriving-exact-uid'))
  await expect.poll(()=>page.evaluate(()=>window.harborQA.stats().lifecycle.canonicalPods)).toBe(22)
  await page.evaluate(()=>window.harborQA.schedule('arriving-exact-uid','worker-01'))
  await expect.poll(()=>page.evaluate(()=>window.harborQA.stats().lifecycle.activeTransfers)).toBeGreaterThan(0)
  await expect.poll(()=>page.evaluate(()=>window.harborQA.stats().lifecycle.activeTransfers)).toBe(0)
  const target=(await page.locator('canvas').evaluate(canvas=>canvas.__harbor.projectTargets({type:'container',uid:'arriving-exact-uid'})))[0]
  expect(target.visible).toBe(true)
  await clickAndCheck(page,target)
})
