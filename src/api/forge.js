
const qs = require('qs')

const clientSecret = 'Cl7SMY6vSqtCzle7hTGOOdKla319LobfwRqqEKy5PXcUmfh4AlS2wCbO4IXrNsbE';
const clientId = 'SJEVtYcdw2XfDwcCsJVBy1ctAAYm1mMqNyIxguxplCTtaD6B';

let access_token = null;
let viewer = null;

/* ------------------------ METHODS ------------------------ */
const Authenticate = async (clientId, clientSecret) => {
  const authorization = btoa(`${clientId}:${clientSecret}`);

  let data = qs.stringify({
    'grant_type': 'client_credentials',
    'scope': 'data:read data:write data:create bucket:create bucket:read bucket:delete'
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://developer.api.autodesk.com/authentication/v2/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Authorization': `Basic ${authorization}`
    },
    data: data
  };

  try {
    const res = await axios.request(config);
    access_token = await res.data.access_token
    return access_token;
  } catch (error) {
    console.log(error.message);
    return {
      error: error.message
    }
  }
}

const GetBuckets = async () => {
  let buckets = null;

  const config = {
    method: 'get',
    url: 'https://developer.api.autodesk.com/oss/v2/buckets',
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  }

  try {
    const res = await axios.request(config);
    buckets = await res.data.items;
  } catch (error) {
    console.log(error)
  }

  return buckets;
}

const GetObjectsInBucket = async (bucketKey, numberOfModels) => {
  let models = null;

  const url = numberOfModels
    ? `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects?limit=${numberOfModels}`
    : `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects`

  const config = {
    method: 'get',
    url: url,
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  }

  try {
    const res = await axios.request(config);
    models = await res.data.items;
  } catch (error) {
    console.log(error);
  }

  return models;
}

const AddBucket = async (bucket) => {
  const data = JSON.stringify(bucket);

  const config = {
    method: 'post',
    url: 'https://developer.api.autodesk.com/oss/v2/buckets',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    data: data
  }

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    return {
      error: error.response.data.reason
    };
  }
}

const DeleteBucket = async (bucketKey) => {
  const config = {
    method: 'delete',
    url: `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}`,
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  }

  try {
    await axios.request(config);
    return {
      bucketKey: bucketKey
    }
  } catch (error) {
    return {
      error: error
    }
  }
}

const getSignedS3UploadUrl = async (bucketKey, objectKey) => {
  const config = {
    method: 'get',
    url: `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`,
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  }

  try {
    const res = await axios.request(config);
    return await res.data;
  } catch (error) {
    return {
      error: error
    }
  }
}

const uploadFileToSignedUrl = async (signedUrl, fileArray) => {
  const config = {
    method: 'put',
    url: signedUrl,
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    data: fileArray
  };

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    console.log(error)
  }
}

const finalizeFileUpload = async (bucketKey, objectKey, uploadKey) => {
  const data = JSON.stringify({
    uploadKey: uploadKey
  });

  const config = {
    method: 'post',
    url: `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`,
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      'x-ads-meta-Content-Type': 'application/octet-stream',
    },
    data: data
  }

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    console.log(error);
  }
}

const UploadFileToBucket = async (bucketKey, objectKey, fileArray) => {
  const { urls, uploadKey } = await getSignedS3UploadUrl(bucketKey, objectKey);

  await uploadFileToSignedUrl(urls[0], fileArray);
  const objectData = await finalizeFileUpload(bucketKey, objectKey, uploadKey);

  return objectData;
}

const DeleteObjectFromBucket = async (bucketKey, objectKey) => {
  const config = {
    method: 'delete',
    url: `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects/${objectKey}`,
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  }

  try {
    const res = await axios.request(config)
    console.log(res.data);
  } catch(error) {
    console.log(error);
  }
}

const TranslateModel = async (modelUrn) => {
  let data = JSON.stringify({
    input: {
      urn: modelUrn
    },
    output: {
      formats: [
        {
          type: "svf",
          views: [
            "2d",
            "3d"
          ]
        }
      ]
    }
  })

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://developer.api.autodesk.com/modelderivative/v2/designdata/job',
    headers: {
      'Authorization':`Bearer ${access_token}`,
      'Content-Type': 'application/json',
      'x-ads-force': 'false'
    },
    data: data
  }

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    return {
      error: error
    };
  }
}

const CheckTranslationStatus = async (modelUrn) => {
  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://developer.api.autodesk.com/modelderivative/v2/designdata/${modelUrn}/manifest`,
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  }

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (error) {
    return {
      error: error
    }
  }
}

// The Initializer function needs to be run just once. It makes sure that all subsystems are running before proceeding.
const InitializeViewer = async () => {
  const options = {
    env: 'AutodeskProduction2',
    api: 'streamingV2',  // for models uploaded to EMEA change this option to 'streamingV2_EU'
    accessToken: access_token
  };

  Autodesk.Viewing.Initializer(options, function () {
    // Adding extensions
    const config3d = {
      extensions: [ 'AwesomeExtension', 'EventReactExtension', 'ToolbarExtension' ]
    }

    const htmlDiv = document.getElementById('forgeViewer');
    viewer = new Autodesk.Viewing.GuiViewer3D(htmlDiv, config3d);
    const startedCode = viewer.start();
    if (startedCode > 0) {
      console.error('Failed to Initialize Forge Viewer!');
      return;
    }
    console.log('Autodesk Forge Initialization Completed Successfully!');
  });
}

const ViewModel = async (modelUrn) => {
  const documentId = `urn:${modelUrn}`;
  Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);

  function onDocumentLoadSuccess(viewerDocument) {
    const defaultModel = viewerDocument.getRoot().getDefaultGeometry();
    viewer.loadDocumentNode(viewerDocument, defaultModel);
  }

  function onDocumentLoadFailure() {
    console.error('Failed fetch Forge manifest');
  }
}

export {
  Authenticate,
  InitializeViewer,
  GetBuckets,
  GetObjectsInBucket,
  AddBucket,
  DeleteBucket,
  UploadFileToBucket,
  TranslateModel,
  CheckTranslationStatus,
  DeleteObjectFromBucket,
  ViewModel
}
