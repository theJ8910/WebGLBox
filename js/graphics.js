"use strict";

//GLOBALS
window.canvas = null;
window.gl     = null;

function initWebGL( canvas ) {
    //Create OpenGL context
    const attr = { preserveDrawingBuffer: true, antialias: false };
    const gl = canvas.getContext( "webgl", attr ) || canvas.getContext( "experimental-webgl", attr );
    if( gl === null ) {
        console.error( "Can't init GL context." );
        return false;
    }

    window.canvas = canvas;
    window.gl     = gl;

    return true;
}

function loadShader( id ) {
    //Find script with the given id.
    const script = document.getElementById( id );
    if( !script ) {
        console.error( "Can't find shader \"" + id + "\"." );
        return null;
    }

    //Create appropriate type of shader based on mime-type of script
    let shader;
    switch( script.type ) {
    case "x-shader/x-vertex":
        shader = gl.createShader( gl.VERTEX_SHADER );
        break;
    case "x-shader/x-fragment":
        shader = gl.createShader( gl.FRAGMENT_SHADER );
        break;
    default:
        console.error( "Unrecognized shader type for shader \"" + id + "\": \"" + script.type + "\"." );
        return null;
    }

    //Compile shader
    gl.shaderSource( shader, script.text );
    gl.compileShader( shader );
    if( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
        console.error( "Shader \"" + id + "\" failed to compile: " + gl.getShaderInfoLog( shader ) );
        return null;
    }

    return shader;
}

function lookupAttrib( program, name ) {
    const a = gl.getAttribLocation( program, name );
    if( a === null || a === -1 ) {
        console.error( "Couldn't find attribute \"" + name + "\"." );
        return null;
    }
    gl.enableVertexAttribArray( a );
    return a;
}

function lookupUniform( program, name ) {
    const u = gl.getUniformLocation( program, name );
    if( u === null || u === -1 ) {
        console.error( "Couldn't find uniform \"" + name + "\"." );
        return null;
    }
    return u;
}

//Loads the given image as an OpenGL texture and returns a texture object.
//img can be an <img>, <canvas>, or anything else that can be passed to gl.texImage2D.
//The returned object contains three parameters:
//    t:    The OpenGL texture
//    refs: Number of references to this texture, initialized to 1. The OpenGL texture is deleted when this reaches 0.
//    id:   The resource# assigned to this texture.
function loadTexture( img ) {
    const texture = gl.createTexture();
    
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.bindTexture( gl.TEXTURE_2D, null );

    return { t: texture, refs: 0, id: ++t_nextID };
}

//Asynchronously load a texture from the given url.
//onSuccess should be a callback that accepts a texture object returned by loadTexture() as its first argument.
//onFailure is an optional callback accepting no arguments.
//onSuccess is called if a valid image was loaded from the url successfully.
//onFailure is called if loading the image and creating a texture from it failed for any reason.
function loadTextureFromURL( url, onSuccess, onFailure ) {
    const img = new Image();
    img.addEventListener( "load", function( evt ) {
        const texture = loadTexture( img );
        onSuccess( texture );
    }, false );

    if( onFailure ) {
        img.addEventListener( "error", function( evt ) {
            onFailure();
        }, false )
    }
    img.src = url;
}

//Increase texture reference count
function incTexture( texture ) {
    ++texture.refs;
}

//Decrease texture reference count
function decTexture( texture ) {
    if( texture.refs === 1 ) {
        console.log( "Unloaded texture " + texture.id );
        gl.deleteTexture( texture.t );
    } else {
        --texture.refs;
    }
}