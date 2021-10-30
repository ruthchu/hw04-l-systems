export default class DrawingRule {
	rules: Array<[any, number]> = [];

	addRule(drawRule: any, chance: number) {
		this.rules.push([drawRule, chance]);
	}

	getRule() : any {
		let val = Math.random();
		let probability = 0.0;
		for(let i = 0; i < this.rules.length; i++) {
			probability += this.rules[i][1];
			if(val <= probability) {
				return this.rules[i][0];
			}
		}
		return;
	}
}