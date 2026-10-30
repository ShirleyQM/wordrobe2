'use strict';
window.FigureView={paint(target,html){if(!target)return;if(target.__figureMarkup===html)return;target.innerHTML=html;target.__figureMarkup=html;}};
