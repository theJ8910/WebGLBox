//IMPORTANT NOTE:
//gl.uniformMatrix*fv assumes the data you give it in supplied in column order.
//There is a "transpose" parameter you can set to true to tell it your data is in row order,
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

//4x4 identity matrix
var identity = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
]);

//World matrix
function world( x, y, z, p ) {
    /*
    | a b c 0 | |x| a = x.x  b = y.x  c = z.x
    | d e f 0 | |y| d = x.y  e = y.y  f = z.y
    | g h i 0 | |z| g = x.z  h = y.z  i = z.z
    | 0 0 0 1 | |1|
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
    var up_r  = vecNormalize( vecProject( up, fwd ) ); 
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
        ( matrix[0]*vec[0] + matrix[4]*vec[1] + matrix[8]*vec[2] + matrix[12] ) / w,
        ( matrix[0]*vec[0] + matrix[4]*vec[1] + matrix[8]*vec[2] + matrix[12] ) / w,
        ( matrix[0]*vec[0] + matrix[4]*vec[1] + matrix[8]*vec[2] + matrix[12] ) / w
    ];
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

//Returns a string with each of the matrix's components, organized into rows and columns
function matrixToString( mat ) {
    return "\n" +
           mat[0] + " " + mat[4] + " " + mat[ 8] + " " + mat[12] + "\n" +
           mat[1] + " " + mat[5] + " " + mat[ 9] + " " + mat[13] + "\n" +
           mat[2] + " " + mat[6] + " " + mat[10] + " " + mat[14] + "\n" +
           mat[3] + " " + mat[7] + " " + mat[11] + " " + mat[15] + "\n"
}