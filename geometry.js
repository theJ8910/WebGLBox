//Returns a line object.
//normal should be a vector in the direction of the line.
//pt should be a point on the line.
function line( dir, pt ) {
    return {
        d: dir, p: pt
    };
}

//Returns a plane object.
//normal should be a unit vector perpendicular to the plane.
//pt should be a point on the plane.
function plane( normal, pt ) {
    //v = a vector, n = normal of the plane, p = a point on the plane
    //v.x * n.x + v.y * n.y + v.z * n.z - ( p.x * n.x - p.y * n.y - p.z * n.z ) = 0
    //ax + by + cz + d = 0
    return {
        n: normal,
        d: -vecDot( normal, pt )
    };
}

//Returns a rectangle object.
//The rectangle is defined by the three given vectors, a, b, and c
//a, b, and c are expected to be points laid out relative to one another like so:
// a-----+
// |     |
// |     |
// b-----c
function rect( a, b, c ) {
    return {
        p: b,
        x: vecSub( c, b ),  //Vector from b to c; "x" vector
        y: vecSub( a, b )   //Vector from b to a; "y" vector
    };
}

//Returns a point on the given line:
//    line.p + t * line.d
//line should be the line to find a point on.
//t should be a factor indicating how many times line.d should be multiplied.
function line_point( line, t ) {
    return vecAdd( line.p, vecMul( t, line.d ) );
}

//Returns the plane the given rectangle resides on
function rect_plane( rect ) {
    return plane( vecNormalize( vecCross( rect.x, rect.y ) ), rect.p );
}

//Finds the intersection point between the given line and plane.
//Returns a factor, t, indicating how many times the line's direction vector (line.d) must be multiplied to arrive at the intersection point.
//You can call line_point( line, t ) to convert t to a point.
//By inspecting t's sign, you can determine whether the intersect is in front of line.p (in the direction of "line.d") or behind it:
//    t > 0: In front of line.p
//    t < 0: Behind line.p
//Returns null if the line is parallel to the plane.
function line_plane_intersect( line, plane ) {
    //Dot product between the normal of the plane and the direction vector of the line.
    var dot = vecDot( plane.n, line.d );

    //Plane and line are parallel; this either means the line is on the plane (and therefore the entire line intersects),
    //or the line is NOT on the plane and never intersects it. This function returns a point, so either of these cases are regarded as failures.
    if( dot == 0 )
        return null;

    var t = -( vecDot( plane.n, line.p ) + plane.d ) / dot;
    return t;
}

//Returns true if the given point is contained on the surface of the given rectangle.
function rect_contains( rect, pt ) {
    var pr = vecSub( pt, rect.p ); //pt's location relative to b
    var x  = rect.x;
    var y  = rect.y;
    
    //Note: dot(a,b) = |a||b|cos(t)
    var xCoord = vecDot( pr, x ); //"x coordinate" of the point on the rectangle; if on the rectangle between 0 and |bToC|^2
    if( xCoord < 0 || xCoord > vecSqLength( x ) )
        return false;
    var yCoord = vecDot( pr, y ); //"y coordinate" of the point on the rectangle; ranges between 0 and |bToA|^2
    if( yCoord < 0 || yCoord > vecSqLength( y ) )
        return false;
    return true;
}