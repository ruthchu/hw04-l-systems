import ExpansionRule from "./ExpansionRule";

export default class Grammar {
    expansionRules: Map<string, ExpansionRule> = new Map();
    axiom: string;

    constructor(axiom: string) {
        this.axiom = axiom;
        this.expansionRules = new Map();
    }

    createRules() {
        let A : ExpansionRule = new ExpansionRule();
        A.addRule("&/FA[C]B", 1.0);
        let B: ExpansionRule = new ExpansionRule();
        B.addRule("/^^A", 1.0);
        let C: ExpansionRule = new ExpansionRule();
        C.addRule("G", .2);
        C.addRule("BBA", 0.8);
        this.expansionRules.set("A", A);
        this.expansionRules.set("B", B);
        this.expansionRules.set("C", C);
    }

    expand(iter: number) : string {
        for (let i = 0; i < iter; ++i) {
            let temp = "";
            for (let j = 0; j < this.axiom.length; ++j) {
                let rule = this.expansionRules.get(this.axiom[j]);
                if (rule) {
                    temp += rule.getRule();
                }
                else {                 
                    temp += this.axiom[j];
                }
            }
            this.axiom = temp;
        }
        return this.axiom;
    }
}