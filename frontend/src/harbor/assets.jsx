import React, { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json'
import { HARBOR_DIMENSIONS as D } from '../constants/dimensions.js'

const font = new FontLoader().parse(fontData)
export const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1)
const UNIT_CYLINDER = new THREE.CylinderGeometry(1, 1, 1, 8)
const dummy = new THREE.Object3D()
const color = new THREE.Color()

export function Blocks({ items, material, castShadow = true, receiveShadow = true, geometry = UNIT_BOX, ...props }) {
  const ref = useRef()
  useLayoutEffect(()=>{const instance=ref.current;return()=>instance?.dispose ? instance.dispose() : instance?.dispatchEvent({type:'dispose'})},[items.length])
  useLayoutEffect(() => {
    if (!ref.current) return
    items.forEach((item, index) => {
      dummy.position.set(...item.p)
      dummy.rotation.set(...(item.r || [0, 0, 0]))
      dummy.scale.set(...item.s)
      dummy.updateMatrix()
      ref.current.setMatrixAt(index, dummy.matrix)
      if (item.c) ref.current.setColorAt(index, color.set(item.c))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [items])
  return items.length ? <instancedMesh key={items.length} ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow={receiveShadow} dispose={null} {...props} /> : null
}
export function Box({ position = [0,0,0], scale = [1,1,1], material, rotation, ...props }) {
  return <mesh position={position} scale={scale} rotation={rotation} geometry={UNIT_BOX} material={material} castShadow receiveShadow {...props} dispose={null} />
}
export function Cylinder({ position, scale, material, rotation }) { return <mesh position={position} scale={scale} material={material} rotation={rotation} geometry={UNIT_CYLINDER} castShadow receiveShadow dispose={null} /> }
export function Beam({ a, b, thickness = 0.35, depth = thickness, material }) {
  const { mid, length, quaternion } = useMemo(() => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start)
    return { mid: start.clone().add(end).multiplyScalar(0.5), length: direction.length(), quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), direction.normalize()) }
  }, [a.join(','), b.join(',')])
  return <mesh geometry={UNIT_BOX} material={material} position={mid} quaternion={quaternion} scale={[thickness, length, depth]} castShadow dispose={null} />
}
export function Lettering({ children, position, rotation, size = 1.6, material, center = true }) {
  const geometry = useMemo(() => {
    const g = new TextGeometry(String(children), { font, size, depth: 0.015, curveSegments: 2, bevelEnabled: false })
    g.computeBoundingBox()
    if (center) g.translate(-(g.boundingBox.max.x - g.boundingBox.min.x) / 2, 0, 0)
    return g
  }, [String(children), size, center])
  useLayoutEffect(() => () => geometry.dispose(), [geometry])
  return <mesh position={position} rotation={rotation} geometry={geometry} material={material} />
}

function hullGeometry(bottom, top, bottomScale, topScale) {
  // Stern is square; the bow narrows continuously into a raised stem.
  const outline = [[-5.8,-36],[5.8,-36],[7.5,-31],[8,-22],[8,18],[6.3,27],[3.6,33],[0,36],[-3.6,33],[-6.3,27],[-8,18],[-8,-22],[-7.5,-31]]
  const positions = [], indices = []
  for (const [y, scale] of [[bottom,bottomScale],[top,topScale]]) for (const [x,z] of outline) positions.push(x * scale, y, z)
  const n = outline.length
  for (let i = 0; i < n; i++) { const j = (i+1)%n; indices.push(i,n+i,j,j,n+i,n+j) }
  const triangles = THREE.ShapeUtils.triangulateShape(outline.map(([x,z]) => new THREE.Vector2(x,z)), [])
  for (const triangle of triangles) indices.push(...triangle.map(i => n+i).reverse())
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
export const HULL = hullGeometry(0.45,3.5,0.95,1)
const KEEL = hullGeometry(-2.3,0.45,0.68,0.95)
const DECK = hullGeometry(3.49,3.8,0.97,0.97)
const HULL_EDGES=new THREE.EdgesGeometry(HULL,18)

export function CargoShip({ position, materials: m, selected, state = 'unknown', lowDetail = false, onClick, onPointerOver, onPointerOut, slot = 0, radarData, hovered = false }) {
  const fittings = useMemo(() => {
    const windows = [], white = [], accents = [], dark = [], red = [], mast = []
    white.push({p:[0,5.6,-27.5],s:[11,3.7,12.5]},{p:[0,8.9,-27],s:[9.5,3.3,10]},{p:[0,11.7,-26],s:[11,2.2,8]},{p:[0,13,-26],s:[11.9,0.35,8.8]},{p:[0,17.5,-24],s:[5.2,0.16,0.16]},{p:[0,4.6,30.1],s:[3.2,1.2,5.3]})
    dark.push({p:[0,13.3,-29.6],s:[3.2,3.8,2.9]})
    red.push({p:[0,15.4,-29.6],s:[3.3,0.8,3]},{p:[5.8,5.2,-26],s:[0.8,0.8,2.4]})
    windows.push({p:[0,11.6,-21.93],s:[10.1,0.8,0.08]},{p:[0,17.9,-23.9],s:[2.2,0.3,0.4]})
    mast.push({p:[0,16.1,-24],s:[0.15,6,0.15]},{p:[0,7.2,30],s:[0.13,5.8,0.13]})
    for (const side of [-1,1]) {
      for (let index = 0; index < 6; index++) windows.push({p:[side*4.55,10.4,-27.4+index*1.4],s:[0.07,0.95,0.95]})
      if (!lowDetail) {
        for (let index = 0; index < 7; index++) windows.push({p:[-3.8+index*1.27,11.1,-22.7],s:[0.8,0.85,0.08]})
        for (let index = 0; index < 19; index++) white.push({p:[side*7.5,4.4,-21+index*2.8],s:[0.11,1.1,0.11]})
        white.push({p:[side*7.5,4.9,4],s:[0.09,0.09,51]})
        for (const z of [-30,-16,0,16,27]) accents.push({p:[side*7.78,2.1,z],s:[0.17,0.55,1.1]})
      }
    }
    return { windows, white, accents, dark, red, mast }
  }, [lowDetail])
  return <group position={position} rotation={[0,0,0]} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
    <mesh geometry={KEEL} material={m.red} castShadow receiveShadow dispose={null}/>
    <mesh geometry={HULL} material={m.blue} castShadow receiveShadow dispose={null}/>
    <mesh geometry={DECK} material={m.deck} receiveShadow dispose={null}/>
    <Blocks items={fittings.windows} material={m.window}/>
    <Blocks items={fittings.white} material={m.white}/>
    <Blocks items={fittings.dark} material={m.dark}/>
    <Blocks items={fittings.red} material={m.red}/>
    <Blocks items={fittings.accents} material={m.black}/>
    <Blocks items={fittings.mast} material={m.white} geometry={UNIT_CYLINDER}/>
    {!lowDetail && <>
      <Lettering position={[8.03,1.55,2]} rotation={[0,Math.PI/2,0]} size={1.55} material={m.white}>KUBEVIEW</Lettering>
      <Lettering position={[-8.03,1.55,-2]} rotation={[0,-Math.PI/2,0]} size={1.55} material={m.white}>KUBEVIEW</Lettering>
      <Lettering position={[0,6.3,-33.79]} rotation={[0,Math.PI,0]} size={1.25} material={m.dark}>{`NODE ${String(slot+1).padStart(2,'0')}`}</Lettering>
    </>}
    <group position={[0,18.3,-24]} name="node-radar" userData={{harborTarget:radarData?{type:'node-radar',...radarData,local:[0,0.9,0]}:undefined}} onClick={event=>{event.stopPropagation();onClick?.(event)}}>
      <Cylinder position={[0,0.3,0]} scale={[0.3,1,0.3]} material={m.rail}/><Box position={[0,1.1,0]} scale={[4.2,0.9,0.7]} rotation={[0,0.35,0]} material={m.white}/>
      <Box position={[0,1.1,0.4]} scale={[3.7,0.55,0.15]} rotation={[0,0.35,0]} material={m.window}/>
    </group>
    <Cylinder position={[-4.5,13.4,-24]} scale={[0.38,0.5,0.38]} material={state === 'ready' ? m.yellow : state === 'failed' ? m.rust : m.rail}/>
    {(selected||hovered)&&<lineSegments geometry={HULL_EDGES} raycast={()=>null} scale={[1.015,1.015,1.005]} position={[0,0.05,0]} dispose={null}><lineBasicMaterial color={selected?'#4a8bd8':'#e5be62'} transparent opacity={0.95} depthTest={false}/></lineSegments>}
  </group>
}

export function Hangar({ position, materials: m, variant = 0 }) {
  const ribs = useMemo(() => {
    const items=[]
    for (let z=-20; z<=20; z+=2.6) for (const x of [-17.6,17.6]) items.push({p:[x,9,z],s:[0.2,17,0.25]})
    return items
  }, [])
  return <group position={position}>
    <Box position={[0,9,0]} scale={[D.HANGAR_WIDTH,18,D.HANGAR_LENGTH]} material={variant ? m.lightRoof : m.dark}/>
    <Box position={[-8.7,18.8,0]} scale={[18,0.8,44]} rotation={[0,0,0.1]} material={variant ? m.lightRoof : m.roof}/>
    <Box position={[8.7,18.8,0]} scale={[18,0.8,44]} rotation={[0,0,-0.1]} material={variant ? m.lightRoof : m.roof}/>
    <Box position={[0,7.2,21.6]} scale={[24,14.3,0.18]} material={m.black}/>
    <Box position={[0,13.5,21.8]} scale={[22,2.2,0.2]} material={m.roof}/>
    <Box position={[0,15.9,21.9]} scale={[25,0.5,0.35]} material={m.yellow}/>
    {[-13,13].map(x => <Box key={x} position={[x,7.8,21.9]} scale={[0.65,15.2,0.4]} material={m.yellow}/>)}
    <Box position={[0,9,21.95]} scale={[0.25,10.6,0.12]} material={m.rail}/>
    <Blocks items={ribs} material={variant ? m.white : m.rail}/>
    <Lettering position={[0,16.5,22.15]} size={1.6} material={variant ? m.dark : m.white}>{variant ? 'DEPOLAMA' : 'TERSANE'}</Lettering>
    <Box position={[13.8,2.6,22]} scale={[3,5.2,0.2]} material={m.roof}/>
    <Box position={[13.8,3.4,22.15]} scale={[1.8,1.1,0.1]} material={m.window}/>
    {[-13,13].map(x => <Box key={`line${x}`} position={[x,0.08,29]} scale={[0.28,0.06,12]} material={m.yellow}/>)}
  </group>
}

export function Gantry({ position = [0,0,0], materials: m, rust = false, trolley = 0, hoist = 10, active = false, lowDetail = false, externalHoist = false, doubleJib = false }) {
  const metal = rust ? m.rust : m.yellow
  const parts = useMemo(() => {
    const frame=[], wheels=[], rails=[], windows=[]
    const beam=(a,b,t=0.35,d=t) => {
      const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start)
      const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize())
      const e=new THREE.Euler().setFromQuaternion(q)
      frame.push({p:start.add(end).multiplyScalar(0.5).toArray(),s:[t,direction.length(),d],r:[e.x,e.y,e.z]})
    }
    for(const x of [-9,9]) {
      for(const z of [-4.8,4.8]) {
        beam([x*1.03,2,z],[x*0.78,28,z*0.5],1,0.9)
        frame.push({p:[x,1.4,z],s:[2,1.1,3.4]})
        for(const dz of [-0.9,0.9])wheels.push({p:[x,0.75,z+dz],s:[0.65,2.1,0.65],r:[0,0,Math.PI/2]})
      }
      beam([x*0.8,25,-2.5],[x*0.8,25,2.5],0.7)
      beam([x,5,-4.8],[x,17,2.7],0.3)
    }
    frame.push({p:[doubleJib?0:10.5,28,0],s:[doubleJib?60:43,2.7,3.1]},{p:[-8,25.6,2.4],s:[3.5,3.6,2.5]})
    windows.push({p:[-7.8,25.9,3.7],s:[2.5,1.7,0.1]})
    if(!lowDetail) {
      rails.push({p:[doubleJib?0:10.5,30,1.6],s:[doubleJib?60:43,0.12,0.1]})
      for(let i=0;i<14;i++)rails.push({p:[-10+i*2.8,29.7,1.6],s:[0.09,0.8,0.09]})
    }
    return{frame,wheels,rails,windows}
  },[lowDetail,doubleJib])
  return <group position={position}>
    <Blocks items={parts.frame} material={metal}/>
    <Blocks items={parts.wheels} material={m.black} geometry={UNIT_CYLINDER}/>
    <Blocks items={parts.rails} material={m.rail}/>
    <Blocks items={parts.windows} material={m.window}/>
    <Box position={[doubleJib?0:10.5,29.5,0]} scale={[doubleJib?60:43,0.18,3.5]} material={m.white}/>
    {!externalHoist && <><Box position={[trolley,26.1,0]} scale={[4,1.4,4.1]} material={m.dark}/>
      <Cylinder position={[trolley,25.1-hoist/2,0]} scale={[0.055,hoist,0.055]} material={m.rail}/>
      <Cylinder position={[trolley+1.2,25.1-hoist/2,0]} scale={[0.055,hoist,0.055]} material={m.rail}/>
      <Box position={[trolley+0.6,25.1-hoist,0]} scale={[3.7,0.45,6.3]} material={metal}/></>}
    {!lowDetail && <Lettering position={[doubleJib?0:10.5,27.1,1.58]} size={1.35} material={rust ? m.white : m.dark}>KUBEVIEW</Lettering>}
    {active && <Cylinder position={[-9,30.3,0]} scale={[0.4,0.6,0.4]} material={m.rust}/>}
  </group>
}

export function OperationsBuilding({ position = [0,0,0], materials: m }) {
  const windows = useMemo(() => Array.from({length:12},(_,i) => ({p:[-7+(i%4)*4.7,3.5+Math.floor(i/4)*3.3,7.6],s:[2.7,1.8,0.13]})), [])
  return <group position={position}>
    <Box position={[0,6,0]} scale={[22,12,15]} material={m.white}/>
    <Box position={[0,12.25,0]} scale={[23,0.55,16]} material={m.roof}/>
    <Box position={[4,19,-3]} scale={[7.5,15,8]} material={m.white}/>
    <Box position={[4,27.5,-3]} scale={[11.5,5,11]} material={m.dark}/>
    <Box position={[4,28,-3]} scale={[11.8,2.4,11.3]} material={m.window}/>
    <Box position={[4,30.4,-3]} scale={[13.5,0.7,13]} material={m.white}/>
    <Box position={[4,31,-3]} scale={[13.8,0.3,13.3]} material={m.yellow}/>
    <Cylinder position={[4,34,-3]} scale={[0.23,6.2,0.23]} material={m.white}/>
    <Box position={[4,36.3,-3]} scale={[7,1.2,0.8]} rotation={[0,0.4,0]} material={m.white}/>
    <Box position={[4,36.3,-2.5]} scale={[6.4,0.7,0.18]} rotation={[0,0.4,0]} material={m.window}/>
    <Blocks items={windows} material={m.window}/>
    <Box position={[-11.1,6,0]} scale={[0.4,12,15.3]} material={m.yellow}/>
    <Lettering position={[0,10.5,7.72]} size={1.35} material={m.dark}>KUBEVIEW</Lettering>
    <Lettering position={[4,24.7,2.8]} size={0.8} material={m.white}>CONTROL</Lettering>
  </group>
}
