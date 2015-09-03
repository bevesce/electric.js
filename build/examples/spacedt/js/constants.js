var BULLET_RADIUS = 3;
var values = {
    asteroid: {
        color: '#BCACFA',
        radius: 20
    },
    asteroidMother: {
        birthIntervalInMs: 2000,
        color: '#A691FA',
        radius: 50
    },
    collision: {
        color: '#FA4141',
        duration: 100,
        radius: 30
    },
    bullet: {
        color: 'white',
        radius: 3,
        speed: 100
    },
    fps: 60,
    score: {
        forAsteroid: 3,
        forMother: 100
    },
    ship: {
        acceleration: {
            angular: 10,
            de: 1600,
            linear: 400
        },
        color: 'white',
        radius: 5,
        vbounds: {
            maxX: 5,
            maxY: 2000,
            minX: -5,
            minY: -50
        }
    }
};
module.exports = values;
