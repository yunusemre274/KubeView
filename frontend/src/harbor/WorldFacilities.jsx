import React, { useMemo, useState } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { Box, Blocks, Cylinder, Hangar, Lettering, OperationsBuilding, UNIT_BOX } from './assets.jsx'

export const FACILITIES = Object.freeze([
  {id:'center',name:'Liman yönetimi',description:'Küme, Deployment ve iş yükü yönetimi',position:[-42,1,-72],size:[25,39,19],anchor:[4,30,-3]},
  {id:'workloads',name:'İş yükleri',description:'Deployment, StatefulSet, DaemonSet ve Pod siparişleri',position:[0,1,-67],size:[36,21,44],anchor:[0,11,21.8]},
  {id:'schedule',name:'Sefer takvimi',description:'Job, CronJob ve görev programları',position:[0,1,-25],size:[10,10,3],anchor:[0,6,0]},
  {id:'storage',name:'Depolama',description:'PVC, PV ve StorageClass depo sözleşmeleri',position:[80,1,-67],size:[36,21,44],anchor:[0,10,21.8]},
  {id:'config',name:'Talimat panosu',description:'ConfigMap, ResourceQuota ve çalışma talimatları',position:[-65,1,-52],size:[10,9,3],anchor:[0,5,0]},
  {id:'secrets',name:'Güvenlik kasası',description:'Secret değerleri varsayılan gizlidir',position:[-65,1,-75],size:[10,9,9],anchor:[0,5,4.6]},
  {id:'network',name:'Ağ istasyonu',description:'Service, EndpointSlice ve NetworkPolicy ilişkileri',position:[109,1,-54],size:[18,13,17],anchor:[0,8,8.6]},
  {id:'ingress',name:'Giriş feneri',description:'Ingress ve dış erişim kuralları',position:[82,1,96],size:[9,17,9],anchor:[0,11,0]},
  {id:'identity',name:'Personel ve kimlik',description:'ServiceAccount, Role ve RoleBinding yetkileri',position:[-101,1,-78],size:[22,14,19],anchor:[0,8,9.6]},
])
const EDGES=new THREE.EdgesGeometry(UNIT_BOX)
const hintStyle={background:'#fffffff0',color:'#223544',border:'1px solid #cad6dc',padding:'6px 9px',borderRadius:6,font:'500 12px/1.4 system-ui',whiteSpace:'nowrap',pointerEvents:'none',boxShadow:'0 2px 8px #183a4320'}

export function FacilityHit({id,name,description,position=[0,0,0],size,anchor,selected,canSelect,onOpen,children,diagnostic=true,hitbox=true}) {
  const [hover,setHover]=useState(false)
  const target=anchor||[0,size[1]*0.65,0]
  return <group position={position} name={`facility:${id}`} userData={diagnostic?{harborTarget:{type:'facility',id,name,local:target}}:{}} onClick={event=>{event.stopPropagation();if(canSelect(event))onOpen?.(id)}} onPointerOver={event=>{event.stopPropagation();setHover(true);document.body.style.cursor='pointer'}} onPointerOut={event=>{event.stopPropagation();setHover(false);document.body.style.cursor='auto'}}>
    {children}
    {hitbox&&<mesh position={[0,size[1]/2,0]} scale={size} geometry={UNIT_BOX} dispose={null}>
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false}/>
    </mesh>}
    {(hover||selected)&&<lineSegments position={[0,size[1]/2,0]} scale={size.map(v=>v+0.4)} geometry={EDGES} raycast={()=>null} dispose={null}><lineBasicMaterial color={selected?'#2771bd':'#ebc158'} transparent opacity={0.88} depthTest={false}/></lineSegments>}
    {hover&&<Html style={{pointerEvents:'none'}} center position={[0,size[1]+3,0]} zIndexRange={[18,0]}><div style={hintStyle}><strong>{name}</strong><div style={{fontSize:12,fontWeight:400,color:'#536776'}}>{description}</div></div></Html>}
  </group>
}
function Board({materials:m,calendar=false}) {
  const lines=useMemo(()=>Array.from({length:calendar?12:7},(_,i)=>({p:[calendar?-2.7+(i%4)*1.8:-0.5,calendar?3.2+Math.floor(i/4)*1.5:2.5+i*0.6,0.7],s:calendar?[1.2,0.85,0.08]:[6.5-(i%3)*1.2,0.14,0.08]})),[calendar])
  return <group>
    <Box position={[0,0.3,0]} scale={[10,0.6,3]} material={m.concrete}/>
    <Box position={[-3.7,4,0]} scale={[0.45,8,0.45]} material={m.yellow}/><Box position={[3.7,4,0]} scale={[0.45,8,0.45]} material={m.yellow}/>
    <Box position={[0,5.4,0]} scale={[9,6.9,1]} material={m.dark}/><Box position={[0,5.2,0.55]} scale={[8.2,5.7,0.15]} material={m.white}/>
    <Box position={[0,8,0.7]} scale={[8.2,0.9,0.18]} material={calendar?m.blue:m.yellow}/>
    <Blocks items={lines} material={calendar?m.blue:m.rail}/>
    <Lettering position={[0,7.8,0.84]} size={0.62} material={calendar?m.white:m.dark}>{calendar?'JOB / CRONJOB':'CONFIGMAP'}</Lettering>
  </group>
}
function Safe({materials:m}) {return <group>
  <Box position={[0,0.4,0]} scale={[11,0.8,10]} material={m.concrete}/><Box position={[0,4,0]} scale={[8.7,7.5,8]} material={m.dark}/>
  <Box position={[0,4,4.1]} scale={[7.7,6.5,0.45]} material={m.rail}/><Box position={[0,4,4.4]} scale={[6.5,5.3,0.22]} material={m.dark}/>
  <Cylinder position={[0,4,4.8]} scale={[1.1,0.3,1.1]} rotation={[Math.PI/2,0,0]} material={m.yellow}/>
  <Box position={[0,4,5]} scale={[0.25,2.5,0.22]} material={m.yellow}/><Box position={[0,4,5]} scale={[2.5,0.25,0.22]} material={m.yellow}/>
  <Lettering position={[0,7,4.5]} size={0.7} material={m.white}>SECRET</Lettering>
</group>}
function NetworkStation({materials:m}){return <group>
  <Box position={[0,5,0]} scale={[16,10,15]} material={m.roof}/><Box position={[0,10.5,0]} scale={[18,1,17]} material={m.dark}/>
  <Box position={[-4,4.5,7.6]} scale={[4,7.8,0.2]} material={m.dark}/><Box position={[3,6.8,7.7]} scale={[5.5,2.5,0.2]} material={m.window}/>
  <Cylinder position={[5,12,0]} scale={[0.2,5,0.2]} material={m.white}/><Box position={[5,13.7,0]} scale={[5,0.4,0.3]} material={m.rail}/>
  <Lettering position={[0,9.1,7.8]} size={1.1} material={m.white}>AG / SERVICE</Lettering>
  {[-5,-2,1,4].map(x=><Box key={x} position={[x,2.3,7.8]} scale={[1.5,0.22,0.2]} material={m.yellow}/>)}
</group>}
function Lighthouse({materials:m}) {return <group>
  <Cylinder position={[0,0.5,0]} scale={[4.2,1,4.2]} material={m.concrete}/><Cylinder position={[0,5.9,0]} scale={[1.7,11,1.7]} material={m.white}/>
  <Cylinder position={[0,8.8,0]} scale={[1.76,1.9,1.76]} material={m.rust}/><Cylinder position={[0,12.1,0]} scale={[2.5,1,2.5]} material={m.dark}/>
  <Cylinder position={[0,13.4,0]} scale={[1.9,1.9,1.9]} material={m.window}/><mesh position={[0,15.1,0]} material={m.red}><coneGeometry args={[2.6,1.6,10]}/></mesh>
</group>}
function IdentityOffice({materials:m}) {return <group>
  <Box position={[0,5.2,0]} scale={[21,10.4,18]} material={m.white}/><Box position={[0,10.8,0]} scale={[22,0.8,19]} material={m.roof}/>
  <Box position={[-5,4,9.1]} scale={[5,8,0.2]} material={m.dark}/><Box position={[4,5,9.2]} scale={[6,3.2,0.15]} material={m.window}/>
  <Box position={[9.5,5.2,0]} scale={[0.5,10.4,18]} material={m.yellow}/><Lettering position={[0,9.1,9.3]} size={0.88} material={m.dark}>KIMLIK / RBAC</Lettering>
</group>}

export default function WorldFacilities({materials,selectedFacility,onOpenFacility,canSelect,pierEnd}) {
  return <group>{FACILITIES.map(definition=> {
    const facility=definition.id==='ingress'?{...definition,position:[82,1,pierEnd-4]}:definition
    let model
    switch(facility.id){
      case 'center':model=<OperationsBuilding materials={materials} position={[0,0,0]}/>;break
      case 'workloads':model=<group><Hangar materials={materials} position={[0,0,0]}/><Box position={[10,8,22.1]} scale={[5.5,4.8,0.3]} material={materials.white}/><Box position={[10,9.7,22.3]} scale={[5,0.6,0.08]} material={materials.yellow}/>{[0,1,2,3].map(i=><Box key={i} position={[9.5,8.7-i*0.7,22.3]} scale={[3.8-(i%2),0.15,0.08]} material={materials.rail}/>)}</group>;break
      case 'storage':model=<Hangar materials={materials} position={[0,0,0]} variant={1}/>;break
      case 'schedule':model=<Board materials={materials} calendar/>;break
      case 'config':model=<Board materials={materials}/>;break
      case 'secrets':model=<Safe materials={materials}/>;break
      case 'network':model=<NetworkStation materials={materials}/>;break
      case 'identity':model=<IdentityOffice materials={materials}/>;break
      case 'ingress':model=<Lighthouse materials={materials}/>;break
    }
    return <FacilityHit key={facility.id} {...facility} selected={selectedFacility===facility.id} onOpen={onOpenFacility} canSelect={canSelect}>{model}</FacilityHit>
  })}</group>
}
