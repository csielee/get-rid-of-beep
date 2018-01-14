console.log("I am event 2")

const gpu = new GPU();

function grayKernel(length) {
    var kernel = gpu.createKernel(function(data) {
        // width this.thread.x
        // height this.thread.y
        if (this.thread.x % 4 == 3)
            return data[this.thread.x]
        
        let index = this.thread.x - (this.thread.x % 4);
        let gray = data[index+0]*30
        gray += data[index+1]*59 
        gray += data[index+2]*11 + 50
        gray -= gray % 100;
        gray /= 100;
        return gray;
    }).setOutput([length])
    return kernel;
}

// make random
const windowSize = 3;
var arr=[];
for (let i=0;i<windowSize*windowSize;i++)
    arr.push(i);

var randomArr = [];
while(arr.length!=0) {
    // get a random number (<arr.length)
    let r = (Math.floor(Math.random()*(arr.length)))%arr.length;
    randomArr.push(arr.splice(r,1)[0]);
}

function mosaicKernel(length,w,h) {
    //const depth = 4; // r,b,g,a
    //let width = w;
    //let height = h;
    const option = {
        constants : {
            depth : 4,
            width : w,
            height : h,
            windowSize : windowSize,
        }
    }
    var kernel = gpu.createKernel(function(data,random,random_length) {
        var colspace = this.constants.width*this.constants.depth;
        var x = this.thread.x % colspace;
        x = Math.floor(x/this.constants.windowSize)
        x = Math.floor(x/this.constants.depth)
        var y = this.thread.x / colspace;
        y = Math.floor(y);
        y = Math.floor(y/this.constants.windowSize)

        var r = random[x % random_length];
        x = x*this.constants.windowSize + r % this.constants.windowSize;
        y = y*this.constants.windowSize + Math.floor(r / this.constants.windowSize);
        //if (x > this.constants.width || y > this.constants.height)
        //    return 0;
        
        var pixel = data[x*this.constants.depth+y*this.constants.width*this.constants.depth+this.thread.x%this.constants.depth];
        return pixel;
    },option).setOutput([length]);
    return kernel;
}

function testMosaic() {
    var data = [
        255,0,0,255, 0,255,0,255, /*0,0,255,255,*/
        255,255,0,255, 0,255,255,255, /*255,0,255,255,*/
        /*128,0,128,255, 0,128,128,255, 128,128,0,255,*/
    ]
    var kernel = mosaicKernel(data.length,2,2);
    var result = kernel(data, randomArr, randomArr.length);
    return result;
}

function mosaic(data, width, height) {
    var kernel = mosaicKernel(data.length, width, height);
    return kernel(data, randomArr, randomArr.length);
}

function face(img, W, H) {
    var retAry= [];
    var tracker = new tracking.ObjectTracker('face');
    var ret = tracker.track(img, W, H);
    ret.forEach(function(rect) {
        console.log(rect);
        retAry.push(rect);
    });
    return retAry;
}

chrome.runtime.onMessage.addListener(
    function(data, sender, sendResponse) {  
        console.log(sender.tab ?   
            "取得到tab，這是來自內容腳本的訊息：" + sender.tab.url   
            : "沒有tab，這是來自擴充功能內部的訊息");  
        // create gpu kernel
        //let kernel = grayKernel(data.length)
        // use gpu kernel
        var length = data.length;
        //var result = kernel(data);
        var faces = face(data, data.width, data.height)
        var result = mosaic(data, data.width, data.height)
        faces.forEach(rect => {
            var colspace = data.width
            for (let x = rect.x;x <= rect.x + rect.width;x++)
                for (let y = rect.y ; y <= rect.y + rect.height;y++) {
                    for (let d = 0;d<4;d++) {
                        var index = x*4 + y*data.width*4 + d;
                        data[index] = result[index];
                    }
                }
        })

        /*data = Object.assign(data, result)
        data.length = length;*/
        
        sendResponse(data);
});
