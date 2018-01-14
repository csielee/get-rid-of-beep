console.log("I am event 2")

const gpu = new GPU();
const cpu = new GPU({ mode: 'cpu' });

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

function mosaicKernel(length,w,h,isCPU=false) {
    //const depth = 4; // r,b,g,a
    //let width = w;
    //let height = h;
    const option = {
        constants : {
            depth : 4,
            width : w,
            height : h,
            windowSize : windowSize,
            debug : true,
        }
    }
    var device = gpu;
    if (isCPU)
        device = cpu;
    var kernel = device.createKernel(function(data,random,random_length) {
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

function mosaicWithGPU(data, width, height) {
    var kernel = mosaicKernel(data.length, width, height);
    return kernel(data, randomArr, randomArr.length);
}

function mosaicWithCPU(data, width, height) {
    var kernel = mosaicKernel(data.length, width, height, true);
    return kernel(data, randomArr, randomArr.length);
}

function mosaicWithJS(data, width, height) {
    var result = [];
    for (let i=0;i<data.length;i++) {
        var colspace = width*4;
        var x = i % colspace;
        x = Math.floor(x/windowSize)
        x = Math.floor(x/4)
        var y = i / colspace;
        y = Math.floor(y);
        y = Math.floor(y/windowSize)

        var r = randomArr[x % randomArr.length];
        x = x*windowSize + r % windowSize;
        y = y*windowSize + Math.floor(r / windowSize);
        
        result[i] = data[x*4+y*width*4+i%4];
    }
    return result;
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

        //var length = data.length;
        
        // 偵測人臉
        var faces = face(data, data.width, data.height)
        if (faces.length == 0) {
            data.isSuccess = false;
            sendResponse(data);
        }

        // 進行馬賽克
        if (data.useCPU) {
            console.log('use CPU to mosaic')
            var result = mosaicWithCPU(data, data.width, data.height)
        }
        if (data.useGPU) {
            console.log('use GPU to mosaic')
            var result = mosaicWithGPU(data, data.width, data.height)
        }
        if (data.useJS) {
            console.log('use JS to mosaic')
            var result = mosaicWithJS(data, data.width, data.height)
        }
        
        // 把人臉馬賽克
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
        // 將資料丟回去 context script
        data.isSuccess = true;
        sendResponse(data);
});
