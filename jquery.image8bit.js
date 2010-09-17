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
					color,
					max,
					min,
					h,
					s,
					l,
					d;
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
						color = [color[0]/255, color[1]/255, color[2]/255];
						max = Math.max(color[0], color[1], color[2]);
						min = Math.min(color[0], color[1], color[2]);
						h = s = 0;
						l = (max + min) / 2;
						if (max !== min) {
							d = max - min;
							s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
							switch (max) {
							case color[0]:
								h = (color[1] - color[2]) / d + (color[1] < color[2] ? 6 : 0);
								break;
							case color[1]:
								h = (color[2] - color[0]) / d + 2;
								break;
							default:
								h = (color[0] - color[1]) / d + 4;
								break;
							}
							h /= 6;
						}
						color = [h, s, l];

						// Apply granularity.
						color[0] = Math.round(color[0] / params.granularity * 100) * params.granularity * 3.6;
						color[1] = Math.round(color[1] / params.granularity * 100) * params.granularity + "%";
						color[2] = Math.round(color[2] / params.granularity * 100) * params.granularity;
						context.fillStyle = "hsl(" + color.join(",") + "%)";
						context.fillRect(x, y, params.blocksize, params.blocksize);
					}
				}
				$this.replaceWith(canvas);
			});
		}
	};
})(jQuery, document, "canvas", "2d");