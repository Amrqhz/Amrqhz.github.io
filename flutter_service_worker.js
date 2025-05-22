'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"canvaskit/canvaskit.js": "86e461cf471c1640fd2b461ece4589df",
"canvaskit/canvaskit.js.symbols": "68eb703b9a609baef8ee0e413b442f33",
"canvaskit/canvaskit.wasm": "efeeba7dcc952dae57870d4df3111fad",
"canvaskit/chromium/canvaskit.js": "34beda9f39eb7d992d46125ca868dc61",
"canvaskit/chromium/canvaskit.js.symbols": "5a23598a2a8efd18ec3b60de5d28af8f",
"canvaskit/chromium/canvaskit.wasm": "64a386c87532ae52ae041d18a32a3635",
"canvaskit/skwasm.js": "f2ad9363618c5f62e813740099a80e63",
"canvaskit/skwasm.js.symbols": "80806576fa1056b43dd6d0b445b4b6f7",
"canvaskit/skwasm.wasm": "f0dfd99007f989368db17c9abeed5a49",
"canvaskit/skwasm_st.js": "d1326ceef381ad382ab492ba5d96f04d",
"canvaskit/skwasm_st.js.symbols": "c7e7aac7cd8b612defd62b43e3050bdd",
"canvaskit/skwasm_st.wasm": "56c3973560dfcbf28ce47cebe40f3206",
"flutter.js": "76f08d47ff9f5715220992f993002504",
"flutter_bootstrap.js": "69da32d83cc84a87d24264647724af3d",
"index.html": "ae1b2ac2c5d1b2dcb8fa368a54995a2b",
"/": "ae1b2ac2c5d1b2dcb8fa368a54995a2b",
"main.dart.js": "62d549a72601f0d6eed7e90b456fc040",
"version.json": "16831d2b4c0d901bf4e9e5ad7f7a7f81",
"assets/assets/doctors.png": "a7e2a338a282b6f2cc83a1ab15bbefe6",
"assets/assets/cal.png": "a707a5ec432971d288a06e12832dfcf5",
"assets/assets/env.png": "fe436b50e56473f09f3cbb023a77c834",
"assets/assets/g48.png": "921dc494254cea640ad7287a2ac507e0",
"assets/assets/app.jpg": "8a8a60032988f2ccc1529a282a70abf9",
"assets/assets/register.png": "f6082711d55ed66f72e8f4fc71f28eae",
"assets/assets/register2.png": "7302a30b72f4a2bd687745c68fc0e8ba",
"assets/assets/app%2520icon.png": "dd54060a5d1eaa9ab18d14eddb6a7ff0",
"assets/assets/AnticDidone-Regular.ttf": "3dce0bb7c64cd75acbc1b7789ed763d0",
"assets/assets/photo_2_2025-04-14_16-03-36.jpg": "d67980c47b6c39e2b206a197b694dcbb",
"assets/assets/photo_1_2025-04-14_16-03-36.jpg": "533364e0f3ea7bb22fa3dca4d5c4483b",
"assets/assets/photo_4_2025-03-15_10-37-19.jpg": "3c66581c3037c04477d8029a77766db2",
"assets/assets/Screenshot%2520From%25202025-04-15%252016-24-11.png": "2acc733dfdc9a7d17bc39b994fdbd7f6",
"assets/assets/image.png": "79fcca08e44f2d6892dfe20c6a545dad",
"assets/assets/image%2520copy.png": "9b458f8126af2b6839934fc55696c9e0",
"assets/assets/Group%252046.png": "3154e8d6c44ae93fd8e0c491231dbdd3",
"assets/assets/Group%252047.png": "868d57b0e3d1b461d6102ad0fbe921b7",
"assets/assets/Group%252048.png": "48417b9eaca146f643b815ca1dbc949d",
"assets/assets/Group%252046%2520(1).svg": "ee9c7caee587d47894b89e6d8565d836",
"assets/assets/1.png": "8ba83dceaebce9d25224993550d8276b",
"assets/assets/2.png": "07ceeb972571c37c4a6e3e7071c30d1d",
"assets/assets/Group%252050.png": "eef0f92cd59448b588255fb696d4ac38",
"assets/assets/Group%252049.png": "605311a8922242fdad3653d5c45c683d",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "33b7d9392238c04c131b6ce224e13711",
"assets/packages/fluttertoast/assets/toastify.css": "a85675050054f179444bc5ad70ffc635",
"assets/packages/fluttertoast/assets/toastify.js": "56e2c9cedd97f10e7e5f1cebd85d53e3",
"assets/packages/font_awesome_flutter/lib/fonts/fa-regular-400.ttf": "3ca5dc7621921b901d513cc1ce23788c",
"assets/packages/font_awesome_flutter/lib/fonts/fa-solid-900.ttf": "a2eb084b706ab40c90610942d98886ec",
"assets/packages/font_awesome_flutter/lib/fonts/fa-brands-400.ttf": "9fa78efa5e0fea5eb5c85ff9000251f6",
"assets/fonts/MaterialIcons-Regular.otf": "178d6bee7a87ec7d3a1b0b572538a098",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"assets/AssetManifest.json": "9c179ed2e08ce169bcf9f879a01ec1b9",
"assets/AssetManifest.bin": "4a60a70aec06e10c4b6ec4f75309419d",
"assets/AssetManifest.bin.json": "2cada5395ef541d563b307bdc31faf0e",
"assets/FontManifest.json": "32631334d9f98f1935946651ba328535",
"assets/NOTICES": "f645aedab839e023e1383b7ad43160ec",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"manifest.json": "72fb0784fc65f0fb34012475ba60cf80",
"splash/img/light-1x.png": "96968dd21fe4abc33abae1b157a9df40",
"splash/img/light-2x.png": "735b2b2c9c72a45807c90b955c3e83dd",
"splash/img/light-3x.png": "b1714197c2584d974d94dff60ff4ac24",
"splash/img/light-4x.png": "972fd703630c4a60c12b2a1ec03ebbda",
"splash/img/dark-1x.png": "96968dd21fe4abc33abae1b157a9df40",
"splash/img/dark-2x.png": "735b2b2c9c72a45807c90b955c3e83dd",
"splash/img/dark-3x.png": "b1714197c2584d974d94dff60ff4ac24",
"splash/img/dark-4x.png": "972fd703630c4a60c12b2a1ec03ebbda",
"app%20icon.png": "dd54060a5d1eaa9ab18d14eddb6a7ff0"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
