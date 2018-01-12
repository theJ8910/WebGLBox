//IMPORTANT NOTE:
//gl.uniformMatrix*fv assumes the data you give it in supplied in column-major order.
//There is a "transpose" parameter you can set to true to tell it your data is in row-major order,
//but this parameter is useless because the spec requires it to be false.
//What does this mean? The array:
//var myData = new Float32Array([
//     0, 1, 2, 3,
//     4, 5, 6, 7,
//     8, 9,10,11,
//    12,13,14,15
//]);
//...becomes the following matrix:
//| 0 4  8 12 |
//| 1 5  9 13 |
//| 2 6 10 14 |
//| 3 7 11 15 |
//In other words, the resulting matrix is transposed!
//How stupid is this? This could practically define the phrase "counter-intuitive".
//Keep this in mind when looking at matrix arrays here!
//
//For more information see the following links:
//https://www.khronos.org/registry/OpenGL-Refpages/es2.0/xhtml/glUniform.xml
//https://en.wikipedia.org/wiki/Row-_and_column-major_order
//
//Other notes:
//Row vectors and column vectors are two ways of representing the same vector as a matrix.
//Take the 4D vector <1, 2, 3, 1> for instance.
//When written as a row vector (a 4x1 matrix) it looks like this:
// | 1 2 3 1 |
//when written as a column vector (a 1x4 matrix) it looks like this:
// | 1 |
// | 2 |
// | 3 |
// | 1 |
//
//My code uses column vectors as suggested by the OpenGL specification.
//Either choice is fine - mathematically speaking you'll arrive at the same values regardless of your choice.
//However, because row and column vectors are transposes of one another, your choice will also decide the ordering of
//the values within the matrices you'll be using and the order of your matrix multiplications.
//If using row vectors, your transformations will take place left-to-right (e.g.: vector * world * view * projection),
//and your matrices will be arranged like so, where x, y, and z are your basis vectors and p is your translation:
//| x.x x.y x.z 0   |
//| y.x y.y y.z 0   |
//| z.x z.y z.z 0   |
//| p.x p.y p.z 1   |
//If using column vectors, your transformations will take place right-to-left (e.g.: projection * view * world * vector), and your matrices will be arranged like so:
//| x.x y.x z.x p.x |
//| x.y y.y z.y p.y |
//| x.z y.z z.z p.z |
//| 0   0   0   1   |
//
//For more information see the following link:
//https://en.wikipedia.org/wiki/Row_and_column_vectors

//4x4 identity matrix
var IDENTITY = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
]);

//World matrix
function world( x, y, z, p ) {
    /*
    | a b c x | a = x.x  b = y.x  c = z.x  x = p.x
    | d e f y | d = x.y  e = y.y  f = z.y  y = p.y
    | g h i z | g = x.z  h = y.z  i = z.z  z = p.z
    | 0 0 0 1 |
    */
    return new Float32Array([
        x[0], x[1], x[2], 0,
        y[0], y[1], y[2], 0,
        z[0], z[1], z[2], 0,
        p[0], p[1], p[2], 1
    ]);
}

//Builds a view matrix from vectors describing the viewer's position and orientation.
//The forward vector should point towards the object you want to capture.
//f: forward vector.  This is the +Z direction of the viewer's orientation.
//r: right vector.    This is the +X direction of the viewer's orientation.
//u: up vector.       This is the +Y direction of the viewer's orientation.
//p: position vector. This is the viewer's position.
//f, r, and u should be at 90 degree angles to one another
function view( f, r, u, p ) {
    /*
    a,b,c = R.x, U.x, F.x
    d,e,f = R.y, U.y, F.y
    g,h,i = R.z, U.z, F.z
    x,y,z = P.x, P.y, P.z
    
    F,R,U form a rotation matrix R, P forms a translation matrix T
    World Matrix = T*R
    View Matrix = Inverse( World Matrix ) = Inverse(R) * Inverse(T):
    | a d g -ax-dy-gz |
    | b e h -bx-ey-hz |
    | c f i -cx-fy-iz |
    | 0 0 0 1         |

    0 4  8 12
    1 5  9 13
    2 6 10 14
    3 7 11 15
    */
    var tx = -r[0]*p[0] - r[1]*p[1] - r[2]*p[2];
    var ty = -u[0]*p[0] - u[1]*p[1] - u[2]*p[2];
    var tz = -f[0]*p[0] - f[1]*p[1] - f[2]*p[2];
    return new Float32Array([
        r[0],  u[0],  f[0], 0,
        r[1],  u[1],  f[1], 0,
        r[2],  u[2],  f[2], 0,
        tx,    ty,    tz,   1
    ]);
}

//Returns a view matrix where the viewer is positioned at "from", looking at "to".
//The viewer is oriented such that his "up" is as close as possible to the given "up" vector.
function view_lookat( from, to, up ) {
    var fwd   = vecNormalize( vecSub( to, from ) );
    var up_r  = vecNormalize( vecProject( up, fwd ) );
    var right = vecCross( fwd, up_r );

    return view( fwd, right, up_r, from );
}

//Returns a view matrix that looks at pt, orbiting the given distance away from it at the given pitch and yaw.
//A pitch of 0 places the viewer in the X/Y plane. A pitch of Math.PI/2 places the viewer on the Z axis.
//If pitch is 0, a yaw of 0 places the viewer on the +X axis. A yaw of Math.PI/2 places the viewer on the +Y axis.
function view_orbit( pt, pitch, yaw, distance ) {
    var c = Math.cos( pitch );
    var s = Math.sin( pitch );

    var c2 = Math.cos( yaw );
    var s2 = Math.sin( yaw );

    //fwd faces towards the point.
    var fwd   = [ -c2*c, -s2*c, -s ];
    //A vector as close to "up" as possible while still being at a 90 degree angle to fwd. It's a "relative up".
    var up_r  = vecNormalize( vecProject( UP, fwd ) );
    //At a 90 degree angle to both fwd and up.
    var right = vecCross( fwd, up_r );
    //We move in the direction opposite of fwd, by "distance" units.
    var viewer_pos = vecSub( pt, vecMul( distance, fwd ) );

    return view( fwd, right, up_r, viewer_pos );
}

//Centered orthographic projection
function ortho( w, h, n, f ) {
    var zOff = f - n;

    return new Float32Array([
        2/w, 0,   0,               0,
        0,   2/h, 0,               0,
        0,   0,   2/zOff,          0,
        0,   0,   -(f + n) / zOff, 1
    ]);
}

//Off-center orthographic projection
function ortho_oc( l, r, b, t, n, f ) {
    //-1 < 2x / (r - l) - (r + l) / (r - l) < 1
    //-1 < 2x / (t - b) - (t + b) / (t - b) < 1
    //-1 < 2x / (f - n) - (f + n) / (f - n) < 1
    var xOff = r - l;
    var yOff = t - b;
    var zOff = f - n;
    return new Float32Array([
        2/xOff,           0,                0,               0,
        0,                2/yOff,           0,               0,
        0,                0,                2/zOff,          0,
        -(r + l) / xOff,  -(t + b) / yOff,  -(f + n) / zOff, 1
    ]);
}

//Performs matrix * vec.
//vec is 3D. It is implicitly converted to homogenous coordinates (i.e. the 4D vector [x,y,z,1]).
//This is because:
//    (1) the matrix is 4x4, you can't multiply a 3x1 vector against it
//    (2) it allows transformations with a perspective projection matrix or its inverse.
//After transformation, the vector is then implicitly converted from homogenous coordinates (4D) back to cartesian coordinates (3D) and returned.
function transform( matrix, vec ) {
    //Homogenous W. To convert from homogenous to cartesian coordinates, we divide each coordinate by this and drop the W.
    var w = matrix[3]*vec[0] + matrix[7]*vec[1] + matrix[11]*vec[2] + matrix[15];
    return [
        ( matrix[0]*vec[0] + matrix[4]*vec[1] + matrix[ 8]*vec[2] + matrix[12] ) / w,
        ( matrix[1]*vec[0] + matrix[5]*vec[1] + matrix[ 9]*vec[2] + matrix[13] ) / w,
        ( matrix[2]*vec[0] + matrix[6]*vec[1] + matrix[10]*vec[2] + matrix[14] ) / w
    ];
}

//Returns a copy of the given matrix.
function matrixCopy( mat ) {
    return new Float32Array([
        mat[ 0], mat[ 1], mat[ 2], mat[ 3],
        mat[ 4], mat[ 5], mat[ 6], mat[ 7],
        mat[ 8], mat[ 9], mat[10], mat[11],
        mat[12], mat[13], mat[14], mat[15]
    ]);
}

//Multiplies the 4x4 matrix left with the 4x4 matrix right.
function matrixMultiply( left, right ) {
    /*
     0 4  8 12
     1 5  9 13
     2 6 10 14
     3 7 11 15
    */
    return new Float32Array([
        left[0] * right[ 0] + left[4] * right[ 1] + left[ 8] * right[ 2] + left[12] * right[ 3], //0  = left.row_0 * right.column_0
        left[1] * right[ 0] + left[5] * right[ 1] + left[ 9] * right[ 2] + left[13] * right[ 3], //1  = left.row_1 * right.column_0
        left[2] * right[ 0] + left[6] * right[ 1] + left[10] * right[ 2] + left[14] * right[ 3], //2  = left.row_2 * right.column_0
        left[3] * right[ 0] + left[7] * right[ 1] + left[11] * right[ 2] + left[15] * right[ 3], //3  = left.row_3 * right.column_0

        left[0] * right[ 4] + left[4] * right[ 5] + left[ 8] * right[ 6] + left[12] * right[ 7], //4  = left.row_0 * right.column_1
        left[1] * right[ 4] + left[5] * right[ 5] + left[ 9] * right[ 6] + left[13] * right[ 7], //5  = left.row_1 * right.column_1
        left[2] * right[ 4] + left[6] * right[ 5] + left[10] * right[ 6] + left[14] * right[ 7], //6  = left.row_2 * right.column_1
        left[3] * right[ 4] + left[7] * right[ 5] + left[11] * right[ 6] + left[15] * right[ 7], //7  = left.row_3 * right.column_1

        left[0] * right[ 8] + left[4] * right[ 9] + left[ 8] * right[10] + left[12] * right[11], //8  = left.row_0 * right.column_2
        left[1] * right[ 8] + left[5] * right[ 9] + left[ 9] * right[10] + left[13] * right[11], //9  = left.row_1 * right.column_2
        left[2] * right[ 8] + left[6] * right[ 9] + left[10] * right[10] + left[14] * right[11], //10 = left.row_2 * right.column_2
        left[3] * right[ 8] + left[7] * right[ 9] + left[11] * right[10] + left[15] * right[11], //11 = left.row_3 * right.column_2

        left[0] * right[12] + left[4] * right[13] + left[ 8] * right[14] + left[12] * right[15], //12 = left.row_0 * right.column_3
        left[1] * right[12] + left[5] * right[13] + left[ 9] * right[14] + left[13] * right[15], //13 = left.row_1 * right.column_3
        left[2] * right[12] + left[6] * right[13] + left[10] * right[14] + left[14] * right[15], //14 = left.row_2 * right.column_3
        left[3] * right[12] + left[7] * right[13] + left[11] * right[14] + left[15] * right[15], //15 = left.row_3 * right.column_3
    ]);
}

//Returns the inverse of the given 4x4 matrix, or null if the matrix is not invertible.
function matrixInvert( mat ) {
    /*
     0 4  8 12
     1 5  9 13
     2 6 10 14
     3 7 11 15
    */
    var _00 = mat[0], _01 = mat[4], _02 = mat[ 8], _03 = mat[12];
    var _10 = mat[1], _11 = mat[5], _12 = mat[ 9], _13 = mat[13];
    var _20 = mat[2], _21 = mat[6], _22 = mat[10], _23 = mat[14];
    var _30 = mat[3], _31 = mat[7], _32 = mat[11], _33 = mat[15];
    
    var m1 = _22 * _33 - _23 * _32;
    var m2 = _21 * _33 - _23 * _31;
    var m3 = _21 * _32 - _22 * _31;
    var m4 = _20 * _33 - _23 * _30;
    var m5 = _20 * _32 - _22 * _30;
    var m6 = _20 * _31 - _21 * _30;

    var c00 = _11 * m1 - _12 * m2 + _13 * m3;
    var c01 = _12 * m4 - _13 * m5 - _10 * m1;
    var c02 = _10 * m2 - _11 * m4 + _13 * m6;
    var c03 = _11 * m5 - _12 * m6 - _10 * m3;

    var det = _00 * c00 + _01 * c01 + _02 * c02 + _03 * c03;

    if( det == 0 )
        return null;

    var m7  = _12 * _33 - _13 * _32;
    var m8  = _11 * _33 - _13 * _31;
    var m9  = _11 * _32 - _12 * _31;
    var m10 = _10 * _33 - _13 * _30;
    var m11 = _10 * _32 - _12 * _30;
    var m12 = _10 * _31 - _11 * _30;
    var m13 = _12 * _23 - _13 * _22;
    var m14 = _11 * _23 - _13 * _21;
    var m15 = _11 * _22 - _12 * _21;
    var m16 = _10 * _23 - _13 * _20;
    var m17 = _10 * _22 - _12 * _20;
    var m18 = _10 * _21 - _11 * _20;

    return new Float32Array([
        c00 / det,                                   //_00
        c01 / det,                                   //_10
        c02 / det,                                   //_20
        c03 / det,                                   //_30
        
        ( _02 * m2  - _01 * m1  - _03 * m3  ) / det, //_01
        ( _00 * m1  - _02 * m4  + _03 * m5  ) / det, //_11
        ( _01 * m4  - _00 * m2  - _03 * m6  ) / det, //_21
        ( _00 * m3  - _01 * m5  + _02 * m6  ) / det, //_31
        
        ( _01 * m7  - _02 * m8  + _03 * m9  ) / det, //_02
        ( _02 * m10 - _00 * m7  - _03 * m11 ) / det, //_12
        ( _00 * m8  - _01 * m10 + _03 * m12 ) / det, //_22
        ( _01 * m11 - _00 * m9  - _02 * m12 ) / det, //_32

        ( _02 * m14 - _01 * m13 - _03 * m15 ) / det, //_03
        ( _00 * m13 - _02 * m16 + _03 * m17 ) / det, //_13
        ( _01 * m16 - _00 * m14 - _03 * m18 ) / det, //_23
        ( _00 * m15 - _01 * m17 + _02 * m18 ) / det  //_33
    ]);
}

//Returns a string with each of the matrix's components, organized into rows and columns
function matrixToString( mat ) {
    return "\n" +
           mat[0] + " " + mat[4] + " " + mat[ 8] + " " + mat[12] + "\n" +
           mat[1] + " " + mat[5] + " " + mat[ 9] + " " + mat[13] + "\n" +
           mat[2] + " " + mat[6] + " " + mat[10] + " " + mat[14] + "\n" +
           mat[3] + " " + mat[7] + " " + mat[11] + " " + mat[15] + "\n"
}