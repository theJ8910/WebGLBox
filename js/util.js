"use strict";

const TWO_PI  = 2 * Math.PI;
const HALF_PI = Math.PI / 2;

//Valid image MIME types and extensions
const VALID_TYPES      = [ "image/png", "image/jpeg" ];
const VALID_EXTENSIONS = [ "png", "jpg", "jpeg" ];

//Returns the angular distance between two numbers.
//Returns a number between -Math.PI and Math.PI.
function angle_diff( from, to ) {
    //Wrap from and to to the range [0, 2PI]
    from = wrap( from, TWO_PI );
    to   = wrap( to,   TWO_PI );
    const diff = to - from;

    //Return whichever difference is shorter; e.g. if from is 0 and to is 3PI/2, return -PI/2 instead of 3PI/2.
    if(      diff >  Math.PI ) { return diff - TWO_PI; }
    else if( diff < -Math.PI ) { return diff + TWO_PI; }
    else                       { return diff;          }
}

//Wraps the given number x between 0 and the given bound, b (where b > 0).
//Similiar to x % b but different behavior for negative numbers:
//x:           -4 -3 -2 -1  0  1  2  3  4  5  6
//wrap(x,3):    2  0  1  2  0  1  2  0  1  2  0
function wrap( x, b ) {
    return x - b * Math.floor( x / b );
}

//Converts client x/y coordinates (e.g. event.clientX, event.clientY) to coordinates relative to the top-left corner of the given element.
//Returns an Array containing the two converted coordinates, [x,y].
function clientToLocal( x, y, element ) {
    const r = element.getBoundingClientRect();
    return [
        x - r.left,
        y - r.top
    ];
}

//Returns true if "x" is a power of two (e.g. 1, 2, 4, 6, 8, 16, 32, 64, 128, etc)
//Only positive numbers can be powers of two (e.g. 0 and -2 do not count).
//Furthermore, this function does not consider negative powers of two (such as 2^(-1) === 0.5) to be powers of two.
function isPowerOfTwo( x ) {
    return x > 0 && ( x & ( ~x + 1 ) ) === x;
}

//Returns true if the given file is an image.
//Returns false otherwise.
function isImage( file ) {
    return VALID_TYPES.includes( file.type );
}

//Returns true if the given URL ends with an image extension (e.g. ".png" in "http://www.whatever.com/something.png").
//Returns false otherwise.
function isImageURL( url ) {
    const results = url.match( /\.(\w+)$/ );
    if( results )
        return VALID_EXTENSIONS.includes( results[1].toLowerCase() );
}

//Turns the given image into a power of two
function fixImage( image ) {
    const oldWidth  = image.width;
    const oldHeight = image.height;

    //Determine new power-of-two width and height
    let newWidth = 1;
    while( newWidth  < oldWidth  ) { newWidth  *= 2; }
    let newHeight = 1;
    while( newHeight < oldHeight ) { newHeight *= 2; }

    //Create a canvas of this size
    const canvas  = document.createElement( "canvas" );
    canvas.width  = newWidth;
    canvas.height = newHeight;

    //Draw the image in the upper-left corner
    const ctx = canvas.getContext( "2d" );
    ctx.drawImage( image, 0, 0 );

    //Return the canvas (generally usable anywhere an image can be used)
    return canvas;
}

//Log info about a drag-drop to the console
function dragInfo( dt ) {
    console.log( "Item count: " + dt.mozItemCount );
    console.log( "File count: " + dt.files.length );
    if( dt.mozItemCount === 1 ) {
        for( const k of dt.types ) {
            const d = dt.getData( k );
            console.log( "Data: " + k + ", " + d + " (" + typeof( d ) + ")" );
        }
    } else {
        for( const k of dt.types ) {
            const d = dt.getData( k );
            const items = [];
            if( k === "application/x-moz-file" ) {
                for( const file of dt.files )
                    items.push( file );
            } else {
                for( let i = 0; i < dt.mozItemCount; ++i )
                    items.push( dt.mozGetDataAt( k, i ) );
            }
            console.log( "Data: " + k + ", [" + items.join( ", " ) + "] ([" + items.map( x => typeof( x ) ).join( ", " ) + "])" );
        }
    }
}