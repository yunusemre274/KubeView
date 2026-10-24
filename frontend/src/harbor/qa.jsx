// Development-only deterministic WebGL benchmark entry. Never imported by the product.
import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import HarborScene from './HarborScene.jsx'
export function fixture(nodes=20,pods=300) {
  const created='2026-10-23T00:00:00Z'
  return [
    ...Array.from({length:nodes},(_,i)=>({apiVersion:'v1',kind:'Node',metadata:{uid:`fixture-node-${i}`,name:`worker-${String(i+1).padStart(2,'0')}`,creationTimestamp:created},spec:{},status:{conditions:[{type:'Ready',status:'True'}]}})),
    ...Array.from({length:pods},(_,i)=>({apiVersion:'v1',kind:'Pod',metadata:{uid:`fixture-pod-${i}`,name:`workload-${i}`,namespace:`fixture-${i%4}`,creationTimestamp:created,ownerReferences:[{kind:'ReplicaSet',uid:`workload-${i%7}`,name:`workload-${i%7}`}]},spec:{nodeName:`worker-${String(i%nodes+1).padStart(2,'0')}`,containers:[{name:'app',image:'fixture:no-image-pull'}]},status:{phase:'Running',conditions:[{type:'Ready',status:'True'}],containerStatuses:[{name:'app',ready:true,restartCount:0,state:{running:{startedAt:created}}}]}}))
  ]
}
function QA(){
  const query=new URLSearchParams(location.search)
  const [resources,setResources]=useState(()=>fixture(Number(query.get('nodes')||20),Number(query.get('pods')||300))),[quality,setQuality]=useState(query.get('quality')||'medium'),[source,setSource]=useState(0),[motion,setMotion]=useState(false),[selection,setSelection]=useState(null),[stats,setStats]=useState(null),[labels,setLabels]=useState(false),[facility,setFacility]=useState(null)
  useEffect(()=>{
    window.harborQA={
      picks:[],
      profile:(nodes,pods)=>{setResources(fixture(nodes,pods));setSource(s=>s+1)},
      setResources,
      pending:(uid='fixture-pending')=>setResources(list=>[...list,{apiVersion:'v1',kind:'Pod',metadata:{uid,name:uid,namespace:'fixture-pending'},spec:{containers:[{name:'app'}]},status:{phase:'Pending'}}]),
      schedule:(uid='fixture-pending',nodeName='worker-01')=>setResources(list=>list.map(r=>r.metadata.uid===uid?{...r,spec:{...r.spec,nodeName},status:{...r.status,phase:'Running'}}:r)),
      remove:uid=>setResources(list=>list.filter(r=>r.metadata.uid!==uid)),
      restart:(uid='fixture-pod-0',reason='OOMKilled')=>setResources(list=>list.map(r=>r.metadata.uid===uid?{...r,status:{...r.status,containerStatuses:[{name:'app',ready:true,restartCount:(r.status?.containerStatuses?.[0]?.restartCount||0)+1,state:{running:{}},lastState:{terminated:{reason,finishedAt:new Date().toISOString()}}}]}}:r)),
      node:(uid='fixture-node-0',status='Unknown')=>setResources(list=>list.map(r=>r.metadata.uid===uid?{...r,status:{...r.status,conditions:[{type:'Ready',status}]}}:r)),
      stats:()=>document.querySelector('canvas')?.__harbor?.stats(),
      select:setSelection,
    }
    return()=>{delete window.harborQA}
  },[])
  useEffect(()=>{const timer=setInterval(()=>setStats(window.harborQA?.stats()),2000);return()=>clearInterval(timer)},[])
  return <><header><strong>KubeView · Harbor QA <span className="fixture-label">Sentetik fixture · canlı küme değil</span></strong><button onClick={()=>window.harborQA.profile(20,300)}>20 Node / 300 Pod</button><button onClick={()=>window.harborQA.profile(50,1500)}>50 Node / 1500 Pod</button><label><input type="checkbox" checked={labels} onChange={e=>setLabels(e.target.checked)}/> Etiket</label><label><input type="checkbox" checked={motion} onChange={e=>setMotion(e.target.checked)}/> Reduced motion</label><select value={quality} onChange={e=>setQuality(e.target.value)}><option value="low">Düşük</option><option value="medium">Orta</option><option value="high">Yüksek</option></select></header><div id="scene" style={query.get('height')?{height:Number(query.get('height'))}:undefined}><HarborScene resources={resources} sourceKey={`fixture-${source}`} selectedUID={selection?.metadata?.uid} onSelect={(resource,info)=>{setSelection(resource);window.harborQA.picks.push({type:'resource',uid:resource.metadata.uid,...info})}} onOpenFacility={id=>{setFacility(id);window.harborQA.picks.push({type:'facility',id})}} selectedFacility={facility} quality={quality} layers={{labels,storage:true,network:false}} reducedMotion={motion} snapshotReady/>{stats&&<output>{JSON.stringify(stats)}</output>}</div></>
}
createRoot(document.getElementById('root')).render(<QA/> )
