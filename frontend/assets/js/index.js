// Replace 'SDK' with the actual SDK you've downloaded from API Gateway
// const sdk = require('aws-sdk'); 

const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('gallery-row');

const uploadButton = document.getElementById('upload-button');
const fileInput = document.getElementById('file-input');
const customLabelsInput = document.getElementById('custom-labels');

const alert_div = document.getElementById('alert')


function showAlert(type, message){
    alert_div.innerHTML = `<div class="inner-message m-5 alert alert-${type} alert-dismissible fade show" role="alert">
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>`

    alert_div.style.display = 'block';
}

var loadFile = function(event) {
    var output = document.getElementById('previewImage');
    output.src = URL.createObjectURL(event.target.files[0]);
    output.onload = function() {
      URL.revokeObjectURL(output.src) // free memory
    }
  };


function resetImageAndLabel(){
    document.getElementById('previewImage').src = "";
    customLabelsInput.value = '';
}

searchButton.addEventListener('click', () => {

    const query = searchInput.value.trim();
    if (query !== '') {

        sdk.searchGet({ q: query })
        .then(function(result) {
            console.log("Result : ", result);

            // no valid keyword
            if (result['status'] == 202) {
                return showAlert('warning', result['data']['message'] )
            }


            image_paths = result['data']["images"];
            console.log("image_paths : ", image_paths);

            var photosDiv = document.getElementById("gallery-row");

            // reset previous results
            photosDiv.innerHTML = "";

            image_paths.forEach(imageUrl => {
                images_list = imageUrl.split('/');
                imageName = images_list[images_list.length - 1];
            
                photosDiv.innerHTML += `<div class="col-lg-3 col-md-4 col-sm-6 mb-2">
                    <a class="gallery-item" href="${imageUrl}">
                        <img src="${imageUrl}" style="  width:  250px; height: 250px;" class="img-fluid" alt="${imageName}">
                    </a>
                </div>`;    
            });  

        }).catch(function(result) {
            console.log(result);
            if(result['status'] == 404){

                searchResults.innerHTML = '';
                showAlert('danger', result['data']['message'] );
                return;

            }

            // Clear previous results


        });


    }
});






uploadButton.addEventListener('click', () => {
    var filePath = (document.getElementById('photoupload').value).split("\\");
    var fileName = filePath[filePath.length - 1];
    
    console.log(fileName);
    console.log(filePath);
    var custom_labels = document.getElementById('custom-labels').value;

    console.log(custom_labels);

    var reader = new FileReader();
    var file = document.getElementById('photoupload').files[0];
    console.log('File : ', file);
    document.getElementById('photoupload').value = "";

    if ((filePath == "") || (!['png', 'jpg', 'jpeg'].includes(fileName.split(".")[1]))) {
        alert("Please upload a valid .png/.jpg/.jpeg file!");
    } else {

        var params = {
            "bucket" : "photos-bucket-ap", 
            "key": fileName,
            'Content-Type': "image/" + filePath.toString().split(".")[1] + ';base64',
            'x-amz-meta-customLabels' : custom_labels,
            'Access-Control-Allow-Origin': '*',
            'Accept': "image/*"
        };
        console.log(params)

        var additionalParams = {
            headers: {
                'x-amz-meta-customLabels': custom_labels
            }
        };
        
        reader.onload = function (event) {
            body = btoa(event.target.result);
            console.log('Reader body : ', body);
            return sdk.uploadBucketKeyPut(params, body, additionalParams)
                .then(function (result) {
                    console.log(result);
                    if (result['status'] == 200) {
                        // Create a success alert

                    showAlert("success", "Successfully uploaded the image!")
                        
                    }
                })
                .catch(function (error) {
                    console.log(error);
                    // Create a danger alert
                    showAlert("danger", "There is issue while uploading the image!")
                })
                .finally(()=>{
                    resetImageAndLabel();

                })
        }
        
        reader.readAsBinaryString(file);
    }
});