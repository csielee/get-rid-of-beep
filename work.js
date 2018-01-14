var imgs = document.querySelectorAll('img');
var loadimg = document.createElement('img');
var imgCache = {};
var startTime,endTime;
var totalTime = 0;

function loadingImage(url, W, H) {
    if (imgCache[url])
        return imgCache[url];

    return new Promise((resolve, reject)=>{

        loadimg.setAttribute("crossOrigin",'Anonymous');
        loadimg.onload = () => {
            if (loadimg.width == 0 || loadimg.height == 0 || W == 0 || H == 0) {
                resolve(url)
            }
            var canvas = document.createElement('canvas');
            canvas.width = W;
            canvas.height = H;
            var ctxt = canvas.getContext('2d');
            ctxt.clearRect(0,0,W,H);
            ctxt.drawImage(loadimg, 0, 0, W, H);
            var imgdata = ctxt.getImageData(0, 0, W, H);
            console.log(imgdata.data)
            var test = Object.assign({}, imgdata.data);
            test.length = imgdata.data.length;
            test.width = W;
            test.height = H;
            startTime = new Date().getTime();
            chrome.runtime.sendMessage(test, (response) => {
                endTime = new Date().getTime();
                totalTime += endTime - startTime;
                console.log(url + '\n finish with ' + (endTime - startTime))
                //console.log(response);
                var resData =  new Uint8ClampedArray(response); 
                /*for (var i=0;i<response.length;i++) {
                    imgdata.data[i] = response[i];
                }*/
                var count = 0;
                for (var i=0;i<resData.length;i++) {
                    if (imgdata.data[i]!=resData[i]) {
                        count++;
                        imgdata.data[i] = resData[i];
                    }
                }
                //console.log('count : '+ count);
                //imgdata.data =
                //console.log(imgdata.data)
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

(async () => {
    for (var index=0;index < imgs.length;index++) {
        var img = imgs[index];
        //console.log('img' + index +' (' + img.width +',' + img.height +')' + img.src);
        console.log(`start img ${index}`)
        try {
            var url = await loadingImage(img.src, img.width, img.height)
            //console.log(url)
            img.src = url
            console.log(`finish img ${index}`)
        } catch(error) {
            console.log(error)
        }
        //console.log(url)
    }
})()


totalTime;