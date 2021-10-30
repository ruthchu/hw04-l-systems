export default class ExpansionRule {
	rules: Array<[string, number]> = [];

	addRule(result: string, probability: number) {
		this.rules.push([result, probability]);
	}

	getRule() : string {
		let val : number = Math.random();
		let probability : number = 0.0;
		for(let i = 0; i < this.rules.length; i++) {
			probability += this.rules[i][1];
			if(val <= probability) {
				return this.rules[i][0];
			}
		}
		return;
	}
}