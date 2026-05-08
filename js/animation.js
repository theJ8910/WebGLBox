"use strict";

//Animation related
const FRAMETIME               = 1 / 60; //Number of seconds one frame takes
const ROTATE_SPEED            = TWO_PI; //How fast the cube (or one of its sides) rotates (360 degrees / sec)
const SIDE_TRANSLATE_DISTANCE = 0.3;
const SIDE_TRANSLATE_DELTA    = FRAMETIME * 4 * SIDE_TRANSLATE_DISTANCE;

class SideAnimator {

constructor( side ) {
    this.side       = side;
    this.angle      = 0;
    this.angleIdeal = 0;
    this.angleDelta = 0; //+ = CCW, - = CW
    this.translate  = 0;

    //0 = not animating, 1 = extending, 2 = rotating, 3 = retracting
    this.state      = 0;
}

rotate( amt ) {
    this.angleIdeal = HALF_PI * Math.round( ( this.angleIdeal + amt ) / HALF_PI );
    this.angleDelta = FRAMETIME * ROTATE_SPEED * Math.sign( this.angleIdeal - this.angle );
    if( this.state !== 1 || this.state !== 2 )
        this.state = 1;
}

update() {
    let newPosOrAngle;
    switch( this.state ) {
    case 1:
        //Position
        newPosOrAngle = this.translate + SIDE_TRANSLATE_DELTA;
        if( newPosOrAngle < SIDE_TRANSLATE_DISTANCE )
            this.translate = newPosOrAngle;
        else {
            this.translate = SIDE_TRANSLATE_DISTANCE;
            this.state     = 2;
        }
        this.updateMatrix();
        return true;
    break;
    case 2:
        //Angle
        newPosOrAngle = this.angle + this.angleDelta;
        const sign = Math.sign( this.angleDelta );
        if( sign * newPosOrAngle < sign * this.angleIdeal ) {
            this.angle = newPosOrAngle;
        } else {
            this.angle = wrap( this.angleIdeal, TWO_PI );
            this.angleIdeal = this.angle;
            this.state = 3;
        }
        this.updateMatrix();
        return true;
    break;
    case 3:
        //Position
        newPosOrAngle = this.translate - SIDE_TRANSLATE_DELTA;
        if( newPosOrAngle > 0 )
            this.translate = newPosOrAngle;
        else {
            this.translate = 0;
            this.state     = 0;
        }
        this.updateMatrix();
        return true;
    break;
    }
    return false;
}

updateMatrix() {
    const side = this.side;
    const c = Math.cos( this.angle );
    const s = Math.sin( this.angle );

    let x = EAST, y = NORTH, z = UP;
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

}
