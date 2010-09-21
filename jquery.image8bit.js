/**
 * jQuery plugin to give images the aspect of good old 8-bit graphics.
 * The original img tag is replaced by a canvas tag, thus breaking jQuery fluent interface.
 * 
 * RGB to HSL conversion taken from:
 * http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
 * 
 * How to use?
 * $("img").image8bit({blocksize : 5, granularity : 16});
 * 
 * 'blocksize' is the pixel size for the mosaic effect.
 * 'granularity' limits palette color number (the higher, the fewer colors it gives).
 * 
 * Possible enhancements:
 * @todo: Save canvas back to the image (Using http://www.nihilogic.dk/labs/canvas2image/).
 * @todo: Externalize canvas support test to allow using libraries like explorercanvas.
 * @todo: Apply reusable attributes (style, id, class...) from the original img to the canvas.
 * @todo: use jQuery load() to ensure the image is loaded before processing (required?).
 */
(function($, document, sCanvas, s2d) {
	$.fn.image8bit = function(params) {
		// Check for <canvas> support first.
		params = $.extend({
			blocksize : 5,
			granularity : 16
		}, params);

		$(this).each(function() {
			var $this = $(this),
				image = $this[0],
				width = $this.width(),
				height = $this.height(),
				canvas = document.createElement(sCanvas),
				pixel = document.createElement(sCanvas),
				context,
				pixelContext,
				blockSizeX,
				blockSizeY,
				y,
				x,
				color,
				max,
				min,
				r,
				g,
				b,
				h,
				s,
				l,
				d;
			if (canvas.getContext && image.tagName === "IMG") {
				canvas.width = width;
				canvas.height = height;
				context = canvas.getContext(s2d);
				pixel.width = pixel.height = 1;
				pixelContext = pixel.getContext(s2d);
				for (y = 0; y < height; y += params.blocksize) {
					for (x = 0; x < width; x += params.blocksize) {
						blockSizeX = blockSizeY = params.blocksize;
						if (blockSizeX + x > width) {
							blockSizeX = width - x;
						}
						if (blockSizeY + y > height) {
							blockSizeY = height - y;
						}

						// Draw block to a 1x1 px tmp canvas element to extract mean color.
						pixelContext.drawImage(image, x, y, blockSizeX, blockSizeY, 0, 0, 1, 1);
						try {
							color = pixelContext.getImageData(0, 0, 1, 1).data;
						} catch(err) {
							window.console && window.console.log && console.log(err.message);
							return;
						}

						// Convert color from RGB to HSL.
						r = color[0] / 255;
						g = color[1] / 255;
						b = color[2] / 255;
						max = Math.max(r, g, b);
						min = Math.min(r, g, b);
						h = s = 0;
						l = (max + min) / 2;
						if (max !== min) {
							d = max - min;
							s = l > 0.5 ? d / (2 - max - min) : d / l * 2;
							switch (max) {
							case r:
								h = (g - b) / d + (g < b ? 6 : 0);
								break;
							case g:
								h = (b - r) / d + 2;
								break;
							default:
								h = (r - g) / d + 4;
							}
						}

						// Apply granularity.
						color = [
							Math.round(h / 6 / params.granularity * 100) * params.granularity * 3.6,
							Math.round(s / params.granularity * 100) * params.granularity + "%",
							Math.round(l / params.granularity * 100) * params.granularity
						];
						context.fillStyle = "hsl(" + color.join(",") + "%)";
						context.fillRect(x, y, blockSizeX, blockSizeY);
					}
				}
				$this.replaceWith(canvas);
			}
		});
	};
})(jQuery, document, "canvas", "2d");
