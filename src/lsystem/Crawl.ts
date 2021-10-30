import { mat4, vec3, quat, mat3 } from "gl-matrix";
import DrawingRule from "./DrawingRule";
import Turtle from "./Turtle";

export default class Crawl {
    turtle : Turtle = new Turtle(vec3.fromValues(0, 0, 0), mat3.fromValues(1, 0, 0, 0, 1, 0, 0, 0, 1), 0);
    stack : Array<Turtle>;
    drawRules : Map<string, DrawingRule>;
    transforms : Array<mat4>;
    fruitLoc: Array<[quat, vec3]>;

    constructor(t : Turtle) {
        vec3.copy(this.turtle.pos, t.pos);
        //vec3.copy(this.turtle.orient, t.orient);
        this.turtle.depth = t.depth;
        this.drawRules = new Map();
        this.stack = new Array();
        this.transforms = new Array();
        this.fruitLoc = new Array();
    }

    createRules() {
        let push = new DrawingRule();
        let pop = new DrawingRule();
        let ccSpinYAxis = new DrawingRule();
        let pitchUp = new DrawingRule();
        let pitchDown = new DrawingRule();
        let forward = new DrawingRule();
        let fruit = new DrawingRule();
        push.addRule(this.pushTurtle.bind(this), 1.0);
        pop.addRule(this.popTurtle.bind(this), 1.0);
        ccSpinYAxis.addRule(this.turtleRotY.bind(this), 1.0);
        pitchUp.addRule(this.turtleRotXUpBig.bind(this), .75);
        pitchUp.addRule(this.turtleRotXUpSmall.bind(this), .25);
        pitchDown.addRule(this.turtleRotXDownBig.bind(this), .75);
        pitchDown.addRule(this.turtleRotXDownSmall.bind(this), .25);
        forward.addRule(this.turtleForward.bind(this), 1.0);
        fruit.addRule(this.fruitPos.bind(this), 1.0);
        this.drawRules.set("[", push);
        this.drawRules.set("]", pop);
        this.drawRules.set("/", ccSpinYAxis);
        this.drawRules.set("&", pitchDown);
        this.drawRules.set("^", pitchUp);
        this.drawRules.set("F", forward);
        this.drawRules.set("G", fruit);
    }

    turtleRotY() {
        this.turtle.rotate(this.turtle.getForward(), 45);
    }

    turtleRotXUpSmall() {
        this.turtle.rotate(this.turtle.getRight(), 10);
    }

    turtleRotXUpBig() {
        this.turtle.rotate(this.turtle.getRight(), 11);
    }

    turtleRotXDownBig() {
        this.turtle.rotate(this.turtle.getRight(), -45);
    }

    turtleRotXDownSmall() {
        this.turtle.rotate(this.turtle.getRight(), -44);
    }

    fruitPos() {
        let q = quat.create();
        quat.copy(q, this.turtle.getQuat());
        let v = vec3.create();
        vec3.copy(v, this.turtle.pos);
        this.fruitLoc.push([q, v]);
    }

    turtleForward() {
        let m = mat4.create();
        mat4.fromRotationTranslationScale(m, this.turtle.getQuat(), this.turtle.pos, vec3.fromValues(.2, .2, .2));
        this.transforms.push(m);
        this.turtle.moveForward(.2);
    }

    pushTurtle() : any {
        let t1: Turtle = new Turtle(vec3.fromValues(0, 0, 0), mat3.fromValues(1, 0, 0, 0, 1, 0, 0, 0, 1), 0);
        vec3.copy(t1.pos, this.turtle.pos);
        mat3.copy(t1.orient, this.turtle.orient);
        t1.depth = this.turtle.depth;
        this.stack.push(t1);
        this.turtle.depth += 1;
    }

    popTurtle() {
        if (this.turtle.depth <= 0) {
            return false;
        }
        let t1 = this.stack.pop();
        vec3.copy(this.turtle.pos, t1.pos);
        mat3.copy(this.turtle.orient, t1.orient);
        this.turtle.depth -= 1;
        return true;
    }

    crawl(axiom: string) {
        for (let i = 0; i < axiom.length; ++i) {
            let rule = this.drawRules.get(axiom[i]);
            if (rule) {
                let func : any = rule.getRule();
                func();
            }
        }
    }

    getBranchTransform() {
        return this.transforms;
    }

    getFruitTransform() {
        return this.fruitLoc;
    }
}