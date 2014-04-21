var app = {
	
	dim_x: 4, 			//轉珠盤的橫列珠子數
	dim_y: 4, 			//轉珠盤的直列珠子數
	tile_w: 70, 		//珠子寬
	tile_h: 70, 		//珠子高
	tile_b: 4, 			//珠子框線

	down_speed: 200, 	// 珠子下降的速度
	move_speed: 40, 	// 移動珠子的速度
	gone_speed: 200, 	// 珠子消除的速度

	combo_cnt: 0,		// 連鎖次數
	
	isMobile: false,

    initialize: function() {
       
	   	this.isMobile = (/android|webos|iphone|ipad|ipod|blackberry/i.test(navigator.userAgent.toLowerCase()));
		if( this.isMobile == true ) {
		
			document.addEventListener('deviceready', this.onDeviceReady, false);
		} else {
		
			$(document).ready(function(e) {
				app.onDeviceReady();
			});
		}
    },

    onDeviceReady: function(id) {

		//初始化盤面
		app.init();

		// 監聽 draggable
		app.listenDraggable();
		
		// 設定重試鈕
		app.setTryAgainBtn();
    },
	
	//初始化盤面
	init: function() {

		// 調整轉珠盤上層大小
		$('.demo_top').css('width', this.dim_x * this.tile_w).css('padding-left', this.tile_b * 2).css('padding-top', this.tile_b * 2);

		// 調整轉珠盤大小
		$('.demo').css('width', this.dim_x * this.tile_w).css('height', this.dim_y * this.tile_h);

		var h = Math.floor(this.dim_y * this.tile_h) + 'px';
		$('.game_over').css('line-height', h );
	
		$('.demo').html("");

		var str = "";
		//產生珠子並指定位置、數字
		for(i=0; i<this.dim_y; i++){
	
			for(j=0; j<this.dim_x; j++){

				var num = pickRandNumber();

				str += '<div id="'+j+'-'+i+'" data-num="'+num+'" class="tile-'+num+' tile" style="left:'+ j * this.tile_w +'px; top:'+ i * this.tile_h +'px;">'+num+'</div>'
			}
		}
		$('.demo').append(str);

		//設定所有珠子的尺寸及框線
		$('.tile').css('width', this.tile_w - this.tile_b*2);
		$('.tile').css('height', this.tile_h - this.tile_b*2);

		this.combo_cnt=0;
	},

	// 監聽 draggable
	listenDraggable: function() {

		var self = this;
		$(".tile").draggable({

			grid: [parseInt(self.tile_w), parseInt(self.tile_h)], // 一個格子的尺寸
			drag: function(e, ui){
				
				self.combo_cnt = 0;
				$('#combo').text(self.combo_cnt);
	
				$(this).addClass('sel'); 			//拖曳中珠子的樣式
				var selLeft = Math.abs(ui.position.left);
				var selTop = ui.position.top;
		
				var pos_x = selLeft / self.tile_w;
				var pos_y = selTop / self.tile_h;
				var cur_n = pos_x+'-'+pos_y; 		//拖曳中珠子的位置 "x-y"，與ID相同
		
				//目標位置與ID不同時，表示被移動了
				if(cur_n!=e.target.id) {

					var ori = e.target.id; 		//原本的ID(即原本的位置)
					self.moveTo(cur_n, ori); 		//將目標位置的珠子移到原本拖曳中珠子的位置
					$(this).attr('id', cur_n); 	//拖曳中珠子標示為新位罝ID
				}
			},
			stop: function(e, ui) {
	
				$(this).removeClass('sel');		//停止拖曳就取消拖曳中樣式
				self.makeChain();					//開始計算要消除的Chain
			},
			containment: ".demo", 				//限制珠子的移動範圍
		});
	},

	// 設定重試鈕
	setTryAgainBtn: function() {

		$('.try_again_btn').click(function() {

			app.init();

			app.listenDraggable();

			$('#game_over').hide();
		});
	},
		
	//移動珠子
	moveTo: function(id, pos) {

		var aryPos = pos.split("-");
		var x = aryPos[0] * this.tile_w;
		var y = aryPos[1] * this.tile_h;
		$('#'+id).animate({'top':y, 'left':x}, {'duration': this.move_speed});
		$('#'+id).attr('id', pos);
	},
	
	//消除成為Chain的珠子
	makeChain: function() {

		var self = this;

		//flagMatrix記錄每個珠子XY軸有多少相同珠，"2,3"表示X相鄰有2顆、Y相鄰有3顆 (Chain的例子)
		var flagMatrix = new Array();
		for(i=0; i<this.dim_x; i++) {

			flagMatrix[i] = new Array();
		}

		//開始統計Chain，由左至右，由上而下的visit每一顆，記錄它的X,Y軸的鄰居擁有同色珠的數目(是否成為可消的Chain)
		for(x=0; x<this.dim_x; x++) {

			for(y=0; y<this.dim_y; y++) {

				var repeatX = 0;
				var repeatY = 0;
				var num = '';
				var xn = 0;
				var yn = 0;
				
				if(x > 0) {

					var curX_TileNum = $('#'+x+'-'+y).attr('data-num');
					var lasX_TileNum = $('#'+(x-1)+'-'+y).attr('data-num');

					//目前X軸這顆的顏色 和 X軸上一顆的顏色 相同，repeatX+1
					if (curX_TileNum == lasX_TileNum) {

						repeatX = flagMatrix[x-1][y].repeatX+1;
					}else{

						repeatX = 0;
					}

					num = curX_TileNum;

					//repeatX>1表示有三顆相同，成為Chain了                
					if(repeatX > 1) {

						var i = repeatX;

						//將X Chain上的每一顆都標上此Chain的總顆數
						for (i; i > 0; i--) {
	
							flagMatrix[x-i][y].repeatX = repeatX;
							flagMatrix[x-i][y].num = num;
							flagMatrix[x-i][y].xn = i;
						}
					}
				}

				if(y > 0) {

					var curY_TileNum = $('#'+x+'-'+y).attr('data-num');
					var lasY_TileNum = $('#'+x+'-'+(y-1)).attr('data-num');

					//目前X軸這顆的顏色 和 X軸上一顆的顏色 相同，repeatY+1
					if (curY_TileNum == lasY_TileNum){

						repeatY = flagMatrix[x][y-1].repeatY+1;
					}else{

						repeatY = 0;
					}

					num = curY_TileNum;

					//repeatY>1表示有三顆相同，成為Chain了     
					if (repeatY > 1) {

						var i = repeatY;

						for (i; i > 0; i--) {

							flagMatrix[x][y-i].repeatY = repeatY;
							flagMatrix[x][y-i].num = num;
							flagMatrix[x][y-i].yn = i;
						}
					}
				}

				flagMatrix[x][y] = new repeatMap(repeatX, repeatY, num, xn, yn);
			}
		}

		// 記錄完Chain了，開始準備消除珠子
		var flag = false;
		var aryChk = new Array();
		var aryChains = new Array();
		var aryCombo = new Array();

		//收集combo group
		for(x=0; x<this.dim_x; x++) {

			for(y=0; y<this.dim_y; y++) {

				if (flagMatrix[x][y].repeatX > 1 || flagMatrix[x][y].repeatY > 1) {
					aryChains.push(x+'-'+y);
				}
			}
		}

		var combo_n = 0;
		for(var i=0; i<aryChains.length; i++) {

			if (!isChecked(aryChk, aryChains[i])) {
	
				aryChk.push(aryChains[i]);
				aryCombo[combo_n] = new Array();
				aryCombo[combo_n].push(aryChains[i]); //combo head
				ap = aryChains[i].split('-');
				var x = parseInt(ap[0]);
				var y = parseInt(ap[1]);
				rx = flagMatrix[x][y].repeatX;
				ry = flagMatrix[x][y].repeatY;

				if(rx>1) {

					var ofs_x = rx - parseInt(flagMatrix[x][y].xn);
					x = x - ofs_x;

					for (var a=0; a<=rx; a++) {

						if (!isChecked(aryChk, (x+a)+'-'+y)) {

							aryChk.push((x+a)+'-'+y);
							aryCombo[combo_n].push((x+a)+'-'+y);
							sry = flagMatrix[x+a][y].repeatY;
							syn = flagMatrix[x+a][y].yn;

							if(sry > 1) {

								var ofs_y = sry - syn;
								var sy = y - ofs_y;
								for (var sb=0; sb<=sry; sb++){

									if (!isChecked(aryChk, (x+a)+'-'+(sy+sb))){

										aryChk.push((x+a)+'-'+(sy+sb));
										aryCombo[combo_n].push((x+a)+'-'+(sy+sb));
									}
								}
							}
						}
					}
				}

				if(ry>1){

					var ofs_y = ry - parseInt(flagMatrix[x][y].yn);
					y = y-ofs_y;
					for(var b=0; b<=ry; b++) {

						if(!isChecked(aryChk, x+'-'+(y+b))) {

							aryChk.push(x+'-'+(y+b));
							aryCombo[combo_n].push(x+'-'+(y+b));
							srx = flagMatrix[x][y+b].repeatX;
							sxn = flagMatrix[x][y+b].xn;

							if(srx > 1) {

								var ofs_x = srx - sxn;
								var sx = x-ofs_x;
								for(var sa=0; sa<=srx; sa++) {

									if (!isChecked(aryChk, (sx+sa)+'-'+(y+b))) {

										aryChk.push((sx+sa)+'-'+(y+b));
										aryCombo[combo_n].push((sx+sa)+'-'+(y+b));
									}
								}
							}
						}
					}
				}
				combo_n++;
			}
		}
	
		//走訪combo chain
		for(var d=0; d<aryCombo.length; d++){

			for(var e=0; e<aryCombo[d].length; e++){

				aryP = aryCombo[d][e].split('-');
				var x = aryP[0];
				var y = aryP[1];
			}
			$('#combo').text(++this.combo_cnt);
		}

		// 隱藏珠子    
		for(var x=0; x<this.dim_x; x++) {

			for(var y=0; y<this.dim_y; y++) {

				if (flagMatrix[x][y].repeatX > 1 || flagMatrix[x][y].repeatY > 1) {

					if(	y > 0 && y < this.dim_y -1 &&
						flagMatrix[x][y].num == flagMatrix[x][y-1].num && 
						flagMatrix[x][y].num == flagMatrix[x][y+1].num) {   

						doubleTileNum(x, y);
					} else if ( x > 0 && x < this.dim_x -1 &&
						flagMatrix[x][y].num == flagMatrix[x-1][y].num && 
						flagMatrix[x][y].num == flagMatrix[x+1][y].num) { 

						doubleTileNum(x, y);
					} else {

						$('#'+x+'-'+y).animate({'opacity':0.2}, this.gone_speed, function(){
							$(this).addClass('gone').attr('data-gone', '1');
						});
					}

					flag = true;
				}
			}
		}

		$(".tile").promise().done(function() {

			if (flag){

				$('.tile').css('opacity',1);
				self.gravity();
				
				// 檢查是否 GameOver
				self.checkGameOver();
			}
			
			
			
		});
		
		
	},

	// 消除及重新產生珠子
	gravity: function() {

		//計算被消除的珠子產生的hole有多少，再把上方的珠子和被消除的珠子交換位置
		for(var x=0; x<this.dim_x; x++) {

			var hole = 0;
			for(var y=this.dim_y-1; y>=0; y--) {

				if ('1'==$('#'+x+'-'+y).attr('data-gone')) {

					hole++;
				} else {

					var oldPos = x+'-'+y;
					var newPos = x+'-'+(y+hole);
					this.tileExchange(oldPos, newPos);
				}
			}
		}
		
		var self = this;

		// 讓被消除掉的珠子重生
		$('.tile[data-gone=1]').each(function(){

			//隨機取色珠的母體
			var num = pickRandNumber();
			$(this).removeClass('tile-2 tile-4 tile-8 tile-16 tile-32 tile-64 tile-128 tile-256 tile-512 tile-1024 tile-2048 gone');
			$(this).addClass('tile-'+num);
			$(this).attr('data-num', num);
			$(this).text(num);

			$(this).removeAttr('data-gone');

			$(this).css('z-index',999);

			var aryPos = $(this).attr("id").split("-");
			var x = aryPos[0] * self.tile_w;
			var y = aryPos[1] * self.tile_h;
	
			$(this).offset({top:y-300});
			$(this).animate({'top':y, 'left':x}, self.down_speed);
		});

		setTimeout(this.makeChain, this.down_speed+100);
	},

	//交換珠子
	tileExchange: function(oid, nid){

		if(oid!=nid && 
			( $('#'+oid).attr('data-gone')=='1' || $('#'+nid).attr('data-gone')=='1' ) && 
			$('#'+oid).not(':animated') || $('#'+nid).not(':animated') ){

			var pos_o = oid.split("-");
			var pos_n = nid.split("-");
			var ox = pos_o[0] * this.tile_w;
			var oy = pos_o[1] * this.tile_h;
			var nx = pos_n[0] * this.tile_w;
			var ny = pos_n[1] * this.tile_h;

			$('#'+oid).animate({'top':ny, 'left':nx}, {'duration':this.down_speed});
			$('#'+nid).position({top:oy, left:ox});

			$('#'+oid).attr('name',oid);
			$('#'+nid).attr('name',nid);

			$('#'+oid).attr('id',nid);
			$('div[name='+nid+']').attr('id',oid);

			$('#'+oid).attr('name','');
			$('#'+nid).attr('name','');
		}
	},

	// 檢查是否 GameOver
	checkGameOver: function() {
								// 2  4 8 16 32 64 128 512 1024 2048 4096)
		var numArray = new Array(0, 0, 0, 0, 0, 0,  0,  0,   0,   0,    0);
		
		for(x=0; x<this.dim_x; x++) {

			for(y=0; y<this.dim_y; y++) {

				var num = $('#'+x+'-'+y).attr('data-num');
				var log_n = Math.log(num);
				var log_2 = Math.log(2); 
				// 取 num 是 2 的幾倍數
				var index = Math.floor(log_n / log_2) - 1;
				numArray[index] += 1;
			}
		}

		var isGameOver = true;
		for(var i=0; i<numArray.length; i++) {
		
			console.log("i("+i+")("+numArray[i]+")");
			if(numArray[i] >= 3)	isGameOver = false;
		}

		if(isGameOver == true) {

			console.log("Game Over");
			$('#game_over').show();
		}
	}
};

//隨機挑 2的倍數
function pickRandNumber() {

	var y = Math.floor(Math.random() * 4) + 1; // 倍數
	var num = Math.pow(2, y);	// 取2的倍數
	return num;
}

//記錄成為Chain的珠子，分別在X和Y軸有多少相同的珠子
function repeatMap(repeatX, repeatY, num, xn, yn) {

	this.repeatX = repeatX;
	this.repeatY = repeatY;
	this.num = num;
	this.xn = xn;
	this.yn = yn;

	return this;
}

// 是否已檢查過
var isChecked = function(aryChk, id){

    for (s = 0; s < aryChk.length; s++) {
		
		var thisEntry = aryChk[s].toString();
		if(thisEntry == id) {
			return true;
        }
	}
    return false;
}

// 將珠子的數字加倍
function doubleTileNum(x, y) {

	var num = $('#'+x+'-'+y).attr('data-num');
	num *= 2;

	$('#'+x+'-'+y).removeClass('tile-2 tile-4 tile-8 tile-16 tile-32 tile-64 tile-128 tile-256 tile-512 tile-1024 tile-2048 gone');
	$('#'+x+'-'+y).addClass('tile-'+num);
	$('#'+x+'-'+y).attr('data-num', num);
	$('#'+x+'-'+y).text(num);
}