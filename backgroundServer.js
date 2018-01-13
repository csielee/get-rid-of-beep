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
var arr = [0,1,2,3,4,5,6,7,8];
var randomArr = [];
while(arr.length!=0) {
    // get a random number (<arr.length)
    let r = (Math.floor(Math.random()*(arr.length)))%arr.length;
    randomArr.push(arr.splice(r,1));
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
            windowSize : 3,
        }
    }
    var kernel = gpu.createKernel(function(data, random) {
        var colspace = (this.constants.width/this.constants.windowSize)*this.constants.depth
        var x = this.thread.x % colspace;
        x = Math.floor(x/this.constants.depth)
        var y = this.thread.x / colspace;
        y = Math.floor(y);

        var r = random[this.thread.x % random.length];
        return 0;
    },option).setOutput(length/(option.constants.width*option.constants.height));
    return kernel;
}

function testMosaic() {
    let data = [
        255,0,0,255, 0,255,0,255, 0,0,255,255,
        255,255,0,255, 0,255,255,255, 255,0,255,255,
        128,0,128,255, 0,128,128,255,128,128,0,255,
    ]
    let kernel = mosaicKernel(36,3,3);
    var result = kernel(data,randomArr);
    return result;
}

chrome.runtime.onMessage.addListener(
    function(data, sender, sendResponse) {  
        console.log(sender.tab ?   
            "取得到tab，這是來自內容腳本的訊息：" + sender.tab.url   
            : "沒有tab，這是來自擴充功能內部的訊息");  
        // create gpu kernel
        let kernel = grayKernel(data.length)
        // use gpu kernel
        var length = data.length;
        var result = kernel(data);
        data = Object.assign({}, result)
        data.length = length;
        
        sendResponse(data);
});