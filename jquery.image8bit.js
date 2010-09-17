/**
 * jQuery plugin to give images the aspect of good old 8-bit graphics.
 * The original img tag is replaced by a canvas tag, thus breaking jQuery fluent interface.
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
 * @todo: Inlining rgbToHsl() may reduce size after minification significantly. 
 */
(function($, document, sCanvas, s2d) {
	$.fn.image8bit = function(params) {
		/**
		 * Converts an RGB color value to HSL. Conversion formula adapted from
		 * http://en.wikipedia.org/wiki/HSL_color_space. Assumes r, g, and b are
		 * contained in the set [0, 255] and returns h, s, and l in the set [0, 1].
		 * http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
		 * 
		 * @param {number} r The red color value.
		 * @param {number} g The green color value.
		 * @param {number} b The blue color value.
		 * @return {Array.<number>} The HSL representation.
		 */
		function rgbToHsl(r, g, b) {
			r /= 255;
			g /= 255;
			b /= 255;
			var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2, d;
			if (max !== min) {
				d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				switch (max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / d + 2;
					break;
				default:
					h = (r - g) / d + 4;
					break;
				}
				h /= 6;
			}
			return [ h, s, l ];
		}

		if (document.createElement(sCanvas).getContext) {
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
					data;
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
						pixelContext.drawImage(image, x, y, blockSizeX, blockSizeY, 0, 0, 1, 1);
						data = pixelContext.getImageData(0, 0, 1, 1).data;
						data = rgbToHsl(data[0], data[1], data[2]);
						data[0] = Math.round(data[0] / params.granularity * 100) * params.granularity * 3.6;
						data[1] = Math.round(data[1] / params.granularity * 100) * params.granularity+"%";
						data[2] = Math.round(data[2] / params.granularity * 100) * params.granularity;
						context.fillStyle = "hsl(" + data.join(",") + "%)";
						
						context.fillRect(x, y, params.blocksize, params.blocksize);
					}
				}
				$this.replaceWith(canvas);
			});
		}
	};
})(jQuery, document, "canvas", "2d");