import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

function isWebGLSupported() {
  if (window.WebGLRenderingContext) {
    const canvas = document.createElement('canvas');
    try {
      const gl = canvas.getContext('webgl2');
      if (!gl) return false;

      // Load floating-point texture extensions
      const ext =
        gl.getExtension("OES_texture_float") ||
        gl.getExtension("OES_texture_float_linear");

      if (!ext) return false;

      return true;
    } catch (e) {
      // WebGL is supported, but disabled
    }
    return false;
  }
  // WebGL not supported
  return false;
}

if (!isWebGLSupported()) {
  alert('Your browser does not support WebGL2 or floating-point textures.');
  throw Error('Unsupported WebGL version');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
