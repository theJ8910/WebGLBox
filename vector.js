var east  = [ 1,  0,  0 ];
var west  = [-1,  0,  0 ];
var up    = [ 0,  0,  1 ];
var down  = [ 0,  0, -1 ];
var north = [ 0,  1,  0 ];
var south = [ 0, -1,  0 ];
var zero  = [ 0 , 0,  0 ];

function vecAdd( left, right ) {
    return [
        left[0] + right[0],
        left[1] + right[1],
        left[2] + right[2]
    ];
}

//Subtracts the right vector from left, returns.
function vecSub( left, right ) {
    return [
        left[0] - right[0],
        left[1] - right[1],
        left[2] - right[2]
    ];
}

//Multiplies a scalar against vec, returns a new vector
function vecMul( scalar, vec ) {
    return [
        scalar * vec[0],
        scalar * vec[1],
        scalar * vec[2]
    ];
}

//Returns how long the given vector is in units.
function vecLength( vec ) {
    return Math.sqrt( vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2] );
}

//Returns a vector with the same direction as the given vector, but a length of 1.
function vecNormalize( vec ) {
    var d = vecLength( vec );
    if( d == 0 )
        return [ 1, 0, 0 ];

    return [
        vec[0] / d,
        vec[1] / d,
        vec[2] / d
    ]
}

//Returns the dot product between the two given vectors
function vecDot( left, right ) {
    return left[0]*right[0] + left[1]*right[1] + left[2]*right[2];
}

//Returns the cross product between the two given vectors
function vecCross( left, right ) {
    return [
        left[1] * right[2] - left[2] * right[1],
        left[2] * right[0] - left[0] * right[2],
        left[0] * right[1] - left[1] * right[0]
    ];
}

//Projects vec onto the plane containing the point ( 0, 0, 0 ) with normal plane_normal (expected to be a unit vector).
function vecProject( vec, plane_normal ) {
    return vecSub( vec, vecMul( vecDot( vec, plane_normal ), plane_normal ) );
}

//Returns "vec.x, vec.y, vec.z"
function vecToString( vec ) {
    return vec[0] + ", " + vec[1] + ", " + vec[2];
}