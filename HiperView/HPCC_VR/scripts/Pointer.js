function Pointer(sprite_png, scale)
{
    this.type = "Pointer";
    var sprite;

    addSprite();

    function addSprite()
    {
        var spriteMap = new THREE.TextureLoader().load( sprite_png );
        var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
        sprite = new THREE.Sprite( spriteMaterial );
        sprite.scale.set( scale, scale, scale )
    }

    return sprite;
}