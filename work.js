var imgs = document.querySelectorAll('img');
var imgCache = {};
//var startTime,endTime;
var totalTime = 0;
var useTime = 0;

function loadingImage(url, W, H) {
    if (imgCache[url])
        return imgCache[url];

    return new Promise((resolve, reject)=>{
        var loadimg = document.createElement('img');
        loadimg.setAttribute("crossOrigin",'Anonymous');
        loadimg.onload = () => {
            if (loadimg.width == 0 || loadimg.height == 0 || W == 0 || H == 0) {
                resolve(url)
                return;
            }
            var canvas = document.createElement('canvas');
            canvas.width = W;
            canvas.height = H;
            var ctxt = canvas.getContext('2d');
            ctxt.clearRect(0,0,W,H);
            ctxt.drawImage(loadimg, 0, 0, W, H);
            var imgdata = ctxt.getImageData(0, 0, W, H);

            var test = Object.assign({}, imgdata.data);
            test.length = imgdata.data.length;
            test.width = W;
            test.height = H;

            // choose device
            switch(choice) {
                case 0: 
                    test.useJS = true;
                    break;
                case 1:
                    test.useGPU = true;
                    break;
                /*case 2:
                    test.useJS = true;
                    break;*/
                default:
                    test.useGPU = true;
                    break;
            }
            // default
            test.windowSize = 3;       
                
            test.startTime = new Date().getTime();
            chrome.runtime.sendMessage(test, (response) => {
                var endTime = new Date().getTime();
                totalTime += endTime - test.startTime;
                console.log(url + '\n finish with ' + (endTime - test.startTime))

                if (!response.isSuccess) {
                    resolve(url)
                    return;
                }

                var resData =  new Uint8ClampedArray(response); 

                var count = 0;
                for (var i=0;i<resData.length;i++) {
                    if (imgdata.data[i]!=resData[i]) {
                        count++;
                        imgdata.data[i] = resData[i];
                    }
                }

                ctxt.putImageData(imgdata,0,0,0,0,W,H);
                try {
                    var retURL = canvas.toDataURL()
                    imgCache[url] = retURL
                    resolve(retURL)    
                } catch (error) {
                    reject(error)
                }
            });

        }
        loadimg.src = url;
    });
}

var finishCount = 0;
var startTime = new Date().getTime()
imgs.forEach((img, index)=>{
    console.log(`start img ${index}`)
    loadingImage(img.src, img.width, img.height).then((url)=>{
        img.src = url;
        console.log(`finish img ${index}`)
        finishCount++;
        if (finishCount == imgs.length) {
            var endTime = new Date().getTime()
            useTime = endTime - startTime;
            console.log(`execute time : ${totalTime/1000}\nuse time : ${useTime/1000}`);
            if (showTime)
                alert(`execute time : ${totalTime/1000}\nuse time : ${useTime/1000}`)
        }
    }).catch(error=>console.error(error))
})

totalTime;