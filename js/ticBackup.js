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

document.body.appendChild( renderer.domElement );

const light = new THREE.AmbientLight( 0x404040);
scene.add(light);

var ipts = [];
var jpts = [];
var kpts = [];

ipts.push(
  new THREE.Vector3(0,0,0),
  new THREE.Vector3(500,0,0)
);

jpts.push(
  new THREE.Vector3(0,0,0),
  new THREE.Vector3(0,500,0)
);

kpts.push(
  new THREE.Vector3(0,0,0),
  new THREE.Vector3(0,0,500)
);



//draw unit vectors
var igeo = new THREE.BufferGeometry().setFromPoints( ipts );
var jgeo = new THREE.BufferGeometry().setFromPoints( jpts );
var kgeo = new THREE.BufferGeometry().setFromPoints( kpts );

var iline = new THREE.Line( igeo , new THREE.LineBasicMaterial({color : 0xff0000}));  //red
var jline = new THREE.Line( jgeo , new THREE.LineBasicMaterial({color : 0x00ff00}));  //green
var kline = new THREE.Line( kgeo , new THREE.LineBasicMaterial({color : 0x0000ff}));  //blue
scene.add(iline);
scene.add(jline);
scene.add(kline);

//camera.translateX(200);
camera.translateY(500);
//camera.translateZ(250);
//camera.translateX(250);
camera.lookAt(0,0);
//camera.rotateOnWorldAxis( new THREE.Vector3( 0,1,0),-Math.PI/2);

//spots must be perfect square
let spots = 9;
let dps = Math.sqrt(spots)*10;
let xmax = 400;
let xmin = -xmax;
let xrange = xmax - xmin;
console.log(xrange);
let zmax = 200;
let zmin = -zmax;
let zrange = zmax - zmin;

let vf = [];
let cf = [];

for ( let i = 0; i < dps; i++ ) {
  for ( let j = 0; j < dps; j++ ) {

    //top left
    let x0 = xmin + (i/dps)*(xmax-xmin);
    let z0 = zmin + (j/dps)*(zmax-zmin);

    let x1 = xmin + ((i+1)/dps)*(xmax - xmin);
    let z1 = zmin + ((j+1)/dps)*(zmax - zmin);

    let vdata = [
      x0,0,z0,
      x1,0,z0,
      x1,0,z1,
      x1,0,z1,
      x0,0,z1,
      x0,0,z0
    ]  

    vf.push(...vdata);


    let r1 = Math.random();
    let g1 = Math.random();
    let b1 = Math.random();

    let r2 = Math.random();
    let g2 = Math.random();
    let b2 = Math.random();


    let cdata = [
      r1,g1,b1,
      r1,g1,b1,
      r1,g1,b1,
      r2,g2,b2,
      r2,g2,b2,
      r2,g2,b2
    ] 

 
    cf.push(...cdata);
  }
}



//Base Mesh

const material = new THREE.MeshBasicMaterial( { vertexColors: true, side: THREE.DoubleSide } );
var geom = new THREE.BufferGeometry();
geom.setAttribute('position' , new THREE.Float32BufferAttribute( vf,3));
geom.setAttribute('color'    , new THREE.Float32BufferAttribute( cf,3)); 
const mesh = new THREE.Mesh(geom,material);

/*
const boardGeo = new THREE.PlaneGeometry(20,20);
const mesh = new THREE.Mesh(boardGeo,material);
*/
scene.add( mesh );
//mesh.rotateX(Math.PI/2);

//Wire Frame
/*
var wgeom = new THREE.EdgesGeometry( mesh.geometry );
var wmat = new THREE.LineBasicMaterial( { color : 0xffffff }) ;
var wframe = new THREE.LineSegments ( wgeom , wmat );
scene.add(wframe);
*/




function toCylinder(x,y,z) {
  //angle x maps to in cylinder
  // -xr/2 --- x --- xr/2 =>  3PI/2 ----- theta ----- -PI/2
  let theta = (-x/xrange)*2*Math.PI + Math.PI/2;
  // C = 2*PI*r => r = C/(2*PI)
  let radius = (xrange/(2*Math.PI));
  let res = [ radius*Math.cos(theta),
              radius*Math.sin(theta),
              z,
            ]
  return res;
}

function toTorusFromCylinder(x,y,z) {
  let theta = (-z/zrange)*2*Math.PI + Math.PI/2;
  let radius = (zrange/(2*Math.PI));
  //y is no constant
  //x and z change as they wrap around y axis
  let res = [ radius*Math.sin(theta),
              y,
              radius*Math.cos(theta)
  ]
  return res;
}


const positions = geom.attributes.position.array;
console.log(positions);
// pos l /3

//store the intial shape
let S = positions.map((x) => x);
//calculate final shape
let SF_PC = positions.map((x) => x);

let SF_CT = positions.map((x) => x);

//plane to cylinder
for ( let i = 0; i < positions.length/3; i++) {
  let cyl = toCylinder(S[3*i],S[3*i +1],S[3*i+2]);
  SF_PC[3*i] = cyl[0];
  SF_PC[3*i + 1] = cyl[1];
  SF_PC[3*i + 2] = cyl[2];
}

//cylinder to torus
for ( let i = 0; i < positions.length/3; i++) {
  let tor = toTorusFromCylinder(SF_PC[3*i],SF_PC[3*i +1],SF_PC[3*i+2]);
  SF_CT[3*i] = tor[0];
  SF_CT[3*i + 1] = tor[1];
  SF_CT[3*i + 2] = tor[2];
}

console.log(S);
console.log(SF_PC);



// t : 0 to 1
function cylinderTransform(t) {
      //transform all points one time step
			for ( let i = 0; i < positions.length/3; i++) {
      
        /* 
        let x = positions[3*i];
        let y = positions[3*i + 1];
        let z = positions[3*i + 2];
        */

        //find (x,y)'s point in starting image
        let x = S[3*i];
        let y = S[3*i + 1];
        let z = S[3*i + 2];

        //find (x,y)'s point in final image SF
        let xf = SF_PC[3*i];
        let yf = SF_PC[3*i + 1];
        let zf = SF_PC[3*i + 2];

        //interpolate a line between x,y,z and xf,yf,zf
          //find distance vector
          let xd = xf - x;
          let yd = yf - y;
          let zd = zf - z;
          //draw distance vectors for debug perspective
          /*
          var xgeo = new THREE.BufferGeometry();
          var xpos = Float32Array.from([x,y,z,xf,yf,zf]);
          xgeo.setAttribute('position' , new THREE.BufferAttribute(xpos , 3));
          var matx = new THREE.LineBasicMaterial( { color: 0xf0fff0 } );
          var line = new THREE.Line( xgeo , matx );
          scene.add(line);
          */

          let xn = x + ( (xd) * t);
          let yn = y + ( (yd) * t);
          let zn = z + ( (zd) * t);
          positions[3*i]     =  xn;
          positions[3*i + 1] =  yn;
          positions[3*i + 2] =  zn;
      }
}

function identity(t) {
}


// t : 0 to 1
function torusTransform(t) {
      //transform all points one time step
			for ( let i = 0; i < positions.length/3; i++) {
      
        /* 
        let x = positions[3*i];
        let y = positions[3*i + 1];
        let z = positions[3*i + 2];
        */

        //find (x,y)'s point in starting image
        let x = SF_PC[3*i];
        let y = SF_PC[3*i + 1];
        let z = SF_PC[3*i + 2];

        //find (x,y)'s point in final image SF
        let xf = SF_CT[3*i];
        let yf = SF_CT[3*i + 1];
        let zf = SF_CT[3*i + 2];

        //interpolate a line between x,y,z and xf,yf,zf
          //find distance vector
          let xd = xf - x;
          let yd = yf - y;
          let zd = zf - z;
          //draw distance vectors for debug perspective
          /*
          var xgeo = new THREE.BufferGeometry();
          var xpos = Float32Array.from([x,y,z,xf,yf,zf]);
          xgeo.setAttribute('position' , new THREE.BufferAttribute(xpos , 3));
          var matx = new THREE.LineBasicMaterial( { color: 0xf0fff0 } );
          var line = new THREE.Line( xgeo , matx );
          scene.add(line);
          */

          let xn = x + ( (xd) * t);
          let yn = y + ( (yd) * t);
          let zn = z + ( (zd) * t);
          positions[3*i]     =  xn;
          positions[3*i + 1] =  yn;
          positions[3*i + 2] =  zn;
      }
}


let ti = 0;
let tsteps = 20;
let lastStep = performance.now();
let dir = 1;
/*
let transformCycle = [ { kind : cylinderTransform , dir: 1 },
                       { kind : torusTransform    , dir: 1 },
                       { kind : torusTransform    , dir: -1},
                       { kind : cylinderTransform , dir: -1}
                     ]
*/
let transformCycle = [ { kind : identity , dir: 1} ];
let transformIndex = 0;
let transform = identity;

function animate() {
  requestAnimationFrame( animate );

  if ( performance.now() > lastStep + 75 ) {

      transform( (dir==1) ? ti/tsteps : 1 - (ti/tsteps) );
      geom.attributes.position.needsUpdate = true;
      console.log(ti);
      lastStep = performance.now();

    if ( ti < tsteps) {
        ti++;
    } else {
      ti = 0;
      let tci = transformCycle[transformIndex];
      transform = tci.kind;
      dir = tci.dir;
      transformIndex = (transformIndex + 1) % transformCycle.length;
      /*
      dir *= -1;
      ti = 0;
      */
    }
	renderer.render( scene, camera );

  }
}

animate();




