// Scene picking never changes Kubernetes identity. Display labels remain separate.
export function containersForPod(pod) {
  const groups=[['container',pod?.spec?.containers],['init',pod?.spec?.initContainers],['ephemeral',pod?.spec?.ephemeralContainers]]
  const entries=groups.flatMap(([role,items])=>(items||[]).map(container=>({containerName:container.name,role,container})))
  return entries.length?entries:[{containerName:undefined,role:'pod',container:null}]
}
export function containerInstances(pods) {
  return pods.flatMap(resource=>containersForPod(resource).map((container,index,containers)=>({resource,...container,index,count:containers.length})))
}
export class PointerGesture {
  constructor(threshold=5){this.threshold=threshold;this.start=null;this.moved=false;this.lastButton=0}
  down(event){this.start=[event.clientX,event.clientY];this.moved=false;this.lastButton=event.button??0}
  move(event){if(this.start&&Math.hypot(event.clientX-this.start[0],event.clientY-this.start[1])>this.threshold)this.moved=true}
  up(event){this.move(event)}
  canSelect(event){return this.lastButton===0&&!this.moved&&(event?.delta==null||event.delta<=this.threshold)}
}
