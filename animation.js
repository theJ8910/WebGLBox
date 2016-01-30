//Animation related
var FRAMETIME               = 1 / 60; //Number of seconds one frame takes
var ROTATE_SPEED            = TWO_PI; //How fast the cube (or one of its sides) rotates (360 degrees / sec)
var SIDE_TRANSLATE_DISTANCE = 0.3;
var SIDE_TRANSLATE_DELTA    = FRAMETIME * 4 * SIDE_TRANSLATE_DISTANCE;

function SideAnimator( side ) {
    this.side       = side;
    this.angle      = 0;
    this.angleIdeal = 0;
    this.angleDelta = 0; //+ = CCW, - = CW
    this.translate  = 0;

    //0 = not animating, 1 = extending, 2 = rotating, 3 = retracting
    this.state      = 0;
}

SideAnimator.prototype.rotate = function( amt ) {
    this.angleIdeal = HALF_PI * Math.round( ( this.angleIdeal + amt ) / HALF_PI );
    this.angleDelta = FRAMETIME * ROTATE_SPEED * Math.sign( this.angleIdeal - this.angle );
    if( this.state != 1 || this.state != 2 )
        this.state = 1;
}

SideAnimator.prototype.update = function() {
    switch( this.state ) {
    case 1:
        var newPos = this.translate + SIDE_TRANSLATE_DELTA;
        if( newPos < SIDE_TRANSLATE_DISTANCE )
            this.translate = newPos;
        else {
            this.translate = SIDE_TRANSLATE_DISTANCE;
            this.state     = 2;
        }
        this.updateMatrix();
    break;
    case 2:
        var newAngle = this.angle + this.angleDelta;
        var sign = Math.sign( this.angleDelta );
        if( sign * newAngle < sign*this.angleIdeal ) {
            this.angle = newAngle;
        } else {
            this.angle = wrap( this.angleIdeal, TWO_PI );
            this.angleIdeal = this.angle;
            this.state = 3;
        }
        this.updateMatrix();
    break;
    case 3:
        var newPos = this.translate - SIDE_TRANSLATE_DELTA;
        if( newPos > 0 )
            this.translate = newPos;
        else {
            this.translate = 0;
            this.state     = 0;
        }
        this.updateMatrix();
    break;
    }
}

SideAnimator.prototype.updateMatrix = function() {
    var side = this.side;
    var c = Math.cos( this.angle );
    var s = Math.sin( this.angle );

    var x = east, y = north, z = up;
    switch( side ) {
    case SIDE_FRONT:
        x = [  c,  0, -s ];
        z = [  s,  0,  c ];
    break;
    case SIDE_BACK:
        x = [  c,  0,  s ];
        z = [ -s,  0,  c ];
    break;
    case SIDE_RIGHT:
        y = [  0,  c,  s ];
        z = [  0, -s,  c ];
    break;
    case SIDE_LEFT:
        y = [  0,  c, -s ];
        z = [  0,  s,  c ];
    break;
    case SIDE_TOP:
        x = [  c,  s,  0 ];
        y = [ -s,  c,  0 ];
    break;
    case SIDE_BOTTOM:
        x = [  c, -s,  0 ];
        y = [  s,  c,  0 ];
    break;
    }
    m_side[ side ] = world( x, y, z, vecMul( this.translate, SIDE_DIRECTION[ side ] ) );
}