/*console.log(document.querySelector('#testCanvas'));

if (document.querySelector('#testCanvas') == null) {
    var canvas = document.createElement('canvas');
    canvas.id = "testCanvas";
    document.body.appendChild(canvas);
} else {
    var canvas = document.querySelector('#testCanvas');
}*/
var imgs = document.querySelectorAll('img');
var loadimg = document.createElement('img');
var imgCache = {};

function loadingImage(url, W, H) {
    if (imgCache[url])
        return imgCache[url];

    return new Promise((resolve, reject)=>{

        loadimg.setAttribute("crossOrigin",'Anonymous');
        loadimg.onload = () => {
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
            chrome.runtime.sendMessage(test, (response) => {
                console.log(response);
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
            
            /*for (var i=0;i<imgdata.data.length;i+=4) {
                var gray = (imgdata.data[i]*4899 + imgdata.data[i+1]*9617 + imgdata.data[i+2]*1868 + 8192) >> 14;
                imgdata.data[i] = gray;
                imgdata.data[i+1] = gray;
                imgdata.data[i+2] = gray;
            }*/
           
            /*ctxt.putImageData(imgdata, 0, 0,0,0,W,H);
            try {
                var retURL = canvas.toDataURL()
                imgCache[url] = retURL
                resolve(retURL)    
            } catch (error) {
                reject(error)
            }*/
        }
        loadimg.src = url;
    });
}

// get one image
var img = imgs[1];


var currentH = 0;
var maxwidth = 0;
/*imgs.forEach(async (img,index) => {
        console.log('img' + index +' (' + img.width +',' + img.height +')' + img.src);
        try {
            var url = await loadingImage(img.src)
        } catch(error) {
            console.error(error)
            return;
        }
        console.log(url)
        img.src = url
})*/

var a = async () => {
    console.log(choice);
    for (var index=0;index < imgs.length;index++) {
        var img = imgs[index];
        //console.log('img' + index +' (' + img.width +',' + img.height +')' + img.src);
        try {
            var url = await loadingImage(img.src, img.width, img.height)
            console.log(url)
            img.src = url
            console.log(`finish img ${index}`)
        } catch(error) {
            console.log(error)
        }
        //console.log(url)
    }
}
a()
/*
canvas.width = maxwidth;
canvas.height = currentH;

currentH = 0;
imgs.forEach((element,index) => {
    ctxt.drawImage(element, 0, currentH, element.width, element.height);
    currentH += element.height;
})*/

var str = "return value in this str";
str;

