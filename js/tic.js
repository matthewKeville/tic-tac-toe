const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 
  100,
  window.innerWidth / window.innerHeight,
  0.1,
  1000 
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( 
  window.innerWidth,
  window.innerHeight 
);
renderer.sortObjects = false;

let container = document.getElementById("container");
container.appendChild(renderer.domElement);

const light = new THREE.AmbientLight( 0x404040);
scene.add(light);

let controls = new THREE.OrbitControls(camera,renderer.domElement);

///////////////////
//draw unit vectors
///////////////////

var ipts = [];
var jpts = [];
var kpts = [];

ipts.push(
  new THREE.Vector3(0,0,0),
  new THREE.Vector3(3000,0,0)
);

jpts.push(
  new THREE.Vector3(0,0,0),
  new THREE.Vector3(0,3000,0)
);

kpts.push(
  new THREE.Vector3(0,0,0),
  new THREE.Vector3(0,0,3000)
);


var igeo = new THREE.BufferGeometry().setFromPoints( ipts );
var jgeo = new THREE.BufferGeometry().setFromPoints( jpts );
var kgeo = new THREE.BufferGeometry().setFromPoints( kpts );

var iline = new THREE.Line( igeo , new THREE.LineBasicMaterial({color : 0xff0000}));  //red
var jline = new THREE.Line( jgeo , new THREE.LineBasicMaterial({color : 0x00ff00}));  //green
var kline = new THREE.Line( kgeo , new THREE.LineBasicMaterial({color : 0x0000ff}));  //blue
scene.add(iline);
scene.add(jline);
scene.add(kline);

camera.translateY(500);
camera.lookAt(0,0);

//////////////////////////////
// construct the board space
//////////////////////////////

//spots must be perfect square
let spr = 9; //spot base
let spots = spr**2; //total spots ( a square number )
let granularity = 10; //determine resolution of individual spots
let triangles = spots* (4**granularity) /2; //triangles per spot

//dimensions of spot space / (tic-toe) board

let xmax = 100;
let xmin = -xmax;
let xrange = xmax - xmin;
let zmax = 100;
let zmin = -zmax;
let zrange = zmax - zmin;

let vf = []; //vertices     ( x,y,z,x,y,z,x,y ... )
let cf = []; //color values ( r,g,b,r,g,b,r,g ... )

//define X / O vertex data based on original state of board space
/*
//xGeometry will span the space of 1 face , minus the outside layer of it's granularity
let xw = (xmax-xmin)/spr * (granularity-2)/granularity;
let xh = (zmax-zmin)/spr * (granularity-2)/granularity;
//let xGeometry = new THREE.PlaneGeometry(100,100,50);
let xGeometry = new THREE.PlaneGeometry(xw,xh,50);

let xMat = new THREE.MeshBasicMaterial( { color : 0xffff00 , side : THREE.DoubleSide});
let xPlane = new THREE.Mesh( xGeometry , xMat );
//rotate vertex set
xPlane.geometry.rotateX(Math.PI/2);
scene.add( xPlane );
*/

let xPlanes = [];
//null = free space
//0    = O
//1    = X
let boardModel = Array(spots).fill(null);
console.log(boardModel);

//board tiling colors
let ra = Math.random();
let ga = Math.random();
let ba = Math.random();

let rb = Math.random();
let gb = Math.random();
let bb = Math.random();

//iterate over spaces in the board
for ( let i = 0; i < spr; i++ ) {
  for ( let j = 0; j < spr; j++ ) {
    //iterate over granul fill of each space
    //spot start x at (i,j)
    //spot start y at (i,j)

    //top left of spot 
    let ssx = xmin + (i/spr)*(xmax-xmin);
    let ssz = zmin + (j/spr)*(zmax-zmin);
    
    //bottom right of spot
    let sfx = xmin + ((i+1)/spr)*(xmax-xmin);
    let sfz = zmin + ((j+1)/spr)*(zmax-zmin);

    //sub-divide each spot by granularity fill
    //all sub regions of spot will be colored the same

     
        let r1 = r2 = ((i*spr + j) % 2 == 0) ? ra : rb;
        let g1 = g2 = ((i*spr + j) % 2 == 0) ? ga : gb;
        let b1 = b2 = ((i*spr + j) % 2 == 0) ? ba : bb;

        let cdata = [
          r1,g1,b1,
          r1,g1,b1,
          r1,g1,b1,
          r2,g2,b2,
          r2,g2,b2,
          r2,g2,b2
        ] 

    for ( let a = 0; a < granularity; a++) {
      for ( let b = 0; b < granularity; b++) {
        //ranges of spot dimensions
        let gtxr = sfx - ssx;
        let gtzr = sfz - ssz;
        //top left
        let x0 = ssx + (a/(granularity))*gtxr;
        let z0 = ssz + (b/(granularity))*gtzr;

        let x1 = ssx + ((a+1)/(granularity))*gtxr;
        let z1 = ssz + ((b+1)/(granularity))*gtzr;

        let vdata = [
          x0,0,z0,
          x1,0,z0,
          x1,0,z1,
          x1,0,z1,
          x0,0,z1,
          x0,0,z0
        ]  

        vf.push(...vdata);
        cf.push(...cdata);
 
        //insert X peices at the second layer of the
        //face partition
        if ( a == 1 && b == 1 ) {
          //xGeometry will span the space of 1 face , minus the outside layer of it's granularity
          let xw = (xmax-xmin)/spr * (granularity-2)/granularity;
          let xh = (zmax-zmin)/spr * (granularity-2)/granularity;
          //let xGeometry = new THREE.PlaneGeometry(xw,xh,10);
          let xGeometry = new THREE.BoxGeometry(xw,xh,20,20,20,20);
          let xMat = new THREE.MeshBasicMaterial( { color : 0xffffff , side : THREE.DoubleSide});
          let xPlane = new THREE.Mesh( xGeometry , xMat );
          //rotate vertex set
          xPlane.geometry.rotateX(Math.PI/2);
          //translate X so that it is centered in it's corresponding face
          xPlane.geometry.translate(ssx + (xmax-xmin)/spr/2,0,ssz + (zmax-zmin)/spr/2);
          scene.add( xPlane );
          xPlanes.push(xPlane);
        }

    }
    }
  }
}


//Base Mesh

const boardMaterial = new THREE.MeshBasicMaterial( { vertexColors: true, side: THREE.DoubleSide } );
var boardGeom = new THREE.BufferGeometry();
boardGeom.setAttribute('position' , new THREE.Float32BufferAttribute( vf,3));
boardGeom.setAttribute('color'    , new THREE.Float32BufferAttribute( cf,3)); 
const boardMesh = new THREE.Mesh(boardGeom,boardMaterial);
//boardMesh.renderOrder = 0;

scene.add( boardMesh );

//Wire Frame
/*
var wgeom = new THREE.EdgesGeometry( mesh.geometry );
var wmat = new THREE.LineBasicMaterial( { color : 0xffffff }) ;
var wframe = new THREE.LineSegments ( wgeom , wmat );
scene.add(wframe);
*/


//////////////////////////////////
// Topological Transformations  //
//////////////////////////////////

//these transformations depends on the assumption of the plane board being 
//centered at the origin

//z axis preserved
function toCylinder(x,y,z) {
  //angle x maps to in cylinder
  // -xr/2 --- x --- xr/2 =>  3PI/2 ----- theta ----- -PI/2
  let theta = (-x/xrange)*2*Math.PI + Math.PI/2;

  let radius = (xrange/(2*Math.PI));
  // C = 2*PI*r => r = C/(2*PI)
  
  //experimental
  //since we wish to use this to map extruded geometry (tiles)
  //we define a special case in the input space ( y != 0 )
  //when this is the case, we modify the output vector by displacing it 
  //that amount in the normal direction
  
  //as the planar surface has y = 0 , nonzero y's must be for transforming tiles

  let tanx = -radius*Math.sin(theta);
  let tany = radius*Math.cos(theta);

  let normalx = tany;
  let normaly = -1*tanx;

  //normalize normal vector
  let nnorm = Math.sqrt( normalx**2 +  normaly**2 );

  let res = [];
  if ( y == 0 ) {
    res = [ radius*Math.cos(theta),
                radius*Math.sin(theta),
                z,
              ]
  //extruded geometry
  } else {
    res = [     radius*Math.cos(theta) + y*normalx/nnorm,
                radius*Math.sin(theta) + y*normaly/nnorm,
                z
              ]
  }
  return res;
}

//x axis preserved
function toAltCylinder(x,y,z) {
  //angle x maps to in cylinder
  // -xr/2 --- x --- xr/2 =>  3PI/2 ----- theta ----- -PI/2
  let theta = (-z/zrange)*2*Math.PI + Math.PI/2;

  let radius = (zrange/(2*Math.PI));
  // C = 2*PI*r => r = C/(2*PI)
  
  //experimental
  //since we wish to use this to map extruded geometry (tiles)
  //we define a special case in the input space ( y != 0 )
  //when this is the case, we modify the output vector by displacing it 
  //that amount in the normal direction
  
  //as the planar surface has y = 0 , nonzero y's must be for transforming tiles

  let tany = -radius*Math.sin(theta);
  let tanz = radius*Math.cos(theta);

  let normaly = tanz;
  let normalz = -tany;

  //normalize normal vector
  let nnorm = Math.sqrt( normaly**2 +  normalz**2 );

  let res = [];
  if ( y == 0 ) {
    res = [     x,
                radius*Math.cos(theta),
                radius*Math.sin(theta)
              ]
  //extruded geometry
  } else {
    res = [     x,
                radius*Math.cos(theta) + y*normaly/nnorm,
                radius*Math.sin(theta) + y*normalz/nnorm
              ]
  }
  return res;
}



function toMobiusFromPlane(x,y,z) {
  //angle x maps to in cylinder
  // -xr/2 --- x --- xr/2 =>  3PI/2 ----- theta ----- -PI/2
  let theta = (-x/xrange)*2*Math.PI + Math.PI/2;

  //scale radius to give space for twisting to not self-intersect
  let radius = 5*(xrange/(2*Math.PI));
  
  //tangent vector of mapping to circle
  let tanx = -radius*Math.sin(theta);
  let tany = radius*Math.cos(theta);

  //normal vector of circle mapping
  let normalx = tany;
  let normaly = -1*tanx;

  //normalize normal vector
  let nnorm = Math.sqrt( normalx**2 +  normaly**2 );

  //we have to rotate the calculated points about the tangent axis of
  //the circle mapping, i.e. for each point on the circle there is a line
  //of points along the z axis that need to twist about the tangent axis

  //mapping for twists on circular path
  //Phi maps -x to 0 and x to PI where 0-> PI/2
  let phi = (x/xrange)*(Math.PI) + Math.PI/2;
  //turns in mobdius strip
  let turns = 1;

  //create a vector 3 of the point
  //let point = new THREE.Vector3( radius*Math.cos(theta) , radius*Math.sin(theta) , z );
  let point = new THREE.Vector3( radius*Math.cos(theta),radius*Math.sin(theta), z );
  let rotAxis = (new THREE.Vector3( tanx, tany,0));
  let rotNorm = (rotAxis).clone().normalize();
  let rotAxisStart = new THREE.Vector3(radius*Math.cos(theta),radius*Math.sin(theta),0);

  //rotate the points in the normal plane against the tangent axis
  point.sub(rotAxisStart);
  point.applyAxisAngle(rotNorm,turns*phi);
  point.add(rotAxisStart);

  //rotate the normal vector
  let normal = new THREE.Vector3( normalx, normaly, 0);
  normal.normalize();
  normal.applyAxisAngle(rotNorm,turns*phi);


  let res = [];
  if ( y == 0 ) {
    //add the offset rotation to the original point mapping
    res = [ point.x,
            point.y,
            point.z
              ]
  //extruded geometry
  } else {

    res = [     point.x +   y*normal.x,
                point.y +   y*normal.y,
                point.z +   y*normal.z
              ]
    /*
    res = [     point.x + y*  normalx/nnorm,
                point.y + y*  normaly/nnorm,
                point.z
              ]
              */
  }
  return res;
}




function toTorusFromCylinder(x,y,z) {
  let theta = (-z/zrange)*2*Math.PI - Math.PI;
  //let radius = (zrange/(2*Math.PI)); //base radius
                                     //center points of torus
  // We will use the cylindrical slice coplanar to x-y axis as a basis
  // or revolution for all other points. We find a rotation of a point
  // in this slice in terms of x and y, which we rotate about (z %) theta
  //

  // R_theta = [ cos t   -sin t]  v = [ vx
  //           [ sin t   cos t ]        vy ]
  //
  // R_theta v = [ vx * cos t + vy * - sin t ]
  //               vx * sin t + vy *   cos t 


  //give a default toroidal radius
  let r1 = 200;

  //basis slice on xz axis
  let tempz = 0;
  let tempx = -r1 + x;


  //rotate basis by angle given by z
  let rotTempx = tempx * Math.cos(theta) + tempz * -Math.sin(theta);
  let rotTempz = tempx * Math.sin(theta) + tempz * Math.cos(theta);

  //normal doesn't need to cheat here, not 100% why but it just works

  //y is no constant
  //x and z change as they wrap around y axis
  let res = [ rotTempx,
              y,
              rotTempz
  ]
  return res;
}






//calculate different board forms


const positions = boardGeom.attributes.position.array;
// pos l /3

//Calculate the different states that the board and the peices 
//can be in and store the vertex data

//store the intial shape
let S = positions.map((x) => x);

// Cylinder Vertex data
let SF_PC = positions.map((x) => x);

// Alt cylinder vertex data
let SF_PAC = positions.map((x) => x);

// Torus Vertex data
let SF_CT = positions.map((x) => x);

// Mobius vertex data
let SF_PM = positions.map((x) => x);

// Calculate Cylinder vertex data by applying plane
// to cylinder transformation
for ( let i = 0; i < positions.length/3; i++) {
  //cylinder
  let cyl = toCylinder(S[3*i],S[3*i +1],S[3*i+2]);
  SF_PC[3*i]     = cyl[0];
  SF_PC[3*i + 1] = cyl[1];
  SF_PC[3*i + 2] = cyl[2];
  //alt cylinder
  let altCyl = toAltCylinder(S[3*i],S[3*i +1],S[3*i+2]);
  SF_PAC[3*i]     = altCyl[0];
  SF_PAC[3*i + 1] = altCyl[1];
  SF_PAC[3*i + 2] = altCyl[2];
  //mobius
  let mob = toMobiusFromPlane(S[3*i],S[3*i +1],S[3*i+2]);
  SF_PM[3*i] = mob[0];
  SF_PM[3*i + 1] = mob[1];
  SF_PM[3*i + 2] = mob[2];
  //torus
  let tor = toTorusFromCylinder(SF_PC[3*i],SF_PC[3*i +1],SF_PC[3*i+2]);
  SF_CT[3*i] = tor[0];
  SF_CT[3*i + 1] = tor[1];
  SF_CT[3*i + 2] = tor[2];

}



boardMeshGeoCache = 
  {
    mesh        : boardMesh,
    plane       : S,
    cylinder    : SF_PC,
    altCylinder : SF_PAC,
    torus       : SF_CT,
    mobius      : SF_PM
  }


//todo map of maps where
//each xPlane has a map to each of it's geometric configurations

// X planes geometry cache
let xPlanesGeoCache = [];
//calculate each topological state of each X plane peice
console.log(xPlanes);
xPlanes.forEach( xp => {
  const pos = xp.geometry.attributes.position.array;

  let pl = pos.map((x) => x);

  let cy = pos.map((x) => x);
  let cyAlt = pos.map((x) => x);
  let to = pos.map((x) => x);
  let mo = pos.map((x) => x);

  for ( let i = 0; i < pos.length/3; i++) {
    let cyl = toCylinder(pos[3*i],pos[3*i +1],pos[3*i+2]);
    //let alt = toCylinder(pos[3*i + 1],pos[3*i + 2],pos[3*i]);
    cy[3*i] = cyl[0];
    cy[3*i + 1] = cyl[1];
    cy[3*i + 2] = cyl[2];
    //alt cylinder
    let cylAlt = toAltCylinder(pos[3*i],pos[3*i +1],pos[3*i+2]);
    cyAlt[3*i]     = cylAlt[0];
    cyAlt[3*i + 1] = cylAlt[1];
    cyAlt[3*i + 2] = cylAlt[2];

    let tor = toTorusFromCylinder(cy[3*i],cy[3*i +1],cy[3*i+2]);
    to[3*i] = tor[0];
    to[3*i + 1] = tor[1];
    to[3*i + 2] = tor[2];

    let mob = toMobiusFromPlane(pos[3*i],pos[3*i +1],pos[3*i+2]);
    mo[3*i] = mob[0];
    mo[3*i + 1] = mob[1];
    mo[3*i + 2] = mob[2];

  }


  let cache = {
    mesh     : xp,
    plane    : pl,
    cylinder : cy,
    altCylinder : cyAlt,
    torus    : to,
    mobius   : mo

  }
  xPlanesGeoCache.push(cache);

});




////////////////////////////
// Transformation Animation 
////////////////////////////


//generic transformation prototype
//mesh : the mesh to be transformed
//S : domain vertex set
//F : image  vertex set
function genericTransform(t,mesh,S,F) {
			for ( let i = 0; i < S.length/3; i++) {
        
        //find (x,y)'s point in starting image
        let x = S[3*i];
        let y = S[3*i + 1];
        let z = S[3*i + 2];

        //find (x,y)'s point in final image SF
        let xf = F[3*i];
        let yf = F[3*i + 1];
        let zf = F[3*i + 2];

        //interpolate a line between x,y,z and xf,yf,zf
        //find distance vector
        let xd = xf - x;
        let yd = yf - y;
        let zd = zf - z;

        //draw distance vectors for debug perspective

        let xn = x + ( (xd) * t);
        let yn = y + ( (yd) * t);
        let zn = z + ( (zd) * t);
        mesh.geometry.attributes.position.array[3*i]     =  xn;
        mesh.geometry.attributes.position.array[3*i + 1] =  yn;
        mesh.geometry.attributes.position.array[3*i + 2] =  zn;
      }

      //flag the mesh to recalculate after transformation
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.geometry.computeBoundingSphere();
      mesh.geometry.computeBoundingBox();
}

//target : { plane , cylinder , mobius , torus }
function executeTransform(target,t) {
  let tmp = xPlanesGeoCache.map((x) => x);
  tmp.push(boardMeshGeoCache);
  tmp.forEach( xp => {
    genericTransform(t,xp.mesh,xp.mesh.geometry.attributes.position.array,xp[target]);
  });
}

/*
function goCylinder(t) {
  //apply transform to board
  genericTransform(t,boardMeshGeoCache.mesh,boardMeshGeoCache.plane,boardMeshGeoCache.cylinder);
  //apply transform to spots
  xPlanesGeoCache.forEach( xp => {
    genericTransform(t,xp.mesh,xp.plane,xp.cylinder);
  });
}

function goIdentity(t) {
}

function goMobius(t) {
  //apply transform to board
  genericTransform(t,boardMesh,S,SF_PM);
  //apply transform to spots
  xPlanesGeoCache.forEach( xp => {
    genericTransform(t,xp.mesh,xp.plane,xp.mobius);
  });
}

function goTorus(t) {
  //apply transform to board
  genericTransform(t,boardMesh,SF_PC,SF_CT);
  //apply transform to spots
  xPlanesGeoCache.forEach( xp => {
    genericTransform(t,xp.mesh,xp.cylinder,xp.torus);
  });
}
*/

/*
function goTorusFromMobius(t) {
  //apply transform to board
  genericTransform(t,boardMesh,SF_PM,SF_CT);
  console.log("main done");
  //apply transform to spots
  xPlanesGeoCache.forEach( xp => {
    genericTransform(t,xp.mesh,xp.mobius,xp.torus);
  });
}
*/





//Ray casting
const raycaster = new THREE.Raycaster();
raycaster.params.Line.threshold = 0;
const pointer = new THREE.Vector2();

function mouseMove(event) {
  pointer.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
  pointer.y = ( event.clientY / renderer.domElement.clientHeight) * -2 + 1;
  //console.log(pointer);
}

window.onmousemove = mouseMove;



function logicalBoardPrint() {
  let res = ""
  for ( let i = 0; i < spr; i++) {
    let line = "\n";
    for ( let j = 0; j < spr; j++ ) {
      line+= " " + boardModel[spr*i + j];
    }
    res += line;
  }
  console.log(res);
}



////////////////////////
//Transformation Logic//
////////////////////////


let ti = 0;
let tsteps = 20;
let lastStep = performance.now();
let dir = 1;

let transforms = [ 
  "mobius",
  "plane",
  "altCylinder",
  "cylinder",
  "torus",
  "plane"
];


let transform = "plane";

function animate() {
  requestAnimationFrame( animate );
  if ( performance.now() > lastStep + 75 ) {
      executeTransform(transform,ti/tsteps);
      boardGeom.attributes.position.needsUpdate = true;
      console.log(ti);
      lastStep = performance.now();

    if ( ti < tsteps) {
        ti++;
    } else {

    }
	renderer.render( scene, camera );

  }
}


///////////////////////
//Interactation hookup
///////////////////////

let planeButton = document.getElementById("planeButton");
planeButton.onclick = function () {
  transform = "plane";
  ti = 0;
}


let cylinderButton = document.getElementById("cylinderButton");
cylinderButton.onclick = function () {
  transform = "cylinder";
  ti = 0;
}

let altCylinderButton = document.getElementById("altCylinderButton");
altCylinderButton.onclick = function () {
  transform = "altCylinder";
  ti = 0;
}


let mobiusButton = document.getElementById("mobiusButton");
mobiusButton.onclick = function () {
  transform = "mobius";
  ti = 0;
}

let torusButton = document.getElementById("torusButton");
torusButton.onclick = function () {
  transform = "torus";
  ti = 0;
}





let turn = 0;
let playerOne = 0xff0000; //x
let playerTwo = 0x000000; //o
window.onkeydown = function (key) {
  //cycle transformation
  //spacebar
  if (key.keyCode === 32) {
  }

  if(key.keyCode === 13) {
    console.log("enter hit");

    raycaster.setFromCamera( pointer , camera);
    let intersections = raycaster.intersectObjects( scene.children );
    /*
    for ( let i = 0; i < intersections.length; i++) {
      console.log( intersections[i]);
    }
    */
    let firstHit = intersections[0];
    //determine if a spot was hit by referencing the uuids in the 
    //xPlanes list
    if ((firstHit) && firstHit.distance != 0) {
      if ( (xPlanes.map(x => x.uuid )).includes(firstHit.object.uuid) )
      {
        let spotIndex = xPlanes.indexOf(firstHit.object);
        if (boardModel[spotIndex]==null) {
        //alternate the color 
        let player = ( turn == 0 ? playerOne : playerTwo ); 
        firstHit.object.material.color = new THREE.Color(player);
        //update the model to reflect this move
        //boardModel
        boardModel[spotIndex] = (turn == 0 ? "x" : "o" );
        turn = (turn + 1) % 2;
        logicalBoardPrint();
        } else {
          console.warn("This spot is already taken");
        }
      }
    }
  }
}



animate();




