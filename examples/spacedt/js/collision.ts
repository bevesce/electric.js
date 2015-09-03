export interface Collision {
	index1: number;
	index2: number;
	x: number,
	y: number
}

export function collisions() {
	return {
		all: null,
		gameEnding: null,
		toDraw: null,
		asteroid: {
			bullet: null,
			ship: null
		},
		bullet: {
			bullet: null,
			ship: null,
			mother: null,
			asteroid: null
		},
		mother: {
			bullet: null,
			ship: null
		},
		ship: {
			asteroid: null,
			bullet: null,
			mother: null
		}
	}
}