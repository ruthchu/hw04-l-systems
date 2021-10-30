import {vec3, mat3, quat} from 'gl-matrix';
class Turtle {
	pos: vec3 = vec3.create();
  orient: mat3 = mat3.create();  
  depth: number = 0;

  constructor(pos: vec3, orient: mat3, depth: number) {
    vec3.copy(this.pos, pos);
    mat3.copy(this.orient, orient);
    this.depth = depth;
  }

  getForward() {
    return vec3.fromValues(this.orient[3], this.orient[4], this.orient[5]);
  }

  getRight() {
    return vec3.fromValues(this.orient[6], this.orient[7], this.orient[8]);
  }

  getQuat() {
    let q = quat.create();
    quat.fromMat3(q, this.orient);
    return q;
  }

  moveForward(amt: number) {
    let temp : vec3 = vec3.create();
    vec3.scale(temp, this.getForward(), amt);
    vec3.add(this.pos, this.pos, temp);
  }

  rotate(axis: vec3, angle: number) {
    vec3.normalize(axis, axis);

	  let q: quat = quat.create();
	  let a: number = Math.PI * angle / 180.0;
	  quat.setAxisAngle(q, axis, a);
  	quat.normalize(q, q);

    let mrot = mat3.create();
    mat3.fromQuat(mrot, q);
    mat3.multiply(this.orient, mrot, this.orient);
	}
}

export default Turtle;