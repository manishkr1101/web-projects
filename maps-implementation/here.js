const platform = new H.service.Platform({ apikey: 'BGYuM0Tzk5KhTCN0PEAu6ubPHOwh60qIwSMOSV-TpqI' });
const defaultLayers = platform.createDefaultLayers();

window.addEventListener('resize', () => map.getViewPort().resize());
const query = parseQuery();
window.center = { lat: query.lat, lng: query.lng };
let map;

//Initialize routing service
const router = platform.getRoutingService();

const geocoder = platform.getGeocodingService();

const destinations = [];

function updateLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((center) => {
            window.center = {
                lat: center.coords.latitude,
                lng: center.coords.longitude
            }
            console.log(center)
        }, (errorPosition) => {
            console.log(errorPosition)
            alert('Geolocation permission denied')
        })
    }
    else {
        alert('Geolocation not supported')
    }
}


updateLocation();
initMap(center);


function focusLocation() {
    console.log('focus')
    updateLocation();
    map.setCenter(center)
    addIcon(center);
}

function initMap(center) {

    map = new H.Map(document.getElementById('map'),
        defaultLayers.vector.normal.map, {
        center: center,
        zoom: 13,
        pixelRatio: window.devicePixelRatio || 1
    });
    const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    const ui = H.ui.UI.createDefault(map, defaultLayers);

    const locationOfMarker = center;
    addIcon(locationOfMarker);

}

function addIcon(location) {

    // optionally - resize a larger PNG image to a specific size
    var pngIcon = new H.map.Icon("icons/location.png", { size: { w: 56, h: 56 } });

    // Create a marker using the previously instantiated icon:
    var marker = new H.map.Marker(location, { icon: pngIcon });
    // Add the marker to the map:
    map.addObject(marker);

}

function addCard(location) {
    const el = document.querySelector('.template .card');
    var outerElement = document.createElement('div');

    outerElement.style.userSelect = 'none';
    outerElement.style.webkitUserSelect = 'none';
    outerElement.style.msUserSelect = 'none';
    outerElement.style.mozUserSelect = 'none';
    outerElement.style.cursor = 'default';
    const cloned = el.cloneNode(true);
    cloned.style.display = "block"
    const hiddenElement = document.createElement('input');
    hiddenElement.setAttribute('type', 'hidden');
    hiddenElement.setAttribute('lat', location.lat)
    hiddenElement.setAttribute('lng', location.lng);
    cloned.appendChild(hiddenElement)
    outerElement.appendChild(cloned)

    //create dom icon and add/remove opacity listeners
    var domIcon = new H.map.DomIcon(outerElement, {

    });
    var marker = new H.map.DomMarker(location, {
        icon: domIcon
    });
    map.addObject(marker);
}

function locateLocation(searchText) {
    //Begin geocoding


    geocoder.geocode({ searchText }, result => {
        const location = result.Response.View[0].Result[0].Location.DisplayPosition;
        const { Latitude: lat, Longitude: lng } = location;
        var pngIcon = new H.map.Icon("icons/location.png", { size: { w: 56, h: 56 } });
        const marker = new H.map.Marker({ lat, lng }, { icon: pngIcon });
        map.addObject(marker);
        map.setCenter({ lat, lng });
    });
}

function submitForm(evt) {
    evt.preventDefault();
    const query = document.querySelector('#q').value;
    try {
        locateLocation(query);

    } catch (error) {
        alert(error)
    }
}
const dest = {
    "lat": 25.138636710603333,
    "lng": 85.86271031866139
}
function displayRoute(source, destination) {
    return new Promise((resolve, reject) => {
        //Begin routing
        //Configure transportation mode, start, end points
        const request = {
            mode: 'fastest;car',
            waypoint0: `geo!${source.lat},${source.lng}`,
            waypoint1: `geo!${destination.lat},${destination.lng}`,
            representation: 'display'
        };



        router.calculateRoute(request, response => {
            //Parse the route's shape
            window.response = response
            const shape = response.response.route[0].shape.map(x => x.split(','));
            const linestring = new H.geo.LineString();
            shape.forEach(s => linestring.pushLatLngAlt(s[0], s[1]));
            //Create a polyline with the shape
            const routeLine = new H.map.Polyline(linestring, {
                style: { strokeColor: 'blue', lineWidth: 3 }
            });
            //Add route to map
            map.addObject(routeLine);
            // addIcon(source)
            // addIcon(destination)
            //Zoom to bounds of the route shape
            // map.getViewModel().setLookAtData({ bounds: routeLine.getBoundingBox() });
            resolve({})
        });
    })
}
// displayRoute(center, dest);

let target;
function getDirection(event) {
    const div = event.target.parentElement;
    target = div;
    const input = div.querySelector('input');
    const coord = {
        lat: input.getAttribute('lat'),
        lng: input.getAttribute('lng')
    }
    console.log(coord)
    displayRoute(center, coord);
}

map.addEventListener('tap', function (event) {
    // console.log(event.target)
    const marker = event.target;
    // map.removeObject(marker);
})

map.addEventListener('longpress', function (event) {
    let { viewportX, viewportY } = event.currentPointer;
    let coord = map.screenToGeo(viewportX, viewportY);
    addIcon(coord)
    addCard(coord)
    destinations.push(coord)
})

function findDirection() {
    destinations.forEach(dest => {
        displayRoute(center, dest)
    })
}

function parseQuery() {
    const href = location.href;
    const queries = href.split('?')[1].split('&');

    const obj = {}
    queries.forEach(query => {
        const [key, value] = query.split('=');
        obj[key] = value;
    })
    return obj;
}