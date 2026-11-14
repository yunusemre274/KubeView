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

// All hull layers share this fair, rounded outline. The bow remains local +Z;
// the overall capsule and deck attachment coordinates are unchanged.
const hullShape = new THREE.Shape()
hullShape.moveTo(-5.8, -36)
hullShape.lineTo(5.8, -36)
hullShape.quadraticCurveTo(8, -33, 8, -25)
hullShape.lineTo(8, 16)
hullShape.bezierCurveTo(8, 25, 4.8, 32.8, 0, 36)
hullShape.bezierCurveTo(-4.8, 32.8, -8, 25, -8, 16)
hullShape.lineTo(-8, -25)
hullShape.quadraticCurveTo(-8, -33, -5.8, -36)
const HULL_OUTLINE = hullShape.getPoints(6).slice(0, -1).map(point => [
  point.x * D.SHIP_WIDTH / 16, point.y * D.SHIP_LENGTH / 72,
])

function hullGeometry(bottom, top, bottomScale, topScale, chine = false) {
  const outline = HULL_OUTLINE
  const positions = [], indices = []
  const rings = chine
    ? [[bottom, bottomScale], [bottom + (top-bottom)*0.24, (bottomScale+topScale)/2], [top, topScale]]
    : [[bottom,bottomScale],[top,topScale]]
  for (const [y, scale] of rings) for (const [x,z] of outline) positions.push(x * scale, y, z)
  const n = outline.length
  for (let ring = 0; ring < rings.length-1; ring++) for (let i = 0; i < n; i++) {
    const j = (i+1)%n, a = ring*n
    indices.push(a+i,a+n+i,a+j,a+j,a+n+i,a+n+j)
  }
  // Separate cap vertices keep the painted sides smooth without bending the
  // deck's shading into the hull; a narrow coaming catches the sunlight.
  const capOffset = positions.length/3
  for (const [x,z] of outline) positions.push(x*topScale, top, z*topScale)
  const triangles = THREE.ShapeUtils.triangulateShape(outline.map(([x,z]) => new THREE.Vector2(x,z)), [])
  for (const triangle of triangles) indices.push(...triangle.map(i => capOffset+i).reverse())
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
export const HULL = hullGeometry(0.45,3.5+D.SHIP_FREEBOARD_LIFT,0.90,1,true)
const KEEL = hullGeometry(-2.3,0.45,0.64,0.90,true)
const DECK = hullGeometry(3.49+D.SHIP_FREEBOARD_LIFT,3.8+D.SHIP_FREEBOARD_LIFT,0.985,0.985)
const WATERLINE = hullGeometry(0.44,0.68,0.90,0.918)
const HULL_EDGES=new THREE.EdgesGeometry(HULL,18)

function beamItem(a, b, thickness, depth = thickness) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b)
  const direction = end.clone().sub(start), length = direction.length()
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize())
  const e = new THREE.Euler().setFromQuaternion(q)
  return {p:start.add(end).multiplyScalar(0.5).toArray(),s:[thickness,length,depth],r:[e.x,e.y,e.z]}
}

export function CargoShip({ position, materials: m, selected, state = 'unknown', lowDetail = false, onClick, onPointerOver, onPointerOut, slot = 0, radarData, hovered = false }) {
  const fittings = useMemo(() => {
    const windows = [], white = [], accents = [], dark = [], red = [], mast = [], steel = []
    white.push({p:[0,5.6,-27.5],s:[11,3.7,12.5]},{p:[0,8.9,-27],s:[9.5,3.3,10]},{p:[0,11.7,-26],s:[11,2.2,8]},{p:[0,13,-26],s:[11.9,0.35,8.8]},{p:[0,17.5,-24],s:[5.2,0.16,0.16]},{p:[0,4.6,30.1],s:[3.2,1.2,5.3]})
    dark.push({p:[0,13.3,-29.6],s:[3.2,3.8,2.9]})
    red.push({p:[0,15.4,-29.6],s:[3.3,0.8,3]},{p:[5.8,5.2,-26],s:[0.8,0.8,2.4]})
    windows.push({p:[0,11.6,-21.93],s:[10.1,0.8,0.08]},{p:[0,17.9,-23.9],s:[2.2,0.3,0.4]})
    mast.push({p:[0,16.1,-24],s:[0.15,6,0.15]},{p:[0,7.2,30],s:[0.13,5.8,0.13]})
    // Bridge wing decks, sun visors and glazing mullions. They stay inside the
    // vessel bounds and remain one instanced batch per shared material.
    white.push({p:[0,10.5,-25.8],s:[12.4,0.24,8.8]},{p:[0,12.5,-21.7],s:[11.2,0.22,0.7]})
    for (let i=0; i<8; i++) white.push({p:[-4.9+i*1.4,11.6,-21.85],s:[0.15,1.2,0.11]})
    windows.push({p:[-5.55,11.6,-26],s:[0.08,0.85,6.7]},{p:[5.55,11.6,-26],s:[0.08,0.85,6.7]})
    dark.push({p:[0,15.9,-29.6],s:[3.1,0.3,2.8]},{p:[0,4,28],s:[3.8,0.3,4.4]})
    for (const side of [-1,1]) {
      for (let index = 0; index < 6; index++) windows.push({p:[side*4.55,10.4,-27.4+index*1.4],s:[0.07,0.95,0.95]})
      if (!lowDetail) {
        for (const z of [-16,0,16]) accents.push({p:[side*7.97,2.1,z],s:[0.10,0.6,1.5]})
        for (const z of [-32,22]) {
          steel.push({p:[side*4.8,4.08,z],s:[2,0.22,1.2]},
            {p:[side*4.8,4.45,z],s:[0.6,0.65,0.6]},
            {p:[side*4.8,4.8,z],s:[1.55,0.16,0.7]})
        }
        for (let i=0;i<4;i++) steel.push({p:[side*5.8,5.2+i*0.8,-31+i*1.1],s:[1.5,0.14,0.7]})
        white.push({p:[side*6,10.9,-25.8],s:[0.08,0.8,8.6]}, {p:[side*6,11.3,-25.8],s:[0.1,0.1,8.6]})
      }
    }
    if (!lowDetail) {
      for (let i=0;i<HULL_OUTLINE.length;i++) {
        const [x,z]=HULL_OUTLINE[i], [nx,nz]=HULL_OUTLINE[(i+1)%HULL_OUTLINE.length]
        const a=[x*0.967,4.85,z*0.967], b=[nx*0.967,4.85,nz*0.967]
        white.push(beamItem(a,b,0.1), {p:[a[0],4.35,a[2]],s:[0.1,1,0.1]})
        steel.push(beamItem([a[0],3.93,a[2]],[b[0],3.93,b[2]],0.18,0.18))
        const length=Math.hypot(nx-x,nz-z)
        for(let j=1;j<Math.ceil(length/3);j++) {
          const t=j/Math.ceil(length/3)
          white.push({p:[a[0]+(b[0]-a[0])*t,4.35,a[2]+(b[2]-a[2])*t],s:[0.1,1,0.1]})
        }
      }
    }
    for (const parts of [windows, white, accents, dark, red, mast, steel])
      for (const part of parts) part.p[1] += D.SHIP_FREEBOARD_LIFT
    return { windows, white, accents, dark, red, mast, steel }
  }, [lowDetail])
  return <group position={position} rotation={[0,0,0]} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
    <mesh geometry={KEEL} material={m.red} castShadow receiveShadow dispose={null}/>
    <mesh geometry={HULL} material={m.blue} castShadow receiveShadow dispose={null}/>
    <mesh geometry={WATERLINE} material={m.dark} receiveShadow dispose={null}/>
    <mesh geometry={DECK} material={m.deck} receiveShadow dispose={null}/>
    <Blocks items={fittings.windows} material={m.window}/>
    <Blocks items={fittings.white} material={m.white}/>
    <Blocks items={fittings.dark} material={m.dark}/>
    <Blocks items={fittings.red} material={m.red}/>
    <Blocks items={fittings.accents} material={m.black}/>
    <Blocks items={fittings.mast} material={m.white} geometry={UNIT_CYLINDER}/>
    <Blocks items={fittings.steel} material={m.rail}/>
    {!lowDetail && <>
      <Lettering position={[8.03,1.55,2]} rotation={[0,Math.PI/2,0]} size={1.55} material={m.white}>KUBEVIEW</Lettering>
      <Lettering position={[-8.03,1.55,-2]} rotation={[0,-Math.PI/2,0]} size={1.55} material={m.white}>KUBEVIEW</Lettering>
      <Lettering position={[0,6.3+D.SHIP_FREEBOARD_LIFT,-33.79]} rotation={[0,Math.PI,0]} size={1.25} material={m.dark}>{`NODE ${String(slot+1).padStart(2,'0')}`}</Lettering>
    </>}
    <group position={[0,18.3+D.SHIP_FREEBOARD_LIFT,-24]} name="node-radar" userData={{harborTarget:radarData?{type:'node-radar',...radarData,local:[0,0.9,0]}:undefined}} onClick={event=>{event.stopPropagation();onClick?.(event)}}>
      <Cylinder position={[0,0.3,0]} scale={[0.3,1,0.3]} material={m.rail}/><Box position={[0,1.1,0]} scale={[4.2,0.9,0.7]} rotation={[0,0.35,0]} material={m.white}/>
      <Box position={[0,1.1,0.4]} scale={[3.7,0.55,0.15]} rotation={[0,0.35,0]} material={m.window}/>
    </group>
    <Cylinder position={[-4.5,13.4+D.SHIP_FREEBOARD_LIFT,-24]} scale={[0.38,0.5,0.38]} material={state === 'ready' ? m.yellow : state === 'failed' ? m.rust : m.rail}/>
    {(selected||hovered)&&<lineSegments geometry={HULL_EDGES} raycast={()=>null} scale={[1.015,1.015,1.005]} position={[0,0.05,0]} dispose={null}><lineBasicMaterial color={selected?'#4a8bd8':'#e5be62'} transparent opacity={0.95} depthTest={false}/></lineSegments>}
  </group>
}

const GABLE = (() => {
  const triangle = new THREE.Shape()
  triangle.moveTo(-D.HANGAR_WIDTH/2, D.HANGAR_HEIGHT)
  triangle.lineTo(D.HANGAR_WIDTH/2, D.HANGAR_HEIGHT)
  triangle.lineTo(0, D.HANGAR_HEIGHT+1.8)
  triangle.closePath()
  const geometry = new THREE.ExtrudeGeometry(triangle, {depth:D.HANGAR_LENGTH,steps:1,bevelEnabled:false})
  geometry.translate(0,0,-D.HANGAR_LENGTH/2)
  return geometry
})()

export function Hangar({ position, materials: m, variant = 0 }) {
  const parts = useMemo(() => {
    const wall=[], roof=[], ribs=[], accent=[], interior=[], glass=[]
    // A real recessed service bay: the dark interior is behind the doorway,
    // not a black sticker pasted on the face of a solid box.
    wall.push({p:[0,9,-21.25],s:[35,18,0.5]},
      {p:[-17.25,9,0],s:[0.5,18,43]}, {p:[17.25,9,0],s:[0.5,18,43]},
      {p:[-14.75,9,21.25],s:[5.5,18,0.5]}, {p:[14.75,9,21.25],s:[5.5,18,0.5]},
      {p:[0,17,21.25],s:[24,2,0.5]})
    roof.push({p:[-8.7,18.8,0],s:[18,0.65,44],r:[0,0,0.1]},
      {p:[8.7,18.8,0],s:[18,0.65,44],r:[0,0,-0.1]},
      {p:[0,19.83,0],s:[0.75,0.22,44]},
      {p:[0,14.9,21.45],s:[23.3,2.1,0.22]},
      {p:[14.7,2.6,21.8],s:[2.8,5.2,0.2]})
    interior.push({p:[0,7,12.5],s:[24,14,0.3]}, {p:[0,0.2,17],s:[24,0.35,10]},
      {p:[0,14,17],s:[24,0.2,10]},
      {p:[-11.8,7,17],s:[0.2,14,10]}, {p:[11.8,7,17],s:[0.2,14,10]})
    accent.push({p:[0,16.1,21.9],s:[25,0.45,0.4]})
    for(const side of [-1,1]) {
      accent.push({p:[side*12.6,7.9,21.9],s:[0.55,15.5,0.4]},
        {p:[side*13,0.08,29],s:[0.25,0.06,12]})
      ribs.push({p:[side*17.7,17.7,0],s:[0.35,0.35,44]},
        {p:[side*17.7,8.8,-20.4],s:[0.23,17.5,0.23]})
      for(let z=-18;z<=18;z+=3.6) ribs.push({p:[side*17.55,9,z],s:[0.14,17.5,0.18]})
      // Narrow clerestory strips, with a frame rhythm rather than a single
      // featureless window slab across the whole factory.
      for(let z=-16;z<=16;z+=4) glass.push({p:[side*17.55,14.7,z],s:[0.07,1.4,2.9]})
    }
    for(let i=0;i<4;i++) ribs.push({p:[0,14.1+i*0.5,21.6],s:[23.4,0.05,0.08]})
    glass.push({p:[14.7,3.6,21.95],s:[1.7,1.15,0.08]})
    return {wall,roof,ribs,accent,interior,glass}
  }, [])
  const cladding = variant ? m.lightRoof : (m.cladding || m.dark)
  return <group position={position}>
    <Blocks items={parts.wall} material={cladding}/>
    <mesh geometry={GABLE} material={cladding} castShadow receiveShadow dispose={null}/>
    <Blocks items={parts.roof} material={variant ? m.lightRoof : m.roof}/>
    <Blocks items={parts.interior} material={m.black}/>
    <Blocks items={parts.ribs} material={variant ? m.rail : m.dark}/>
    <Blocks items={parts.accent} material={m.yellow}/>
    <Blocks items={parts.glass} material={m.window}/>
    <Lettering position={[0,16.7,21.95]} size={1.4} material={variant ? m.dark : m.white}>{variant ? 'DEPOLAMA' : 'TERSANE'}</Lettering>
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
      for(const x of [-9,9]) {
        beam([x,5,4.8],[x*0.8,18,-2.7],0.26)
        rails.push({p:[x*0.92,11,-4.2],s:[0.12,18,0.12]}, {p:[x*0.92+1.1,11,-4.2],s:[0.12,18,0.12]})
        for(let y=3;y<20;y+=1.1) rails.push({p:[x*0.92+0.55,y,-4.2],s:[1.1,0.1,0.1]})
      }
      rails.push({p:[-8,23.6,2.5],s:[4.2,0.18,3.3]})
      // Beam flanges expose the load-bearing cross section in the sunlight.
      frame.push({p:[doubleJib?0:10.5,26.6,0],s:[doubleJib?60:43,0.24,3.6]})
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
  const windows = useMemo(() => [
    ...Array.from({length:12},(_,i) => ({p:[-7+(i%4)*4.7,3.5+Math.floor(i/4)*3.3,7.6],s:[2.7,1.8,0.13]})),
    ...Array.from({length:6},(_,i) => ({p:[11.05,3.5+Math.floor(i/2)*3.3,-3.5+(i%2)*6.8],s:[0.12,1.8,2.7]})),
  ], [])
  const frames = useMemo(() => {
    const parts=[]
    for(const x of [-1.6,1.2,4,6.8,9.6]) for(const z of [-8.72,2.72]) parts.push({p:[x,28,z],s:[0.18,2.5,0.14]})
    for(const x of [-1.95,9.95]) for(const z of [-8.3,-5.65,-3,-0.35,2.3]) parts.push({p:[x,28,z],s:[0.14,2.5,0.18]})
    for(let row=0;row<3;row++) parts.push({p:[0,2.48+row*3.3,7.76],s:[20,0.16,0.4]})
    return parts
  }, [])
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
    <Blocks items={frames} material={m.white}/>
    <Box position={[-11.1,6,0]} scale={[0.4,12,15.3]} material={m.yellow}/>
    <Lettering position={[0,10.5,7.72]} size={1.35} material={m.dark}>KUBEVIEW</Lettering>
    <Lettering position={[4,24.7,2.8]} size={0.8} material={m.white}>CONTROL</Lettering>
  </group>
}
