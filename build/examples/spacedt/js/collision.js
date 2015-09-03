function collisions() {
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
    };
}
exports.collisions = collisions;
