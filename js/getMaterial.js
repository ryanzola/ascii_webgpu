import { texture, TextureLoader, NodeMaterial } from 'three/webgpu';
import { attribute, floor, Fn, pow, texture as tslTexture, uv, vec2 } from 'three/tsl'

import loren from '../img/loren.png?url'

function getMaterial({ asciiTexture, length }) {
  let uTexture = new TextureLoader().load(loren);

  let material = new NodeMaterial({
    wireframe: true,
  });

  const ascii_code = Fn(() => {
    const textureColor = texture(uTexture, attribute('aPixelUV'));
    const brightness = pow(textureColor.r, 0.4).add(attribute('aRandom').x.mul(-0.2));
    const asciiUV = vec2(
      uv().x.div(length).add(floor(brightness.mul(length)).div(length)), 
      uv().y
    );
    const asciiCode = tslTexture(asciiTexture, asciiUV)
    let finalColor = textureColor;

    return asciiCode.mul(finalColor);
  })

  material.colorNode = ascii_code();

  return material;
}

export default getMaterial;